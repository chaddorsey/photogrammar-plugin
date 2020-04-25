import { connect } from 'react-redux';
import Map from './Map.jsx';
import { selectCounty, selectCity, selectState, selectNation, selectViz } from '../store/actions';
import { getSelectedCityMetadata, getCounties, getCities, getMapParameters, getLinkUp } from '../store/selectors';

const mapStateToProps = state => {
  const { mapPosition, dimensions, selectedMapView, selectedViz} = state;
  return {
    counties: (selectedMapView === 'counties') ? getCounties(state) : [],
    cities: (selectedMapView === 'cities') ? getCities(state) : [],
    selectedCounty: state.selectedCounty,
    selectedCity: state.selectedCity,
    selectedState: state.selectedState,
    selectedMapView,
    selectedViz,
    mapParameters: getMapParameters(state),
    linkUp: getLinkUp(state),
  };
}

const mapDispatchToProps = {
  selectCounty,
  selectCity,
  selectState,
  selectNation,
  selectViz
};

export default connect(mapStateToProps, mapDispatchToProps)(Map);
