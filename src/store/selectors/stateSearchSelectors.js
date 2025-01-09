export const getStateSearchOptions = (state) => {
  if (!state) return [];
  return state.stateOptions || [];
};