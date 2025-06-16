
// Binary data parsing utilities for mzML/mzXML files
export interface BinaryDataArray {
  data: number[];
  precision: 32 | 64;
  compression: 'none' | 'zlib' | 'gzip';
  arrayType: 'mz' | 'intensity' | 'time';
}

export const parseBinaryData = (
  binaryElement: Element,
  arrayLength: number
): BinaryDataArray => {
  // Get binary data attributes
  const precisionParam = binaryElement.querySelector('cvParam[name="32-bit float"], cvParam[name="64-bit float"]');
  const precision = precisionParam?.getAttribute('name')?.includes('64') ? 64 : 32;
  
  const compressionParam = binaryElement.querySelector('cvParam[name="zlib compression"], cvParam[name="no compression"]');
  const compression = compressionParam?.getAttribute('name')?.includes('zlib') ? 'zlib' : 'none';
  
  const arrayTypeParam = binaryElement.querySelector('cvParam[name="m/z array"], cvParam[name="intensity array"], cvParam[name="time array"]');
  let arrayType: 'mz' | 'intensity' | 'time' = 'mz';
  if (arrayTypeParam) {
    const paramName = arrayTypeParam.getAttribute('name') || '';
    if (paramName.includes('intensity')) arrayType = 'intensity';
    else if (paramName.includes('time')) arrayType = 'time';
  }

  // Get base64 encoded data
  const binaryText = binaryElement.querySelector('binary')?.textContent?.trim();
  if (!binaryText) {
    console.warn('No binary data found in element');
    return { data: [], precision, compression, arrayType };
  }

  try {
    // Decode base64 with better error handling
    let binaryString: string;
    try {
      binaryString = atob(binaryText);
    } catch (error) {
      console.error('Failed to decode base64 data:', error);
      return { data: [], precision, compression, arrayType };
    }

    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Handle compression - for now, we'll work with uncompressed data
    let decodedBytes = bytes;
    if (compression === 'zlib') {
      console.warn('Zlib compression detected - trying to parse raw data. For full zlib support, additional library needed.');
      // Try to parse anyway - some files may not be properly compressed
    }

    // Convert bytes to numbers based on precision
    const data: number[] = [];
    const bytesPerFloat = precision === 64 ? 8 : 4;
    const expectedBytes = arrayLength * bytesPerFloat;
    
    console.log(`Parsing binary array: type=${arrayType}, length=${arrayLength}, precision=${precision}, compression=${compression}`);
    console.log(`Expected ${expectedBytes} bytes, got ${decodedBytes.length} bytes`);
    
    if (decodedBytes.length >= expectedBytes) {
      const dataView = new DataView(decodedBytes.buffer, decodedBytes.byteOffset);
      
      for (let i = 0; i < arrayLength; i++) {
        const offset = i * bytesPerFloat;
        try {
          let value: number;
          if (precision === 64) {
            value = dataView.getFloat64(offset, true); // little endian
          } else {
            value = dataView.getFloat32(offset, true); // little endian
          }
          
          // Validate the value
          if (!isNaN(value) && isFinite(value)) {
            data.push(value);
          } else {
            console.warn(`Invalid value at index ${i}: ${value}`);
          }
        } catch (error) {
          console.warn(`Error reading value at offset ${offset}:`, error);
          break;
        }
      }
      
      console.log(`Successfully parsed ${data.length} values from binary data`);
    } else {
      console.warn(`Binary data length mismatch: expected ${expectedBytes} bytes, got ${decodedBytes.length}`);
      return { data: [], precision, compression, arrayType };
    }

    return { data, precision, compression, arrayType };
  } catch (error) {
    console.error('Failed to parse binary data:', error);
    return { data: [], precision, compression, arrayType };
  }
};

export const extractPeaksFromBinaryArrays = (
  mzArray: number[],
  intensityArray: number[]
): { mz: number; intensity: number }[] => {
  const peaks = [];
  const length = Math.min(mzArray.length, intensityArray.length);
  
  console.log(`Extracting peaks from arrays: ${mzArray.length} m/z values, ${intensityArray.length} intensity values`);
  
  for (let i = 0; i < length; i++) {
    const mz = mzArray[i];
    const intensity = intensityArray[i];
    
    // Only include valid, non-zero intensities
    if (intensity > 0 && !isNaN(mz) && !isNaN(intensity) && isFinite(mz) && isFinite(intensity)) {
      peaks.push({
        mz: mz,
        intensity: intensity
      });
    }
  }
  
  console.log(`Extracted ${peaks.length} valid peaks`);
  return peaks;
};

// Helper function to validate peak data structure
export const validatePeakData = (peaks: any[]): boolean => {
  if (!Array.isArray(peaks) || peaks.length === 0) {
    return false;
  }
  
  // Check if peaks have the expected structure
  return peaks.every(peak => 
    peak && 
    typeof peak === 'object' && 
    typeof peak.mz === 'number' && 
    typeof peak.intensity === 'number' && 
    !isNaN(peak.mz) && 
    !isNaN(peak.intensity) &&
    isFinite(peak.mz) && 
    isFinite(peak.intensity) &&
    peak.intensity > 0
  );
};

// Helper function to validate and filter peak arrays
export const filterValidPeaks = (peaks: any[]): { mz: number; intensity: number }[] => {
  if (!Array.isArray(peaks)) {
    return [];
  }
  
  return peaks.filter(peak => 
    peak && 
    typeof peak === 'object' && 
    typeof peak.mz === 'number' && 
    typeof peak.intensity === 'number' && 
    !isNaN(peak.mz) && 
    !isNaN(peak.intensity) &&
    isFinite(peak.mz) && 
    isFinite(peak.intensity) &&
    peak.intensity > 0 &&
    peak.mz > 0
  );
};
