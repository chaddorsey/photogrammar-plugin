import { useLocation } from 'react-router-dom';
import Centroids from '../data/centroids.json';
import { StateFacet, ParsedStateFacets, NHGISJoinCode } from './index.d';

// convenience functions for dates
export const monthNum = (m: number): number => (m - 1) / 12;
export const getTimeCode = (year: number, month: number): number => year * 100 + month;
export const timeCodeToNum = (timecode: number): number => Math.floor(timecode / 100) + monthNum(timecode % 100);

export const getStateAbbr = (name: string): string => {
  if (!name) {
    return null;
  }
  const stateabbrs = {"AL": "Alabama", "AK": "Alaska", "AS": "American Samoa", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District Of Columbia", "FM": "Federated States Of Micronesia", "FL": "Florida", "GA": "Georgia", "GU": "Guam", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MH": "Marshall Islands", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "MP": "Northern Mariana Islands", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PW": "Palau", "PA": "Pennsylvania", "PR": "Puerto Rico", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VI": "Virgin Islands", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"};
  const stIndex = Object.values(stateabbrs)
    .findIndex(stateName => stateName.toLowerCase() === name.toLowerCase());
  return Object.keys(stateabbrs)[stIndex];
}

export function parsePathname(pathname: string): ParsedStateFacets {
  // remove the basename from the pathPieces and build an object with state parameters
  const pathPieces: string[] = pathname.split('/').filter(param => param);
  const isParamKey = (param: string): boolean => ['lightbox', 'photo', 'photographers', 'ohsearch', 'themes', 'timeline', 'city', 'county', 'state', 'maps', 'caption'].includes(param);
  const stateParams: ParsedStateFacets = {};
  pathPieces.forEach((pathPiece, idx) => {
    if (isParamKey(pathPiece)) {
      if (pathPiece === 'themes' && isParamKey(pathPieces[idx + 1])) {
        stateParams[pathPiece as StateFacet] = 'root';
      } else if (pathPiece === 'photo') { // an exception as the id can contain a slash
        stateParams[pathPiece as StateFacet] = (!isParamKey(pathPieces[idx + 1])) ? `${pathPieces[idx + 1]}${(!isParamKey(pathPieces[idx + 2])) ? `/${pathPieces[idx + 2]}` : '' }` : null;
      } else {
        stateParams[pathPiece as StateFacet] = (!isParamKey(pathPieces[idx + 1])) ? pathPieces[idx + 1] : null;
      }
    }
  });
  stateParams.themes = stateParams.themes || 'root';
  return stateParams;
}

export const getCentroidForCounty = (nhgis_join: string): { center: number[]; dx: number; dy: number } => (Centroids as { counties: { [index: string]: { center: number[]; dx: number; dy: number } }}).counties[nhgis_join];
