import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Range } from 'rc-slider';
import { scaleLinear } from 'd3-scale';
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

type SelectChangeHandler = (value: Option | null, actionMeta: { action: string }) => void;

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
    open,
  } = props;

  const [resultsCountQuery, setResultsCountQuery] = useState<string | null>(null);
  const [photographerOption, setPhotographerOption] = useState<Option | null>(selectedPhotographerOption);
  const [stateOption, setStateOption] = useState<Option | null>(selectedStateOption);
  const [countyOrCityOption, setCountyOrCityOption] = useState<Option | null>(selectedCountyOption || selectedCityOption);
  const [themeOption, setThemeOption] = useState<Option | null>(selectedThemeOption);
  const [photoCaptionOptions, setPhotoCaptionOptions] = useState<Option[]>(selectedPhotoCaption ? [selectedPhotoCaption] : []);
  const [timeRangeOptions, setTimeRangeOptions] = useState<[number, number]>(timeRange);
  const [linkTo, setLinkTo] = useState('/');
  const [controlNumber, setControlNumber] = useState<string>('');
  const [isSearchingById, setIsSearchingById] = useState<boolean>(false);
  const [validatedLocItemLinks, setValidatedLocItemLinks] = useState<string[]>([]);

  const monthNum = (m: number): number => (m - 1) / 12;
  const numToMonth = (num: number): number => Math.round(num * 12) + 1;
  const x = scaleLinear()
    .domain([1935, 1944 + monthNum(6)])
    .range([0, 100]);

  const marks: { [x: number]: string; } = {};
  [1935, 1936, 1937, 1938, 1939, 1940, 1941, 1942, 1943, 1944].forEach((y: number): void => {
    marks[x(y)] = y.toString();
  });

  const step: number = x(1935 + monthNum(2)) - x(1935);

  const timeDefaultValue: [number, number] = [
    x(Math.floor(timeRangeOptions[0] / 100) + monthNum(timeRangeOptions[0] % 100)),
    x(Math.floor(timeRangeOptions[1] / 100) + monthNum(timeRangeOptions[1] % 100)),
  ];

  const customStyles = {
    control: (provided: { [cssSelector: string ]: string; }, state: { isFocused: boolean; }) => ({
      ...provided,
      borderRadius: '19px',
      borderColor: (state.isFocused) ? '#297373' : 'grey',
      backgroundColor: (state.isFocused) ? 'white' : '#fafafa',
      boxShadow: state.isFocused ? "0 0 0 2px #297373" : '0',
      '&:hover': {
        borderColor: 'pink'
      }
    }),
  };

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
      if (!lookupData || !lookupData.controlToLoc) {
        throw new Error('Failed to load lookup table');
      }
      
      // Directly look up loc_item_links using control numbers
      const locItemLinks = ids.map(id => {
        const locId = lookupData.controlToLoc[id];
        if (!locId) {
          console.warn(`No matching loc_item_link found for control number: ${id}`);
        }
        return locId;
      }).filter((id): id is string => id !== undefined);
      
      if (locItemLinks.length === 0) {
        alert('No matching photos found for the provided control numbers');
        return;
      }
      
      // Store the validated loc_item_links
      setValidatedLocItemLinks(locItemLinks);
      
      // Clear other search options since we're using control number search
      setPhotographerOption(null);
      setStateOption(null);
      setCountyOrCityOption(null);
      setThemeOption(null);
      setPhotoCaptionOptions([]);
      setTimeRangeOptions([193501, 194406]);
      
    } catch (error) {
      console.error('Error searching by control number:', error);
      alert('Failed to search photos. Please try again.');
    } finally {
      setIsSearchingById(false);
    }
  };

  const makeQuery = (field: Field | 'count'): string => {
    const cartoURLBase = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';
    const wheres: string[] = [];

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
    if (field !== 'photographer_name' && photographerOption?.label) {
      wheres.push(`photographer_name = '${photographerOption.label}'`);
    }
    if (field !== 'state' && stateOption?.label) {
      wheres.push(`state = '${stateOption.label}'`);
    }
    if (field !== 'nhgis_join' && selectedMapView === 'counties' && countyOrCityOption?.value) {
      wheres.push(`nhgis_join = '${countyOrCityOption.value}'`);
    }
    if (field !== 'city' && selectedMapView === 'cities' && countyOrCityOption?.label) {
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
    if (field !== 'themes' && themeOption?.value) {
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
    if (photoCaptionOptions?.[0]?.value) {
      const terms = photoCaptionOptions[0].value.match(/(".*?"|[^",\s]+)(?=\s*|\s*$)/g);
      if (terms) {
        terms.forEach(filterTerm => {
          wheres.push(`caption ~* '\\m${filterTerm}'`);
        });
      }
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

    return `${cartoURLBase}${encodeURIComponent(
      `select distinct ${field} as field from photogrammar_photos`
    )}`;
  };

  const onTimeChanging = (value: number[]): void => {
    if (value.length === 2) {
      const [start, end] = value;
      const newTimeRange: [number, number] = [
        Math.floor(x.invert(start)) * 100 + numToMonth(x.invert(start) % 1),
        Math.floor(x.invert(end)) * 100 + numToMonth(x.invert(end) % 1)
      ];
      setTimeRangeOptions(newTimeRange);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div id='searchWrapper'>
      <div id='advancedSearch'>
        <div className='controls'>
          <CloseButton onClick={toggleSearch} role='close' />
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
          onChange={(value: Option | null) => setPhotographerOption(value)}
          label='Photographer'
        />

        <StateSelect
          fetchPath={makeQuery('state')}
          defaultValue={stateOption}
          onChange={(value: Option | null, actionMeta?: { action: string }) => {
            setStateOption(value);
            if (actionMeta?.action === 'clear') {
              setCountyOrCityOption(null);
            }
          }}
          label='State'
        />

        <SearchSelect
          fetchPath={makeQuery(selectedMapView === 'cities' ? 'city' : 'nhgis_join')}
          defaultValue={countyOrCityOption}
          onChange={(value: Option | null) => setCountyOrCityOption(value)}
          label={selectedMapView === 'cities' ? 'City' : 'County'}
          isDisabled={!stateOption}
          options={stateOption ? countiesOrCitiesOptions[selectedMapView === 'cities' ? 'cities' : 'counties'][stateOption.value] : []}
        />

        <ThemesSelect
          fetchPath={makeQuery('themes')}
          defaultValue={themeOption}
          onChange={(value: Option | null) => setThemeOption(value)}
          label='Theme'
        />

        <div className='search-field'>
          <label>Caption</label>
          <CreatableSelect
            styles={customStyles}
            value={photoCaptionOptions}
            onChange={(value: Option[]) => setPhotoCaptionOptions(value)}
            isMulti
            placeholder='Enter search terms'
          />
        </div>

        <div className='search-field'>
          <label>Time Range</label>
          <Range
            min={0}
            max={100}
            step={step}
            defaultValue={timeDefaultValue}
            marks={marks}
            onChange={onTimeChanging}
          />
        </div>

        <div className='search-field'>
          <SearchButton
            linkTo={linkTo}
            fetchPath={makeQuery('count')}
            toggleSearch={toggleSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default Search;
