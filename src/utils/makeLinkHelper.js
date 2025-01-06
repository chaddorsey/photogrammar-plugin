export const getMakeLinkFunction = (state) => {
  return (actions) => {
    // First, get the current geographic context from the state
    const currentState = state.selectedState;
    const currentCounty = state.selectedCounty;
    const currentCity = state.selectedCity;
    const currentTheme = state.selectedTheme;

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
        return `${geoContext}${themeContext}`;
      }
      return geoContext || themeContext || '';
    };

    // Geographic selection
    const stateAction = actions.find(a => a.type === 'set_state');
    if (stateAction) {
      return `/state/${stateAction.payload}`;
    }
    
    const countyAction = actions.find(a => a.type === 'set_county');
    if (countyAction) {
      return `/county/${countyAction.payload}`;
    }
    
    const cityAction = actions.find(a => a.type === 'set_city');
    if (cityAction) {
      return `/city/${cityAction.payload}`;
    }

    // Theme selection (preserve geographic context)
    const themeAction = actions.find(a => a.type === 'set_theme');
    if (themeAction) {
      return `/themes/${themeAction.payload}${geoContext}`;
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
        return geoContext ? `/themes${geoContext}` : '/themes';
      }
      
      if (vizAction.payload === 'map') {
        return geoContext || '/maps';
      }
      
      return '/maps';
    }

    // Content type selection
    const photographerAction = actions.find(a => a.type === 'set_photographer');
    if (photographerAction) {
      return `/photographers/${photographerAction.payload}`;
    }

    // Special photographer routes
    const royStrykerAction = actions.find(a => a.type === 'set_roy_stryker');
    if (royStrykerAction) {
      const { interviewKey, timestampKey, highlight } = royStrykerAction.payload;
      return `/photographers/RoyStryker/${interviewKey}/${timestampKey}/${highlight}`;
    }

    // Clear/reset actions
    if (actions.find(a => a.type === 'set_clear_photo')) {
      return getFullContext() || '/maps';
    }

    return '/maps'; // default fallback
  };
};