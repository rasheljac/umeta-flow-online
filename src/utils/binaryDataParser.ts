
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
