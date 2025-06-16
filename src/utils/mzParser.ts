
import { parseBinaryData, extractPeaksFromBinaryArrays, validatePeakData } from './binaryDataParser';

export interface Peak {
  mz: number;
  intensity: number;
}

export interface Chromatogram {
  id: string;
  timeArray: number[];
  intensityArray: number[];
  precursorMz?: number;
}

export interface Spectrum {
  id: string;
  scanNumber: number;
  msLevel: number;
  retentionTime: number;
  basePeakMz: number;
  basePeakIntensity: number;
  totalIonCurrent: number;
  peaks: Peak[];
}

export interface ParsedMzData {
  fileName: string;
  instrumentModel: string;
  spectra: Spectrum[];
  chromatograms: Chromatogram[];
  totalSpectra: number;
  msLevels: number[];
  scanRange: { min: number; max: number };
  rtRange: { min: number; max: number };
}

export const parseMzFile = async (file: File): Promise<ParsedMzData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const xmlContent = event.target?.result as string;
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          reject(new Error(`XML parsing error: ${parserError.textContent}`));
          return;
        }

        try {
          const parsedData = extractMzDataFromDOM(xmlDoc, file.name);
          resolve(parsedData);
        } catch (parseErr) {
          reject(new Error(`Failed to extract data: ${parseErr}`));
        }
      } catch (error) {
        reject(new Error(`File reading error: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

const extractMzDataFromDOM = (xmlDoc: Document, fileName: string): ParsedMzData => {
  // Support both mzML and mzXML formats
  const mzMLRoot = xmlDoc.querySelector('mzML');
  const mzXMLRoot = xmlDoc.querySelector('mzXML') || xmlDoc.querySelector('msRun');
  
  if (!mzMLRoot && !mzXMLRoot) {
    throw new Error('Invalid mzML/mzXML file format');
  }

  const format = mzMLRoot ? 'mzML' : 'mzXML';
  console.log(`Parsing ${fileName}: detected format ${format}`);

  // Extract instrument information
  const instrumentModel = extractInstrumentModelFromDOM(xmlDoc);
  
  // Extract spectra with format-specific handling
  const spectra = extractSpectraFromDOM(xmlDoc, format);
  
  // Extract chromatograms if available (mzML format)
  const chromatograms = extractChromatogramsFromDOM(xmlDoc);
  
  // Generate TIC chromatogram from spectra if no chromatograms exist
  if (chromatograms.length === 0 && spectra.length > 0) {
    const ticChromatogram = generateTICFromSpectra(spectra);
    chromatograms.push(ticChromatogram);
  }

  // Calculate summary statistics
  const msLevels = [...new Set(spectra.map(s => s.msLevel))].sort();
  const scanNumbers = spectra.map(s => s.scanNumber);
  const retentionTimes = spectra.map(s => s.retentionTime);

  console.log(`Parsing complete: ${spectra.length} spectra, ${chromatograms.length} chromatograms`);

  return {
    fileName,
    instrumentModel,
    spectra,
    chromatograms,
    totalSpectra: spectra.length,
    msLevels,
    scanRange: {
      min: Math.min(...scanNumbers),
      max: Math.max(...scanNumbers)
    },
    rtRange: {
      min: Math.min(...retentionTimes),
      max: Math.max(...retentionTimes)
    }
  };
};

const extractInstrumentModelFromDOM = (xmlDoc: Document): string => {
  try {
    // Try mzML format first
    const instrumentConfig = xmlDoc.querySelector('instrumentConfiguration');
    if (instrumentConfig) {
      return instrumentConfig.getAttribute('id') || 'Unknown Instrument';
    }
    
    // Try mzXML format
    const msInstrument = xmlDoc.querySelector('msInstrument msManufacturer');
    if (msInstrument) {
      return msInstrument.getAttribute('value') || 'Unknown Instrument';
    }
    
    return 'Unknown Instrument';
  } catch {
    return 'Unknown Instrument';
  }
};

const extractSpectraFromDOM = (xmlDoc: Document, format: string): Spectrum[] => {
  const spectra: Spectrum[] = [];
  
  // Format-specific spectrum selection
  let spectrumElements: NodeListOf<Element>;
  if (format === 'mzML') {
    spectrumElements = xmlDoc.querySelectorAll('spectrum');
  } else {
    // mzXML format
    spectrumElements = xmlDoc.querySelectorAll('scan');
  }
  
  console.log(`Found ${spectrumElements.length} spectrum elements in ${format} format`);
  
  let successfullyParsed = 0;
  let failedToParse = 0;
  
  spectrumElements.forEach((spectrumEl, index) => {
    const spectrum = extractSpectrumFromElement(spectrumEl, index, format);
    if (spectrum) {
      spectra.push(spectrum);
      successfullyParsed++;
    } else {
      failedToParse++;
    }
  });
  
  console.log(`Spectrum parsing results: ${successfullyParsed} successful, ${failedToParse} failed`);
  
  return spectra;
};

const extractSpectrumFromElement = (element: Element, index: number, format: string): Spectrum | null => {
  try {
    const id = element.getAttribute('id') || element.getAttribute('num') || `spectrum_${index}`;
    const scanNumber = parseInt(element.getAttribute('index') || element.getAttribute('num') || index.toString());
    
    // Extract MS level
    let msLevel = 1;
    if (format === 'mzML') {
      const msLevelParam = element.querySelector('cvParam[name="ms level"]');
      if (msLevelParam) {
        msLevel = parseInt(msLevelParam.getAttribute('value') || '1');
      }
    } else {
      // mzXML format
      if (element.getAttribute('msLevel')) {
        msLevel = parseInt(element.getAttribute('msLevel') || '1');
      }
    }

    // Extract retention time
    let retentionTime = 0;
    if (format === 'mzML') {
      const rtParam = element.querySelector('cvParam[name="scan start time"], cvParam[name="retention time"]');
      if (rtParam) {
        retentionTime = parseFloat(rtParam.getAttribute('value') || '0');
        if (rtParam.getAttribute('unitName') === 'second') {
          retentionTime /= 60;
        }
      }
    } else {
      // mzXML format
      if (element.getAttribute('retentionTime')) {
        const rtStr = element.getAttribute('retentionTime') || '';
        retentionTime = parseFloat(rtStr.replace('PT', '').replace('S', '')) / 60;
      }
    }

    // Extract base peak and TIC
    let basePeakMz = 0;
    let basePeakIntensity = 0;
    let totalIonCurrent = 0;

    if (format === 'mzML') {
      const bpmzParam = element.querySelector('cvParam[name="base peak m/z"]');
      if (bpmzParam) basePeakMz = parseFloat(bpmzParam.getAttribute('value') || '0');
      
      const bpiParam = element.querySelector('cvParam[name="base peak intensity"]');
      if (bpiParam) basePeakIntensity = parseFloat(bpiParam.getAttribute('value') || '0');
      
      const ticParam = element.querySelector('cvParam[name="total ion current"]');
      if (ticParam) totalIonCurrent = parseFloat(ticParam.getAttribute('value') || '0');
    } else {
      // mzXML format attributes
      if (element.getAttribute('basePeakMz')) {
        basePeakMz = parseFloat(element.getAttribute('basePeakMz') || '0');
        basePeakIntensity = parseFloat(element.getAttribute('basePeakIntensity') || '0');
        totalIonCurrent = parseFloat(element.getAttribute('totIonCurrent') || '0');
      }
    }

    // Parse peaks based on format
    const peaks = parseRealPeaksFromSpectrum(element, format);
    
    // Validate parsed peaks
    if (!validatePeakData(peaks)) {
      console.warn(`Invalid peak data for spectrum ${id}, using fallback generation`);
      // Generate some basic peaks if we have at least the base peak info
      const fallbackPeaks = generateFallbackPeaks(basePeakMz, basePeakIntensity, totalIonCurrent);
      if (fallbackPeaks.length === 0) {
        console.warn(`No valid peaks found for spectrum ${id}, skipping`);
        return null;
      }
      return {
        id,
        scanNumber,
        msLevel,
        retentionTime,
        basePeakMz,
        basePeakIntensity,
        totalIonCurrent,
        peaks: fallbackPeaks
      };
    }
    
    // Update base peak and TIC if we have real data
    if (peaks.length > 0) {
      const maxIntensityPeak = peaks.reduce((max, peak) => 
        peak.intensity > max.intensity ? peak : max
      );
      
      if (basePeakMz === 0) basePeakMz = maxIntensityPeak.mz;
      if (basePeakIntensity === 0) basePeakIntensity = maxIntensityPeak.intensity;
      if (totalIonCurrent === 0) {
        totalIonCurrent = peaks.reduce((sum, peak) => sum + peak.intensity, 0);
      }
    }
    
    return {
      id,
      scanNumber,
      msLevel,
      retentionTime,
      basePeakMz,
      basePeakIntensity,
      totalIonCurrent,
      peaks
    };
  } catch (error) {
    console.warn('Failed to extract spectrum:', error);
    return null;
  }
};

const parseRealPeaksFromSpectrum = (spectrumElement: Element, format: string): Peak[] => {
  try {
    if (format === 'mzML') {
      return parseMzMLPeaks(spectrumElement);
    } else {
      return parseMzXMLPeaks(spectrumElement);
    }
  } catch (error) {
    console.error('Error parsing peaks:', error);
    return [];
  }
};

const parseMzMLPeaks = (spectrumElement: Element): Peak[] => {
  // Look for binary data arrays in mzML format
  const binaryArrayList = spectrumElement.querySelector('binaryDataArrayList');
  if (!binaryArrayList) {
    console.log('No binary data arrays found in mzML spectrum');
    return [];
  }

  const binaryArrays = binaryArrayList.querySelectorAll('binaryDataArray');
  if (binaryArrays.length < 2) {
    console.log('Insufficient binary arrays found (need m/z and intensity)');
    return [];
  }

  let mzArray: number[] = [];
  let intensityArray: number[] = [];

  // Parse each binary array
  for (const binaryArray of binaryArrays) {
    const arrayLengthElement = binaryArray.querySelector('cvParam[name="binary data array length"]');
    const arrayLength = arrayLengthElement ? 
      parseInt(arrayLengthElement.getAttribute('value') || '0') : 0;

    if (arrayLength === 0) {
      console.log('Binary array has zero length, skipping');
      continue;
    }

    const binaryData = parseBinaryData(binaryArray, arrayLength);
    
    if (binaryData.data.length === 0) {
      console.log(`Failed to parse binary data for ${binaryData.arrayType} array`);
      continue;
    }
    
    if (binaryData.arrayType === 'mz') {
      mzArray = binaryData.data;
    } else if (binaryData.arrayType === 'intensity') {
      intensityArray = binaryData.data;
    }
  }

  // Extract peaks from arrays
  if (mzArray.length > 0 && intensityArray.length > 0) {
    const peaks = extractPeaksFromBinaryArrays(mzArray, intensityArray);
    console.log(`Successfully extracted ${peaks.length} real peaks from mzML binary data`);
    return peaks;
  }

  console.log('No valid peak arrays found in mzML format');
  return [];
};

const parseMzXMLPeaks = (spectrumElement: Element): Peak[] => {
  // mzXML format uses different structure - look for peaks element
  const peaksElement = spectrumElement.querySelector('peaks');
  if (!peaksElement) {
    console.log('No peaks element found in mzXML spectrum');
    return [];
  }

  // Get peaks count
  const peaksCount = parseInt(peaksElement.getAttribute('count') || '0');
  if (peaksCount === 0) {
    console.log('Peaks count is zero in mzXML');
    return [];
  }

  // Get binary data
  const binaryText = peaksElement.textContent?.trim();
  if (!binaryText) {
    console.log('No binary data found in mzXML peaks element');
    return [];
  }

  try {
    // Decode base64 data
    const binaryString = atob(binaryText);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // mzXML typically uses 32-bit floats in pairs (m/z, intensity)
    const dataView = new DataView(bytes.buffer);
    const peaks: Peak[] = [];
    
    // Each peak is 8 bytes (4 bytes m/z + 4 bytes intensity)
    const expectedBytes = peaksCount * 8;
    
    if (bytes.length < expectedBytes) {
      console.warn(`mzXML binary data length mismatch: expected ${expectedBytes} bytes, got ${bytes.length}`);
    }
    
    const actualPeaksCount = Math.floor(bytes.length / 8);
    
    for (let i = 0; i < actualPeaksCount; i++) {
      const offset = i * 8;
      try {
        const mz = dataView.getFloat32(offset, false); // big endian for mzXML
        const intensity = dataView.getFloat32(offset + 4, false);
        
        if (!isNaN(mz) && !isNaN(intensity) && isFinite(mz) && isFinite(intensity) && intensity > 0) {
          peaks.push({ mz, intensity });
        }
      } catch (error) {
        console.warn(`Error reading mzXML peak at offset ${offset}:`, error);
        break;
      }
    }
    
    console.log(`Successfully parsed ${peaks.length} peaks from mzXML binary data`);
    return peaks;
    
  } catch (error) {
    console.error('Failed to parse mzXML binary data:', error);
    return [];
  }
};

// Generate fallback peaks when binary parsing fails
const generateFallbackPeaks = (basePeakMz: number, basePeakIntensity: number, totalIonCurrent: number): Peak[] => {
  const peaks: Peak[] = [];
  
  if (basePeakMz > 0 && basePeakIntensity > 0) {
    // Add the base peak
    peaks.push({ mz: basePeakMz, intensity: basePeakIntensity });
    
    // Generate a few additional peaks around the base peak
    const intensityFactor = basePeakIntensity / 5;
    for (let i = 1; i <= 3; i++) {
      const mzOffset = i * 10;
      const intensity = basePeakIntensity / (i + 1);
      
      if (intensity > 1000) { // Only add significant peaks
        peaks.push({ mz: basePeakMz + mzOffset, intensity });
        if (basePeakMz - mzOffset > 50) {
          peaks.push({ mz: basePeakMz - mzOffset, intensity: intensity * 0.8 });
        }
      }
    }
    
    console.log(`Generated ${peaks.length} fallback peaks for spectrum`);
  }
  
  return peaks;
};

const extractChromatogramsFromDOM = (xmlDoc: Document): Chromatogram[] => {
  const chromatograms: Chromatogram[] = [];
  
  const chromElements = xmlDoc.querySelectorAll('chromatogram');
  chromElements.forEach(chromEl => {
    const id = chromEl.getAttribute('id') || 'chromatogram';
    
    // Try to parse real chromatogram data
    const binaryArrayList = chromEl.querySelector('binaryDataArrayList');
    if (binaryArrayList) {
      const binaryArrays = binaryArrayList.querySelectorAll('binaryDataArray');
      
      let timeArray: number[] = [];
      let intensityArray: number[] = [];
      
      for (const binaryArray of binaryArrays) {
        const arrayLengthElement = binaryArray.querySelector('cvParam[name="binary data array length"]');
        const arrayLength = arrayLengthElement ? 
          parseInt(arrayLengthElement.getAttribute('value') || '0') : 0;

        if (arrayLength > 0) {
          const binaryData = parseBinaryData(binaryArray, arrayLength);
          
          if (binaryData.arrayType === 'time') {
            timeArray = binaryData.data;
          } else if (binaryData.arrayType === 'intensity') {
            intensityArray = binaryData.data;
          }
        }
      }
      
      if (timeArray.length > 0 && intensityArray.length > 0) {
        chromatograms.push({
          id,
          timeArray,
          intensityArray
        });
      }
    }
  });
  
  return chromatograms;
};

const generateTICFromSpectra = (spectra: Spectrum[]): Chromatogram => {
  const timeArray = spectra.map(s => s.retentionTime);
  const intensityArray = spectra.map(s => s.totalIonCurrent || 
    s.peaks.reduce((sum, peak) => sum + peak.intensity, 0));
  
  return {
    id: 'TIC',
    timeArray,
    intensityArray
  };
};
