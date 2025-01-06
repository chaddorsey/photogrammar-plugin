import { connect } from 'react-redux';
import Photo from './Photo.tsx';
import { toggleLightbox } from '../store/actions';
import { getPhotoFetchQueries } from '../store/selectors';
import { getMakeLinkFunction } from '../utils/makeLinkHelper';

const mapStateToProps = state => {
  const { photoMetadataQuery, similarPhotosQuery } = getPhotoFetchQueries(state);
  return {
    photoMetadataQuery,
    similarPhotosQuery,
    selectedMapView: state.selectedMapView,
    height: state.dimensions.selectedPhoto.height,
    lightboxLink: `/lightbox${state.pathname}`,
    makeLink: getMakeLinkFunction(state),
  };
};

const mapDispatchToProps = {
  toggleLightbox,
};

export default connect(mapStateToProps, mapDispatchToProps)(Photo);
