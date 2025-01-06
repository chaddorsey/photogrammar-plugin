import { connect } from 'react-redux';
import Lightbox from './Lightbox.tsx';
import { toggleLightbox } from '../store/actions';
import { getPhotoFetchQueries } from '../store/selectors';
import { getMakeLinkFunction } from '../utils/makeLinkHelper';

const mapStateToProps = state => {
  const { photoMetadataQuery } = getPhotoFetchQueries(state);
  const makeLink = getMakeLinkFunction(state);
  const closeLink = state.pathname.replace('/lightbox', '');
  return {
    fetchPath: photoMetadataQuery,
    closeLink,
  };
};

const mapDispatchToProps = {
  toggleLightbox,
};

export default connect(mapStateToProps, mapDispatchToProps)(Lightbox);
