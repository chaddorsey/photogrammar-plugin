import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Async from "react-async";
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import Photographers from '../../data/photographers.json';
import TimelineRow from './TimelineRow.jsx';
import './Timeline.css';

const loadTimelineCells = async ({ fetchPath }, { signal }) => {
  const res = await fetch(fetchPath, { signal });
  if (!res.ok) { console.log(res) }
  return res.json();
}

const formatPhotographers = (data, timeRange, selectedPhotographer, dimensions, selectedMapView, selectedViz) => {
  const timelineCells = data.rows || data;
  // convenience functions for dates
  const monthNum = m => (m - 1) / 12;
  const getTimeCode = (year, month) => year * 100 + month;
  const timeCodeToNum = timecode => Math.floor(timecode / 100) + monthNum(timecode % 100);

  let baseColor;
  if (selectedViz === 'themes') {
    baseColor = '#F78154';
  } else {
    baseColor = (selectedMapView === 'counties') ? '#6a1b9a' : '#289261';
  }

  // create the basic photographers data
  const filteredCells = timelineCells
    .filter(tc => tc.month && tc.year < 1944 || tc.month <= 6);
  const activePhotographers = filteredCells.map(tc => tc.photographer);
  const opacityDenominator = Math.min(250, Math.max(...filteredCells.map(tc => tc.count)));
  const threshold = 500;
  const photographers = Photographers
    .filter(p => p.count >= 75 && p.key && p.key !== 'unspecified' && p.key !== 'NA')
    .sort((a, b) => {
      if (a.count < threshold && b.count >= threshold) {
        return -1;
      }
      if (a.count >= threshold && b.count < threshold) {
        return 1;
      }
      if (a.firstDate !== b.firstDate) {
        return (a.count >= threshold) ? a.firstDate - b.firstDate : b.firstDate - a.firstDate;
      }
      if (a.lastDate != b.lastDate) {
        return (a.count >= threshold) ? a.lastDate - b.lastDate : b.lastDate - a.lastDate;
      }
      return 0;
    })
    .map(p => {
      p.active = (activePhotographers.includes(p.key)
        && timeRange[1] > p.firstDate && timeRange[0] < p.lastDate);
      p.fill = (p.active) ? 'black' : 'silver';
      p.months = [];
      p.isOther = p.count < threshold;
      return p;
    });

  // use the number above threshold and number below to calculate height and translateY offset
  const { leftAxisWidth, width, height } = dimensions.timelineHeatmap;

  const x = d3.scaleLinear()
    .domain([1935, 1944 + monthNum(6)])
    .range([leftAxisWidth + 140, width + leftAxisWidth]);
  const monthWidth = x(1935 + monthNum(2)) - x(1935);

  // add the timeline cells to each photographer
  filteredCells.forEach(tc => {
    const idx = photographers.findIndex(p => p.key === tc.photographer);
    const inSelection = (!(getTimeCode(tc.year, tc.month) < timeRange[0] || getTimeCode(tc.year, tc.month) > timeRange[1]) && (!selectedPhotographer || selectedPhotographer === tc.photographer));
    if (idx !== -1) {
      const cell = {
        year: tc.year,
        month: tc.month,
        count: tc.count,
        x: x(tc.year + monthNum(tc.month)),
        fill: (inSelection) ? baseColor : '#eeeeee',
        inSelection,
        fillOpacity: (tc.count > 0) ? 0.05 + 0.95 * tc.count / opacityDenominator : 0
      }
      photographers[idx].months.push(cell);
    }
  });

  // drop BarbaraEvans and OttoGilmore, who uniquely have more than 75 photos but none with a month
  const beIdx = photographers.findIndex(p => p.key === "BarbaraWright");
  photographers.splice(beIdx, 1);
  const ogIdx = photographers.findIndex(p => p.key === "OttoGilmore");
  photographers.splice(ogIdx, 1);


  // sort the cells in chronological order
  photographers.forEach(p => {
    p.months = p.months.sort((a, b) => getTimeCode(a.year, a.month) - getTimeCode(b.year, b.month));
  });

  const numberAboveThreshold = photographers.filter(p => !p.isOther).length;
  const numberBelowThreshold = photographers.filter(p => p.isOther).length;
  // the +/-2 here are to leave room for the collective "other photographers" when they aren't individual shown
  const rowHeight = height / (numberAboveThreshold + 2);
  const translateY = -1 * rowHeight * (numberBelowThreshold);
  const monthHeight = rowHeight - 2;

  // the +2 here is for an empty row for the "other photographers" to separate the two visually
  const y = d3.scaleLinear()
      .domain([0, photographers.length + 2])
      .range([0, height - translateY]);

  // add the y, labelX, and yeartick values for each photographer
  photographers.forEach((p, i) => {
    photographers[i].y = (p.isOther) ? y(i) + 1 : y(i + 2) + 1;
    photographers[i].labelX = x(1935) - 5; //x(Math.floor(p.firstDate / 100)) - 5;
    photographers[i].yearTicks = [];
    [1935, 1936, 1937, 1938, 1939, 1940, 1941, 1942, 1943, 1944, 1945].forEach(y => {
      if (!p.isOther || y >= Math.floor(p.firstDate / 100)) {
        let stroke = 'black';
        // lighten if it's before photographers first data
        if (y < Math.floor(p.firstDate / 100)) {
          stroke = '#ddd';
        }
        // or if it's not within the time range
        if (y * 100 < timeRange[0] || y * 100 > timeRange[1]) {
          stroke = '#ddd';
        }
        photographers[i].yearTicks.push({
          x: x(y) - 0.25,
          stroke,
        });
      }
    });
  });

  return {
    photographers,
    translateY,
    monthWidth,
    monthHeight,
    baseColor,
  }

}

const TimelineHeatmap = (props) => {
  const {
    fetchPath,
    selectedPhotographer,
    timeRange,
    dimensions,
    selectedMapView,
    selectedViz,
    width,
    leftAxisWidth,
    monthHeight,
    monthWidth,
    makeLink,
  } = props;

  const [showOthers, setShowOthers] = useState(false);
  const [hoveredPhotographer, setHoveredPhotographer] = useState(null);

  const clearLink = makeLink([{ type: 'clear_photographer' }]);

  // this will close the other photographers if one is selected
  const otherPhotographerSelected = useRef(selectedPhotographer);
  if (selectedPhotographer && selectedPhotographer !== otherPhotographerSelected.current) {
    // only close if it's an other photographer
    const { count } = Photographers.find(p => p.key === selectedPhotographer);
    if (count < 500) {
      otherPhotographerSelected.current = selectedPhotographer;
      setShowOthers(false);
    }
  }

  const onHover = (photographerKey) => {
    if (hoveredPhotographer !== photographerKey) {
      setHoveredPhotographer(photographerKey);
    }
  };

  const onUnhover = () => {
    if (hoveredPhotographer) {
      setHoveredPhotographer(null);
    }
  };
  
  return (
    <Async
      promiseFn={loadTimelineCells}
      fetchPath={fetchPath}
      watch={fetchPath}
    >
      {({ data, error, isPending }) => {
        //if (isPending) return "Loading..."
        if (error) return `Something went wrong: ${error.message}`
        if (data) {
          const {
            photographers,
            translateY,
            monthWidth,
            monthHeight,
            baseColor
          } = formatPhotographers(data, timeRange, selectedPhotographer, dimensions, selectedMapView, selectedViz);
          const height = props.height - translateY;
          return (
            <div
              className='timeline'
              style={{
                overflowY: (showOthers) ? 'visible' : 'hidden',
                height: props.height,
                zIndex: 1001,
              }}
            >
              <div
                style={{
                  transform: `translateY(${translateY}px)`,
                  backgroundColor: 'rgba(255, 255, 255, 0.97)',
                }}
              >
                <svg
                  width={width + leftAxisWidth}
                  height={height}
                >
                {/* todo: this does not appear to be sorting properly */}
                  {photographers
                    .sort((a, b) =>  {
                      if (!hoveredPhotographer && !selectedPhotographer) {
                        return 0;
                      }
                      if (hoveredPhotographer === a.key) {
                        return -1;
                      }
                      if (selectedPhotographer === a.key) {
                        return -1;
                      }
                      if (hoveredPhotographer === b.key) {
                        return 1;
                      }
                      if (selectedPhotographer === b.key) {
                        return 1;
                      }
                      return 0;
                    })
                    .map(p => {
                      let y = p.y;
                      // the other photographers cells are overlayed on one another when they're not individually shown
                      if (p.isOther && !showOthers) {
                        y = translateY * -1;
                      }
                      // with one exception: if the photographer is selected
                      if (!showOthers && p.isOther && selectedPhotographer === p.key) {
                        y = translateY * -1 + monthHeight;
                      }
                      return (
                        <TimelineRow
                          {...p}
                          y={y}
                          showLabel={(!p.isOther || selectedPhotographer === p.key || showOthers)}
                          deemphasize={(hoveredPhotographer && hoveredPhotographer !== p.key)}
                          emphasize={(selectedPhotographer && selectedPhotographer === p.key) || (hoveredPhotographer && hoveredPhotographer === p.key)}
                          photographerKey={p.key}
                          monthWidth={monthWidth}
                          monthHeight={monthHeight}
                          key={`timelineRowFor${p.key}`}
                          onHover={onHover}
                          onUnhover={onUnhover}
                          makeLink={makeLink}
                        />
                      );
                  })}

                  <g
                    transform={`translate(${leftAxisWidth} ${height - monthHeight * 13})`}
                  >
                    {(selectedPhotographer) ? (
                      <Link
                        to={clearLink}
                      >
                        <g transform={'translate(-15 0)'}>
                          <line
                            x1={-8}
                            x2={8}
                            y1={-8}
                            y2={8}
                            strokeWidth={18 / 9}
                            stroke='black'
                          />
                          <line
                            x1={-8}
                            x2={8}
                            y1={8}
                            y2={-8}
                            strokeWidth={18 / 9}
                            stroke='black'
                          />
                        </g>
                        <text
                          x={-30}
                          y={0}
                          textAnchor='end'
                          fontSize={height / photographers.length * 1.5}
                        >
                          <tspan>
                            clear selected
                          </tspan>
                          <tspan
                            x={-30}
                            dy={height / photographers.length * 1.75}
                          >
                            photographer
                          </tspan>
                        </text>
                      </Link>
                    ) : (
                      <text
                        x={0}
                        y={0}
                        textAnchor='end'
                        fontSize={height / photographers.length * 1.25}
                        className='tip'
                      >
                        <tspan>
                          To select a photographer
                        </tspan>
                        <tspan
                          x={0}
                          dy={height / photographers.length * 1.75}
                        >
                          click on their name
                        </tspan>
                      </text>
                    )}
                  </g>

                  {/* the legend */}
                  <g
                    transform={`translate(${leftAxisWidth * 3/4 - 20} ${height - monthHeight * 7})`}
                    className='legend'
                  >
                    {/*   
                    <text
                      textAnchor='middle'
                      fontSize={monthHeight * 1.5}
                    >
                      <tspan>
                        Each box shows the number
                      </tspan>
                      <tspan
                        x={0}
                        dy={monthHeight * 1.75}
                      >
                        of photos taken that month
                      </tspan>
                    </text> */}

                    <text
                      textAnchor='middle'
                      fontSize={monthHeight * 1.2}
                      y={monthHeight * 5.6}
                      fill='#666'
                    >
                      Number of photos taken each month
                    </text> 

                    <defs>
                      <linearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"
                          style={{
                            stopOpacity: 0,
                          }}
                        />
                        <stop offset="100%" 
                          style={{
                            stopOpacity: 1,
                          }} />
                      </linearGradient>
                    </defs>

                    <rect 
                      x={leftAxisWidth * -1 / 4}
                      y={monthHeight * 1}
                      width={leftAxisWidth * 2 / 4}
                      height={monthHeight * 1.5}
                      fill="url(#legendGrad)"
                    />

                    <g
                      className='axis'
                      transform={`translate(0 ${monthHeight * 4.2})`}
                    >
                      <text
                        fontSize={monthHeight * 1.25}
                        x={leftAxisWidth * -1 / 4}
                      >
                        0
                      </text>
                      <text
                        fontSize={monthHeight * 1.25}
                      >
                        100
                      </text>
                      <text
                        x={leftAxisWidth * 1 / 4}
                        fontSize={monthHeight * 1.25}
                      >
                        200+
                      </text>
                    </g>
                  </g>

                  {(!showOthers) ? (
                    <text
                      x={leftAxisWidth + 140 - 2}
                      y={monthHeight - translateY}
                      textAnchor='end'
                      onClick={() => setShowOthers(true)}
                      fontSize={monthHeight * 1.2}
                    >
                      other photographers
                    </text>
                  ) : (
                    <text
                      x={leftAxisWidth}
                      y={height * 0.2}
                      textAnchor='end'
                      fontSize={height / photographers.length * 1.25}
                      onClick={() => setShowOthers(false)}
                    >
                      <tspan>
                        collapse photographers
                      </tspan>
                      <tspan
                        x={leftAxisWidth}
                        dy={height / photographers.length * 1.75}
                      >
                         with less than 500 photos
                      </tspan>
                    </text>
                  )}
                </svg>
              </div>
            </div>
          );
        }
      }}
    </Async>
  );
};

export default TimelineHeatmap;

TimelineHeatmap.propTypes = {

};

TimelineHeatmap.defaultProps = {
  
};
