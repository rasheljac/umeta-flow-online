
export interface BinaryDataParser {
  parseFloat32Array: (base64Data: string, compression?: string) => Float32Array;
  parseFloat64Array: (base64Data: string, compression?: string) => Float64Array;
  parseInt32Array: (base64Data: string, compression?: string) => Int32Array;
}

// Enhanced binary data parsing with better error handling and debugging
export const binaryDataParser: BinaryDataParser = {
  parseFloat32Array: (base64Data: string, compression?: string): Float32Array => {
    try {
      console.log(`🔍 Parsing Float32Array: ${base64Data.length} chars, compression: ${compression || 'none'}`);
      
      if (!base64Data || typeof base64Data !== 'string') {
        console.warn('⚠️ Invalid base64 data provided');
        return new Float32Array();
      }

      // Clean base64 data
      const cleanedData = base64Data.replace(/\s/g, '');
      
      // Decode base64
      let binaryString: string;
      try {
        binaryString = atob(cleanedData);
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        return new Float32Array();
      }

      console.log(`📊 Decoded binary string length: ${binaryString.length} bytes`);

      // Handle compression if specified
      let finalBinaryString = binaryString;
      if (compression && compression.toLowerCase() === 'zlib') {
        console.log('⚠️ zlib compression detected but not implemented, using raw data');
        // Note: Real zlib decompression would require additional libraries
      }

      // Convert to array buffer
      const arrayBuffer = new ArrayBuffer(finalBinaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < finalBinaryString.length; i++) {
        uint8Array[i] = finalBinaryString.charCodeAt(i);
      }

      const float32Array = new Float32Array(arrayBuffer);
      
      console.log(`✅ Parsed ${float32Array.length} float32 values`);
      console.log(`📈 Value range: ${Math.min(...float32Array).toFixed(4)} - ${Math.max(...float32Array).toFixed(4)}`);
      
      // Log some sample values for debugging
      if (float32Array.length > 0) {
        const sampleValues = Array.from(float32Array.slice(0, 10));
        console.log(`📝 Sample values:`, sampleValues.map(v => v.toFixed(4)).join(', '));
      }

      return float32Array;
    } catch (error) {
      console.error('❌ Error parsing Float32Array:', error);
      return new Float32Array();
    }
  },

  parseFloat64Array: (base64Data: string, compression?: string): Float64Array => {
    try {
      console.log(`🔍 Parsing Float64Array: ${base64Data.length} chars, compression: ${compression || 'none'}`);
      
      if (!base64Data || typeof base64Data !== 'string') {
        console.warn('⚠️ Invalid base64 data provided');
        return new Float64Array();
      }

      // Clean base64 data
      const cleanedData = base64Data.replace(/\s/g, '');
      
      // Decode base64
      let binaryString: string;
      try {
        binaryString = atob(cleanedData);
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        return new Float64Array();
      }

      console.log(`📊 Decoded binary string length: ${binaryString.length} bytes`);

      // Handle compression if specified
      let finalBinaryString = binaryString;
      if (compression && compression.toLowerCase() === 'zlib') {
        console.log('⚠️ zlib compression detected but not implemented, using raw data');
      }

      // Convert to array buffer
      const arrayBuffer = new ArrayBuffer(finalBinaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < finalBinaryString.length; i++) {
        uint8Array[i] = finalBinaryString.charCodeAt(i);
      }

      const float64Array = new Float64Array(arrayBuffer);
      
      console.log(`✅ Parsed ${float64Array.length} float64 values`);
      console.log(`📈 Value range: ${Math.min(...float64Array).toFixed(4)} - ${Math.max(...float64Array).toFixed(4)}`);
      
      // Log some sample values for debugging
      if (float64Array.length > 0) {
        const sampleValues = Array.from(float64Array.slice(0, 10));
        console.log(`📝 Sample values:`, sampleValues.map(v => v.toFixed(4)).join(', '));
      }

      return float64Array;
    } catch (error) {
      console.error('❌ Error parsing Float64Array:', error);
      return new Float64Array();
    }
  },

  parseInt32Array: (base64Data: string, compression?: string): Int32Array => {
    try {
      console.log(`🔍 Parsing Int32Array: ${base64Data.length} chars, compression: ${compression || 'none'}`);
      
      if (!base64Data || typeof base64Data !== 'string') {
        console.warn('⚠️ Invalid base64 data provided');
        return new Int32Array();
      }

      // Clean base64 data
      const cleanedData = base64Data.replace(/\s/g, '');
      
      // Decode base64
      let binaryString: string;
      try {
        binaryString = atob(cleanedData);
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        return new Int32Array();
      }

      console.log(`📊 Decoded binary string length: ${binaryString.length} bytes`);

      // Handle compression if specified
      let finalBinaryString = binaryString;
      if (compression && compression.toLowerCase() === 'zlib') {
        console.log('⚠️ zlib compression detected but not implemented, using raw data');
      }

      // Convert to array buffer
      const arrayBuffer = new ArrayBuffer(finalBinaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < finalBinaryString.length; i++) {
        uint8Array[i] = finalBinaryString.charCodeAt(i);
      }

      const int32Array = new Int32Array(arrayBuffer);
      
      console.log(`✅ Parsed ${int32Array.length} int32 values`);
      
      if (int32Array.length > 0) {
        console.log(`📈 Value range: ${Math.min(...int32Array)} - ${Math.max(...int32Array)}`);
        
        // Log some sample values for debugging
        const sampleValues = Array.from(int32Array.slice(0, 10));
        console.log(`📝 Sample values:`, sampleValues.join(', '));
      }

      return int32Array;
    } catch (error) {
      console.error('❌ Error parsing Int32Array:', error);
      return new Int32Array();
    }
  }
};

// New function that mzParser.ts expects
export const parseBinaryData = (binaryArrayElement: Element, arrayLength: number): { data: number[], arrayType: string } => {
  console.log(`🔍 Parsing binary data array with length: ${arrayLength}`);
  
  // Determine array type from CV params
  let arrayType = 'unknown';
  const mzParam = binaryArrayElement.querySelector('cvParam[name="m/z array"]');
  const intensityParam = binaryArrayElement.querySelector('cvParam[name="intensity array"]');
  const timeParam = binaryArrayElement.querySelector('cvParam[name="time array"]');
  
  if (mzParam) arrayType = 'mz';
  else if (intensityParam) arrayType = 'intensity';
  else if (timeParam) arrayType = 'time';
  
  console.log(`📊 Detected array type: ${arrayType}`);
  
  // Get binary data element
  const binaryElement = binaryArrayElement.querySelector('binary');
  if (!binaryElement || !binaryElement.textContent) {
    console.warn('⚠️ No binary data found in array element');
    return { data: [], arrayType };
  }
  
  const base64Data = binaryElement.textContent.trim();
  
  // Determine precision and compression
  const float32Param = binaryArrayElement.querySelector('cvParam[name="32-bit float"]');
  const float64Param = binaryArrayElement.querySelector('cvParam[name="64-bit float"]');
  const zlibParam = binaryArrayElement.querySelector('cvParam[name="zlib compression"]');
  
  const compression = zlibParam ? 'zlib' : undefined;
  
  let parsedArray: Float32Array | Float64Array;
  
  if (float64Param) {
    parsedArray = binaryDataParser.parseFloat64Array(base64Data, compression);
  } else {
    // Default to 32-bit float
    parsedArray = binaryDataParser.parseFloat32Array(base64Data, compression);
  }
  
  return {
    data: Array.from(parsedArray),
    arrayType
  };
};

// New function that mzParser.ts expects
export const extractPeaksFromBinaryArrays = (mzArray: number[], intensityArray: number[]): Array<{mz: number, intensity: number}> => {
  console.log(`🔍 Extracting peaks from arrays: ${mzArray.length} m/z values, ${intensityArray.length} intensity values`);
  
  if (mzArray.length === 0 || intensityArray.length === 0) {
    console.warn('⚠️ Empty arrays provided for peak extraction');
    return [];
  }
  
  if (mzArray.length !== intensityArray.length) {
    console.warn(`⚠️ Array length mismatch: m/z=${mzArray.length}, intensity=${intensityArray.length}`);
    const minLength = Math.min(mzArray.length, intensityArray.length);
    console.log(`📏 Using minimum length: ${minLength}`);
  }
  
  const minLength = Math.min(mzArray.length, intensityArray.length);
  const peaks: Array<{mz: number, intensity: number}> = [];
  
  for (let i = 0; i < minLength; i++) {
    const mz = mzArray[i];
    const intensity = intensityArray[i];
    
    // Only include valid peaks with positive intensity
    if (!isNaN(mz) && !isNaN(intensity) && isFinite(mz) && isFinite(intensity) && intensity > 0) {
      peaks.push({ mz, intensity });
    }
  }
  
  console.log(`✅ Extracted ${peaks.length} valid peaks from binary arrays`);
  
  if (peaks.length > 0) {
    const mzRange = { min: Math.min(...peaks.map(p => p.mz)), max: Math.max(...peaks.map(p => p.mz)) };
    const intensityRange = { min: Math.min(...peaks.map(p => p.intensity)), max: Math.max(...peaks.map(p => p.intensity)) };
    console.log(`📈 m/z range: ${mzRange.min.toFixed(4)} - ${mzRange.max.toFixed(4)}`);
    console.log(`📈 Intensity range: ${intensityRange.min.toFixed(2)} - ${intensityRange.max.toFixed(2)}`);
  }
  
  return peaks;
};

// New function that mzParser.ts expects
export const validatePeakData = (peaks: Array<{mz: number, intensity: number}>): boolean => {
  console.log(`🔍 Validating peak data: ${peaks.length} peaks`);
  
  if (!Array.isArray(peaks)) {
    console.error('❌ Peak data is not an array');
    return false;
  }
  
  if (peaks.length === 0) {
    console.warn('⚠️ No peaks to validate');
    return false;
  }
  
  let validPeaks = 0;
  let invalidPeaks = 0;
  
  for (const peak of peaks) {
    if (peak && typeof peak === 'object' && 
        typeof peak.mz === 'number' && typeof peak.intensity === 'number' &&
        !isNaN(peak.mz) && !isNaN(peak.intensity) &&
        isFinite(peak.mz) && isFinite(peak.intensity) &&
        peak.intensity > 0 && peak.mz > 0) {
      validPeaks++;
    } else {
      invalidPeaks++;
    }
  }
  
  console.log(`📊 Peak validation: ${validPeaks} valid, ${invalidPeaks} invalid`);
  
  const isValid = validPeaks > 0 && (invalidPeaks / peaks.length) < 0.5; // Allow up to 50% invalid peaks
  console.log(`✅ Peak data validation result: ${isValid}`);
  
  return isValid;
};

// Enhanced helper functions for debugging
export const validateBinaryData = (data: any[]): boolean => {
  console.log(`🔍 Validating binary data arrays...`);
  
  if (!Array.isArray(data)) {
    console.error('❌ Data is not an array');
    return false;
  }

  let totalValidValues = 0;
  let totalArrays = 0;

  for (const array of data) {
    totalArrays++;
    if (array && typeof array.length === 'number' && array.length > 0) {
      // Check if it's a typed array
      if (array instanceof Float32Array || array instanceof Float64Array || array instanceof Int32Array) {
        totalValidValues += array.length;
        console.log(`✅ Valid ${array.constructor.name} with ${array.length} values`);
      } else {
        console.warn(`⚠️ Array ${totalArrays} is not a typed array`);
      }
    } else {
      console.warn(`⚠️ Array ${totalArrays} is empty or invalid`);
    }
  }

  console.log(`📊 Validation summary: ${totalValidValues} valid values from ${totalArrays} arrays`);
  return totalValidValues > 0;
};

export const debugBinaryParsing = (base64String: string, expectedType: string): void => {
  console.log(`🔬 Debug binary parsing for ${expectedType}:`);
  console.log(`   Base64 length: ${base64String.length}`);
  console.log(`   First 50 chars: ${base64String.substring(0, 50)}...`);
  console.log(`   Last 50 chars: ...${base64String.substring(base64String.length - 50)}`);
  
  // Check for valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  const isValidBase64 = base64Regex.test(base64String.replace(/\s/g, ''));
  console.log(`   Valid base64 format: ${isValidBase64}`);
  
  if (!isValidBase64) {
    console.error('❌ Invalid base64 characters detected');
  }
};
