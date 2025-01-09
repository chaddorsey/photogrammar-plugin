import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadLookupTable } from '../utils/lookupTable';
import { setSidebarPhotos } from '../store/actions';
import A from '../store/actionTypes';
import './LoadPhotosModal.css';

const cartoURLBase = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';

interface LoadPhotosModalProps {
  toggleLoadPhotos: () => void;
}

const LoadPhotosModal: React.FC<LoadPhotosModalProps> = ({ toggleLoadPhotos }) => {
  const [controlNumbers, setControlNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const isMounted = useRef(true);
  
  // Get current state values we want to preserve
  const selectedMapView = useSelector((state: any) => state.selectedMapView);
  const selectedViz = useSelector((state: any) => state.selectedViz);

  // Handle unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLoadPhotos = async () => {
    if (!controlNumbers.trim()) {
      setError('Please enter at least one control number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load lookup table
      const lookupData = await loadLookupTable();
      if (!isMounted.current) return;

      console.log('Lookup table loaded:', {
        totalEntries: Object.keys(lookupData.controlToLoc).length,
        sampleEntries: Object.entries(lookupData.controlToLoc).slice(0, 3)
      });

      // Parse and validate control numbers
      const numbers = controlNumbers
        .split(/[\s,]+/)
        .map(n => n.trim())
        .filter(n => n);

      if (numbers.length === 0) {
        throw new Error('No valid control numbers found');
      }

      // Get loc_item_links for the control numbers
      const locItemLinks = numbers
        .map(num => lookupData.controlToLoc[num])
        .filter(link => link);

      if (locItemLinks.length === 0) {
        throw new Error('No matching photos found in lookup table');
      }

      console.log('Found loc_item_links:', locItemLinks);

      // Construct SQL query
      const query = `SELECT p.* FROM photogrammar_photos p WHERE p.loc_item_link IN ('${locItemLinks.join("','")}')`;

      console.log('Querying database:', {
        query,
        url: cartoURLBase + encodeURIComponent(query)
      });

      // Fetch photos from database
      const response = await fetch(cartoURLBase + encodeURIComponent(query));
      if (!response.ok) {
        throw new Error(`Database query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!isMounted.current) return;

      console.log('Raw database response:', data);

      if (!data.rows || data.rows.length === 0) {
        throw new Error('No photos found in database');
      }

      console.log('Retrieved photos:', {
        count: data.rows.length,
        sample: data.rows[0]
      });

      if (isMounted.current) {
        // Store the query for Export CSV and reset all relevant state
        dispatch({
          type: A.SET_STATE,
          payload: {
            sidebarPhotosQuery: query,
            selectedPhotographer: null,
            selectedPhoto: null,
            selectedCounty: null,
            selectedCity: null,
            selectedState: null,
            selectedTheme: 'root',
            selectedViz: selectedViz,  // Preserve current viz
            selectedMapView: selectedMapView,  // Preserve current map view
            filterTerms: [],
            timeRange: [193501, 194406],
            sidebarPhotosOffset: 0,
            isWelcomeOpen: false,
            hasCompletedFirstLoad: true,
            expandedSidebar: false,
            searchOpen: false,
            vizOpen: true,
            pathname: '/maps',  // Set default pathname
            hash: null,  // Include hash
            dimensions: {  // Include dimensions
              calculated: false,
              vizCanvas: {
                height: '90%',
                width: '60%',
              },
              sidebar: {
                width: 200,
                height: 600,
                headerHeight: 70,
                photosHeight: 530,
              },
              map: {
                height: 500,
                width: 960,
                scale: 1,
              },
              mapProjection: {
                height: '100%',
                width: '100%'
              },
              photoCards: {
                displayableCards: 6,
              },
              timelineHeatmap: {
                height: 250,
                width: 960,
                leftAxisWidth: 120,
              },
            }
          }
        });

        // Directly set the photos in the store
        dispatch({ type: A.SET_SIDEBAR_PHOTOS, payload: data.rows });
        
        toggleLoadPhotos(); // Close modal on success
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Error loading photos:', err);
        setError(err instanceof Error ? err.message : 'Failed to load photos');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={toggleLoadPhotos}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Load Photos by Control Number</h2>
        <p>Enter one or more control numbers, separated by commas or spaces:</p>
        <textarea
          value={controlNumbers}
          onChange={e => setControlNumbers(e.target.value)}
          placeholder="Enter control numbers..."
          rows={5}
          disabled={isLoading}
        />
        {error && <div className="error-message">{error}</div>}
        <div className="modal-buttons">
          <button 
            onClick={handleLoadPhotos} 
            disabled={isLoading || !controlNumbers.trim()}
          >
            {isLoading ? 'Loading...' : 'Load Photos'}
          </button>
          <button onClick={toggleLoadPhotos} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadPhotosModal; 