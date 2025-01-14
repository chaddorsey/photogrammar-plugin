import { connect } from 'react-redux';
import Search from './Search.tsx';
import Themes from '../data/themes.json';
import { toggleSearch } from '../store/actions/searchActions';
import { getPhotographers } from '../store/selectors/photographersSelectors';
import { getStateSearchOptions } from '../store/selectors/stateSearchSelectors';
import { getThemesSearchOptions } from '../store/selectors/themesSearchSelectors';
import { getCountiesOrCitiesOptions } from '../store/selectors';

const mapStateToProps = state => {
  const countiesOrCitiesOptions = getCountiesOrCitiesOptions(state);

  const selectedPhotographerOption = (state.selectedPhotographer)
    ? getPhotographers()
      .filter(d => d.key === state.selectedPhotographer)
      .map(p => ({
        value: p.key,
        label: `${p.firstname} ${p.lastname}`.trim(),
      }))
    : null;

  const selectedStateOption = (state.selectedState)
    ? getStateSearchOptions().find(d => d.value === state.selectedState) : null;

  const selectedThemeOption = (state.selectedTheme)
    ? Themes.find(d => d.value === state.selectedTheme) : null;

  const selectedCountyOption = (state.selectedCounty)
    ? countiesOrCitiesOptions.counties[state.selectedState].find(d => d.value === state.selectedCounty) : null;

  const selectedCityOption = (state.selectedCity)
    ? countiesOrCitiesOptions.cities[state.selectedState].find(d => d.value === state.selectedCity) : null;


  return {
    selectedPhotographerOption: (selectedPhotographerOption) ? selectedPhotographerOption[0] : null,
    selectedStateOption,
    selectedThemeOption,
    selectedCountyOption,
    selectedCityOption,
    selectedCity: state.selectedCity,
    selectedPhotoCaption: {
      label: state.filterTerms.join(' '),
      value: state.filterTerms.join(' ')
    },
    timeRange: state.timeRange,
    terms: state.filterTerms,
    selectedMapView: state.selectedMapView,
    countiesOrCitiesOptions,
  };
};

const mapDispatchToProps = {
  toggleSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(Search);
