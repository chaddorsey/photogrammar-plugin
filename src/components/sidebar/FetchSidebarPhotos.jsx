import React from 'react';
import { useFetch } from 'react-async';
import PropTypes from 'prop-types';
import SidebarPhotos from './SidebarPhotos.js';

const FetchSidebarPhotos = ({ query }) => {
  if (query) {
    const { data, error } = useFetch(query, {
      headers: { accept: "application/json" },
    });

    if (error) {
      return null;
    }

    // if (error) return error.message
    if (data) {
      return (
        <SidebarPhotos
          photos={data.rows}
        />
      )
    }
  }

  return null;
};

export default FetchSidebarPhotos;

FetchSidebarPhotos.propTypes = {
  query: PropTypes.string,
};

FetchSidebarPhotos.defaultProps = {
  query: null,
};

