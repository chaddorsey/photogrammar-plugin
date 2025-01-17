import * as React from 'react';
import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { connect, useDispatch, useSelector } from 'react-redux';
import './Navbar.css';
import { Props } from './Navbar.d';
import { loadLookupTable } from '../utils/lookupTable';
import LoadPhotosModal from './LoadPhotosModal';
import { getSidebarPhotosQuery } from '../store/selectors';
import { resetMapView } from '../store/actions';
import initialState from '../store/initialState';
import {
  loadUMAPData,
  loadFaceDetectionData,
  loadPhotoDimensions,
  loadPanoramaData,
  calculateAreaRatio,
  calculatePanoramaRatios
} from '../utils/metadata';

const cartoURLBase = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';

interface NavbarProps extends Props {
  currentQuery: string;
  sidebarPhotosQuery?: string;
}

const Navbar = ({ countiesLink, citiesLink, themesLink, selectedViz, selectedMapView, toggleSearch, isMobile, currentQuery, sidebarPhotosQuery }: NavbarProps) => {
  const location = useLocation();
  const { pathname } = location;
  const [isLoadPhotosOpen, setIsLoadPhotosOpen] = useState(false);
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: any) => state.selectedTheme);
  const currentState = useSelector((state: any) => state.selectedState);
  const currentCounty = useSelector((state: any) => state.selectedCounty);
  const currentCity = useSelector((state: any) => state.selectedCity);

  const toggleLoadPhotos = () => {
    setIsLoadPhotosOpen(!isLoadPhotosOpen);
  };

  const handleMapReset = async () => {
    // Check if we have a theme selected
    const hasTheme = currentTheme && currentTheme !== 'root';
    const hasGeographicFacets = currentState || currentCounty || currentCity;

    try {
      // Fetch random photos first
      const query = 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000';
      const response = await fetch(cartoURLBase + encodeURIComponent(query));
      const data = await response.json();

      if (data.rows) {
        // Update state and photos together
        dispatch({
          type: 'SET_STATE',
          payload: {
            selectedMapView: 'counties',
            previousMapView: selectedMapView,  // Include previous view type
            selectedCounty: null,
            selectedCity: null,
            selectedState: null,
            selectedTheme: (hasTheme && !hasGeographicFacets) ? currentTheme : 'root',
            filterTerms: [],
            sidebarPhotosQuery: query,
            pathname: (hasTheme && !hasGeographicFacets) ? `/themes/${currentTheme}` : '/maps',
            hash: '#mapview=counties',
            timeRange: [193501, 194406],
            selectedViz: (hasTheme && !hasGeographicFacets) ? 'themes' : 'map',
            sidebarPhotosOffset: 0
          }
        });
        dispatch({ type: 'SET_SIDEBAR_PHOTOS', payload: data.rows });
      }
    } catch (error) {
      console.error('Error fetching random photos:', error);
    }
  };

  const handleCitiesClick = async () => {
    // If we have a theme selected, retain it
    const hasTheme = currentTheme && currentTheme !== 'root';

    try {
      // Fetch random photos first
      const query = 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000';
      const response = await fetch(cartoURLBase + encodeURIComponent(query));
      const data = await response.json();

      if (data.rows) {
        // Update state and photos together
        dispatch({
          type: 'SET_STATE',
          payload: {
            selectedMapView: 'cities',
            previousMapView: selectedMapView,  // Include previous view type
            selectedCounty: null,
            selectedCity: null,
            selectedState: null,
            selectedTheme: hasTheme ? currentTheme : 'root',
            filterTerms: [],
            sidebarPhotosQuery: query,
            pathname: hasTheme ? `/themes/${currentTheme}` : '/maps',
            hash: '#mapview=cities',
            timeRange: [193501, 194406],
            selectedViz: 'map',
            sidebarPhotosOffset: 0,
            sidebarPhotos: []
          }
        });
        dispatch({ type: 'SET_SIDEBAR_PHOTOS', payload: data.rows });
      }
    } catch (error) {
      console.error('Error fetching random photos:', error);
    }
  };

  const handleThemesClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default navigation
    console.log('Themes clicked - Starting state transition');
    
    // First, fetch random photos
    const query = 'SELECT * FROM photogrammar_photos ORDER BY random() LIMIT 1000';
    console.log('Fetching random photos with query:', query);
    
    fetch(cartoURLBase + encodeURIComponent(query))
      .then(response => response.json())
      .then(data => {
        if (data.rows) {
          console.log('Photos fetched successfully, dispatching state change');
          const payload = {
            selectedMapView: null,
            previousMapView: null, // Clear previous map view
            selectedCounty: null,
            selectedCity: null,
            selectedState: null,
            selectedTheme: 'root',
            filterTerms: [],
            sidebarPhotosQuery: query,
            pathname: '/themes',
            hash: '',
            timeRange: [193501, 194406],
            selectedViz: 'themes',
            sidebarPhotosOffset: 0,
            vizOpen: true,
            searchOpen: false,
            expandedSidebar: false,
            hasCompletedFirstLoad: true,
            dimensions: {
              ...initialState.dimensions,
              calculated: false
            }
          };
          console.log('Dispatching SET_STATE with payload:', payload);
          
          // First dispatch the state change
          dispatch({
            type: 'SET_STATE',
            payload
          });

          console.log('Dispatching SET_SIDEBAR_PHOTOS');
          // Then update the photos
          dispatch({ type: 'SET_SIDEBAR_PHOTOS', payload: data.rows });
          
          console.log('Updating URL to /themes');
          // Finally, update the URL
          window.history.pushState(null, '', '/themes');
        }
      })
      .catch(error => {
        console.error('Error fetching random photos:', error);
        // Even if photos fail to load, still switch to themes view
        const payload = {
          selectedMapView: null,
          previousMapView: null, // Clear previous map view
          selectedCounty: null,
          selectedCity: null,
          selectedState: null,
          selectedTheme: 'root',
          filterTerms: [],
          pathname: '/themes',
          hash: '',
          timeRange: [193501, 194406],
          selectedViz: 'themes',
          sidebarPhotosOffset: 0,
          vizOpen: true,
          searchOpen: false,
          expandedSidebar: false,
          hasCompletedFirstLoad: true,
          dimensions: {
            ...initialState.dimensions,
            calculated: false
          }
        };
        console.log('Photo fetch failed, dispatching SET_STATE with payload:', payload);
        
        dispatch({
          type: 'SET_STATE',
          payload
        });
        
        console.log('Updating URL to /themes');
        // Update the URL even if photos fail to load
        window.history.pushState(null, '', '/themes');
      });
  };

  const handleExportCSV = async () => {
    try {
      // Use sidebarPhotosQuery directly if available, otherwise fall back to currentQuery
      const query = sidebarPhotosQuery || currentQuery;
      if (!query) {
        console.warn('No query available');
        alert('No photos available for export. Please ensure you are viewing photos in the sidebar.');
        return;
      }

      console.log('Using query for export:', query); // Debug log

      // Load all required data in parallel
      const [lookupData, umapData, faceData, photoDimensions, panoData] = await Promise.all([
        loadLookupTable(),
        loadUMAPData(),
        loadFaceDetectionData(),
        loadPhotoDimensions(),
        loadPanoramaData()
      ]);

      // Extract and clean up the SQL query
      let sqlQuery = query;
      // Only decode and clean if it's a CartoDB URL
      if (query.startsWith(cartoURLBase)) {
        sqlQuery = decodeURIComponent(query.replace(cartoURLBase, ''));
      }

      // For debugging
      console.log('SQL query after cleaning:', sqlQuery);

      const orderByMatch = sqlQuery.match(/ORDER\s+BY\s+.*?(?=\s+LIMIT|$)/i);
      const orderByClause = orderByMatch ? orderByMatch[0] : '';

      // Remove any existing clauses that might interfere with our pagination
      sqlQuery = sqlQuery
        .replace(/SELECT\s+.*?\s+FROM/i, 'SELECT * FROM')
        .replace(/\s+LIMIT\s+\d+/gi, '')
        .replace(/\s+OFFSET\s+\d+/gi, '')
        .replace(/\s+ORDER\s+BY\s+.*$/i, '');

      // For debugging
      console.log('SQL query after removing clauses:', sqlQuery);

      // Extract the base query and where clause, preserving table alias if present
      const fromMatch = sqlQuery.match(/FROM\s+(\w+)(?:\s+(\w+))?/i);
      const whereMatch = sqlQuery.match(/WHERE\s+.*?(?=\s+ORDER\s+BY|$)/i);
      
      if (!fromMatch) {
        throw new Error('Invalid query: Could not find FROM clause');
      }
      
      const tableName = fromMatch[1];
      const tableAlias = fromMatch[2] || '';
      const whereClause = whereMatch ? whereMatch[0].replace(new RegExp(`${tableAlias}\\.`, 'g'), '') : '';
      
      // Construct the count query without table alias
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
      
      console.log('Count query:', countQuery);
      
      const countResponse = await fetch(cartoURLBase + encodeURIComponent(countQuery));
      if (!countResponse.ok) {
        throw new Error(`Failed to fetch count: ${countResponse.status} ${countResponse.statusText}`);
      }
      const countData = await countResponse.json();
      const totalPhotos = countData.rows[0].total;

      if (totalPhotos === 0) {
        console.warn('No photos found in response');
        alert('No photos available for export');
        return;
      }

      console.log(`Found ${totalPhotos} photos to export`);

      // Create CSV headers
      const headers = [
        'Control Number',
        'loc_item_link',
        'call_number',
        'photographer_name',
        'year',
        'month',
        'state',
        'county',
        'city',
        'caption',
        'vanderbilt_level1',
        'vanderbilt_level2',
        'vanderbilt_level3',
        'Part of Strip',
        'Position in Strip',
        'Strip Type',
        'Faces Detected',
        'Total Face Area Ratio',
        'Detected Region Ratio',
        'Detected Stuff Ratio',
        'Detected Things Ratio',
        'UMAP Dimension 1',
        'UMAP Dimension 2'
      ];

      // Initialize variables for batch processing
      const chunks: string[] = [headers.join(',')];
      const batchSize = 1000;
      const totalBatches = Math.ceil(totalPhotos / batchSize);
      let processedPhotos = 0;
      let retryCount = 0;
      const maxRetries = 3;

      // Show progress to user
      alert(`Starting export of ${totalPhotos} photos. This may take a few minutes.`);

      // Fetch data in batches
      for (let batch = 0; batch < totalBatches; batch++) {
        let success = false;
        while (!success && retryCount < maxRetries) {
          try {
            const offset = batch * batchSize;
            // Construct batch query with original ORDER BY clause
            const batchQuery = `SELECT * FROM ${tableName} ${whereClause} ${orderByClause} LIMIT ${batchSize} OFFSET ${offset}`;
            console.log(`Fetching batch ${batch + 1}/${totalBatches} (${offset} to ${offset + batchSize})`);
            console.log('Batch query:', batchQuery);

            const response = await fetch(cartoURLBase + encodeURIComponent(batchQuery));
            if (!response.ok) {
              throw new Error(`Failed to fetch batch ${batch + 1}: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.rows || data.rows.length === 0) {
              if (offset < totalPhotos) {
                throw new Error(`Expected data but received empty batch ${batch + 1}`);
              }
              console.warn(`No photos in batch ${batch + 1}`);
              break;
            }

            // Process each photo in the batch
            const rows = data.rows.map((photo: any) => {
              // Get control number from lookup table using loc_item_link
              const locItemLink = photo.loc_item_link;
              const controlNum = lookupData.locToControl[locItemLink];
              
              // Debug log for troubleshooting
              if (!controlNum) {
                console.warn('No control number found for:', {
                  locItemLink,
                  call_number: photo.call_number,
                  photograph_type: photo.photograph_type
                });
              }
              
              // Get dimensions and detection data using control number
              const dimensions = photoDimensions[controlNum];
              const faceDetections = faceData[controlNum];
              const panoDetections = panoData[controlNum];
              const umapValues = umapData[controlNum] || { umap_01: '', umap_02: '' };
              
              // Calculate ratios
              const faceAreaRatio = calculateAreaRatio(faceDetections, dimensions);
              const panoRatios = calculatePanoramaRatios(panoDetections, dimensions);
              
              // Determine strip information
              const isStrip = photo.photograph_type ? 'T' : 'F';
              const stripPosition = photo.photograph_type ? 
                (photo.photograph_type.length === 1 ? 
                  photo.photograph_type.toLowerCase().charCodeAt(0) - 96 : 
                  parseInt(photo.photograph_type.substring(1))) : 
                '';

              const values = [
                controlNum,
                locItemLink || '',
                lookupData.controlToCall[controlNum] || photo.call_number || '',
                photo.photographer_name || '',
                photo.year || '',
                photo.month || '',
                photo.state || '',
                photo.county || '',
                photo.city || '',
                (photo.caption || '').replace(/,/g, ';'),
                photo.vanderbilt_level1 || '',
                photo.vanderbilt_level2 || '',
                photo.vanderbilt_level3 || '',
                isStrip,
                stripPosition,
                photo.photograph_type || '',
                faceDetections?.count || 0,
                faceAreaRatio.toFixed(6),
                panoRatios.det_region_ratio.toFixed(6),
                panoRatios.det_stuff_ratio.toFixed(6),
                panoRatios.det_things_ratio.toFixed(6),
                umapValues.umap_01,
                umapValues.umap_02
              ];
              return values.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
            });

            // Add the batch rows to our chunks array
            chunks.push(rows.join('\n'));
            processedPhotos += data.rows.length;

            // Update progress
            if ((batch + 1) % 5 === 0 || batch === totalBatches - 1) {
              console.log(`Processed ${processedPhotos} of ${totalPhotos} photos`);
            }

            success = true;
          } catch (error) {
            console.error(`Error processing batch ${batch + 1}:`, error);
            retryCount++;
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to process batch ${batch + 1} after ${maxRetries} attempts`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        }
        retryCount = 0; // Reset retry count for next batch
      }

      if (processedPhotos === 0) {
        throw new Error('No photos were processed successfully');
      }

      // Combine all chunks and create the final CSV
      const csv = chunks.join('\n');
      console.log(`CSV generation complete. Processed ${processedPhotos} photos`);
      
      // Create and download the file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `photogrammar_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Export complete! ${processedPhotos} photos have been exported.`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export photos. Please try again.');
    }
  };

  return (
    <nav className="navbar">
      <ul className="nav navbar-nav navbar-right">
        <li onClick={toggleSearch}>Search</li>
        <li className={(selectedViz === 'photographers' && pathname !== '/about') ? 'active photographerslink' : 'photographerslink'}>
          <Link to='/photographers'>Photographers</Link>
        </li>
        <li className={(selectedViz === 'themes' && pathname !== '/about') ? 'active themes' : 'themes'}>
          <Link to={themesLink} onClick={handleThemesClick}>Themes</Link>
        </li>
        <li className={(selectedViz === 'map' && selectedMapView === 'counties' && pathname !== '/about') ? 'active counties' : 'counties'}>
          <Link to={countiesLink} onClick={handleMapReset}>{`${(!isMobile) ? 'Map: ' : ''}Counties`}</Link>
        </li>
        <li className={(selectedViz === 'map' && selectedMapView === 'cities' && pathname !== '/about') ? 'active cities' : 'cities'}>
          <Link to={citiesLink} onClick={handleCitiesClick}>{`${(!isMobile) ? 'Map: ' : ''}Cities & Towns`}</Link>
        </li>
        {(isMobile) ? (
          <li className={(selectedViz === 'timeline') ? 'active timeline' : 'timeline'}>
            <Link to={'/timeline'}>Timeline</Link>
          </li>
        ) : (
          <React.Fragment>
            <li className={(pathname === '/about') ? 'active': ''}><Link to='/about'>About</Link></li>
            <li><a href="https://dsl.richmond.edu/panorama#maps" className="section-scroll" target='_blank'>American Panorama</a></li>
            <li><button onClick={toggleLoadPhotos} className="nav-button">Load Photos</button></li>
            <li>
              <button 
                onClick={handleExportCSV}
                className="export-csv-button"
                title="Export displayed photos as CSV"
              >
                Export CSV
              </button>
            </li>
          </React.Fragment>
        )}
      </ul>
      {isLoadPhotosOpen && <LoadPhotosModal toggleLoadPhotos={toggleLoadPhotos} />}
    </nav>
  );
};

const mapStateToProps = (state: any) => ({
  currentQuery: state.sidebarPhotosQuery || getSidebarPhotosQuery(state),
  sidebarPhotosQuery: state.sidebarPhotosQuery
});

export default connect(mapStateToProps)(Navbar);
