import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Counties from '../data/svgs/counties.json';
import { parsePathname } from '../helpers';
import { AppState, CityKey, NHGISJoinCode, StateAbbr, MapView, Viz, StateFacet, ParsedStateFacets } from '../index.d';
import { useSelector } from 'react-redux';

const ActionsFromURL = ({ setState }: { setState: (obj: AppState) => void }): null => {
  const [pathLoaded, setPathLoaded] = useState('');
  const { pathname, hash } = useLocation();
  const currentMapView = useSelector((state: any) => state.selectedMapView);

  type StateFacet = 'lightbox' | 'photo' | 'photographers' | 'ohsearch' | 'themes' | 'timeline' | 'city' | 'county' | 'state' | 'maps' | 'caption';

  useEffect(() => {
    const pathPieces: string[] = pathname
      .replace(`${process.env.PUBLIC_URL}`, '')
      .split('/')
      .filter(param => param);

    // get the view
    const getViz = (idx: number): string => {
      const paramMap: {[index: string]: string} = {
        photographers: 'photographers',
        ohsearch: 'photographers',
        themes: 'themes',
        timeline: 'timeline',
        city: 'map',
        county: 'map',
        state: 'map',
        maps: 'map',
      }
      // look for the first match
      if (paramMap[pathPieces[idx]]) {
        return paramMap[pathPieces[idx]];
      } else if (idx < pathPieces.length - 1) {
        return getViz(idx + 1);
      } else {
        // return 'map' if there aren't any matches
        return 'map';
      }
    };
    const selectedViz: string = getViz(0);

    // remove the basename from the pathPieces and build an object with state parameters
    const stateParams: ParsedStateFacets = parsePathname(pathname.replace(`${process.env.PUBLIC_URL}`, ''));
    
    // Preserve current view type when state is selected, otherwise use URL parameters
    const selectedMapView: MapView = stateParams.state ? 
      currentMapView : // Keep current view if state is selected
      (stateParams.city || hash === '#mapview=cities') ? 'cities' : 'counties';

    const {
      ohsearch,
      themes: selectedTheme,
      timeline,
      city: selectedCity,
      photo: selectedPhoto,
      photographers: selectedPhotographer,
      caption,
    } = stateParams;
    let {
      county: selectedCounty,
    } = stateParams;

    // set the state from city or county if necessary;
    let selectedState: string = stateParams.state;
    if (selectedState === 'DC') {
      selectedCounty = 'G1100010';
    } else if (selectedCounty) {
      ({ s: selectedState } = Counties.find(c => c.j === selectedCounty));
    } else if (selectedCity) {
      selectedState = selectedCity.substring(0, 2);
    } 

    if (`${pathname}${hash}` !== pathLoaded) {
      setState({
        selectedPhotographer: selectedPhotographer || null,
        selectedPhoto: selectedPhoto || null,
        selectedState: selectedState as StateAbbr || null,
        selectedCounty: selectedCounty as NHGISJoinCode || null,
        selectedCity: selectedCity as CityKey || null,
        selectedTheme: selectedTheme || 'root',
        selectedViz: selectedViz as Viz,
        selectedMapView: selectedMapView,
        filterTerms: (caption) ? caption.match(/(".*?"|[^",\s]+)(?=\s*|\s*$)/g) || [] : [],
        timeRange: (timeline) ? timeline.split('-').map(d => parseInt(d)) as [number, number] : [193501, 194406],
        pathname,
        hash,
      });
      setPathLoaded(`${pathname}${hash}`); 
    }
  });

  return null;
};

export default ActionsFromURL;
