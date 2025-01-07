import * as React from 'react';
import { Async } from 'react-async';
import SidebarHeaderPhotographerButton from './SidebarHeaderPhotographerButton.js';
import SidebarHeaderStateButton from './SidebarHeaderStateButton.js';
import SidebarHeaderCityCountyButton from './SidebarHeaderCityCountyButton.js';
import SidebarHeaderThemeButton from './SidebarHeaderThemeButton.js';
import SidebarHeaderFilterButton from './SidebarHeaderFilterButton.js';
import SidebarHeaderTimeRangeButton from './SidebarHeaderTimeRangeButton.js';
import './SidebarHeader.css';
import { Props, QueryStats } from './SidebarHeader.d';
import { PhotoMetadata } from '../../index.d';

const loadCounts = async ({ query }: { query: string; }) => {
  if (!query) {
    return 1000;
  }
  const response = await fetch(query);
  if (!response.ok) { console.warn(`photo count query failed ${response}`) };
  const json: { rows: { count: number; }[] } = await response.json();
  if (json.rows.length > 0) {
    return json.rows[0].count;
  }
  return 1000;
}

const convertToCSV = (photos: PhotoMetadata[]) => {
  const headers = [
    'call_number',
    'loc_item_link',
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
    'strip',
    'strip_position',
    'strip_type',
    'strip_id'
  ];

  const headerLabels = [
    'Call Number',
    'LOC Item Link',
    'Photographer',
    'Year',
    'Month',
    'State',
    'County',
    'City',
    'Caption',
    'Theme Level 1',
    'Theme Level 2',
    'Theme Level 3',
    'Part of Strip',
    'Position in Strip',
    'Strip Type',
    'Strip ID'
  ];

  const headerRow = headerLabels.join(',');

  const rows = photos.map(photo => {
    const photoWithStrip = {
      ...photo,
      strip: photo.photograph_type ? 'T' : 'F',
      strip_position: photo.photograph_type ? 
        (photo.photograph_type.length === 1 ? 
          photo.photograph_type.toLowerCase().charCodeAt(0) - 96 : 
          parseInt(photo.photograph_type.substring(1))) : 
        '',
      strip_type: photo.photograph_type || '',
      strip_id: photo.photograph_type ? photo.call_number : ''
    };

    return headers.map(header => {
      const value = photoWithStrip[header] || '';
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

const SidebarPhotosHeader = (props: Props) => {
  const {
    query,
    hasFacet,
    displayableCards,
    sidebarPhotosOffset,
    previousOffset,
    nextOffset,
    setPhotoOffset,
    toggleExpandedSidebar,
    expandedSidebar,
    isMobile,
    timeRange,
  } = props;

  const handleExportCSV = async () => {
    try {
      console.log('Original query:', query);
      
      // Decode the URL, extract the SQL query part
      const decodedUrl = decodeURIComponent(query);
      const sqlQueryMatch = decodedUrl.match(/q=(.+)$/);
      
      if (!sqlQueryMatch) {
        throw new Error('Could not parse SQL query');
      }
      
      // Get the SQL query and modify it
      let sqlQuery = sqlQueryMatch[1];
      sqlQuery = sqlQuery.replace(/SELECT\s+count\(cartodb_id\)/i, 'SELECT *');
      
      // Construct the new URL
      const baseUrl = 'https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=';
      const exportQuery = baseUrl + encodeURIComponent(sqlQuery);
      
      console.log('Export query:', exportQuery);
      
      const response = await fetch(exportQuery);
      if (!response.ok) {
        throw new Error('Failed to fetch photo data');
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      const photos = data.rows;
      
      if (!photos || photos.length === 0) {
        console.warn('No photos found to export');
        return;
      }

      const csv = convertToCSV(photos);
      console.log('First row of CSV:', csv.split('\n')[1]); // Log first data row
      
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
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export photos. Please try again.');
    }
  };

  return (
    <Async
      promiseFn={loadCounts}
      query={query}
      watch={query}
    >
      {({ data, error }: { data: number; error: any }) => {
        if (error) return `Something went wrong: ${error.message}`
        if (data) {
          const count: number = data;
          const from = sidebarPhotosOffset + 1;
          const to = (count) ? Math.min(sidebarPhotosOffset + displayableCards, count)
            : sidebarPhotosOffset + displayableCards;

          const getDateRangeString = (timeRange: [number, number]) => {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const yearMonths = timeRange.map(tr => ({
              year: Math.floor(tr / 100),
              month: tr % 100,
            }));
            const startString = `${monthNames[yearMonths[0].month - 1].substring(0, 3)} ${yearMonths[0].year}`;
            const endString = `${monthNames[yearMonths[1].month - 1].substring(0, 3)} ${yearMonths[1].year}`;
            return `${startString} - ${endString}`;
          };

          const timeRangeDisabled = timeRange[0] === 193501 && timeRange[1] === 194406;

          return (
            <header 
              id='sidebarHeader'
              className="highlight-text"
            >
              {(hasFacet) ? (
                <div className='facets'>
                  <div>
                    Filtered by (click to clear):
                  </div>
                  <SidebarHeaderPhotographerButton />
                  <SidebarHeaderCityCountyButton />
                  <SidebarHeaderStateButton />
                  <SidebarHeaderThemeButton />
                  <SidebarHeaderFilterButton />
                </div>
              ) : (
                <h3>
                  Random selection of photographs
                </h3>
              )}
              <div className='timeAndNav'>
                <div className='facets'>
                  <SidebarHeaderTimeRangeButton />
                </div>
                <button
                  onClick={handleExportCSV}
                  className="export-csv-button"
                  title="Export displayed photos as CSV"
                >
                  Export CSV
                </button>
                <h4 className='counts'>
                  {`${from}-${to} of `}
                  <strong>
                    {count.toLocaleString()}
                  </strong>
                </h4>
                <button
                  onClick={setPhotoOffset}
                  id={previousOffset.toString()}
                  disabled={previousOffset < 0}
                >
                  <svg
                    width={25}
                    height={25}
                  >
                    <g transform='translate(9 12.5)'>
                      <line
                        x1={0}
                        x2={8}
                        y1={0}
                        y2={-5}
                      />
                      <line
                        x1={0}
                        x2={8}
                        y1={0}
                        y2={5}
                      />
                    </g>
                  </svg>
                </button>
                <button
                  onClick={setPhotoOffset}
                  id={nextOffset.toString()}
                  disabled={!nextOffset || nextOffset >= count}
                >
                  <svg
                    width={25}
                    height={25}
                  >
                    <g transform='translate(16 12.5)'>
                      <line
                        x1={0}
                        x2={-8}
                        y1={0}
                        y2={-5}
                      />
                      <line
                        x1={0}
                        x2={-8}
                        y1={0}
                        y2={5}
                      />
                    </g>
                  </svg>
                </button>
                {(!isMobile) && (
                  <button
                    onClick={toggleExpandedSidebar}
                  >
                    <svg
                      width={25}
                      height={25}
                    >
                      <defs>
                        <marker
                          id="arrow"
                          viewBox="0 0 10 10"
                          refX="5"
                          refY="5"
                          markerWidth="2.5"
                          markerHeight="2.5"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" />
                        </marker>
                      </defs>
                      <g transform={`translate(0 12.5) ${(expandedSidebar) ? 'rotate(180 12.5 0)' : ''}`}>
                        <line
                          x1={8}
                          x2={8}
                          y1={-8}
                          y2={8}
                        />
                        <line
                          x1={12}
                          x2={20}
                          y1={0}
                          y2={0}
                          markerEnd="url(#arrow)"
                        />
                      </g>
                    </svg>
                  </button>
                )}
              </div>
            </header>
          );
        }
      }}
    </Async>
  );
};

export default SidebarPhotosHeader;
