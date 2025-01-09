import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadLookupTable } from '../../utils/lookupTable';
import { setSidebarPhotos } from '../../store/actions';
import './BatchPhotoLoader.css';

interface Props {
  onPhotosLoaded?: (count: number) => void;
}

interface DatabaseLookup {
  [call_number: string]: string;  // maps call_number to loc_item_link
}

const BatchPhotoLoader: React.FC<Props> = ({ onPhotosLoaded }) => {
  const [controlNumbers, setControlNumbers] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const buildDatabaseLookup = async (): Promise<DatabaseLookup> => {
    // Query to get all call_number and loc_item_link pairs
    const query = `SELECT call_number, loc_item_link FROM photogrammar_photos WHERE call_number IS NOT NULL`;
    const url = `https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=${encodeURIComponent(query)}`;

    console.log('Building database lookup:', {
      query,
      url
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch database lookup: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.rows || data.rows.length === 0) {
      throw new Error('No data returned from database');
    }

    console.log('Database lookup data:', {
      count: data.rows.length,
      sample: data.rows.slice(0, 3)
    });

    // Build lookup table
    const lookup: DatabaseLookup = {};
    data.rows.forEach((row: { call_number: string; loc_item_link: string }) => {
      if (row.call_number && row.loc_item_link) {
        lookup[row.call_number] = row.loc_item_link;
      }
    });

    return lookup;
  };

  const handleLoadPhotos = async () => {
    setIsLoading(true);
    try {
      // Split input on commas or whitespace
      const numbers = controlNumbers
        .split(/[\s,]+/)
        .map(n => n.trim())
        .filter(n => n);

      if (numbers.length === 0) {
        alert('Please enter at least one control number');
        return;
      }

      console.log('Processing control numbers:', numbers);

      // First, load the lookup table to get call numbers
      let lookupData;
      try {
        lookupData = await loadLookupTable();
        console.log('Control number lookup loaded:', {
          totalEntries: Object.keys(lookupData.controlToLoc).length,
          sampleEntries: Object.entries(lookupData.controlToLoc).slice(0, 3)
        });
      } catch (error) {
        console.error('Failed to load control number lookup:', error);
        alert('Failed to load photo lookup data. Please try again later.');
        return;
      }

      // Get call numbers from control numbers
      const callNumbers = numbers
        .map(controlNum => lookupData.controlToLoc[controlNum])
        .filter(callNum => callNum);

      if (callNumbers.length === 0) {
        alert('No matching call numbers found for the provided control numbers');
        return;
      }

      console.log('Found call numbers:', {
        inputNumbers: numbers,
        callNumbers: callNumbers
      });

      // Build database lookup table
      const dbLookup = await buildDatabaseLookup();
      console.log('Database lookup built:', {
        totalEntries: Object.keys(dbLookup).length,
        sampleEntries: Object.entries(dbLookup).slice(0, 3)
      });

      // Get loc_item_links from call numbers
      const itemLinks = callNumbers
        .map(callNum => dbLookup[callNum])
        .filter(link => link);

      if (itemLinks.length === 0) {
        alert('No matching photos found in database');
        return;
      }

      console.log('Found loc_item_links:', {
        callNumbers: callNumbers,
        itemLinks: itemLinks
      });

      // Query using loc_item_link
      const conditions = itemLinks.map(link => `'${link.replace(/'/g, "''")}'`).join(',');
      const query = `SELECT * FROM photogrammar_photos WHERE loc_item_link IN (${conditions})`;
      const url = `https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=${encodeURIComponent(query)}`;

      console.log('Photo query:', {
        query,
        url
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.rows || data.rows.length === 0) {
        console.log('No photos found for loc_item_links:', itemLinks);
        alert('No photos found in database for the provided control numbers');
        return;
      }

      console.log('Loaded photos:', {
        count: data.rows.length,
        photos: data.rows
      });

      // Update sidebar state with photos
      dispatch(setSidebarPhotos(data.rows));
      
      // Notify parent component
      if (onPhotosLoaded) {
        onPhotosLoaded(data.rows.length);
      }

      // Clear input
      setControlNumbers('');

    } catch (error) {
      console.error('Error loading photos:', error);
      alert('Failed to load photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="batch-loader">
      <textarea
        value={controlNumbers}
        onChange={(e) => setControlNumbers(e.target.value)}
        placeholder="Enter control numbers (comma or space separated)"
        rows={3}
      />
      <button 
        onClick={handleLoadPhotos}
        disabled={isLoading}
        className="batch-loader-button"
      >
        {isLoading ? 'Loading...' : 'Load Photos'}
      </button>
    </div>
  );
};

export default BatchPhotoLoader; 