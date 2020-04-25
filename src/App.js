import { connect } from 'react-redux';
import App from './App.jsx';
import { initializeData, windowResized } from './store/actions';

const mapStateToProps = state => ({
  dimensions: state.dimensions,
  isInitialized: state.isInitialized,
  selectedViz: state.selectedViz,
});

const mapDispatchToProps = {
  initializeData,
  windowResized,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
