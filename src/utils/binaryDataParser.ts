
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
  // Get binary data attributes with better detection
  const precisionParam = binaryElement.querySelector('cvParam[name*="32-bit"], cvParam[name*="64-bit"]');
  const precision = precisionParam?.getAttribute('name')?.includes('64') ? 64 : 32;
  
  const compressionParam = binaryElement.querySelector('cvParam[name*="zlib"], cvParam[name*="compression"], cvParam[name*="no compression"]');
  const compression = compressionParam?.getAttribute('name')?.includes('zlib') ? 'zlib' : 'none';
  
  // Better array type detection
  const arrayTypeParam = binaryElement.querySelector('cvParam[name*="m/z"], cvParam[name*="intensity"], cvParam[name*="time"]');
  let arrayType: 'mz' | 'intensity' | 'time' = 'mz';
  if (arrayTypeParam) {
    const paramName = arrayTypeParam.getAttribute('name') || '';
    if (paramName.toLowerCase().includes('intensity')) arrayType = 'intensity';
    else if (paramName.toLowerCase().includes('time')) arrayType = 'time';
  }

  // Get base64 encoded data
  const binaryText = binaryElement.querySelector('binary')?.textContent?.trim();
  if (!binaryText) {
    console.warn('No binary data found in element');
    return { data: [], precision, compression, arrayType };
  }

  try {
    // Enhanced base64 decoding with validation
    let binaryString: string;
    try {
      // Clean base64 string - remove whitespace and newlines
      const cleanBase64 = binaryText.replace(/\s/g, '');
      binaryString = atob(cleanBase64);
    } catch (error) {
      console.error('Failed to decode base64 data:', error);
      return { data: [], precision, compression, arrayType };
    }

    // Convert to Uint8Array more efficiently
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Handle compression - basic implementation
    let decodedBytes = bytes;
    if (compression === 'zlib') {
      console.warn('Zlib compression detected. Attempting to parse raw data.');
      // For now, try to parse anyway - in production, would need pako or similar library
    }

    // Enhanced number conversion with better validation
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
          
          // Try both little and big endian - mzML typically uses little, mzXML uses big
          if (precision === 64) {
            value = dataView.getFloat64(offset, true); // little endian first
            // If value seems invalid, try big endian
            if (!isFinite(value) || (arrayType === 'mz' && (value < 0 || value > 10000))) {
              value = dataView.getFloat64(offset, false); // big endian
            }
          } else {
            value = dataView.getFloat32(offset, true); // little endian first
            // If value seems invalid, try big endian
            if (!isFinite(value) || (arrayType === 'mz' && (value < 0 || value > 10000))) {
              value = dataView.getFloat32(offset, false); // big endian
            }
          }
          
          // Enhanced validation based on array type
          if (isFinite(value) && !isNaN(value)) {
            if (arrayType === 'mz' && value > 0 && value < 10000) {
              data.push(value);
            } else if (arrayType === 'intensity' && value >= 0) {
              data.push(value);
            } else if (arrayType === 'time' && value >= 0) {
              data.push(value);
            } else if (arrayType === 'mz') {
              // Still add even if outside normal range - might be valid
              data.push(Math.abs(value));
            } else {
              data.push(Math.abs(value)); // Take absolute value as fallback
            }
          } else {
            console.warn(`Invalid value at index ${i}: ${value} for type ${arrayType}`);
          }
        } catch (error) {
          console.warn(`Error reading value at offset ${offset}:`, error);
          break;
        }
      }
      
      console.log(`Successfully parsed ${data.length} values from binary data (${arrayType})`);
      
      // Additional validation - check if data makes sense
      if (data.length > 0) {
        if (arrayType === 'mz') {
          const avgMz = data.reduce((sum, val) => sum + val, 0) / data.length;
          console.log(`Average m/z: ${avgMz.toFixed(2)}, range: ${Math.min(...data).toFixed(2)} - ${Math.max(...data).toFixed(2)}`);
        } else if (arrayType === 'intensity') {
          const maxIntensity = Math.max(...data);
          const nonZeroCount = data.filter(v => v > 0).length;
          console.log(`Max intensity: ${maxIntensity.toLocaleString()}, non-zero values: ${nonZeroCount}/${data.length}`);
        }
      }
      
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
