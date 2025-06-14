
import { parseString } from 'xml2js';

export interface Spectrum {
  id: string;
  scanNumber: number;
  msLevel: number;
  retentionTime: number;
  basePeakMz: number;
  basePeakIntensity: number;
  totalIonCurrent: number;
  peaks: Array<{ mz: number; intensity: number }>;
}

export interface ParsedMzData {
  fileName: string;
  instrumentModel: string;
  spectra: Spectrum[];
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
        
        parseString(xmlContent, { explicitArray: false }, (err, result) => {
          if (err) {
            reject(new Error(`Failed to parse XML: ${err.message}`));
            return;
          }

          try {
            const parsedData = extractMzData(result, file.name);
            resolve(parsedData);
          } catch (parseErr) {
            reject(new Error(`Failed to extract data: ${parseErr}`));
          }
        });
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

const extractMzData = (xmlData: any, fileName: string): ParsedMzData => {
  let mzML = xmlData.mzML || xmlData.mzXML;
  
  if (!mzML) {
    throw new Error('Invalid mzML/mzXML file format');
  }

  // Extract instrument information
  const instrumentModel = extractInstrumentModel(mzML);
  
  // Extract spectra
  const spectraList = mzML.run?.spectrumList?.spectrum || mzML.msRun?.scan || [];
  const spectraArray = Array.isArray(spectraList) ? spectraList : [spectraList];
  
  const spectra: Spectrum[] = spectraArray.map((spectrum: any, index: number) => {
    return extractSpectrum(spectrum, index);
  });

  // Calculate summary statistics
  const msLevels = [...new Set(spectra.map(s => s.msLevel))].sort();
  const scanNumbers = spectra.map(s => s.scanNumber);
  const retentionTimes = spectra.map(s => s.retentionTime);

  return {
    fileName,
    instrumentModel,
    spectra,
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

const extractInstrumentModel = (mzML: any): string => {
  try {
    const instrumentConfig = mzML.instrumentConfigurationList?.instrumentConfiguration;
    if (instrumentConfig) {
      const config = Array.isArray(instrumentConfig) ? instrumentConfig[0] : instrumentConfig;
      return config.$.id || 'Unknown Instrument';
    }
    return 'Unknown Instrument';
  } catch {
    return 'Unknown Instrument';
  }
};

const extractSpectrum = (spectrum: any, index: number): Spectrum => {
  const id = spectrum.$.id || spectrum.$.num || `spectrum_${index}`;
  const scanNumber = parseInt(spectrum.$.index || spectrum.$.num || index.toString());
  
  // Extract MS level
  let msLevel = 1;
  if (spectrum.cvParam) {
    const cvParams = Array.isArray(spectrum.cvParam) ? spectrum.cvParam : [spectrum.cvParam];
    const msLevelParam = cvParams.find((param: any) => param.$.name === 'ms level');
    if (msLevelParam) {
      msLevel = parseInt(msLevelParam.$.value);
    }
  }

  // Extract retention time
  let retentionTime = 0;
  if (spectrum.scanList?.scan?.cvParam) {
    const scanCvParams = Array.isArray(spectrum.scanList.scan.cvParam) 
      ? spectrum.scanList.scan.cvParam 
      : [spectrum.scanList.scan.cvParam];
    const rtParam = scanCvParams.find((param: any) => 
      param.$.name === 'scan start time' || param.$.name === 'retention time'
    );
    if (rtParam) {
      retentionTime = parseFloat(rtParam.$.value);
      // Convert to minutes if in seconds
      if (rtParam.$.unitName === 'second') {
        retentionTime /= 60;
      }
    }
  }

  // Extract base peak and TIC
  let basePeakMz = 0;
  let basePeakIntensity = 0;
  let totalIonCurrent = 0;

  if (spectrum.cvParam) {
    const cvParams = Array.isArray(spectrum.cvParam) ? spectrum.cvParam : [spectrum.cvParam];
    
    const bpmzParam = cvParams.find((param: any) => param.$.name === 'base peak m/z');
    if (bpmzParam) basePeakMz = parseFloat(bpmzParam.$.value);
    
    const bpiParam = cvParams.find((param: any) => param.$.name === 'base peak intensity');
    if (bpiParam) basePeakIntensity = parseFloat(bpiParam.$.value);
    
    const ticParam = cvParams.find((param: any) => param.$.name === 'total ion current');
    if (ticParam) totalIonCurrent = parseFloat(ticParam.$.value);
  }

  // Extract peaks (simplified - in real implementation would decode base64)
  const peaks: Array<{ mz: number; intensity: number }> = [];
  
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
};
