import { connect } from 'react-redux';
import SidebarHeaderFacetButton from './SidebarHeaderFacetButton';
import { getMakeLinkFunction } from '../../utils/makeLinkHelper';

const mapStateToProps = state => {
  const { selectedTheme, selectedViz } = state;
  const label = (selectedTheme && selectedTheme !== 'root' && selectedTheme.includes('|'))
    ? selectedTheme.substring(selectedTheme.lastIndexOf('|') + 1)
    : null;
  const makeLink = getMakeLinkFunction(state);
  const parentTheme = selectedTheme && selectedTheme.includes('|')
    ? selectedTheme.substring(0, selectedTheme.lastIndexOf('|'))
    : 'root';
  const link = makeLink([{
    type: 'set_theme',
    payload: parentTheme,
  }]);

  return {
    label,
    link,
    className: 'themes',
  };
};

export default connect(mapStateToProps, {})(SidebarHeaderFacetButton);
