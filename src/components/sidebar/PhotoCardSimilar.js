import { connect } from 'react-redux';
import PhotoCard from './PhotoCard';
import { getMakeLinkFunction } from '../../utils/makeLinkHelper';

const mapStateToProps = state => {
  const { selectedMapView, dimensions } = state;
  const { width, height, interiorWidth, interiorHeight, padding, margin, borderWidth } = dimensions.photoCards;
  const { scale } = dimensions.similarPhotos;

  return {
    selectedPhotograph: (state.selectedPhotoData) ? state.selectedPhotoData.loc_item_link : null,
    width,
    height,
    interiorWidth,
    interiorHeight,
    padding,
    margin,
    borderWidth,
    selectedMapView,
    makeLink: getMakeLinkFunction(state),
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(PhotoCard);
