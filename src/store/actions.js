import he from 'he';
import A from './actionTypes';
import Photographers from '../data/photographers.json';
import Counties from '../data/svgs/counties.json';
import Cities from '../data/citiesCounts.json';
import { makeWheres } from './selectors';

const cartoURLBase = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';
const sqlQueryBase = 'SELECT * FROM photogrammar_photos';
const stateabbrs = {"AL": "Alabama", "AK": "Alaska", "AS": "American Samoa", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District Of Columbia", "FM": "Federated States Of Micronesia", "FL": "Florida", "GA": "Georgia", "GU": "Guam", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MH": "Marshall Islands", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "MP": "Northern Mariana Islands", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PW": "Palau", "PA": "Pennsylvania", "PR": "Puerto Rico", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VI": "Virgin Islands", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"};
const basename = process.env.PUBLIC_URL;

/* 
  action functions
    initializeData
    setState
    selectViz
    selectPhoto
    setPhotoOffset
    setTimeRange
    closeWelcome
    toggleExpandedSidebar
    windowResized
    calculateDimensions

  utility functions
    getEventId
    getStateNameFromAbbr
*/

export function initializeData() {
  return async (dispatch, getState) => {
    const {
      isWelcomeOpen,
      expandedSidebar,
      dimensions,
    } = getState();
    const theDimensions = calculateDimensions({ isWelcomeOpen, expandedSidebar });
    if (!dimensions.calculated) {
      dispatch({
        type: A.DIMENSIONS_CALCULATED,
        payload: theDimensions,
      });
    }
    
    // Load initial random photos
    const query = 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000';
    try {
      const response = await fetch(`https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.rows) {
        dispatch({ type: A.SET_SIDEBAR_PHOTOS, payload: data.rows });
        dispatch({
          type: A.SET_STATE,
          payload: {
            sidebarPhotosQuery: query,
            sidebarPhotosOffset: 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading initial photos:', error);
    }

    dispatch({
      type: A.INITIALIZED,
    });
  }
}

export function setState(payload) {
  return async (dispatch, getState) => {
    const { selectedPhotographer, selectedState, selectedCounty, selectedCity, selectedTheme,
        selectedViz, selectedMapView, filterTerms, timeRange, sidebarPhotosOffset } = getState();

    // Ensure all required fields have valid values
    const updatedPayload = {
      ...payload,
      selectedPhotographer: payload.selectedPhotographer ?? selectedPhotographer,
      selectedState: payload.selectedState ?? selectedState,
      selectedCounty: payload.selectedCounty ?? selectedCounty,
      selectedCity: payload.selectedCity ?? selectedCity,
      selectedTheme: payload.selectedTheme ?? selectedTheme,
      selectedViz: payload.selectedViz ?? selectedViz,
      selectedMapView: payload.selectedMapView ?? selectedMapView,
      timeRange: payload.timeRange ?? timeRange,
      filterTerms: payload.filterTerms ?? filterTerms,
      sidebarPhotosOffset: payload.sidebarPhotosOffset ?? sidebarPhotosOffset
    };

    // Handle themes view specifically
    if (payload.selectedViz === 'themes') {
      updatedPayload.selectedMapView = null;
      updatedPayload.selectedCounty = null;
      updatedPayload.selectedCity = null;
      updatedPayload.selectedState = null;
      updatedPayload.pathname = payload.selectedTheme ? `/themes/${payload.selectedTheme}` : '/themes';
    }
    // Preserve view type when selecting a state
    else if (payload.selectedState && !payload.selectedMapView) {
      // If we're selecting a state, keep the current map view type
      updatedPayload.selectedMapView = selectedMapView;
      
      // Ensure county view doesn't get implicitly set
      if (selectedMapView === 'cities') {
        updatedPayload.selectedCounty = null;
      }
      
      // Set appropriate pathname for map view
      updatedPayload.pathname = `/state/${payload.selectedState}`;
    }

    const hasSelectionChanged = updatedPayload.selectedPhotographer !== selectedPhotographer
      || updatedPayload.selectedState !== selectedState 
      || updatedPayload.selectedCounty !== selectedCounty
      || updatedPayload.selectedCity !== selectedCity 
      || updatedPayload.selectedTheme !== selectedTheme
      || updatedPayload.selectedViz !== selectedViz 
      || updatedPayload.selectedMapView !== selectedMapView
      || updatedPayload.timeRange[0] !== timeRange[0] 
      || updatedPayload.timeRange[1] !== timeRange[1]
      || updatedPayload.filterTerms.sort().join(',') !== filterTerms.sort().join(',');

    if (hasSelectionChanged) {
      updatedPayload.sidebarPhotosOffset = 0;

      // For themes view, use random photos query
      let query;
      if (updatedPayload.selectedViz === 'themes') {
        query = 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000';
      } else {
        // Construct SQL query based on the new selection
        const wheres = makeWheres({
          ...getState(),
          ...updatedPayload
        });
        query = `${sqlQueryBase} WHERE ${wheres.join(' AND ')}`;
      }

      try {
        // Fetch photos from database
        const response = await fetch(cartoURLBase + encodeURIComponent(query));
        if (!response.ok) {
          throw new Error(`Database query failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.rows && data.rows.length > 0) {
          // Update photos in store
          dispatch({ type: A.SET_SIDEBAR_PHOTOS, payload: data.rows });
          updatedPayload.sidebarPhotosQuery = query;
        }
      } catch (err) {
        console.error('Error fetching photos:', err);
      }
    } else {
      updatedPayload.sidebarPhotosOffset = sidebarPhotosOffset;
    }

    dispatch({
      type: A.SET_STATE,
      payload: updatedPayload
    });
  }
}

export function setPhotoOffset(eOrId) {
  return {
    type: A.SET_PHOTO_OFFSET,
    payload: getEventId(eOrId, 'number')
  };
}

export function closeWelcome() {
  return (dispatch, getState) => {
    const theDimensions = calculateDimensions({ isWelcomeOpen: false });
    dispatch({
      type: A.DIMENSIONS_CALCULATED,
      payload: theDimensions,
    });
    dispatch({
      type: A.CLOSE_WELCOME
    });
  }
}

export function toggleExpandedSidebar() {
  return async (dispatch, getState) => {
    const theDimensions = calculateDimensions({ isWelcomeOpen: false, expandedSidebar: !getState().expandedSidebar });
    dispatch({
      type: A.DIMENSIONS_CALCULATED,
      payload: theDimensions,
    });
    // if the photo offset is an even page, adjust the offset so it shows the current and previous; if it's an odd page it should show the current and next, e.g. if the current page is 2 and the sidebar is selected, reset offset to 0 to show the first and second photocard sets
    if (!getState().expandedSidebar && getState().sidebarPhotosOffset % theDimensions.photoCards.displayableCards !== 0) {
      dispatch({
        type: A.SET_PHOTO_OFFSET,
        payload: Math.floor(getState().sidebarPhotosOffset / theDimensions.photoCards.displayableCards) * theDimensions.photoCards.displayableCards,
      })
    }
    dispatch({
      type: A.TOGGLE_EXPANDED_SIDEBAR,
    });


  }
}

export function toggleViz() {
  return {
    type: A.TOGGLE_VIZ,
  }
}

export function toggleLightbox() {
  return {
    type: A.TOGGLE_LIGHTBOX,
  };
}

export function toggleSearch() {
  return {
    type: A.TOGGLE_SEARCH,
  };
}

export function setIsLoading(status) {
  return {
    type: A.SET_IS_LOADING,
    payload: status,
  };
}

export function setTimeRange(tr) {
  return async (dispatch, getState) => {
    // if time range isn't set, reset it to the full view
    const timeRange = (tr && Array.isArray(tr) && tr.length === 2) ? tr : [193501, 194406];
    dispatch({
      type: A.SET_TIME_RANGE,
      payload: timeRange,
    });
  }
}

export function windowResized() {
  return (dispatch, getState) => {
    const theDimensions = calculateDimensions({ isWelcomeOpen: getState().isWelcomeOpen });
    dispatch({
      type: A.DIMENSIONS_CALCULATED,
      payload: theDimensions,
    });

    // adjust the photo offset to the nearest set number to keep them as multiples of the number of displayable cards
    if (getState().sidebarPhotosOffset % theDimensions.photoCards.displayableCards !== 0) {
      dispatch({
        type: A.SET_PHOTO_OFFSET,
        payload: Math.floor(getState().sidebarPhotosOffset / theDimensions.photoCards.displayableCards) * theDimensions.photoCards.displayableCards,
      })
    }
  }
}
 
export function calculateDimensions(options) {
  const padding = 10;
  const timelineSliderHeight = 50;
  const headerElements = 101;
  // this should be calculated from the DOM--if it's there
  const headerHeight = (headerElements && headerElements.length >= 1) ? headerElements.height : 101;
  const { innerHeight: windowInnerHeight, innerWidth: windowInnerWidth } = window;
  const { clientWidth, clientHeight } = (document.documentElement) ? document.documentElement : { clientWidth: null, clientHeight: null };
  const innerWidth = clientWidth || windowInnerWidth;
  const innerHeight = clientHeight || windowInnerHeight; 

  const isMobile = innerWidth <= 768;

  const windowWidth = Math.max(800, innerWidth);

  let welcomeHeight = (options && options.isWelcomeOpen) ? 0 : 0;
  const expandedSidebar = (options && options.expandedSidebar);

  const vizCanvasWidth =  (!expandedSidebar)
    ? Math.min(windowWidth * 0.66, windowWidth - 200) - padding * 2
    : Math.min(windowWidth * 0.33, windowWidth - 200) - padding * 2
  const vizCanvas = {
    height: Math.max(600, innerHeight - headerHeight - timelineSliderHeight),
    width: vizCanvasWidth,
  }

  const selectedPhoto = {
    height: Math.max(600, innerHeight - headerHeight),
  }

  const timelineHeatmap = (isMobile) ? {
    width: innerWidth * 0.8,
    height: Math.min(Photographers.length * 15, vizCanvas.height / 3),
    leftAxisWidth: innerWidth * 0.15,
    labelsWidth: 150,
  } : {
    width: Math.min(vizCanvas.width * 0.75, vizCanvas.width - 200),
    height: Math.min(Photographers.length * 15, vizCanvas.height * 0.35),
    leftAxisWidth: Math.max(225, vizCanvas.width * 0.2),
    labelsWidth: 150,
  };

  const mapControlsWidth = 50;
  const mapControlsHeight = vizCanvas.height - timelineHeatmap.height - padding / 2;
  const mapControls = {
    width: mapControlsWidth,
    height: mapControlsHeight,
  };

  const mapWidth = (isMobile) ? innerWidth: vizCanvas.width - mapControlsWidth;
  const mapHeight = (isMobile) ? innerHeight * 0.5 - 70 : vizCanvas.height - timelineHeatmap.height - padding / 2;
  const horizontalScale = mapWidth / 960;
  const verticalScale = mapHeight / 500;
  const map = {
    height: mapHeight,
    width: mapWidth,
    scale: Math.min(horizontalScale, verticalScale) / 1000,
  };

  let sidebarWidth = innerWidth;
  let unexpandedSidebarWidth = innerWidth;
  if (!isMobile) {
    sidebarWidth = (!expandedSidebar)
      ? Math.max(200, windowWidth * 0.33)
      : Math.max(200, windowWidth * 0.66);

    unexpandedSidebarWidth = Math.max(200, windowWidth * 0.33);
  }
  const sidebarHeight = (!isMobile)
    ? vizCanvas.height - 75 - welcomeHeight
    : innerHeight - 75;
  const sidebarHeaderHeight = 100;
  const filterHeight = 34;
  const sidebar = {
    width: sidebarWidth,
    height: sidebarHeight,
    headerHeight: sidebarHeaderHeight,
    photosHeight: sidebarHeight - sidebarHeaderHeight - filterHeight,
  }

  // the photocard will be scaled to be between 150 and 200px
  const photoCardMinWidth = 145; // (expandedSidebar) ? 200 : 145;
  const photoCardMaxWidth = 300;
  const maxCols = Math.floor(sidebarWidth / photoCardMinWidth);
  let photoCardWidth = unexpandedSidebarWidth / Math.floor(unexpandedSidebarWidth / photoCardMinWidth) * 0.96;
  let cols = Math.floor(unexpandedSidebarWidth/ photoCardMinWidth);
  if (expandedSidebar) {
    cols = cols * 2;
  }

  // // if the maxCols is three or greater on , increase the size to make them more visible--shooting for 250 give or take
  // const defaultCols = (expandedSidebar) ? 6 : 3;
  // for (let potentialCols = cols - 1; potentialCols >= defaultCols && photoCardWidth < 220; potentialCols -= 1) {
  //   //cols = potentialCols;
  //   //photoCardWidth = sidebarWidth / potentialCols * 0.96
  // }

  if (isMobile) {
    photoCardWidth = innerWidth * 0.45;
    cols = 2;
  }
  //const cols = Math.floor(sidebarWidth / photoCardMinWidth);
  //const photoCardWidth = sidebarWidth / cols * 0.96;
  const photoCardScale = photoCardWidth / photoCardMaxWidth;
  const photoCardHeight = 350 * photoCardScale;
  const rows = Math.max(1, Math.floor(sidebarHeight / photoCardHeight));
  //const photoCardWidth = Math.min(200, sidebarWidth / 2);
  const photoCardPaddingMargin = Math.min(5, photoCardWidth * 0.25);
  const photoCardBorderWidth = Math.max(2, photoCardWidth * 0.01);
  const interiorWidth = photoCardWidth - photoCardPaddingMargin * 2;
  const interiorHeight = photoCardHeight - photoCardPaddingMargin * 2;
  //const photoCardHeight = 350;
  //const cols = Math.floor(sidebarWidth / photoCardWidth);
  //const rows = Math.max(1, Math.floor(sidebar.photosHeight / photoCardHeight));
  const photoCards = {
    cols,
    rows,
    displayableCards: cols * rows,
    width: photoCardWidth,
    height: photoCardHeight,
    interiorWidth,
    interiorHeight,
    padding: photoCardPaddingMargin,
    margin: photoCardPaddingMargin,
    borderWidth: photoCardBorderWidth,
    scale: photoCardScale,
  };

  const similarPhotos = {};
  const similarPhotosHeaderHeight = 50;
  similarPhotos.height = Math.min(250, (vizCanvas.height - similarPhotosHeaderHeight) / 3);
  similarPhotos.width = 400;
  similarPhotos.scale = Math.min(1.5, similarPhotos.height / photoCards.height);

  const dimensions = {
    calculated: true,
    vizCanvas,
    map,
    mapControls,
    sidebar,
    photoCards,
    timelineHeatmap,
    selectedPhoto,
    similarPhotos,
    isMobile,
  }

  return dimensions;
}

function getEventId(eOrId, type = 'string') {
  let id = eOrId.id || eOrId;
  if (!eOrId.id && typeof eOrId === 'object') {
    const ct = eOrId.currentTarget || eOrId.target;
    id = ct.id || ct.options.id;
  }
  return (type === 'number') ? parseInt(id, 10) : id;
}

export function getStateNameFromAbbr (abbr) {
  return stateabbrs[abbr];
}

export const getStateAbbr = (name) => {
  if (!name) {
    return '';
  }
  const stIndex = Object.values(stateabbrs)
    .findIndex(stateName => stateName.toLowerCase() === name.toLowerCase());
  const abbr = Object.keys(stateabbrs)[stIndex];

  return abbr;
};

export const SET_SIDEBAR_PHOTOS = 'SET_SIDEBAR_PHOTOS';

export const setSidebarPhotos = (photos) => ({
  type: SET_SIDEBAR_PHOTOS,
  payload: photos
});

export const resetMapView = (targetView = 'counties') => {
  return (dispatch, getState) => {
    const { selectedTheme, selectedMapView } = getState();
    const hasTheme = selectedTheme && selectedTheme !== 'root';
    
    // Ensure we maintain city view if that's what we're in
    const finalView = targetView || (selectedMapView === 'cities' ? 'cities' : 'counties');
    
    dispatch({
      type: A.SET_STATE,
      payload: {
        selectedMapView: finalView,
        selectedCounty: null,
        selectedCity: null,
        selectedState: null,
        selectedTheme: hasTheme ? selectedTheme : 'root',
        filterTerms: [],
        sidebarPhotosOffset: 0,
        timeRange: [193501, 194406],
        sidebarPhotosQuery: 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000',
        selectedPhotographer: null,
        selectedViz: 'map',
        selectedPhoto: null,
        pathname: hasTheme ? `/themes/${selectedTheme}` : '/maps'
      }
    });

    // Fetch random photos
    const query = 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000';
    fetch(`${cartoURLBase}${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.rows) {
          dispatch({ type: A.SET_SIDEBAR_PHOTOS, payload: data.rows });
        }
      })
      .catch(error => console.error('Error fetching random photos:', error));
  };
};

