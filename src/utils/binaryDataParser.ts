
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

      // Enhanced base64 cleaning - remove all whitespace and validate
      const cleanedData = base64Data.replace(/\s/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Validate base64 format more thoroughly
      if (cleanedData.length === 0) {
        console.warn('⚠️ Empty base64 data after cleaning');
        return new Float32Array();
      }
      
      if (cleanedData.length % 4 !== 0) {
        console.warn(`⚠️ Invalid base64 length: ${cleanedData.length} (should be divisible by 4)`);
        // Pad with = characters if needed
        const paddedData = cleanedData + '='.repeat(4 - (cleanedData.length % 4));
        console.log(`🔧 Padded base64 data to length: ${paddedData.length}`);
      }
      
      // Decode base64 with enhanced error handling
      let binaryString: string;
      try {
        binaryString = atob(cleanedData);
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        // Try with padding
        const paddedData = cleanedData + '='.repeat(4 - (cleanedData.length % 4));
        try {
          binaryString = atob(paddedData);
          console.log('✅ Base64 decode succeeded with padding');
        } catch (paddedError) {
          console.error('❌ Base64 decode failed even with padding:', paddedError);
          return new Float32Array();
        }
      }

      console.log(`📊 Decoded binary string length: ${binaryString.length} bytes`);

      // Enhanced compression handling (placeholder for future implementation)
      let finalBinaryString = binaryString;
      if (compression && compression.toLowerCase() === 'zlib') {
        console.log('⚠️ zlib compression detected but not implemented, using raw data');
        // Note: Real zlib decompression would require additional libraries like pako
      }

      // Validate binary string length for Float32Array (should be multiple of 4)
      if (finalBinaryString.length % 4 !== 0) {
        console.warn(`⚠️ Binary data length ${finalBinaryString.length} not divisible by 4 for Float32Array`);
        // Truncate to nearest multiple of 4
        const truncatedLength = Math.floor(finalBinaryString.length / 4) * 4;
        finalBinaryString = finalBinaryString.substring(0, truncatedLength);
        console.log(`🔧 Truncated binary data to length: ${truncatedLength}`);
      }

      // Convert to array buffer with byte order consideration
      const arrayBuffer = new ArrayBuffer(finalBinaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < finalBinaryString.length; i++) {
        uint8Array[i] = finalBinaryString.charCodeAt(i) & 0xFF; // Ensure byte range
      }

      // Create Float32Array and validate values
      const float32Array = new Float32Array(arrayBuffer);
      
      // Count valid vs invalid values
      let validValues = 0;
      let invalidValues = 0;
      for (let i = 0; i < float32Array.length; i++) {
        const value = float32Array[i];
        if (isFinite(value) && !isNaN(value)) {
          validValues++;
        } else {
          invalidValues++;
        }
      }
      
      console.log(`✅ Parsed ${float32Array.length} float32 values (${validValues} valid, ${invalidValues} invalid)`);
      
      if (validValues > 0) {
        const validValuesArray = Array.from(float32Array).filter(v => isFinite(v) && !isNaN(v));
        console.log(`📈 Value range: ${Math.min(...validValuesArray).toFixed(4)} - ${Math.max(...validValuesArray).toFixed(4)}`);
        
        // Log some sample values for debugging
        const sampleValues = validValuesArray.slice(0, 10);
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

      // Enhanced base64 cleaning and validation
      const cleanedData = base64Data.replace(/\s/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
      
      if (cleanedData.length === 0) {
        console.warn('⚠️ Empty base64 data after cleaning');
        return new Float64Array();
      }

      // Decode base64 with error handling
      let binaryString: string;
      try {
        binaryString = atob(cleanedData);
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        const paddedData = cleanedData + '='.repeat(4 - (cleanedData.length % 4));
        try {
          binaryString = atob(paddedData);
        } catch (paddedError) {
          console.error('❌ Base64 decode failed even with padding:', paddedError);
          return new Float64Array();
        }
      }

      console.log(`📊 Decoded binary string length: ${binaryString.length} bytes`);

      // Handle compression
      let finalBinaryString = binaryString;
      if (compression && compression.toLowerCase() === 'zlib') {
        console.log('⚠️ zlib compression detected but not implemented, using raw data');
      }

      // Validate for Float64Array (should be multiple of 8)
      if (finalBinaryString.length % 8 !== 0) {
        console.warn(`⚠️ Binary data length ${finalBinaryString.length} not divisible by 8 for Float64Array`);
        const truncatedLength = Math.floor(finalBinaryString.length / 8) * 8;
        finalBinaryString = finalBinaryString.substring(0, truncatedLength);
        console.log(`🔧 Truncated binary data to length: ${truncatedLength}`);
      }

      // Convert to array buffer
      const arrayBuffer = new ArrayBuffer(finalBinaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < finalBinaryString.length; i++) {
        uint8Array[i] = finalBinaryString.charCodeAt(i) & 0xFF;
      }

      const float64Array = new Float64Array(arrayBuffer);
      
      // Validate values
      let validValues = 0;
      for (let i = 0; i < float64Array.length; i++) {
        if (isFinite(float64Array[i]) && !isNaN(float64Array[i])) {
          validValues++;
        }
      }
      
      console.log(`✅ Parsed ${float64Array.length} float64 values (${validValues} valid)`);
      
      if (validValues > 0) {
        const validValuesArray = Array.from(float64Array).filter(v => isFinite(v) && !isNaN(v));
        console.log(`📈 Value range: ${Math.min(...validValuesArray).toFixed(4)} - ${Math.max(...validValuesArray).toFixed(4)}`);
        
        const sampleValues = validValuesArray.slice(0, 10);
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

      // Enhanced cleaning and validation
      const cleanedData = base64Data.replace(/\s/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
      
      if (cleanedData.length === 0) {
        console.warn('⚠️ Empty base64 data after cleaning');
        return new Int32Array();
      }

      // Decode base64
      let binaryString: string;
      try {
        binaryString = atob(cleanedData);
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        const paddedData = cleanedData + '='.repeat(4 - (cleanedData.length % 4));
        try {
          binaryString = atob(paddedData);
        } catch (paddedError) {
          return new Int32Array();
        }
      }

      console.log(`📊 Decoded binary string length: ${binaryString.length} bytes`);

      // Handle compression
      let finalBinaryString = binaryString;
      if (compression && compression.toLowerCase() === 'zlib') {
        console.log('⚠️ zlib compression detected but not implemented, using raw data');
      }

      // Validate for Int32Array (should be multiple of 4)
      if (finalBinaryString.length % 4 !== 0) {
        console.warn(`⚠️ Binary data length ${finalBinaryString.length} not divisible by 4 for Int32Array`);
        const truncatedLength = Math.floor(finalBinaryString.length / 4) * 4;
        finalBinaryString = finalBinaryString.substring(0, truncatedLength);
      }

      // Convert to array buffer
      const arrayBuffer = new ArrayBuffer(finalBinaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < finalBinaryString.length; i++) {
        uint8Array[i] = finalBinaryString.charCodeAt(i) & 0xFF;
      }

      const int32Array = new Int32Array(arrayBuffer);
      
      console.log(`✅ Parsed ${int32Array.length} int32 values`);
      
      if (int32Array.length > 0) {
        console.log(`📈 Value range: ${Math.min(...int32Array)} - ${Math.max(...int32Array)}`);
        
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
