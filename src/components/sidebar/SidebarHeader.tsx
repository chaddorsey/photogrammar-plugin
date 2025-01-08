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

// Add a type for UMAP data
interface UMAPData {
  [key: string]: {
    umap_01: number;
    umap_02: number;
  };
}

// Function to load and parse UMAP data
const loadUMAPData = async (): Promise<UMAPData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/umap_embd_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load UMAP data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
      console.error('Received HTML instead of CSV data');
      throw new Error('Invalid UMAP data format received');
    }
    
    const rows = text.trim().split('\n');
    
    if (rows.length < 2) {
      throw new Error('UMAP data file is empty or malformed');
    }
    
    const header = rows[0].split(',');
    
    if (header.length !== 4 || !header.includes('filename')) {
      console.error('Unexpected CSV header:', header);
      throw new Error('UMAP data file has unexpected format');
    }
    
    const data = rows.slice(1).reduce((acc, row) => {
      if (!row.trim()) return acc;
      
      const [filename, _, umap_01, umap_02] = row.split(',');
      if (filename && umap_01 && umap_02) {
        // Store the ID both with and without leading zeros
        const cleanNum = filename.replace(/^0+/, '');
        const paddedNum = cleanNum.padStart(10, '0');
        
        // Store under both formats to increase matching chances
        acc[cleanNum] = {
          umap_01: parseFloat(umap_01),
          umap_02: parseFloat(umap_02)
        };
        acc[paddedNum] = {
          umap_01: parseFloat(umap_01),
          umap_02: parseFloat(umap_02)
        };
      }
      return acc;
    }, {} as UMAPData);

    console.log('UMAP data loaded:', {
      totalEntries: Object.keys(data).length,
      sampleKeys: Object.keys(data).slice(0, 3)
    });
    
    return data;
  } catch (error) {
    console.error('Error loading UMAP data:', error);
    return {};
  }
};

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

// Add helper function to normalize IDs
const normalizePhotoId = (id: string | undefined): string => {
  if (!id) return '';
  
  // Handle both URL and direct ID formats
  const urlMatch = id.match(/pictures\/item\/fsa(\d+)\/PP/i);
  const directMatch = id.match(/^fsa(\d+)\/PP$/i);
  
  const match = urlMatch || directMatch;
  if (!match) {
    console.log('Failed to match ID format:', id);
    return '';
  }
  
  const numericId = match[1];
  console.log('Photo ID extraction:', {
    original: id,
    numericId,
    isURL: !!urlMatch,
    isDirect: !!directMatch
  });
  
  return numericId;
};

// Add debug logging function
const debugLogId = (photoId: string, umapId: string, umapData: UMAPData) => {
  // Try both clean and padded versions
  const cleanNum = umapId.replace(/^0+/, '');
  const paddedNum = cleanNum.padStart(10, '0');
  
  console.log('ID conversion debug:', {
    photoId,
    umapId,
    cleanNum,
    paddedNum,
    hasUMAPDataClean: cleanNum in umapData,
    hasUMAPDataPadded: paddedNum in umapData,
    umapValuesClean: umapData[cleanNum],
    umapValuesPadded: umapData[paddedNum],
    availableKeys: Object.keys(umapData).slice(0, 5)
  });
};

// Add interface for LOC API response
interface LOCResponse {
  results?: Array<{
    control_number?: string;
    call_number?: string;
    title?: string;
  }>;
}

// Function to extract item ID from LOC item link or FSA ID
const extractItemId = (locItemLink: string): string | null => {
  // Handle full LOC URL format
  const urlMatch = locItemLink.match(/\/pictures\/item\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  
  // Handle FSA ID format (e.g., fsa1997007992/PP)
  const fsaMatch = locItemLink.match(/fsa(\d+)\/PP/i);
  if (fsaMatch) return fsaMatch[1];
  
  console.log('Could not extract item ID from:', locItemLink);
  return null;
};

// Function to get control number from LOC API with retry logic
const getControlNumber = async (locItemLink: string, retryCount = 0): Promise<string | null> => {
  try {
    // Ensure we have a full URL
    if (!locItemLink.startsWith('http')) {
      locItemLink = `https://www.loc.gov/pictures/item/${locItemLink}`;
    }
    
    // Add JSON format parameter
    const url = `${locItemLink}?fo=json`;
    
    // Exponential backoff delay, capped at 5 seconds
    const delay = Math.min(250 * Math.pow(2, retryCount), 5000);
    console.log('Fetching from LOC API:', { url, retryCount, delay });
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    if (response.status === 429 && retryCount < 3) {
      console.log(`Rate limited, retry ${retryCount + 1} after ${delay}ms`);
      return getControlNumber(locItemLink, retryCount + 1);
    }
    
    if (!response.ok) {
      throw new Error(`LOC API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('LOC API response:', data);
    
    if (data.item?.control_number) {
      console.log('Found control number:', {
        url,
        retryCount,
        controlNumber: data.item.control_number
      });
      return data.item.control_number;
    }
    
    console.log('No control number found for item:', url);
    return null;
  } catch (error) {
    if (retryCount < 3) {
      console.log(`Error fetching control number, retry ${retryCount + 1}:`, error);
      return getControlNumber(locItemLink, retryCount + 1);
    }
    console.error('Error fetching control number after retries:', error);
    return null;
  }
};

// Add interface for lookup table data
interface LookupData {
  [key: string]: string;  // Maps FSA ID to control number
}

// Function to load and parse lookup table
const loadLookupTable = async (): Promise<LookupData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/fsa_lookup_table_cleaned-final.csv');
    if (!response.ok) {
      throw new Error(`Failed to load lookup table: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
      console.error('Received HTML instead of CSV data');
      throw new Error('Invalid lookup table format received');
    }
    
    const rows = text.trim().split('\n');
    if (rows.length < 2) {
      throw new Error('Lookup table is empty or malformed');
    }
    
    const data = rows.slice(1).reduce((acc, row) => {
      if (!row.trim()) return acc;
      
      const [lcId, controlNumber] = row.split(',').map(p => p.trim());
      if (lcId && controlNumber) {
        acc[lcId] = controlNumber;
      }
      return acc;
    }, {} as LookupData);

    console.log('Lookup table loaded:', {
      totalEntries: Object.keys(data).length,
      sampleEntries: Object.entries(data).slice(0, 3)
    });
    
    return data;
  } catch (error) {
    console.error('Error loading lookup table:', error);
    return {};
  }
};

// Function to construct LC ID from call number and strip info
const constructLCID = (photo: PhotoMetadata): string => {
  const { call_number, photograph_type } = photo;
  if (!call_number) return '';
  
  // If no strip type, just return the call number
  if (!photograph_type) return call_number;
  
  // For strip photos, append the strip position
  // photograph_type can be a single letter (a-z) or M followed by a number
  if (photograph_type.length === 1) {
    // Convert a-z to A-Z for the suffix
    return `${call_number}-${photograph_type.toUpperCase()}`;
  } else if (photograph_type.startsWith('M')) {
    // For M1, M2, etc., keep as is
    return `${call_number}-${photograph_type}`;
  }
  
  return call_number;
};

// Add interfaces for detection data
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectionData {
  [key: string]: {  // Maps control number to array of detections
    boxes: BoundingBox[];
    count: number;
  };
}

interface PhotoDimensions {
  [key: string]: {  // Maps control number to photo dimensions
    width: number;
    height: number;
  };
}

// Function to load photo dimensions
const loadPhotoDimensions = async (): Promise<PhotoDimensions> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/nn_size_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load photo dimensions: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
      throw new Error('Invalid photo dimensions format received');
    }
    
    const rows = text.trim().split('\n');
    if (rows.length < 2) {
      throw new Error('Photo dimensions file is empty or malformed');
    }
    
    // Get header row to find column indices
    const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
    const filenameIdx = headers.indexOf('filename');
    const widthIdx = headers.indexOf('width');
    const heightIdx = headers.indexOf('height');
    
    if (filenameIdx === -1 || widthIdx === -1 || heightIdx === -1) {
      console.error('Missing required columns in photo dimensions data:', headers);
      throw new Error('Photo dimensions data has invalid format');
    }
    
    const data: PhotoDimensions = {};
    rows.slice(1).forEach(row => {
      if (!row.trim()) return;
      
      const columns = row.split(',').map(v => v.trim());
      const filename = columns[filenameIdx];
      const width = Number(columns[widthIdx]);
      const height = Number(columns[heightIdx]);
      
      // Extract control number from filename
      const controlNumber = filename.split('.')[0];  // Remove file extension if present
      
      if (controlNumber && !isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        data[controlNumber] = {
          width: Math.round(width),
          height: Math.round(height)
        };
      }
    });

    // Debug log for the first few entries
    const sampleEntries = Object.entries(data).slice(0, 3);
    console.log('Photo dimensions loaded:', {
      totalPhotos: Object.keys(data).length,
      headers,
      sampleEntries: sampleEntries.map(([key, value]) => ({
        controlNumber: key,
        dimensions: value
      }))
    });
    
    return data;
  } catch (error) {
    console.error('Error loading photo dimensions:', error);
    return {};
  }
};

// Function to load face detection data with bounding boxes
const loadFaceDetectionData = async (): Promise<DetectionData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/nn_face_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load face detection data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
      throw new Error('Invalid face detection data format received');
    }
    
    const rows = text.trim().split('\n');
    if (rows.length < 2) {
      throw new Error('Face detection data file is empty or malformed');
    }
    
    // Get header row to find column indices
    const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
    const filenameIdx = headers.indexOf('filename');
    const topIdx = headers.indexOf('top');
    const rightIdx = headers.indexOf('right');
    const bottomIdx = headers.indexOf('bottom');
    const leftIdx = headers.indexOf('left');
    const confidenceIdx = headers.indexOf('confidence');
    
    if (filenameIdx === -1 || topIdx === -1 || rightIdx === -1 || bottomIdx === -1 || leftIdx === -1) {
      console.error('Missing required columns in face detection data:', headers);
      throw new Error('Face detection data has invalid format');
    }
    
    const data: DetectionData = {};
    rows.slice(1).forEach(row => {
      if (!row.trim()) return;
      
      const columns = row.split(',').map(v => v.trim());
      const filename = columns[filenameIdx];
      const top = Number(columns[topIdx]);
      const right = Number(columns[rightIdx]);
      const bottom = Number(columns[bottomIdx]);
      const left = Number(columns[leftIdx]);
      
      // Extract control number from filename
      const controlNumber = filename.split('.')[0];  // Remove file extension if present
      
      if (controlNumber && !isNaN(top) && !isNaN(right) && !isNaN(bottom) && !isNaN(left)) {
        if (!data[controlNumber]) {
          data[controlNumber] = { boxes: [], count: 0 };
        }
        
        // Calculate width and height from coordinates
        const width = right - left;
        const height = bottom - top;
        
        if (width > 0 && height > 0) {  // Only add valid boxes
          data[controlNumber].boxes.push({
            x: Math.round(left),
            y: Math.round(top),
            width: Math.round(width),
            height: Math.round(height)
          });
          data[controlNumber].count++;
        }
      }
    });

    // Debug log for the first few entries
    const sampleEntries = Object.entries(data).slice(0, 3);
    console.log('Face detection data loaded:', {
      totalPhotos: Object.keys(data).length,
      headers,
      sampleEntries: sampleEntries.map(([key, value]) => ({
        controlNumber: key,
        count: value.count,
        firstBox: value.boxes[0],
        totalBoxes: value.boxes.length
      }))
    });
    
    return data;
  } catch (error) {
    console.error('Error loading face detection data:', error);
    return {};
  }
};

// Function to calculate total area ratio for a photo
const calculateAreaRatio = (
  detections: { boxes: BoundingBox[] } | undefined,
  dimensions: { width: number; height: number; } | undefined
): number => {
  if (!detections?.boxes || !dimensions) {
    console.log('Missing data for area calculation:', { 
      hasDetections: !!detections,
      hasBoxes: !!detections?.boxes,
      hasDimensions: !!dimensions
    });
    return 0;
  }
  
  const totalPhotoArea = dimensions.width * dimensions.height;
  if (totalPhotoArea <= 0) {
    console.log('Invalid photo area:', dimensions);
    return 0;
  }
  
  const totalDetectedArea = detections.boxes.reduce((sum, box) => {
    const area = box.width * box.height;
    if (area <= 0) {
      console.log('Invalid box area:', box);
    }
    return sum + (area > 0 ? area : 0);
  }, 0);
  
  const ratio = totalDetectedArea / totalPhotoArea;
  
  // Add debug logging
  console.log('Area calculation:', {
    photoWidth: dimensions.width,
    photoHeight: dimensions.height,
    totalPhotoArea,
    totalDetectedArea,
    ratio,
    numBoxes: detections.boxes.length,
    boxes: detections.boxes.slice(0, 3)  // Log first 3 boxes
  });
  
  // Ensure ratio is between 0 and 1
  return Math.min(Math.max(ratio, 0), 1);
};

// Add interface for panorama detection data
interface PanoramaDetection {
  area: number;
  is_thing: boolean;
  class: string;
}

interface PanoramaData {
  [key: string]: {  // Maps control number to array of detections
    detections: PanoramaDetection[];
    totalArea: number;
    thingsArea: number;
    stuffArea: number;
  };
}

// Function to load panorama detection data
const loadPanoramaData = async (): Promise<PanoramaData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/nn_pano_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load panorama data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
      throw new Error('Invalid panorama data format received');
    }
    
    const rows = text.trim().split('\n');
    if (rows.length < 2) {
      throw new Error('Panorama data file is empty or malformed');
    }
    
    // Get header row to find column indices
    const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
    const filenameIdx = headers.indexOf('filename');
    const isThingIdx = headers.indexOf('is_thing');
    const classIdx = headers.indexOf('class');
    const areaIdx = headers.indexOf('area');
    
    if (filenameIdx === -1 || isThingIdx === -1 || classIdx === -1 || areaIdx === -1) {
      console.error('Missing required columns in panorama data:', headers);
      throw new Error('Panorama data has invalid format');
    }
    
    const data: PanoramaData = {};
    rows.slice(1).forEach(row => {
      if (!row.trim()) return;
      
      const columns = row.split(',').map(v => v.trim());
      const filename = columns[filenameIdx];
      const isThing = columns[isThingIdx].toUpperCase() === 'TRUE';
      const className = columns[classIdx];
      const area = Number(columns[areaIdx]);
      
      // Extract control number from filename
      const controlNumber = filename.split('.')[0];  // Remove file extension if present
      
      if (controlNumber && !isNaN(area) && area > 0) {
        if (!data[controlNumber]) {
          data[controlNumber] = {
            detections: [],
            totalArea: 0,
            thingsArea: 0,
            stuffArea: 0
          };
        }
        
        data[controlNumber].detections.push({
          area,
          is_thing: isThing,
          class: className
        });
        
        data[controlNumber].totalArea += area;
        if (isThing) {
          data[controlNumber].thingsArea += area;
        } else {
          data[controlNumber].stuffArea += area;
        }
      }
    });

    // Debug log for the first few entries
    const sampleEntries = Object.entries(data).slice(0, 3);
    console.log('Panorama data loaded:', {
      totalPhotos: Object.keys(data).length,
      headers,
      sampleEntries: sampleEntries.map(([key, value]) => ({
        controlNumber: key,
        totalDetections: value.detections.length,
        totalArea: value.totalArea,
        thingsArea: value.thingsArea,
        stuffArea: value.stuffArea,
        sampleClasses: value.detections.slice(0, 3).map(d => d.class)
      }))
    });
    
    return data;
  } catch (error) {
    console.error('Error loading panorama data:', error);
    return {};
  }
};

// Function to calculate panorama ratios
const calculatePanoramaRatios = (
  panoData: { totalArea: number; thingsArea: number; stuffArea: number; } | undefined,
  dimensions: { width: number; height: number; } | undefined
): { det_region_ratio: number; det_stuff_ratio: number; det_things_ratio: number; } => {
  if (!panoData || !dimensions) {
    return {
      det_region_ratio: 0,
      det_stuff_ratio: 0,
      det_things_ratio: 0
    };
  }
  
  const totalPhotoArea = dimensions.width * dimensions.height;
  if (totalPhotoArea <= 0) {
    console.log('Invalid photo area:', dimensions);
    return {
      det_region_ratio: 0,
      det_stuff_ratio: 0,
      det_things_ratio: 0
    };
  }
  
  // Calculate ratios
  const det_region_ratio = Math.min(panoData.totalArea / totalPhotoArea, 1);
  const det_stuff_ratio = Math.min(panoData.stuffArea / totalPhotoArea, 1);
  const det_things_ratio = Math.min(panoData.thingsArea / totalPhotoArea, 1);
  
  // Add debug logging
  console.log('Panorama ratios calculation:', {
    photoWidth: dimensions.width,
    photoHeight: dimensions.height,
    totalPhotoArea,
    totalDetectedArea: panoData.totalArea,
    stuffArea: panoData.stuffArea,
    thingsArea: panoData.thingsArea,
    ratios: {
      det_region_ratio,
      det_stuff_ratio,
      det_things_ratio
    }
  });
  
  return {
    det_region_ratio,
    det_stuff_ratio,
    det_things_ratio
  };
};

const convertToCSV = async (photos: PhotoMetadata[], umapData: UMAPData) => {
  // Load all required data in parallel
  const [lookupData, faceData, photoDimensions, panoData] = await Promise.all([
    loadLookupTable(),
    loadFaceDetectionData(),
    loadPhotoDimensions(),
    loadPanoramaData()
  ]);
  
  // Debug first few photos
  console.log('First few photos:', 
    photos.slice(0, 3).map(p => {
      const lcId = constructLCID(p);
      const controlNumber = lcId ? lookupData[lcId] : undefined;
      const dimensions = controlNumber ? photoDimensions[controlNumber] : undefined;
      const faceDetections = controlNumber ? faceData[controlNumber] : undefined;
      const panoDetections = controlNumber ? panoData[controlNumber] : undefined;
      const panoRatios = calculatePanoramaRatios(panoDetections, dimensions);
      
      return {
        loc_item_link: p.loc_item_link,
        call_number: p.call_number,
        photograph_type: p.photograph_type,
        constructed_lc_id: lcId,
        control_number: controlNumber,
        dimensions,
        faces_detected: faceDetections?.count || 0,
        total_face_area_ratio: calculateAreaRatio(faceDetections, dimensions),
        ...panoRatios,
        raw_umap_data: controlNumber ? umapData[controlNumber] : undefined
      };
    })
  );

  const headers = [
    'loc_item_link',
    'call_number',
    'control_number',
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
    'faces_detected',
    'total_face_area_ratio',
    'det_region_ratio',
    'det_stuff_ratio',
    'det_things_ratio',
    'umap_01',
    'umap_02'
  ];

  const headerLabels = [
    'Photo ID',
    'Call Number',
    'Control Number',
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
    'Faces Detected',
    'Total Face Area Ratio',
    'Detected Region Ratio',
    'Detected Stuff Ratio',
    'Detected Things Ratio',
    'UMAP Dimension 1',
    'UMAP Dimension 2'
  ];

  const headerRow = headerLabels.join(',');

  const rows = photos.map(photo => {
    const lcId = constructLCID(photo);
    const controlNumber = lcId ? lookupData[lcId] : '';
    const dimensions = controlNumber ? photoDimensions[controlNumber] : undefined;
    const faceDetections = controlNumber ? faceData[controlNumber] : undefined;
    const panoDetections = controlNumber ? panoData[controlNumber] : undefined;
    const panoRatios = calculatePanoramaRatios(panoDetections, dimensions);
    
    const photoWithStrip = {
      ...photo,
      control_number: controlNumber,
      strip: photo.photograph_type ? 'T' : 'F',
      strip_position: photo.photograph_type ? 
        (photo.photograph_type.length === 1 ? 
          photo.photograph_type.toLowerCase().charCodeAt(0) - 96 : 
          parseInt(photo.photograph_type.substring(1))) : 
        '',
      strip_type: photo.photograph_type || '',
      faces_detected: faceDetections?.count || 0,
      total_face_area_ratio: calculateAreaRatio(faceDetections, dimensions),
      ...panoRatios,
      umap_01: controlNumber ? (umapData[controlNumber]?.umap_01 || '') : '',
      umap_02: controlNumber ? (umapData[controlNumber]?.umap_02 || '') : ''
    };

    // Debug log first few items
    if (photos.indexOf(photo) < 3) {
      console.log('Photo mapping:', {
        original_id: photo.loc_item_link,
        call_number: photo.call_number,
        photograph_type: photo.photograph_type,
        constructed_lc_id: lcId,
        control_number: controlNumber,
        dimensions,
        faces_detected: photoWithStrip.faces_detected,
        total_face_area_ratio: photoWithStrip.total_face_area_ratio,
        pano_ratios: panoRatios,
        umap_values: controlNumber ? umapData[controlNumber] : undefined,
        final_values: {
          umap_01: photoWithStrip.umap_01,
          umap_02: photoWithStrip.umap_02
        }
      });
    }

    return headers.map(header => {
      const value = photoWithStrip[header] || '';
      // Special handling for numeric fields to ensure proper formatting
      if (header === 'faces_detected') {
        return String(photoWithStrip.faces_detected);
      }
      if (header === 'total_face_area_ratio' || 
          header === 'det_region_ratio' || 
          header === 'det_stuff_ratio' || 
          header === 'det_things_ratio') {
        return photoWithStrip[header].toFixed(6);  // Format ratios to 6 decimal places
      }
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
      // Load UMAP data first
      const umapData = await loadUMAPData();
      
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

      const csv = await convertToCSV(photos, umapData);
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
