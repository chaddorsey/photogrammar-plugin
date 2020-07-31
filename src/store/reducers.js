import { combineReducers } from 'redux';
import A from './actionTypes';
import initialState from './initialState';

const selectedPhotographer = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.photographer : state
);

const selectedPhoto = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.photo : state
);

const selectedCounty = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.county : state
);

const selectedCity = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.city : state
);

const selectedState = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.state : state
);

const selectedTheme = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.theme : state
);

const selectedViz = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.viz : state
);

const selectedMapView = (state = initialState, action) => (
  (action.type === A.SET_STATE) ? action.payload.mapView : state
);

const sidebarPhotosOffset = (state = initialState, action) => {
  if (action.type === A.LOAD_SIDEBAR_PHOTOS) {
    return action.payload.sidebarPhotosOffset;
  }
  if (action.type === A.SELECT_THEME) {
    return 0;
  }
  if (action.type === A.SET_PHOTO_OFFSET) {
    return action.payload;
  }
  return state;
};

const timeRange = (state = initialState, action) => {
  if (action.type === A.SET_TIME_RANGE) {
    return action.payload;
  }
  return state;
};

const randomPhotoNumbers = (state = initialState, action) => (
  (action.type === A.GENERATE_RANDOM_PHOTO_NUMBERS) ? action.payload : state
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

const filterTerms = (state = initialState, action) => {
  if (action.type === A.SET_FILTER_TERMS) {
    return action.payload.filterTerms;
  }
  if (action.type === A.CLEAR_FILTER_TERMS) {
    return [];
  }
  return state;
};

const expandedSidebar = (state = initialState, action) => (
  (action.type === A.TOGGLE_EXPANDED_SIDEBAR) ? !state : state
);

const lightboxOpen = (state = initialState, action) => (
  (action.type === A.TOGGLE_LIGHTBOX) ? !state : state
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

const combinedReducer = combineReducers({
  selectedPhotographer,
  selectedPhoto,
  selectedCounty,
  selectedCity,
  selectedState,
  timeRange,
  sidebarPhotosOffset,
  randomPhotoNumbers,
  dimensions,
  isWelcomeOpen,
  selectedMapView,
  isInitialized,
  hasCompletedFirstLoad,
  selectedTheme,
  selectedViz,
  filterTerms,
  expandedSidebar,
  lightboxOpen,
  searchOpen,
  vizOpen,
});

export default combinedReducer;
