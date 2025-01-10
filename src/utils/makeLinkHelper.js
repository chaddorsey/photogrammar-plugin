export const getMakeLinkFunction = (state) => {
  return (actions) => {
    // First, get the current geographic context from the state
    const currentState = state.selectedState;
    const currentCounty = state.selectedCounty;
    const currentCity = state.selectedCity;
    const currentTheme = state.selectedTheme;
    const currentMapView = state.selectedMapView;

    // Get map view hash - explicitly track both types
    const mapViewHash = `#mapview=${currentMapView}`;

    // Check for view type change action first
    const viewChangeAction = actions.find(a => a.type === 'set_map_view');
    if (viewChangeAction) {
      // When changing view type, preserve current context
      const context = currentCounty ? `/county/${currentCounty}` :
                     currentCity ? `/city/${currentCity}` :
                     currentState ? `/state/${currentState}` :
                     '/maps';
      return `${context}#mapview=${viewChangeAction.payload}`;
    }

    // Geographic selection
    const stateAction = actions.find(a => a.type === 'set_state');
    if (stateAction) {
      return `/state/${stateAction.payload}${mapViewHash}`;
    }
    
    const countyAction = actions.find(a => a.type === 'set_county');
    if (countyAction && currentMapView === 'counties') {
      return `/county/${countyAction.payload}${mapViewHash}`;
    }
    
    const cityAction = actions.find(a => a.type === 'set_city');
    if (cityAction && currentMapView === 'cities') {
      return `/city/${cityAction.payload}${mapViewHash}`;
    }

    // Get geographic context string
    const geoContext = currentCounty ? `/county/${currentCounty}` :
                      currentCity ? `/city/${currentCity}` :
                      currentState ? `/state/${currentState}` :
                      '';

    // Get theme context string
    const themeContext = currentTheme && currentTheme !== 'root' ? 
                        `/themes/${currentTheme}` : '';

    // Combine contexts when both exist
    const getFullContext = () => {
      if (geoContext && themeContext) {
        return `${geoContext}${themeContext}${mapViewHash}`;
      }
      return (geoContext || themeContext || '/maps') + mapViewHash;
    };

    // Clear actions
    const clearCityAction = actions.find(a => a.type === 'clear_city');
    if (clearCityAction) {
      // When clearing a city, return to state view if we have one
      return currentState ? `/state/${currentState}${mapViewHash}` : `/maps${mapViewHash}`;
    }

    const clearCountyAction = actions.find(a => a.type === 'clear_county');
    if (clearCountyAction) {
      // When clearing a county, return to state view if we have one
      return currentState ? `/state/${currentState}${mapViewHash}` : `/maps${mapViewHash}`;
    }

    const clearStateAction = actions.find(a => a.type === 'clear_state');
    if (clearStateAction) {
      // When clearing a state, return to map view
      return `/maps${mapViewHash}`;
    }

    // Theme selection (preserve geographic context)
    const themeAction = actions.find(a => a.type === 'set_theme');
    if (themeAction) {
      return `/themes/${themeAction.payload}${geoContext}${mapViewHash}`;
    }

    // Photo selection (preserve both contexts)
    const photoAction = actions.find(a => a.type === 'set_photo');
    if (photoAction) {
      const contextPath = getFullContext();
      return `/photo/${photoAction.payload}${contextPath}`;
    }

    // Visualization type selection
    const vizAction = actions.find(a => a.type === 'set_selected_viz');
    if (vizAction) {
      if (vizAction.payload === 'themes') {
        return geoContext ? `/themes${geoContext}${mapViewHash}` : `/themes${mapViewHash}`;
      }
      
      if (vizAction.payload === 'map') {
        return geoContext ? `${geoContext}${mapViewHash}` : `/maps${mapViewHash}`;
      }
      
      return `/maps${mapViewHash}`;
    }

    // Content type selection
    const photographerAction = actions.find(a => a.type === 'set_photographer');
    if (photographerAction) {
      return `/photographers/${photographerAction.payload}${mapViewHash}`;
    }

    // Special photographer routes
    const royStrykerAction = actions.find(a => a.type === 'set_roy_stryker');
    if (royStrykerAction) {
      const { interviewKey, timestampKey, highlight } = royStrykerAction.payload;
      return `/photographers/RoyStryker/${interviewKey}/${timestampKey}/${highlight}${mapViewHash}`;
    }

    // Clear/reset actions
    if (actions.find(a => a.type === 'set_clear_photo')) {
      return getFullContext();
    }

    return `/maps${mapViewHash}`; // default fallback
  };
};