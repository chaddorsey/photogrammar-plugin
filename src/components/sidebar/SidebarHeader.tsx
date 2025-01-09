import React from 'react';
import { Async } from 'react-async';
import { useSelector } from 'react-redux';
import SidebarHeaderPhotographerButton from './SidebarHeaderPhotographerButton.js';
import SidebarHeaderStateButton from './SidebarHeaderStateButton.js';
import SidebarHeaderCityCountyButton from './SidebarHeaderCityCountyButton.js';
import SidebarHeaderThemeButton from './SidebarHeaderThemeButton.js';
import SidebarHeaderFilterButton from './SidebarHeaderFilterButton.js';
import SidebarHeaderTimeRangeButton from './SidebarHeaderTimeRangeButton.js';
import { withDefaultProps } from './withDefaultProps';
import './SidebarHeader.css';

const WrappedPhotographerButton = withDefaultProps(SidebarHeaderPhotographerButton);
const WrappedCityCountyButton = withDefaultProps(SidebarHeaderCityCountyButton);
const WrappedStateButton = withDefaultProps(SidebarHeaderStateButton);
const WrappedThemeButton = withDefaultProps(SidebarHeaderThemeButton);
const WrappedFilterButton = withDefaultProps(SidebarHeaderFilterButton);
const WrappedTimeRangeButton = withDefaultProps(SidebarHeaderTimeRangeButton);

interface Props {
  query: string;
  hasFacet: boolean;
  displayableCards: number;
  sidebarPhotosOffset: number;
  previousOffset: number;
  nextOffset: number;
  setPhotoOffset: (offset: number) => void;
  toggleExpandedSidebar: () => void;
  expandedSidebar: boolean;
  isMobile: boolean;
  timeRange: [number, number];
}

const SidebarPhotosHeader = (props: Props) => {
  const {
    query,
    hasFacet,
    displayableCards,
    sidebarPhotosOffset,
    previousOffset,
    nextOffset,
    setPhotoOffset,
    toggleExpandedSidebar,
    expandedSidebar,
    isMobile,
    timeRange,
  } = props;

  const sidebarPhotos = useSelector((state: any) => state.sidebarPhotos);

  const handlePhotoOffset = (event: React.MouseEvent<HTMLButtonElement>) => {
    const offset = parseInt(event.currentTarget.id, 10);
    setPhotoOffset(offset);
  };

  return (
    <Async
      promiseFn={async () => {
        if (!query) return 1000;
        const response = await fetch(query);
        if (!response.ok) { console.warn(`photo count query failed ${response}`) };
        const json: { rows: { count: number; }[] } = await response.json();
        return json.rows.length > 0 ? json.rows[0].count : 1000;
      }}
      watch={query}
    >
      {(state) => {
        const { data: count, error } = state;
        if (error) return `Something went wrong: ${error.message}`
        if (count) {
          const totalCount = sidebarPhotos?.length || count;
          const from = sidebarPhotosOffset + 1;
          const to = (totalCount) ? Math.min(sidebarPhotosOffset + displayableCards, totalCount)
            : sidebarPhotosOffset + displayableCards;

          return (
            <header 
              id='sidebarHeader'
              className="highlight-text"
            >
              {(hasFacet) ? (
                <div className='facets'>
                  <div>
                    Filtered by (click to clear):
                  </div>
                  <WrappedPhotographerButton />
                  <WrappedCityCountyButton />
                  <WrappedStateButton />
                  <WrappedThemeButton />
                  <WrappedFilterButton />
                </div>
              ) : (
                <h3>
                  Random selection of photographs
                </h3>
              )}
              <div className='timeAndNav'>
                <div className='facets'>
                  <WrappedTimeRangeButton />
                </div>
                <h4 className='counts'>
                  {`${from}-${to} of `}
                  <strong>
                    {totalCount.toLocaleString()}
                  </strong>
                </h4>
                <button
                  onClick={handlePhotoOffset}
                  id={previousOffset.toString()}
                  disabled={previousOffset < 0}
                >
                  <svg
                    width={25}
                    height={25}
                  >
                    <g transform='translate(9 12.5)'>
                      <line
                        x1={0}
                        x2={8}
                        y1={0}
                        y2={-5}
                      />
                      <line
                        x1={0}
                        x2={8}
                        y1={0}
                        y2={5}
                      />
                    </g>
                  </svg>
                </button>
                <button
                  onClick={handlePhotoOffset}
                  id={nextOffset.toString()}
                  disabled={!nextOffset || nextOffset >= totalCount}
                >
                  <svg
                    width={25}
                    height={25}
                  >
                    <g transform='translate(16 12.5)'>
                      <line
                        x1={0}
                        x2={-8}
                        y1={0}
                        y2={-5}
                      />
                      <line
                        x1={0}
                        x2={-8}
                        y1={0}
                        y2={5}
                      />
                    </g>
                  </svg>
                </button>
                {(!isMobile) && (
                  <button
                    onClick={toggleExpandedSidebar}
                  >
                    <svg
                      width={25}
                      height={25}
                    >
                      <defs>
                        <marker
                          id="arrow"
                          viewBox="0 0 10 10"
                          refX="5"
                          refY="5"
                          markerWidth="2.5"
                          markerHeight="2.5"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" />
                        </marker>
                      </defs>
                      <g transform={`translate(0 12.5) ${(expandedSidebar) ? 'rotate(180 12.5 0)' : ''}`}>
                        <line
                          x1={8}
                          x2={8}
                          y1={-8}
                          y2={8}
                        />
                        <line
                          x1={12}
                          x2={20}
                          y1={0}
                          y2={0}
                          markerEnd="url(#arrow)"
                        />
                      </g>
                    </svg>
                  </button>
                )}
              </div>
            </header>
          );
        }
        return null;
      }}
    </Async>
  );
};

export default SidebarPhotosHeader;
