
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
        
        // Use DOMParser instead of xml2js to avoid removeAllListeners error
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check for parsing errors
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

  console.log(`Parsing ${fileName}: detected format ${mzMLRoot ? 'mzML' : 'mzXML'}`);

  // Extract instrument information
  const instrumentModel = extractInstrumentModelFromDOM(xmlDoc);
  
  // Extract spectra
  const spectra = extractSpectraFromDOM(xmlDoc);
  
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

const extractSpectraFromDOM = (xmlDoc: Document): Spectrum[] => {
  const spectra: Spectrum[] = [];
  
  // Try mzML format first
  let spectrumElements = xmlDoc.querySelectorAll('spectrum');
  
  // If no spectra found, try mzXML format
  if (spectrumElements.length === 0) {
    spectrumElements = xmlDoc.querySelectorAll('scan');
  }
  
  console.log(`Found ${spectrumElements.length} spectrum elements`);
  
  let successfullyParsed = 0;
  let failedToParse = 0;
  
  spectrumElements.forEach((spectrumEl, index) => {
    const spectrum = extractSpectrumFromElement(spectrumEl, index);
    if (spectrum) {
      spectra.push(spectrum);
      successfullyParsed++;
    } else {
      failedToParse++;
    }
  });
  
  console.log(`Spectrum parsing results: ${successfullyParsed} successful, ${failedToParse} failed`);
  
  // Only fall back to mock data if absolutely no real spectra were found
  if (spectra.length === 0 && spectrumElements.length > 0) {
    console.warn('Failed to parse any real spectra, this may indicate binary data parsing issues');
  }
  
  return spectra;
};

const extractSpectrumFromElement = (element: Element, index: number): Spectrum | null => {
  try {
    const id = element.getAttribute('id') || element.getAttribute('num') || `spectrum_${index}`;
    const scanNumber = parseInt(element.getAttribute('index') || element.getAttribute('num') || index.toString());
    
    // Extract MS level
    let msLevel = 1;
    const msLevelParam = element.querySelector('cvParam[name="ms level"]');
    if (msLevelParam) {
      msLevel = parseInt(msLevelParam.getAttribute('value') || '1');
    } else if (element.getAttribute('msLevel')) {
      msLevel = parseInt(element.getAttribute('msLevel') || '1');
    }

    // Extract retention time
    let retentionTime = 0;
    const rtParam = element.querySelector('cvParam[name="scan start time"], cvParam[name="retention time"]');
    if (rtParam) {
      retentionTime = parseFloat(rtParam.getAttribute('value') || '0');
      if (rtParam.getAttribute('unitName') === 'second') {
        retentionTime /= 60;
      }
    } else if (element.getAttribute('retentionTime')) {
      const rtStr = element.getAttribute('retentionTime') || '';
      retentionTime = parseFloat(rtStr.replace('PT', '').replace('S', '')) / 60;
    }

    // Extract base peak and TIC
    let basePeakMz = 0;
    let basePeakIntensity = 0;
    let totalIonCurrent = 0;

    const bpmzParam = element.querySelector('cvParam[name="base peak m/z"]');
    if (bpmzParam) basePeakMz = parseFloat(bpmzParam.getAttribute('value') || '0');
    
    const bpiParam = element.querySelector('cvParam[name="base peak intensity"]');
    if (bpiParam) basePeakIntensity = parseFloat(bpiParam.getAttribute('value') || '0');
    
    const ticParam = element.querySelector('cvParam[name="total ion current"]');
    if (ticParam) totalIonCurrent = parseFloat(ticParam.getAttribute('value') || '0');

    // mzXML format attributes
    if (element.getAttribute('basePeakMz')) {
      basePeakMz = parseFloat(element.getAttribute('basePeakMz') || '0');
      basePeakIntensity = parseFloat(element.getAttribute('basePeakIntensity') || '0');
      totalIonCurrent = parseFloat(element.getAttribute('totIonCurrent') || '0');
    }

    // Parse binary data arrays for real peaks
    const peaks = parseRealPeaksFromSpectrum(element);
    
    // Validate parsed peaks
    if (!validatePeakData(peaks)) {
      console.warn(`Invalid peak data for spectrum ${id}, skipping`);
      return null;
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
    } else {
      // If no valid peaks were extracted, skip this spectrum
      console.warn(`No valid peaks found in spectrum ${id}`);
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
      peaks
    };
  } catch (error) {
    console.warn('Failed to extract spectrum:', error);
    return null;
  }
};

const parseRealPeaksFromSpectrum = (spectrumElement: Element): Peak[] => {
  try {
    // Look for binary data arrays in mzML format
    const binaryArrayList = spectrumElement.querySelector('binaryDataArrayList');
    if (!binaryArrayList) {
      console.log('No binary data arrays found in spectrum');
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
      console.log(`Successfully extracted ${peaks.length} real peaks from binary data`);
      return peaks;
    }

    console.log('No valid peak arrays found');
    return [];
  } catch (error) {
    console.error('Error parsing real peaks:', error);
    return [];
  }
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
