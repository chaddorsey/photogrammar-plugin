import { connect } from 'react-redux';
import Map from './Map.tsx';
import { getMapParameters, getLinkUp, getMapFetchPath } from '../store/selectors';
import { getMakeLinkFunction } from '../utils/makeLinkHelper';

const mapStateToProps = state => {
  const { selectedMapView, selectedCounty, selectedCity, selectedPhotographer, selectedState, timeRange, filterTerms } = state;
  return {
    timeRange: timeRange,
    selectedPhotographer,
    selectedCounty,
    selectedCity,
    selectedState,
    selectedMapView,
    filterTerms,
    mapParameters: getMapParameters(state),
    linkUp: getLinkUp(state),
    isSearching: state.filterTerms.length > 0,
    fetchPath: getMapFetchPath(state),
    makeLink: getMakeLinkFunction(state),
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Map);
