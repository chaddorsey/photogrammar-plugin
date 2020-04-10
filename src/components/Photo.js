import { connect } from 'react-redux';
import Photo from './Photo.jsx';
import { selectPhotographer, selectPhoto } from '../store/actions';
import { getCentroidForCounty, getMapLink } from '../store/selectors';

const mapStateToProps = state => {
  const photoMetadata = state.selectedPhotoData;
  const centroid = (photoMetadata) ? getCentroidForCounty(photoMetadata.nhgis_join) : null;
  return {
    photoMetadata,
    centroid,
    mapLink: getMapLink(state),
    height: state.dimensions.selectedPhoto.height,
  }
};

const mapDispatchToProps = {
  selectPhoto,
  selectPhotographer,
};

export default connect(mapStateToProps, mapDispatchToProps)(Photo);
