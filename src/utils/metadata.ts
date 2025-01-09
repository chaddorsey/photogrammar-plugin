interface UMAPData {
  [key: string]: {
    umap_01: number;
    umap_02: number;
  };
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectionData {
  [key: string]: {
    boxes: BoundingBox[];
    count: number;
  };
}

interface PhotoDimensions {
  [key: string]: {
    width: number;
    height: number;
  };
}

interface PanoramaDetection {
  area: number;
  is_thing: boolean;
  class: string;
}

interface PanoramaData {
  [key: string]: {
    detections: PanoramaDetection[];
    totalArea: number;
    thingsArea: number;
    stuffArea: number;
  };
}

// Function to load UMAP data
export const loadUMAPData = async (): Promise<UMAPData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/umap_embd_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load UMAP data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const rows = text.trim().split('\n');
    
    if (rows.length < 2) {
      throw new Error('UMAP data file is empty or malformed');
    }
    
    const data = rows.slice(1).reduce((acc, row) => {
      if (!row.trim()) return acc;
      
      const [filename, _, umap_01, umap_02] = row.split(',');
      if (filename && umap_01 && umap_02) {
        const cleanNum = filename.replace(/^0+/, '');
        acc[cleanNum] = {
          umap_01: parseFloat(umap_01),
          umap_02: parseFloat(umap_02)
        };
      }
      return acc;
    }, {} as UMAPData);

    return data;
  } catch (error) {
    console.error('Error loading UMAP data:', error);
    return {};
  }
};

// Function to load face detection data
export const loadFaceDetectionData = async (): Promise<DetectionData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/nn_face_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load face detection data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const rows = text.trim().split('\n');
    const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
    const filenameIdx = headers.indexOf('filename');
    const topIdx = headers.indexOf('top');
    const rightIdx = headers.indexOf('right');
    const bottomIdx = headers.indexOf('bottom');
    const leftIdx = headers.indexOf('left');

    const data: DetectionData = {};
    rows.slice(1).forEach(row => {
      if (!row.trim()) return;
      
      const columns = row.split(',').map(v => v.trim());
      const filename = columns[filenameIdx];
      const top = Number(columns[topIdx]);
      const right = Number(columns[rightIdx]);
      const bottom = Number(columns[bottomIdx]);
      const left = Number(columns[leftIdx]);
      
      const controlNumber = filename.split('.')[0];
      
      if (controlNumber && !isNaN(top) && !isNaN(right) && !isNaN(bottom) && !isNaN(left)) {
        if (!data[controlNumber]) {
          data[controlNumber] = { boxes: [], count: 0 };
        }
        
        const width = right - left;
        const height = bottom - top;
        
        if (width > 0 && height > 0) {
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

    return data;
  } catch (error) {
    console.error('Error loading face detection data:', error);
    return {};
  }
};

// Function to load photo dimensions
export const loadPhotoDimensions = async (): Promise<PhotoDimensions> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/nn_size_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load photo dimensions: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const rows = text.trim().split('\n');
    const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
    const filenameIdx = headers.indexOf('filename');
    const widthIdx = headers.indexOf('width');
    const heightIdx = headers.indexOf('height');
    
    const data: PhotoDimensions = {};
    rows.slice(1).forEach(row => {
      if (!row.trim()) return;
      
      const columns = row.split(',').map(v => v.trim());
      const filename = columns[filenameIdx];
      const width = Number(columns[widthIdx]);
      const height = Number(columns[heightIdx]);
      
      const controlNumber = filename.split('.')[0];
      
      if (controlNumber && !isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        data[controlNumber] = {
          width: Math.round(width),
          height: Math.round(height)
        };
      }
    });

    return data;
  } catch (error) {
    console.error('Error loading photo dimensions:', error);
    return {};
  }
};

// Function to load panorama data
export const loadPanoramaData = async (): Promise<PanoramaData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/nn_pano_fsa.csv');
    if (!response.ok) {
      throw new Error(`Failed to load panorama data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const rows = text.trim().split('\n');
    const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
    const filenameIdx = headers.indexOf('filename');
    const isThingIdx = headers.indexOf('is_thing');
    const classIdx = headers.indexOf('class');
    const areaIdx = headers.indexOf('area');
    
    const data: PanoramaData = {};
    rows.slice(1).forEach(row => {
      if (!row.trim()) return;
      
      const columns = row.split(',').map(v => v.trim());
      const filename = columns[filenameIdx];
      const isThing = columns[isThingIdx].toUpperCase() === 'TRUE';
      const className = columns[classIdx];
      const area = Number(columns[areaIdx]);
      
      const controlNumber = filename.split('.')[0];
      
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

    return data;
  } catch (error) {
    console.error('Error loading panorama data:', error);
    return {};
  }
};

// Function to calculate face area ratio
export const calculateAreaRatio = (
  detections: { boxes: BoundingBox[] } | undefined,
  dimensions: { width: number; height: number; } | undefined
): number => {
  if (!detections?.boxes || !dimensions) return 0;
  
  const totalPhotoArea = dimensions.width * dimensions.height;
  if (totalPhotoArea <= 0) return 0;
  
  const totalDetectedArea = detections.boxes.reduce((sum, box) => {
    const area = box.width * box.height;
    return sum + (area > 0 ? area : 0);
  }, 0);
  
  return Math.min(totalDetectedArea / totalPhotoArea, 1);
};

// Function to calculate panorama ratios
export const calculatePanoramaRatios = (
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
    return {
      det_region_ratio: 0,
      det_stuff_ratio: 0,
      det_things_ratio: 0
    };
  }
  
  return {
    det_region_ratio: Math.min(panoData.totalArea / totalPhotoArea, 1),
    det_stuff_ratio: Math.min(panoData.stuffArea / totalPhotoArea, 1),
    det_things_ratio: Math.min(panoData.thingsArea / totalPhotoArea, 1)
  };
}; 