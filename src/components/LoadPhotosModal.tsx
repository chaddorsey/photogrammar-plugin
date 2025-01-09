import React, { useState } from 'react';
import { usePhotos } from '../context/PhotoContext';
import { loadLookupTable } from '../utils/lookupTable';
import CloseButton from './buttons/Close';
import './Search.css';

interface Props {
  toggleLoadPhotos: () => void;
}

const LoadPhotosModal: React.FC<Props> = ({ toggleLoadPhotos }) => {
  const [controlNumbers, setControlNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setPhotos } = usePhotos();

  const handleLoadPhotos = async () => {
    try {
      setIsLoading(true);
      
      // Split and clean input
      const numbers = controlNumbers
        .split(/[\s,]+/)
        .map(n => n.trim())
        .filter(n => n);

      if (numbers.length === 0) {
        alert('Please enter at least one control number');
        return;
      }

      console.log('Processing control numbers:', numbers);

      // Load lookup table
      let lookupData;
      try {
        lookupData = await loadLookupTable();
        console.log('Lookup table loaded:', {
          totalEntries: Object.keys(lookupData.controlToLoc).length,
          sampleEntries: Object.entries(lookupData.controlToLoc).slice(0, 3)
        });
      } catch (error) {
        console.error('Failed to load lookup table:', error);
        alert('Failed to load photo lookup data. Please try again later.');
        return;
      }
      
      // Get loc_item_links from control numbers
      const itemLinks = numbers
        .map(controlNum => {
          const link = lookupData.controlToLoc[controlNum];
          if (!link) {
            console.warn(`No matching loc_item_link found for control number: ${controlNum}`);
          }
          return link;
        })
        .filter(link => link);

      if (itemLinks.length === 0) {
        alert('No matching photos found for the provided control numbers');
        return;
      }

      console.log('Found loc_item_links:', itemLinks);

      // Query using loc_item_links
      const conditions = itemLinks.map(link => `'${link.replace(/'/g, "''")}'`).join(',');
      const query = `
        SELECT p.*, l.control_number 
        FROM photogrammar_photos p 
        LEFT JOIN (
          SELECT unnest(ARRAY[${numbers.map(n => `'${n}'`).join(',')}]) as control_number
        ) l ON true 
        WHERE p.loc_item_link IN (${conditions})
      `;
      const url = `https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=${encodeURIComponent(query)}`;

      console.log('Querying database:', { query, url });

      const response = await fetch(url);
      if (!response.ok) {
        console.error('Database query failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw database response:', data);
      
      if (!data.rows || data.rows.length === 0) {
        console.log('No photos found for loc_item_links:', itemLinks);
        alert('No photos found in database for the provided control numbers');
        return;
      }

      console.log('Retrieved photos:', {
        count: data.rows.length,
        sample: data.rows[0]
      });

      // Update photos in context/Redux
      setPhotos(data.rows);
      
      // Clear input and close modal
      setControlNumbers('');
      toggleLoadPhotos();

    } catch (error) {
      console.error('Error loading photos:', error);
      alert('Failed to load photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id='searchWrapper'>
      <div id='advancedSearch'>
        <div className='controls'>
          <CloseButton
            onClick={toggleLoadPhotos}
            role='close'
          />
        </div>

        <h2>Load Photos by Control Number</h2>

        <div className='search-field'>
          <textarea
            value={controlNumbers}
            onChange={(e) => setControlNumbers(e.target.value)}
            placeholder="Enter control numbers (comma or space separated)"
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '15px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <button
            onClick={handleLoadPhotos}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#297373',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Loading...' : 'Load Photos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadPhotosModal; 