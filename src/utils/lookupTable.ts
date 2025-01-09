interface LookupData {
  controlToLoc: { [key: string]: string };  // Maps control number to loc_item_link
  locToControl: { [key: string]: string };  // Maps loc_item_link to control number
  controlToCall: { [key: string]: string }; // Maps control number to call number
}

async function processResponse(response: Response): Promise<LookupData> {
  const text = await response.text();
  console.log('Raw lookup table response:', text.substring(0, 200));
  
  const rows = text.trim().split('\n');
  if (rows.length < 2) {
    throw new Error('Lookup table is empty or malformed');
  }

  console.log('Header row:', rows[0]);
  
  const data: LookupData = {
    controlToLoc: {},
    locToControl: {},
    controlToCall: {}
  };

  // Parse CSV properly handling quoted fields
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          // Handle escaped quotes
          currentValue += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    result.push(currentValue.trim());
    return result;
  };

  // Skip header row and process data rows
  rows.slice(1).forEach((row, index) => {
    if (!row.trim()) return;
    
    const parts = parseCSVRow(row);
    // Format in master_lookup_table_final.csv:
    // control_number, call_number, loc_item_link
    const [controlNum, callNumber, locItemLink] = parts;
    
    if (controlNum && callNumber && locItemLink) {
      // Store mappings
      data.controlToLoc[controlNum] = locItemLink;
      data.locToControl[locItemLink] = controlNum;
      data.controlToCall[controlNum] = callNumber;
    } else {
      console.warn(`Skipping malformed row ${index + 2}:`, {
        row,
        parts,
        controlNum,
        callNumber,
        locItemLink
      });
    }
  });
  
  if (Object.keys(data.controlToLoc).length === 0) {
    throw new Error('No valid entries found in lookup table');
  }
  
  console.log('Lookup table loaded:', {
    totalEntries: Object.keys(data.controlToLoc).length,
    sampleEntries: Object.entries(data.controlToLoc).slice(0, 3)
  });
  
  return data;
}

export async function loadLookupTable(): Promise<LookupData> {
  try {
    const response = await fetch('/panorama/photogrammar/data/addi-metadata/fsa/master_lookup_table_final.csv');
    if (!response.ok) {
      console.error('Failed to load lookup table:', response.status, response.statusText);
      throw new Error(`Failed to load lookup table: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of CSV data');
      throw new Error('Invalid lookup table format received');
    }
    
    return processResponse(response);
  } catch (error) {
    console.error('Error loading lookup table:', error);
    throw error;
  }
} 