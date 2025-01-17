import { connect } from 'react-redux';
import Navbar from './Navbar.tsx';
import { toggleSearch } from '../store/actions';
import { getMakeLinkFunction } from '../utils/makeLinkHelper';

const mapStateToProps = state =>  {
  const { selectedMapView, selectedViz } = state;
  
  const makeLink = getMakeLinkFunction(state);
  const themesLink = makeLink([
    {
      type: 'set_selected_viz',
      payload: 'themes',
    }
  ]);
  const countiesLink = makeLink([
    {
      type: 'set_selected_viz',
      payload: 'map',
    },
    {
      type: 'set_selected_map_view',
      payload: 'counties',
    },
  ]);
  const citiesLink = makeLink([
    {
      type: 'set_selected_viz',
      payload: 'map',
    },
    {
      type: 'set_selected_map_view',
      payload: 'cities',
    },
  ]);
  
  return {
    themesLink,
    countiesLink,
    citiesLink,
    selectedViz: state.selectedViz,
    selectedMapView: state.selectedMapView,
    isMobile: state.dimensions.isMobile,
  };
};

const mapDispatchToProps = {
  toggleSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
