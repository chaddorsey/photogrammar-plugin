import { combineReducers } from 'redux';
import A from './actionTypes';
import initialState from './initialState';
import { SET_SIDEBAR_PHOTOS } from './actions';
import { stateabbrs } from '../data/stateabbrs';

const selectedPhotographer = (state = initialState.selectedPhotographer, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedPhotographer ?? null;
  }
  return state;
};

const selectedPhoto = (state = initialState.selectedPhoto, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedPhoto ?? null;
  }
  return state;
};

const selectedCounty = (state = initialState.selectedCounty, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedCounty ?? null;
  }
  return state;
};

const selectedCity = (state = initialState.selectedCity, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedCity ?? null;
  }
  return state;
};

const selectedState = (state = initialState.selectedState, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedState ?? null;
  }
  return state;
};

const selectedTheme = (state = initialState.selectedTheme, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedTheme ?? null;
  }
  return state;
};

const filterTerms = (state = initialState.filterTerms, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.filterTerms ?? [];
  }
  return state;
};

const selectedViz = (state = initialState.selectedViz, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedViz ?? 'map';
  }
  return state;
};

const selectedMapView = (state = initialState.selectedMapView, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedMapView ?? 'counties';
  }
  return state;
};

const sidebarPhotosOffset = (state = initialState.sidebarPhotosOffset, action) => {
  if (action.type === A.SET_STATE) {
    return Math.max(action.payload.sidebarPhotosOffset, 0);
  }
  if (action.type === A.LOAD_SIDEBAR_PHOTOS) {
    return Math.max(action.payload.sidebarPhotosOffset, 0);
  }
  if (action.type === A.SET_PHOTO_OFFSET) {
    return Math.max(action.payload, 0);
  }
  return state;
};

const timeRange = (state = initialState.timeRange, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.timeRange;
  }
  if (action.type === A.SET_TIME_RANGE) {
    return action.payload;
  }
  return state;
};

const pathname = (state = initialState.pathname, action) => {
  switch (action.type) {
    case A.SET_STATE:
      return action.payload.pathname ?? state;
    default:
      return state;
  }
};

const hash = (state = initialState.hash, action) => {
  switch (action.type) {
    case A.SET_STATE:
      return action.payload.hash ?? state;
    default:
      return state;
  }
};

const dimensions = (state = initialState, action) => (
  (action.type === A.DIMENSIONS_CALCULATED) ? action.payload : state
);

const isWelcomeOpen = (state = initialState, action) => (
  (action.type === A.CLOSE_WELCOME) ? false : state
);

const isInitialized = (state = initialState, action) => (
  (action.type === A.INITIALIZED) ? true : state
);

const hasCompletedFirstLoad = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? true : state
);

const expandedSidebar = (state = initialState, action) => (
  (action.type === A.TOGGLE_EXPANDED_SIDEBAR) ? !state : state
);

const searchOpen = (state = initialState.searchOpen, action) => {
  switch (action.type) {
    case A.TOGGLE_SEARCH:
      return !state;
    case A.SET_STATE:
      return action.payload.searchOpen ?? false;
    default:
      return state;
  }
};

const vizOpen = (state = initialState, action) => (
  (action.type === A.TOGGLE_VIZ) ? !state : state
);

const sidebarPhotos = (state = [], action) => {
  if (action.type === A.SET_SIDEBAR_PHOTOS) {
    return action.payload;
  }
  return state;
};

const stateOptions = (state = initialState.stateOptions, action) => {
  if (action.type === A.SET_STATE) {
    if (action.payload.stateOptions) {
      return action.payload.stateOptions;
    }
    if (!state || state.length === 0) {
      return Object.keys(stateabbrs).map(abbr => ({
        value: abbr,
        label: stateabbrs[abbr]
      }));
    }
    return state;
  }
  return state;
};

export default combineReducers({
  selectedPhotographer,
  selectedPhoto,
  selectedCounty,
  selectedCity,
  selectedState,
  selectedTheme,
  filterTerms,
  selectedViz,
  selectedMapView,
  sidebarPhotosOffset,
  timeRange,
  pathname,
  hash,
  dimensions,
  isWelcomeOpen,
  isInitialized,
  hasCompletedFirstLoad,
  expandedSidebar,
  searchOpen,
  vizOpen,
  sidebarPhotos,
  stateOptions,
});
