import { createStore } from 'redux';

interface PhotoState {
  sidebarPhotos: any[];
}

const initialState: PhotoState = {
  sidebarPhotos: []
};

const photoReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'SET_SIDEBAR_PHOTOS':
      return {
        ...state,
        sidebarPhotos: action.payload
      };
    default:
      return state;
  }
};

const store = createStore(photoReducer);

export default store; 