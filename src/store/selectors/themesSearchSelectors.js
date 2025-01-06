import Themes from '../../data/themes.json';

export const getThemesSearchOptions = (selectedTheme) => {
  return Themes.find(d => d.value === selectedTheme) || null;
};