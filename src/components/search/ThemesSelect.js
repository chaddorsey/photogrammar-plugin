import { connect } from 'react-redux';
import SearchSelect from './SearchSelect.jsx';
import Themes from '../../../data/themes.json';

const mapStateToProps = state => {
  return {
    allOptions: Themes,
  };
};

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchSelect);