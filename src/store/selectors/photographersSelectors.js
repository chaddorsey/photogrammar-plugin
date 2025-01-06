export const getPhotographers = (state) => {
  if (!state.photographers) {
    console.warn('Photographers data is missing!');
    return [];
  }
  return state.photographers.map(p => ({
    value: p.key,
    label: `${p.firstname} ${p.lastname}`.trim(),
  }));
};