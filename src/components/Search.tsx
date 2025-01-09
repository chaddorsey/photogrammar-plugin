import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Select, { ValueType, ActionMeta } from 'react-select';
import CreatableSelect, { makeCreatableSelect } from 'react-select/creatable';
import { Range } from 'rc-slider';
import * as d3 from 'd3';
import PhotographersSelect from './search/PhotographersSelect.js';
import StateSelect from './search/StateSelect.js';
import SearchSelect from './search/SearchSelect';
import ThemesSelect from './search/ThemesSelect.js';
import SearchButton from './search/SearchButton';
import themes from '../data/themes.json';
import CloseButton from './buttons/Close.tsx';
import './Search.css';
import { Props, Field, Option, Cities, DBCities, DBQueryResult } from './Search.d';
import { loadLookupTable } from '../utils/lookupTable';
import { useDispatch } from 'react-redux';

const cartoURLBase = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';

const Search = (props: Props) => {
  const {
    selectedPhotographerOption,
    selectedStateOption,
    selectedThemeOption,
    selectedCountyOption,
    selectedCityOption,
    selectedPhotoCaption,
    terms,
    timeRange,
    selectedMapView,
    countiesOrCitiesOptions,
    toggleSearch,
  } = props;

  const [resultsCountQuery, setResultsCountQuery] = useState<null | string>(null);
  const [photographerOption, setPhotographerOption] = useState(selectedPhotographerOption);
  const [stateOption, setStateOption] = useState(selectedStateOption);
  const [countyOrCityOption, setCountyOrCityOption] = useState(selectedCountyOption || selectedCityOption);
  const [themeOption, setThemeOption] = useState(selectedThemeOption);
  //const [photoCaptionOption, setPhotoCaptionOption] = useState(terms);
  const [photoCaptionOptions, setPhotoCaptionOptions] = useState([selectedPhotoCaption]);
  const [timeRangeOptions, setTimeRangeOptions] = useState(timeRange);
  const [linkTo, setLinkTo] = useState('/');
  const [controlNumber, setControlNumber] = useState<string>('');
  const [isSearchingById, setIsSearchingById] = useState<boolean>(false);
  const [controlNumberWhereClause, setControlNumberWhereClause] = useState<string | null>(null);
  const [validatedLocItemLinks, setValidatedLocItemLinks] = useState<string[]>([]);
  const dispatch = useDispatch();

  useEffect(() => {
    let path = '';
    
    // If we have validated loc item links, use those for the path
    if (validatedLocItemLinks.length > 0) {
      path = `/photos/${validatedLocItemLinks.join(',')}`;
    } else {
      // Existing path construction logic
      const photographer = photographerOption && photographerOption.value;
      const state = stateOption && stateOption.value;
      const cityOrCounty = countyOrCityOption && countyOrCityOption.value;
      const theme = themeOption && themeOption.value;
      const filterTerms = photoCaptionOptions && photoCaptionOptions[0] && photoCaptionOptions[0].value;

      if (cityOrCounty) {
        path = `/${(selectedMapView === 'cities') ? 'city' : 'county'}/${cityOrCounty}`;
      } else if (state) {
        path = `/state/${state}`;
      } else if (theme) {
        path = `/themes/${theme}`
      } else {
        path = `/maps`;
      }

      if (theme && !path.includes('/themes/')) {
        path = `${path}/themes/${theme}`
      }

      if (photographer) {
        path = `${path}/photographers/${photographer}`;
      }

      if (filterTerms) {
        path = `${path}/caption/${filterTerms}`
      }

      if (timeRangeOptions[0] !== 193501 || timeRangeOptions[1] !== 194406) {
        path = `${path}/timeline/${timeRangeOptions.join('-')}`;
      }
    }

    if (path !== linkTo) {
      setLinkTo(path);
    }
  }, [validatedLocItemLinks, photographerOption, stateOption, countyOrCityOption, themeOption, photoCaptionOptions, timeRangeOptions, selectedMapView, linkTo]);

  if (!open) {
    return null;
  }

  const monthNum = (m: number): number => (m - 1) / 12;
  const numToMonth = (num: number): number => Math.round(num * 12) + 1;
  const x = d3.scaleLinear()
    .domain([1935, 1944 + monthNum(6)])
    .range([0, 100]);
  const marks: { [x: number]: string; } = {};
  [1935, 1936, 1937, 1938, 1939, 1940, 1941, 1942, 1943, 1944].forEach((y: number): void => {
    marks[x(y)] = y.toString();
  });
  const step: number = x(1935 + monthNum(2)) - x(1935);

  const timeDefaultValue = [
    x(Math.floor(timeRangeOptions[0] / 100) + monthNum(timeRangeOptions[0] % 100)),
    x(Math.floor(timeRangeOptions[1] / 100) + monthNum(timeRangeOptions[1] % 100)),
  ];

  const makeQuery = (field: Field | 'count') => {
    const cartoURLBase = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';
    const wheres = [];

    // Only apply control number filter for the final count/results query
    if (validatedLocItemLinks.length > 0) {
      const idList = validatedLocItemLinks.map(id => `'${id}'`).join(',');
      wheres.push(`loc_item_link IN (${idList})`);
      
      // For control number searches, we only want to return the count or specific fields
      if (field === 'count') {
        return `${cartoURLBase}${encodeURIComponent(
          `select count(loc_item_link) as numPhotos from photogrammar_photos where ${wheres.join(' and ')}`
        )}`;
      } else {
        return `${cartoURLBase}${encodeURIComponent(
          `select distinct ${field} as field from photogrammar_photos where ${wheres.join(' and ')}`
        )}`;
      }
    }

    // Existing filter logic for non-control number searches
    if (field !== 'photographer_name' && photographerOption && photographerOption.label) {
      wheres.push(`photographer_name = '${photographerOption.label}'`);
    }
    if (field !== 'state' && stateOption && stateOption.label) {
      wheres.push(`state = '${stateOption.label}'`);
    }
    if (field !== 'nhgis_join' && selectedMapView === 'counties' && countyOrCityOption && countyOrCityOption.value) {
      wheres.push(`nhgis_join = '${countyOrCityOption.value}'`);
    }
    if (field !== 'city' && selectedMapView === 'cities' && countyOrCityOption && countyOrCityOption.label) {
      // some cities are nested together and only selectable together, you need to get all of them for the count
      if (field === 'count' && countyOrCityOption.sublabels) {
        const cityWheres: string[] = [`city = '${countyOrCityOption.label}'`];
        countyOrCityOption.sublabels.forEach((otherCity: string) => {
          cityWheres.push(`city = '${otherCity}'`);
        });
        wheres.push(`(${cityWheres.join(' or ')})`);
      } else {
        wheres.push(`city = '${countyOrCityOption.label}'`);
      }
    }
    if (field !== 'themes' && themeOption && themeOption.value) {
      const levels = themeOption.value.replace('root|', '').split('|')
      if (levels.length === 3) {
        wheres.push(`vanderbilt_level3 = '${levels[2]}'`);
      }
      if (levels.length >= 2) {
        wheres.push(`vanderbilt_level2 = '${levels[1]}'`);
      }
      if (levels.length >= 1) {
        wheres.push(`vanderbilt_level1 = '${levels[0]}'`);
      } 
    }
    const [startTime, endTime] = timeRangeOptions;
    const startYear = Math.floor(startTime / 100);
    const startMonth = startTime % 100;
    wheres.push(`(year > ${startYear} or (year = ${startYear} and month >= ${startMonth}))`);

    const endYear = Math.floor(endTime / 100);
    const endMonth = endTime % 100;
    wheres.push(`(year < ${endYear} or (year = ${endYear} and month <= ${endMonth}))`);

    // the value of the filter term can be in a few places from the creatable component
    if (photoCaptionOptions && photoCaptionOptions[0] && photoCaptionOptions[0].value) {
      const terms = photoCaptionOptions[0].value.match(/(".*?"|[^",\s]+)(?=\s*|\s*$)/g);
      terms.forEach(filterTerm => {
         wheres.push(`caption ~* '\\m${filterTerm}'`);
      });
    } 

    if (wheres.length > 0 && field === 'themes') {
      wheres.push('vanderbilt_level1 is not null');
    }

    if (wheres.length > 0) {
      let query: string;
      if (field === 'themes') {
        query = `select distinct concat(case when vanderbilt_level1 is not null then concat('root|', vanderbilt_level1) else '' end, case when vanderbilt_level2 is not null then concat('|', vanderbilt_level2) else '' end,  case when vanderbilt_level3 is not null then concat ('|', vanderbilt_level3) else '' end) as field from photogrammar_photos where ${wheres.join(' and ')}`;
      } else if (field === 'count') {
        query = `select count(loc_item_link) as numPhotos from photogrammar_photos where ${wheres.join(' and ')}`;
      } else {
        query = `select distinct ${field} as field from photogrammar_photos where ${wheres.join(' and ')}`;
      }

      return `${cartoURLBase}${encodeURIComponent(query)}`;
    } 
    return null;
  };

  const onTimeChanging = (xs: [number, number]): void => {
    const newTimeRange = (xs.map(anX => {
      const dateNum = x.invert(anX);
      const rawMonth = numToMonth(dateNum % 1);
      const year = (rawMonth === 13) ? Math.floor(dateNum) + 1 : Math.floor(dateNum);
      const month = (rawMonth === 13) ? 1 : rawMonth;
      return year * 100 + month;
    })) as [number, number];
    setTimeRangeOptions(newTimeRange);
  };

  const customStyles = {
    control: (provided: { [cssSelector: string ]: string; }, state: { isFocused: boolean; }) => ({
      ...provided,
      borderRadius: '19px',
      borderColor: (state.isFocused) ? '#297373' : 'grey',
      backgroundColor: (state.isFocused) ? 'white' : '#fafafa',
      //boxShadow: (state.isFocused) ? 'px 2px 2px 2px #297373' : 'none',
      boxShadow: state.isFocused ? "0 0 0 2px #297373" : '0',
      '&:hover': {
        borderColor: 'pink'
      }
    }),
  }

  const filterFunction = (rows: DBQueryResult[] ) => (d: Option) => rows.map(p => p.field).includes(d.label);

  const handleControlNumberSearch = async () => {
    try {
      setIsSearchingById(true);
      setValidatedLocItemLinks([]); // Clear previous results
      
      // Split and clean input
      const ids = controlNumber
        .split(/[\s,]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0);
        
      if (ids.length === 0) {
        alert('Please enter at least one control number');
        return;
      }
      
      // Load lookup table
      const lookupData = await loadLookupTable();
      
      // Directly look up loc_item_links using control numbers
      const locItemLinks = ids.map(id => {
        const locId = lookupData.controlToLoc[id];
        if (!locId) {
          console.warn(`No matching loc_item_link found for control number: ${id}`);
        }
        return locId;
      }).filter(id => id);
      
      if (locItemLinks.length === 0) {
        alert('No matching photos found for the provided control numbers');
        return;
      }

      // Construct query for these specific photos
      const query = `SELECT * FROM photogrammar_photos WHERE loc_item_link IN ('${locItemLinks.join("','")}')`;
      const fullQuery = cartoURLBase + encodeURIComponent(query);
      
      // Fetch the photos
      const response = await fetch(fullQuery);
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Store the photos in Redux
      dispatch({
        type: 'SET_SIDEBAR_PHOTOS',
        payload: data.rows
      });
      
      // Store the query in Redux for Export CSV
      dispatch({
        type: 'SET_STATE',
        payload: {
          sidebarPhotosQuery: query  // Store the raw SQL query without the CartoDB URL
        }
      });
      
      // Store the validated loc_item_links
      setValidatedLocItemLinks(locItemLinks);
      
      // Clear other search options since we're using control number search
      setPhotographerOption(null);
      setStateOption(null);
      setCountyOrCityOption(null);
      setThemeOption(null);
      setPhotoCaptionOptions([{ label: null, value: null }]);
      
    } catch (error) {
      console.error('Error searching by control number:', error);
      alert('Failed to search photos. Please try again.');
    } finally {
      setIsSearchingById(false);
    }
  };

  // Clear control number search when other search options are used
  useEffect(() => {
    if (photographerOption || stateOption || countyOrCityOption || themeOption || 
        (photoCaptionOptions && photoCaptionOptions[0] && photoCaptionOptions[0].value)) {
      setControlNumber('');
      setValidatedLocItemLinks([]);
    }
  }, [photographerOption, stateOption, countyOrCityOption, themeOption, photoCaptionOptions]);

  return (
    <div
      id='searchWrapper'
    >
      <div
        id='advancedSearch'
      >
        <div className='controls'>
          <CloseButton
            onClick={toggleSearch}
            role='close'
          />
        </div>

        <h2>Search</h2>

        <div className='search-field'>
          <label>Search by Control Number</label>
          <div className='control-number-search'>
            <input
              type="text"
              value={controlNumber}
              onChange={(e) => setControlNumber(e.target.value)}
              placeholder="Enter control numbers (comma or space separated)"
              className="control-number-input"
            />
            <button
              onClick={handleControlNumberSearch}
              disabled={isSearchingById}
              className="control-number-search-button"
            >
              {isSearchingById ? 'Searching...' : 'Lookup'}
            </button>
          </div>
        </div>

        <div className='search-divider'>- OR -</div>

        <PhotographersSelect
          fetchPath={makeQuery('photographer_name')}
          defaultValue={photographerOption}
          onChange={(inputValue: ValueType<Option, false>, action: ActionMeta<Option>) => { setPhotographerOption(inputValue); }}
          label='Photographer'
        />

        <StateSelect
          fetchPath={makeQuery('state')}
          defaultValue={stateOption}
          onChange={(inputValue: ValueType<Option, false>, { action }: { action: string }) => { 
            setStateOption(inputValue); 
            if (action === 'clear') {
              setCountyOrCityOption(null);
            }
          }}
          label='State'
        />

        {(selectedMapView === 'counties' && stateOption) && (
          <SearchSelect
            fetchPath={makeQuery('nhgis_join')}
            defaultValue={countyOrCityOption}
            onChange={(inputValue: ValueType<Option, false>, action: ActionMeta<Option>) => { setCountyOrCityOption(inputValue); }}
            label='County'
            allOptions={countiesOrCitiesOptions.counties[stateOption.value]}
          />
        )}

        {(selectedMapView === 'counties' && !stateOption) && (
          <React.Fragment>
            <h4>County</h4>
            <div>Select state above</div>
          </React.Fragment>
        )}

        {(selectedMapView === 'cities' && stateOption) && (
          <SearchSelect
            fetchPath={makeQuery('city')}
            defaultValue={countyOrCityOption}
            onChange={(inputValue: ValueType<Option, false>, action: ActionMeta<Option>) => { setCountyOrCityOption(inputValue); }}
            formatOptionLabel={({value, label, sublabels}: Option) => (<div>{label}{(sublabels) ? ` (includes ${sublabels.join(', ')})`: ''}</div>)}
            label='City'
            allOptions={countiesOrCitiesOptions.cities[stateOption.value]}
          />
        )}

        {(selectedMapView === 'cities' && !stateOption) && (
          <React.Fragment>
            <h4>City</h4>
            <div>Select state above</div>
          </React.Fragment>
        )}

        <ThemesSelect
          fetchPath={makeQuery('themes')}
          defaultValue={themeOption}
          onChange={(inputValue: ValueType<Option, false>, action: ActionMeta<Option>) => { setThemeOption(inputValue); }}
          label='Theme'
         />

        <h4>Photo Caption</h4>

        <CreatableSelect
          styles={customStyles}
          options={photoCaptionOptions}
          isClearable
          onCreateOption={(inputValue) => {
            setPhotoCaptionOptions([
              {
                label: inputValue,
                value: inputValue,
              },
              ...photoCaptionOptions.filter(d => d.value),
            ]);
            // setPhotoCaptionOption({
            //   label: inputValue,
            //   value: inputValue,
            // });
          }}
          onChange={(inputValue: ValueType<Option, false>, { action }: { action: string }) => {
            if (action === 'clear') {
              setPhotoCaptionOptions([
                {
                  label: null,
                  value: null,
                },
                ...photoCaptionOptions,
              ]);
            }
            if (action === 'select-option') {
              setPhotoCaptionOptions([
                inputValue,
                ...photoCaptionOptions.filter(d => d.value !== inputValue.value),
              ]);
              //setPhotoCaptionOption(inputValue);
            }
          }}
          formatCreateLabel={(inputValue) => `search captions for "${inputValue}"`}
          createOptionPosition='last'
          //placeholder={captionInput}
          value={photoCaptionOptions[0]}
        />

        <h4>Time Range</h4>

        <div
          className='timelineSlider'
          style={{
            width: '90%',
            marginLeft: '5%',
          }}
        >
          <Range
            allowCross={false}
            value={timeDefaultValue}
            onChange={onTimeChanging} 
            marks={marks}
            step={step}
            trackStyle={[{
              backgroundColor: 'black',
            }]}
            handleStyle={[
              {
                borderColor: 'black',
                backgroundColor: '#F2BE00',
              },
              {
                borderColor: 'black',
                backgroundColor: '#F2BE00',
              },
            ]} 
            activeDotStyle={{
              borderColor: 'black',
            }}
          />
        </div>

        <SearchButton
          linkTo={linkTo}
          fetchPath={makeQuery('count')}
          toggleSearch={toggleSearch}
        />
      </div>
    </div>
  );
};

export default Search;
