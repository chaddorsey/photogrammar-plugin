import { combineReducers } from 'redux';
import A from './actionTypes';
import initialState from './initialState';
import { SET_SIDEBAR_PHOTOS } from './actions';

const selectedPhotographer = (state = initialState.selectedPhotographer, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedPhotographer ?? state;
  }
  return state;
};

const selectedPhoto = (state = initialState.selectedPhoto, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedPhoto ?? state;
  }
  return state;
};

const selectedCounty = (state = initialState.selectedCounty, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedCounty ?? state;
  }
  return state;
};

const selectedCity = (state = initialState.selectedCity, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedCity ?? state;
  }
  return state;
};

const selectedState = (state = initialState.selectedState, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.selectedState ?? state;
  }
  return state;
};

const selectedTheme = (state = initialState.selectedTheme, action) => (
  (action.type === A.SET_STATE) ? action.payload.selectedTheme : state
);

const filterTerms = (state = initialState.filterTerms, action) => (
  (action.type === A.SET_STATE) ? action.payload.filterTerms : state
);

const selectedViz = (state = initialState.selectedViz, action) => (
  (action.type === A.SET_STATE) ? action.payload.selectedViz : state
);

const selectedMapView = (state = initialState.selectedMapView, action) => (
  (action.type === A.SET_STATE) ? action.payload.selectedMapView : state
);

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
    return action.payload.timeRange ?? state;
  }
  if (action.type === A.SET_TIME_RANGE) {
    return action.payload ?? state;
  }
  return state;
};

const pathname = (state = initialState.pathname, action) => (
  (action.type === A.SET_STATE) ? action.payload.pathname : state
);

const hash = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.hash : state
);

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

const searchOpen = (state = initialState, action) => {
  if (action.type === A.TOGGLE_SEARCH) {
    return !state;
  } 
  if (action.type === A.SET_STATE) {
    return false;
  }
  return state;
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
    return action.payload.stateOptions ?? state;
  }
  return state;
};

const sidebarPhotosQuery = (state = initialState.sidebarPhotosQuery, action) => {
  if (action.type === A.SET_STATE) {
    return action.payload.sidebarPhotosQuery ?? state;
  }
  return state;
};

const combinedReducer = combineReducers({
  selectedPhotographer,
  selectedPhoto,
  selectedCounty,
  selectedCity,
  selectedState,
  timeRange,
  sidebarPhotosOffset,
  pathname,
  hash,
  dimensions,
  isWelcomeOpen,
  selectedMapView,
  isInitialized,
  hasCompletedFirstLoad,
  selectedTheme,
  selectedViz,
  filterTerms,
  expandedSidebar,
  searchOpen,
  vizOpen,
  sidebarPhotos,
  stateOptions,
  sidebarPhotosQuery,
});

export default combinedReducer;
