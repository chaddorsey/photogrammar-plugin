import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams, useLocation } from "react-router-dom";
import * as d3 from 'd3';
import County from './County.jsx';
import State from './State.jsx';
import City from './City.jsx';
import MapLabel from './MapLabel.jsx';
import States from '../../data/svgs/states.json';
import './Map.css';

const Map = (props) => {
  const {
    counties,
    cities,
    selectedCounty,
    selectedCity,
    selectedState,
    selectCity,
    mapParameters,
    linkUp,
  } = props;

  const ref = useRef(null);
  const isMounting = useRef(true);
  const [ hoveredCounty, setHoveredCounty ] = useState(null);
  const [ hoveredCity, setHoveredCity ] = useState(null);
  // const [ hoveredState, setHoveredState ] = useState(null);
  const [ translateX, setTranslateX ] = useState(mapParameters.translateX);
  const [ translateY, setTranslateY ] = useState(mapParameters.translateY);
  const [ scale, setScale ] = useState(mapParameters.scale);
  const { placeId } = useParams();
  const location = useLocation();

  // check to see if it's the city view or county view and set if necessary

  // set selected place from url if necessary
  const mapScale = (location.pathname.split('/').length > 1
    && ['state', 'county', 'city'].includes(location.pathname.split('/')[1]))
    ? location.pathname.split('/')[1] : 'national';
  const cityDivisor = (mapScale !== 'national') ? 3000 : 6000;
  // if (selectedMapView === 'counties' && mapScale === 'county') {
  //   if (placeId !== selectedCounty && !isRetrievingData.current) {
  //     selectCounty(placeId);
  //     isRetrievingData.current = true;
  //   } else if (placeId === selectedCounty && isRetrievingData.current) {
  //     isRetrievingData.current = false;
  //   }
  // }

  // if (mapScale === 'city' && placeId !== selectedCity) {
  //   selectCity(placeId);
  // }
  // if (mapScale === 'state') {
  //   if (!isRetrievingData.current && (placeId !== selectedState || selectedCounty || selectedCity)) {
  //     selectState(placeId);
  //     isRetrievingData.current = true;
  //   } else if (placeId === selectedState && isRetrievingData.current) {
  //     isRetrievingData.current = false;
  //   }
  // }
  // if (mapScale === 'national') {
  //   if (!isRetrievingData.current && (selectedState || selectedCounty || selectedCity)) {
  //     selectNation();
  //     isRetrievingData.current = true;
  //   } else {
  //     isRetrievingData.current = false;
  //   }
  // }

  const mapLabelParams = {};
  if (selectedCity) {
    const selectedCityMetadata = cities.find(c => c.key === selectedCity);
    if (selectedCityMetadata) {
      mapLabelParams.label = selectedCityMetadata.city;
      mapLabelParams.x = selectedCityMetadata.center[0];
      mapLabelParams.y = selectedCityMetadata.center[1] - Math.sqrt(selectedCityMetadata.total / (cityDivisor * mapParameters.scale)) - 5 / mapParameters.scale;
    }
  } else if (selectedCounty) {
    const selectedCountyMetadata = counties.find(c => c.nhgis_join === selectedCounty);
    if (selectedCountyMetadata) {
      mapLabelParams.label = selectedCountyMetadata.name;
      mapLabelParams.x = selectedCountyMetadata.labelCoords[0]
      mapLabelParams.y = selectedCountyMetadata.labelCoords[1]
    }
  }

  //const selectedCityMetadata = (selectedCity) ? cities.find(c => c.key === selectedCity) : null;


  useEffect(
    () => {
      if (!isMounting.current) {
        console.log(mapParameters);
        d3.select(ref.current)
          .transition()
          .duration(1000)
          .attr('transform', `translate(${mapParameters.translateX} ${mapParameters.translateY}) scale(${mapParameters.scale})`)
          .on('end', () => {
            setTranslateX(mapParameters.translateX);
            setTranslateY(mapParameters.translateY);
            setScale(mapParameters.scale);
          });
      }
    }, [mapParameters.x, mapParameters.y, mapParameters.scale]
  );

  const onCityHover = (cityKey) => {
    // find the city
    const hoveredCity = cities.find(city => cityKey === city.key);
    setHoveredCity(hoveredCity);
  };

  const onCityUnhover = () => {
    setHoveredCity(null);
  };

  const onCountyHover = (nhgis_join) => {
    // find the city
    if (nhgis_join !== selectedCounty) {
      const hoveredCounty = counties.find(counties => nhgis_join === counties.nhgis_join);
      // only hover if it has photos
      if (hoveredCounty.photoCount > 0) {
        setHoveredCounty(hoveredCounty);
      }
    }
  };

  const onCountyUnhover = () => {
    setHoveredCounty(null);
  };

  // prevent render on initial load until map parameters have been calculated
  if (isMounting.current) {
    // update the transform if it's changed
    if (mapParameters.translateX !== translateX || mapParameters.translateY !== translateY
      || mapParameters.scale !== scale ) {
      setTranslateX(mapParameters.translateX);
      setTranslateY(mapParameters.translateY);
      setScale(mapParameters.scale);
    }

    // return placeholding div until the map parameters have been calculated
    if (mapParameters.basedOn === placeId || !placeId) {
      isMounting.current = false;
    } else {
      return (
        <div
          style={{
            width: mapParameters.width,
            height: mapParameters.height,
          }}
        />
      );
    }
  }

  return (
    <React.Fragment>
      <div
        className='mapControls'
      >
        {(linkUp) && (
          <Link to={linkUp}>
            <button>
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
                    stroke='black'
                    strokeWidth={2}
                  />
                  <line
                    x1={0}
                    x2={8}
                    y1={0}
                    y2={5}
                    stroke='black'
                    strokeWidth={2}
                  />
                </g>
              </svg>
            </button>
          </Link>
        )}
      </div>
      <svg
        width={mapParameters.width}
        height={mapParameters.height}
        className='map'
        id='map'
      >
        <g
          transform={`translate(${translateX} ${translateY}) scale(${scale})`}
          ref={ref}
        >
          {counties.map(c => (
            <County
              {...c}
              scale={mapParameters.scale}
              selectedCounty={selectedCounty}
              strokeWidth={(mapScale === 'national') ?  0 : 0.75 / mapParameters.scale}
              linkActive={mapScale !== 'national' && c.photoCount > 0}
              key={c.nhgis_join}
              onCountyHover={onCountyHover}
              onCountyUnhover={onCountyUnhover}
            />
          ))}
          { cities.map(city => {
            if (city.center && city.center[0]) {
              const { key } = city;
              let fillOpacity = 0.33;
              let stroke='#289261';
              if (hoveredCity || selectedCity) {
                if ((hoveredCity && key === hoveredCity.key )|| key === selectedCity) {
                  fillOpacity = 0.9;
                } else {
                  fillOpacity = 0.2;
                  stroke='transparent';
                }
              }
              return (
                <City
                  cx={city.center[0]}
                  cy={city.center[1]}
                  r={Math.sqrt(city.total / (cityDivisor * mapParameters.scale))}
                  fillOpacity={fillOpacity}
                  stroke={stroke}
                  strokeWidth={0.5 / mapParameters.scale}
                  scale={scale}
                  name={city.city}
                  id={city.key}
                  key={city.key}
                  linkActive={mapScale !== 'national'}
                  selectCity={selectCity}
                  onCityHover={onCityHover}
                  onCityUnhover={onCityUnhover}
                />
              );
            }
          })}
          {States.filter(s => s.bounds && s.bounds[0] && s.d && s.abbr).map(state => (
            <State
              {...state}
              //fillOpacity={(hoveredState && state.abbr !== hoveredState.abbr) ? 0.4 : 0}
              fillOpacity={0}
              linkActive={(mapScale === 'national' || (selectedState !== state.abbr))}
              scale={mapParameters.scale}
              // onHover={onStateHover}
              // onUnhover={onStateUnhover}
              key={state.abbr}
            />
          ))}

          {(hoveredCity) && (
            <MapLabel 
              x={hoveredCity.center[0]}
              y={hoveredCity.center[1] - Math.sqrt(hoveredCity.total / (cityDivisor * mapParameters.scale)) - 5 / mapParameters.scale}
              fontSize={12 / scale}
              label={hoveredCity.city}
            />
          )}

          {(hoveredCounty) && (
            <MapLabel 
              x={hoveredCounty.labelCoords[0]}
              y={hoveredCounty.labelCoords[1]}
              fontSize={16 / mapParameters.scale}
              label={hoveredCounty.name}
            />
          )}


          {(mapLabelParams.label) && (
            <MapLabel 
              x={mapLabelParams.x}
              y={mapLabelParams.y}
              fontSize={16 / mapParameters.scale}
              label={mapLabelParams.label}
            />
          )}
        </g>
      </svg>
    </React.Fragment>
  );
};

export default React.memo(Map);

Map.propTypes = {
  counties: PropTypes.array.isRequired,
  selectCounty: PropTypes.func,
};

Map.defaultProps = {
  
};
