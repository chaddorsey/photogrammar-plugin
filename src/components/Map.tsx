import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import { Async } from 'react-async';
import us from 'us';
import Counties from '../data/svgs/counties.json';
import States from '../data/svgs/states.json';
import Cities from '../data/citiesCounts.json';
import Centroids from '../data/centroids.json';
import MapLabel from './MapLabel';
import County from './County';
import City from './City';
import State from './State';
import MapCitiesInfo from './MapCitiesInfo';
import MapCountiesInfo from './MapCountiesInfo';

interface Props {
  selectedCounty: string | null;
  selectedCity: string | null;
  selectedState: string | null;
  mapParameters: {
    width: number;
    height: number;
    translateX: number;
    translateY: number;
    scale: number;
  };
  selectedMapView: 'counties' | 'cities';
  isSearching: boolean;
  selectedPhotographer: string | null;
  timeRange: [number, number];
  filterTerms: string[];
  fetchPath: string;
  makeLink: (actions: any[]) => string;
}

interface MonthTotal {
  y: number;
  m: number;
  t: number;
}

interface PlaceCountData {
  k: string;
  t: number;
  ms?: MonthTotal[];
}

interface AsyncData {
  counties: PlaceCountData[];
  cities: PlaceCountData[];
}

interface ProjectedCounty {
  j: string;
  s: string;
  n: string;
  a: number;
  c: number;
  l: [number, number];
  d: string;
}

interface ProjectedState {
  abbr: string;
  name: string;
  labelCoords: [number, number];
  bounds: number[][];
  d: string;
}

interface CityMetadata {
  k: string;
  c: string;
  s: string;
  x?: number;
  y?: number;
}

interface VisibleCity {
  k: string;
  c: string;
  center: [number, number];
}

interface StyledCounty {
  d: string;
  name: string;
  state: string;
  nhgis_join: string;
  area_sqmi: number;
  fill: string;
  fillOpacity: number;
  strokeOpacity: number;
  photoCount: number;
  labelCoords: [number, number];
}

interface StyledCity {
  cx: number;
  cy: number;
  r: number;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  name: string;
  id: string;
}

interface MapLabelProps {
  label: string;
  x: number;
  y: number;
}

const Map = (props: Props) => {
  const {
    selectedCounty,
    selectedCity,
    selectedState,
    mapParameters,
    selectedMapView,
    isSearching,
    selectedPhotographer,
    timeRange,
    filterTerms,
    fetchPath,
    makeLink,
  } = props;

  const ref = useRef<SVGGElement>(null);
  const isMounting = useRef(true);
  const [hoveredCounty, setHoveredCounty] = useState<ProjectedCounty | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityMetadata | null>(null);
  const [hoveredState, setHoveredState] = useState<ProjectedState | null>(null);
  const [translateX, setTranslateX] = useState(mapParameters.translateX);
  const [translateY, setTranslateY] = useState(mapParameters.translateY);
  const [scale, setScale] = useState(mapParameters.scale);
  const [modalOpen, setModalOpen] = useState(false);
  const { pathname } = useLocation();

  // DC as a county is always selectable
  const DC = (Counties as ProjectedCounty[]).find((c: ProjectedCounty) => c.s === 'DC')!;

  useEffect(() => {
    if (ref.current) {
      // @ts-ignore - d3 types are not properly detecting transition
      d3.select(ref.current)
        .transition()
        .duration(isMounting.current ? 0 : 1000)
        .attr('transform', `translate(${mapParameters.translateX} ${mapParameters.translateY}) scale(${mapParameters.scale})`)
        .on('end', () => {
          setTranslateX(mapParameters.translateX);
          setTranslateY(mapParameters.translateY);
          setScale(mapParameters.scale);
          isMounting.current = false;
        });
    }
  }, [mapParameters]);

  let linkUp;
  if (selectedCity || selectedCounty) {
    // CD is an exception as there is no state
    if (selectedCounty === DC.j || selectedCity === 'DC_Washington') {
      linkUp = makeLink([{ type: 'clear_county' }, { type: 'clear_city'}, { type: 'clear_state'}]);
    } else {
      linkUp = makeLink([{ type: 'clear_county' }, { type: 'clear_city'}]);
    }
  } else if (selectedState) {
    linkUp = makeLink([{ type: 'clear_state' }]);
  }

  // check to see if it's the city view or county view and set if necessary
  const mapScale = (pathname.split('/').length > 1
    && ['state', 'county', 'city'].includes(pathname.split('/')[1]))
    ? pathname.split('/')[1] : 'national';

  const formatCounties = (data: PlaceCountData[]): StyledCounty[] => {
    const keysWithData = data.map(d => d.k);
    return (Counties as ProjectedCounty[])
      .filter(county => {
        const { j: nhgis_join, s: state } = county;
        if (!nhgis_join || nhgis_join === 'NULL') {
          return false;
        }
        if (selectedState && state !== selectedState) {
          return false;
        }
        if (county.d.includes('-35,221.3542')) {
          return false;
        }
        if (!keysWithData.includes(nhgis_join)) {
          return false;
        }
        return true;
      })
      .map((county): StyledCounty => {
        const [startTime, endTime] = timeRange;
        const countyData = data.find(d => d.k === county.j)!;
        let photoCount = 0;
        if (filterTerms.length === 0 && (startTime > 193501 || endTime < 193504) && countyData.ms) {
          photoCount = countyData.ms
            .filter((d: MonthTotal) => d.y * 100 + d.m >= startTime && d.y * 100 + d.m <= endTime)
            .reduce((accumulator, d: MonthTotal) => d.t + accumulator, 0);
        } else {
          photoCount = countyData.t;
        }
        const fill = (photoCount > 0) ? '#6a1b9a' : 'white';
        const fillOpacity = (photoCount > 0) ? Math.min(1, photoCount * 50 / county.a + 0.1) : 0.75;
        return {
          d: county.d,
          name: county.n,
          state: county.s,
          nhgis_join: county.j,
          area_sqmi: county.a,
          fill,
          fillOpacity,
          strokeOpacity: photoCount > 0 ? 1 : 0,
          photoCount,
          labelCoords: county.l,
        };
      });
  };

  const formatCities = (data: PlaceCountData[]): StyledCity[] => {
    const keysWithData = data.map(d => d.k);
    const [startTime, endTime] = timeRange;
    // combine/calculate the photo county data with the city metadata
    const visibleCities = Cities
      .filter(cd => {
        if (!keysWithData.includes(cd.k)) return false;
        if (selectedState && us.lookup(cd.s).abbr !== selectedState) return false;
        return true;
      })
      .map(city => {
        const cityData = data.find(d => d.k === city.k)!;
        let photoCount = 0;
        if (filterTerms.length === 0 && (startTime > 193501 || endTime < 193504) && cityData.ms) {
          photoCount = cityData.ms
            .filter((d: MonthTotal) => d.y * 100 + d.m >= startTime && d.y * 100 + d.m <= endTime)
            .reduce((accumulator, d: MonthTotal) => d.t + accumulator, 0);
        } else {
          photoCount = cityData.t;
        }
        return {
          c: city.c,
          k: city.k,
          t: photoCount,
          center: getCentroidForCity(city.k) as [number, number],
        };
      })
      .filter(d => d.t > 0);

    // calculate the divisor based on the number of photos
    const totalCitiesPhotos = visibleCities.reduce((accumulator, city) => accumulator + city.t, 0);
    let cityDivisor = (mapScale !== 'national') ? 3 : 6;
    cityDivisor = cityDivisor * (totalCitiesPhotos / 40000 * mapParameters.scale);

    // style the data
    return visibleCities.map(d => {
      let fillOpacity = 0.33;
      let stroke = '#289261';
      if (hoveredCity || selectedCity) {
        if ((hoveredCity && d.k === hoveredCity.k) || d.k === selectedCity) {
          fillOpacity = 0.9;
        } else {
          fillOpacity = 0.2;
          stroke = 'transparent';
        }
      }
      return {
        cx: d.center[0],
        cy: d.center[1],
        r: Math.sqrt(d.t / (cityDivisor * mapParameters.scale)),
        fillOpacity,
        stroke,
        strokeWidth: 0.5 / mapParameters.scale,
        name: d.c,
        id: d.k,
      };
    });
  };

  const getMapLabelProps = (): MapLabelProps | null => {
    if (selectedCity) {
      const selectedCityMetadata = Cities.find(c => c.k === selectedCity);
      if (selectedCityMetadata && selectedCityMetadata.c) {
        const center = getCentroidForCity(selectedCity) as [number, number];
        return {
          label: selectedCityMetadata.c,
          x: center[0],
          y: center[1],
        };
      }
    } else if (selectedCounty) {
      const selectedCountyMetadata = Counties.find(c => c.j === selectedCounty) as ProjectedCounty;
      if (selectedCountyMetadata) {
        return {
          label: selectedCountyMetadata.n,
          x: selectedCountyMetadata.l[0],
          y: selectedCountyMetadata.l[1],
        };
      }
    }
    return null;
  };

  const mapLabelProps = getMapLabelProps();

  const onCityHover = (cityKey: string): void => {
    const hoveredCity = Cities.find(city => cityKey === city.k);
    if (hoveredCity) {
      const [x, y] = getCentroidForCity(cityKey) as [number, number];
      setHoveredCity({
        ...hoveredCity,
        x,
        y,
      });
    }
  };

  const onCityUnhover = (): void => {
    setHoveredCity(null);
  };

  const onCountyHover = (nhgis_join: string): void => {
    if (nhgis_join !== selectedCounty) {
      const hoveredCounty = Counties.find(county => nhgis_join === county.j) as ProjectedCounty;
      setHoveredCounty(hoveredCounty);
    }
  };

  const onCountyUnhover = (): void => {
    setHoveredCounty(null);
  };

  const onStateHover = (abbr: string): void => {
    if (abbr !== selectedState) {
      const hoveredState = States.find(state => state.abbr === abbr) as ProjectedState;
      setHoveredState(hoveredState);
    }
  };

  const onStateUnhover = (): void => {
    setHoveredState(null);
  };

  const getCentroidForCity = (cityKey: string): [number, number] => 
    (Centroids.cities[cityKey]) ? Centroids.cities[cityKey] as [number, number] : [0, 0];

  return (
    <React.Fragment>
      <div className='mapControls'>
        <button onClick={() => setModalOpen(true)}>?</button>
        {linkUp && (
          <Link to={linkUp}>
            <button>
              <svg width={25} height={25}>
                <g transform='translate(9 12.5)'>
                  <line x1={0} x2={8} y1={0} y2={-5} stroke='black' strokeWidth={2} />
                  <line x1={0} x2={8} y1={0} y2={5} stroke='black' strokeWidth={2} />
                </g>
              </svg>
            </button>
          </Link>
        )}
      </div>
      <svg width={mapParameters.width} height={mapParameters.height} className='map' id='map'>
        <g transform={`translate(${translateX} ${translateY}) scale(${scale})`} ref={ref}>
          <Async 
            promiseFn={async () => {
              try {
                const response = await fetch(fetchPath);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return data as AsyncData;
              } catch (error) {
                console.error('Error fetching data:', error);
                throw error;
              }
            }}
            initialValue={{ counties: [], cities: [] }}
            watch={fetchPath}
          >
            {({ data, error, isPending }) => {
              if (isPending) return null;
              if (error) return `Something went wrong: ${error.message}`;
              if (data) {
                if (selectedMapView === 'counties') {
                  const counties = formatCounties(data.counties);
                  return (
                    <React.Fragment>
                      {counties.map(c => (
                        <County
                          {...c}
                          scale={mapParameters.scale}
                          strokeWidth={(mapScale === 'national') ? 0 : 0.75 / mapParameters.scale}
                          linkActive={mapScale !== 'national' && c.photoCount > 0}
                          makeLink={makeLink}
                          onCountyHover={onCountyHover}
                          onCountyUnhover={onCountyUnhover}
                          key={c.nhgis_join}
                        />
                      ))}
                      {hoveredCounty && (
                        <MapLabel 
                          x={hoveredCounty.l[0]}
                          y={hoveredCounty.l[1]}
                          fontSize={16 / mapParameters.scale}
                          label={hoveredCounty.n}
                        />
                      )}
                    </React.Fragment>
                  );
                } else {
                  const cities = formatCities(data.cities);
                  return (
                    <React.Fragment>
                      {cities.map(city => (
                        <City
                          {...city}
                          key={city.id}
                          linkActive={mapScale !== 'national'}
                          makeLink={makeLink}
                          onCityHover={onCityHover}
                          onCityUnhover={onCityUnhover}
                        />
                      ))}
                      {hoveredCity && (
                        <MapLabel 
                          x={hoveredCity.x!}
                          y={hoveredCity.y!}
                          fontSize={16 / mapParameters.scale}
                          label={hoveredCity.c}
                        />
                      )}
                    </React.Fragment>
                  );
                }
              }
              return null;
            }}
          </Async>

          {(States as Array<{
            abbr: string;
            name: string;
            labelCoords: [number, number];
            bounds: number[][];
            d: string;
          }>)
            .filter(s => s.bounds && s.bounds[0] && s.d && s.abbr)
            .map(state => {
              const stateLink = makeLink([
                { type: 'set_state', payload: state.abbr },
                { type: 'clear_county' },
                { type: 'clear_city' },
                { type: 'set_selected_map_view', payload: selectedMapView },
              ]);
              const isActive = mapScale === 'national' || selectedState !== state.abbr;
              const opacity = hoveredState && state.abbr !== hoveredState.abbr ? 0.4 : 0;
              
              return (
                <State
                  {...state}
                  fillOpacity={opacity}
                  link={stateLink}
                  linkActive={isActive}
                  scale={mapParameters.scale}
                  onHover={onStateHover}
                  onUnhover={onStateUnhover}
                  key={state.abbr}
                />
              );
            })}

          {selectedCounty !== DC.j && selectedCity !== 'DC_Washington' && (
            <County
              d={DC.d}
              name='Washington, DC'
              nhgis_join={DC.j}
              state='DC'
              area_sqmi={DC.a}
              fill={'transparent'}
              strokeOpacity={1}
              photoCount={DC.c}
              labelCoords={DC.l}
              fillOpacity={0}
              scale={mapParameters.scale}
              strokeWidth={(mapScale === 'national') ? 0 : 0.75 / mapParameters.scale}
              linkActive={true}
              link={(selectedMapView === 'counties') ? `/county/${DC.j}` : '/city/DC_Washington'}
              makeLink={makeLink}
              onCountyHover={onCountyHover}
              onCountyUnhover={onCountyUnhover}
            />
          )}

          {mapLabelProps && (
            <MapLabel 
              {...mapLabelProps}
              fontSize={16 / mapParameters.scale}
            />
          )}
        </g>
      </svg>

      {modalOpen && selectedMapView === 'cities' && (
        <MapCitiesInfo close={() => setModalOpen(false)} />
      )}

      {modalOpen && selectedMapView === 'counties' && (
        <MapCountiesInfo close={() => setModalOpen(false)} />
      )}
    </React.Fragment>
  );
};

export default React.memo(Map);
