import * as React from 'react';
import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { connect, useDispatch } from 'react-redux';
import './Navbar.css';
import { Props } from './Navbar.d';
import { loadLookupTable } from '../utils/lookupTable';
import LoadPhotosModal from './LoadPhotosModal';
import { getSidebarPhotosQuery } from '../store/selectors';
import { resetMapView, setCitiesView } from '../store/actions';
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
}

const Navbar = ({ countiesLink, citiesLink, themesLink, selectedViz, selectedMapView, toggleSearch, isMobile, currentQuery }: NavbarProps) => {
  const location = useLocation();
  const { pathname } = location;
  const [isLoadPhotosOpen, setIsLoadPhotosOpen] = useState(false);
  const dispatch = useDispatch();

  const toggleLoadPhotos = () => {
    setIsLoadPhotosOpen(!isLoadPhotosOpen);
  };

  const handleMapReset = () => {
    dispatch(resetMapView());
  };

  const handleCitiesView = () => {
    dispatch(setCitiesView());
  };

  const handleExportCSV = async () => {
    try {
      if (!currentQuery) {
        console.warn('No query available');
        alert('No photos available for export. Please ensure you are viewing photos in the sidebar.');
        return;
      }

      // Load all required data in parallel
      const [lookupData, umapData, faceData, photoDimensions, panoData] = await Promise.all([
        loadLookupTable(),
        loadUMAPData(),
        loadFaceDetectionData(),
        loadPhotoDimensions(),
        loadPanoramaData()
      ]);

      // Extract and clean up the SQL query
      let sqlQuery = decodeURIComponent(currentQuery.replace(cartoURLBase, ''));
      const orderByMatch = sqlQuery.match(/ORDER\s+BY\s+.*?(?=\s+LIMIT|$)/i);
      const orderByClause = orderByMatch ? orderByMatch[0] : '';
      
      // Remove any existing clauses that might interfere with our pagination
      sqlQuery = sqlQuery
        .replace(/SELECT\s+.*?\s+FROM/i, 'SELECT * FROM')
        .replace(/\s+LIMIT\s+\d+/gi, '')
        .replace(/\s+OFFSET\s+\d+/gi, '')
        .replace(/\s+ORDER\s+BY\s+.*$/i, '');

      // Extract the base query and where clause, ensuring we don't duplicate conditions
      const fromMatch = sqlQuery.match(/FROM\s+\w+/i);
      const whereMatch = sqlQuery.match(/WHERE\s+.*?(?=\s+ORDER\s+BY|$)/i);
      
      if (!fromMatch) {
        throw new Error('Invalid query: Could not find FROM clause');
      }
      
      const baseQuery = fromMatch[0];
      const whereClause = whereMatch ? whereMatch[0] : '';
      const countQuery = `SELECT COUNT(*) as total ${baseQuery} ${whereClause}`;
      
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
            const batchQuery = `SELECT * ${baseQuery} ${whereClause} ${orderByClause} LIMIT ${batchSize} OFFSET ${offset}`;
            console.log(`Fetching batch ${batch + 1}/${totalBatches} (${offset} to ${offset + batchSize})`);

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
                  photo.photograph_type ? parseInt(photo.photograph_type.substring(1)) : '') : 
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
          <Link to={themesLink}>Themes</Link>
        </li>
        <li className={(selectedViz === 'map' && selectedMapView === 'counties' && pathname !== '/about') ? 'active counties' : 'counties'}>
          <Link to={countiesLink} onClick={handleMapReset}>{`${(!isMobile) ? 'Map: ' : ''}Counties`}</Link>
        </li>
        <li className={(selectedViz === 'map' && selectedMapView === 'cities' && pathname !== '/about') ? 'active cities' : 'cities'}>
          <Link to={citiesLink} onClick={handleCitiesView}>{`${(!isMobile) ? 'Map: ' : ''}Cities & Towns`}</Link>
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
  currentQuery: getSidebarPhotosQuery(state)
});

export default connect(mapStateToProps)(Navbar);
