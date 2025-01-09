import React from 'react';
import { Provider } from 'react-redux';
import { PhotoProvider } from './context/PhotoContext';
import store from './store';

const App: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <PhotoProvider>
        {children}
      </PhotoProvider>
    </Provider>
  );
}; 