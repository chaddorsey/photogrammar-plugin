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
    const lines = text.split('\n');
    const data: UMAPData = {};
    
    for (let i = 1; i < lines.length; i++) {
      const [controlNum, umap01, umap02] = lines[i].split(',');
      if (controlNum && umap01 && umap02) {
        data[controlNum] = {
          umap_01: parseFloat(umap01),
          umap_02: parseFloat(umap02)
        };
      }
    }
    return data;
  } catch (error) {
    console.error('Error loading UMAP data:', error);
    return {};
  }
};

// Function to load face detection data
export const loadFaceDetectionData = async (): Promise<DetectionData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/face_detections_fsa.json');
    if (!response.ok) {
      throw new Error(`Failed to load face detection data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading face detection data:', error);
    return {};
  }
};

// Function to load photo dimensions
export const loadPhotoDimensions = async (): Promise<PhotoDimensions> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/photo_dimensions_fsa.json');
    if (!response.ok) {
      throw new Error(`Failed to load photo dimensions: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading photo dimensions:', error);
    return {};
  }
};

// Function to load panorama data
export const loadPanoramaData = async (): Promise<PanoramaData> => {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/panorama_detections_fsa.json');
    if (!response.ok) {
      throw new Error(`Failed to load panorama data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading panorama data:', error);
    return {};
  }
};

// Function to calculate area ratio for face detections
export const calculateAreaRatio = (detections: { boxes: BoundingBox[]; count: number } | undefined, dimensions: { width: number; height: number } | undefined): number => {
  if (!detections || !dimensions || !detections.boxes || detections.boxes.length === 0) {
    return 0;
  }

  const totalArea = dimensions.width * dimensions.height;
  const faceArea = detections.boxes.reduce((sum, box) => sum + (box.width * box.height), 0);
  
  return faceArea / totalArea;
};

// Function to calculate panorama ratios
export const calculatePanoramaRatios = (detections: PanoramaData[string] | undefined, dimensions: { width: number; height: number } | undefined) => {
  if (!detections || !dimensions) {
    return {
      det_region_ratio: 0,
      det_stuff_ratio: 0,
      det_things_ratio: 0
    };
  }

  const totalArea = dimensions.width * dimensions.height;
  const detRegionRatio = detections.totalArea / totalArea;
  const detStuffRatio = detections.stuffArea / totalArea;
  const detThingsRatio = detections.thingsArea / totalArea;

  return {
    det_region_ratio: detRegionRatio,
    det_stuff_ratio: detStuffRatio,
    det_things_ratio: detThingsRatio
  };
}; 