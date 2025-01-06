import { connect } from 'react-redux';
import Treemap from './Treemap.tsx';
import { getThemesFetchPath, getThemesBackgroundPhotosQuery } from '../store/selectors';
import { getMakeLinkFunction } from '../utils/makeLinkHelper';

const mapStateToProps = state => {
  const { selectedTheme, timeRange, filterTerms, dimensions } = state;
  const { height, width } = dimensions.map;
  return {
    fetchPath: getThemesFetchPath(state),
    photosQuery: getThemesBackgroundPhotosQuery(state),
    timeRange,
    filterTerms,
    selectedTheme,
    height,
    width,
    dimensions,
    makeLink: getMakeLinkFunction(state),
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Treemap);
