import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface PhotoContextType {
  photos: any[];
  setPhotos: (photos: any[]) => void;
}

const PhotoContext = createContext<PhotoContextType>({
  photos: [],
  setPhotos: () => {}
});

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
}

export const PhotoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const dispatch = useDispatch();
  const reduxPhotos = useSelector((state: any) => state.sidebarPhotos || []);

  const setPhotos = (photos: any[]) => {
    dispatch({ type: 'SET_SIDEBAR_PHOTOS', payload: photos });
  };

  return (
    <PhotoContext.Provider value={{ photos: reduxPhotos, setPhotos }}>
      {children}
    </PhotoContext.Provider>
  );
}; 