import { connect } from 'react-redux';
import { setState } from '../store/actions';
import ActionsFromURL from './ActionsFromURL.tsx';

const mapStateToProps = state => ({
  isLoading: state.isLoading,
});

const mapDispatchToProps = {
  setState,
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionsFromURL);
