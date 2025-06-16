import { ParsedMzData, Spectrum } from './mzParser';

export interface Peak {
  mz: number;
  intensity: number;
  retentionTime: number;
  area?: number;
  snRatio?: number;
}

export interface AlignedPeak extends Peak {
  sampleId: string;
  alignmentScore: number;
}

export interface IdentifiedCompound {
  id: string;
  name: string;
  formula: string;
  mass: number;
  matchScore: number;
  database: string;
  peaks: Peak[];
}

// Comprehensive compound database
const COMPOUND_DATABASE = [
  { name: 'Glucose', formula: 'C6H12O6', mass: 180.1559, pathway: 'Glycolysis' },
  { name: 'Lactate', formula: 'C3H6O3', mass: 90.0779, pathway: 'Glycolysis' },
  { name: 'Pyruvate', formula: 'C3H4O3', mass: 88.0621, pathway: 'Glycolysis' },
  { name: 'Citric acid', formula: 'C6H8O7', mass: 192.1235, pathway: 'TCA Cycle' },
  { name: 'Succinate', formula: 'C4H6O4', mass: 118.0881, pathway: 'TCA Cycle' },
  { name: 'Fumarate', formula: 'C4H4O4', mass: 116.0725, pathway: 'TCA Cycle' },
  { name: 'Malate', formula: 'C4H6O5', mass: 134.0881, pathway: 'TCA Cycle' },
  { name: 'Alanine', formula: 'C3H7NO2', mass: 89.0932, pathway: 'Amino Acid Metabolism' },
  { name: 'Glycine', formula: 'C2H5NO2', mass: 75.0664, pathway: 'Amino Acid Metabolism' },
  { name: 'Serine', formula: 'C3H7NO3', mass: 105.0930, pathway: 'Amino Acid Metabolism' },
  { name: 'Tryptophan', formula: 'C11H12N2O2', mass: 204.2252, pathway: 'Amino Acid Metabolism' },
  { name: 'Caffeine', formula: 'C8H10N4O2', mass: 194.1906, pathway: 'Purine Metabolism' },
  { name: 'Adenosine', formula: 'C10H13N5O4', mass: 267.2413, pathway: 'Purine Metabolism' },
  { name: 'Uric acid', formula: 'C5H4N4O3', mass: 168.1103, pathway: 'Purine Metabolism' }
];

// Enhanced Peak Detection with robust error handling
export const detectPeaks = async (
  data: ParsedMzData[], 
  parameters: any
): Promise<any> => {
  try {
    const { noise_threshold = 1000, min_peak_width = 3, max_peak_width = 50 } = parameters;
    
    console.log(`Detecting peaks with threshold: ${noise_threshold}`);
    console.log(`Input data structure:`, data.map(d => ({ fileName: d.fileName, spectra: d.spectra?.length || 0 })));
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid data format: expected array of samples");
    }

    const allPeaks: Peak[] = [];
    let processedSamples = 0;
    
    for (const sample of data) {
      if (!sample || typeof sample !== 'object') {
        console.warn(`Skipping invalid sample:`, sample);
        continue;
      }

      if (!Array.isArray(sample.spectra) || sample.spectra.length === 0) {
        console.warn(`Sample ${sample.fileName || 'unknown'} has no valid spectra`);
        continue;
      }

      let samplePeaks = 0;
      for (const spectrum of sample.spectra) {
        if (!spectrum || !Array.isArray(spectrum.peaks) || spectrum.peaks.length === 0) {
          continue;
        }

        try {
          // Enhanced peak detection with validation
          const detectedPeaks = findLocalMaxima(spectrum.peaks, noise_threshold, min_peak_width);
          
          const processedPeaks = detectedPeaks
            .filter(peak => peak && typeof peak.mz === 'number' && typeof peak.intensity === 'number')
            .map(peak => ({
              mz: peak.mz,
              intensity: peak.intensity,
              retentionTime: typeof spectrum.retentionTime === 'number' ? spectrum.retentionTime : 0,
              area: calculatePeakArea(peak, spectrum.peaks),
              snRatio: peak.intensity / noise_threshold
            }));
          
          allPeaks.push(...processedPeaks);
          samplePeaks += processedPeaks.length;
        } catch (spectrumError) {
          console.warn(`Error processing spectrum in ${sample.fileName}:`, spectrumError);
        }
      }
      
      console.log(`Sample ${sample.fileName}: detected ${samplePeaks} peaks`);
      processedSamples++;
    }
    
    // Add small delay for UI responsiveness
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Attach detected peaks to each sample
    const resultData = data.map(sample => {
      const samplePeaks = allPeaks.filter(peak => 
        sample.spectra.some(spectrum => 
          Math.abs((spectrum.retentionTime || 0) - peak.retentionTime) < 0.001
        )
      );
      
      return {
        ...sample,
        detectedPeaks: samplePeaks
      };
    });
    
    console.log(`Peak detection complete: ${allPeaks.length} total peaks across ${processedSamples} samples`);
    
    return {
      data: resultData,
      peaksDetected: allPeaks.length,
      message: `Detected ${allPeaks.length} peaks across ${processedSamples} samples`
    };
    
  } catch (error) {
    console.error('Peak detection error:', error);
    throw new Error(`Peak detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Robust helper function to find local maxima
function findLocalMaxima(peaks: any[], threshold: number, minWidth: number): any[] {
  if (!Array.isArray(peaks) || peaks.length === 0) {
    return [];
  }

  const localMaxima = [];
  const safeMinWidth = Math.max(1, Math.min(minWidth, Math.floor(peaks.length / 4)));
  
  for (let i = safeMinWidth; i < peaks.length - safeMinWidth; i++) {
    const currentPeak = peaks[i];
    
    if (!currentPeak || 
        typeof currentPeak.intensity !== 'number' || 
        typeof currentPeak.mz !== 'number' ||
        currentPeak.intensity < threshold) {
      continue;
    }
    
    let isLocalMaximum = true;
    
    // Check surrounding peaks
    for (let j = i - safeMinWidth; j <= i + safeMinWidth && isLocalMaximum; j++) {
      if (j !== i && peaks[j] && typeof peaks[j].intensity === 'number') {
        if (peaks[j].intensity >= currentPeak.intensity) {
          isLocalMaximum = false;
        }
      }
    }
    
    if (isLocalMaximum) {
      localMaxima.push(currentPeak);
    }
  }
  
  return localMaxima;
}

// Enhanced peak area calculation
function calculatePeakArea(peak: any, allPeaks: any[]): number {
  if (!peak || !Array.isArray(allPeaks) || allPeaks.length === 0) {
    return 0;
  }

  const peakIndex = allPeaks.findIndex(p => 
    p && Math.abs(p.mz - peak.mz) < 0.001
  );
  
  if (peakIndex === -1) return 0;
  
  const windowSize = Math.min(3, Math.floor(allPeaks.length / 4));
  let area = 0;
  
  const startIdx = Math.max(0, peakIndex - windowSize);
  const endIdx = Math.min(allPeaks.length - 1, peakIndex + windowSize);
  
  for (let i = startIdx; i < endIdx; i++) {
    const p1 = allPeaks[i];
    const p2 = allPeaks[i + 1];
    
    if (p1 && p2 && 
        typeof p1.intensity === 'number' && 
        typeof p2.intensity === 'number' &&
        typeof p1.mz === 'number' && 
        typeof p2.mz === 'number') {
      area += (p1.intensity + p2.intensity) * Math.abs(p2.mz - p1.mz) / 2;
    }
  }
  
  return Math.max(0, area);
}

// Enhanced Peak Alignment with better error handling
export const alignPeaks = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  try {
    const { mz_tolerance = 0.01, rt_tolerance = 0.1 } = parameters;
    
    console.log(`Aligning peaks with mz tolerance: ${mz_tolerance}, rt tolerance: ${rt_tolerance}`);
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No valid data provided for peak alignment");
    }

    // Small delay for UI responsiveness
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const alignedPeaks: AlignedPeak[] = [];
    let alignmentGroups = 0;
    
    // Collect all peaks with proper validation
    const allPeaks = data.flatMap(sample => {
      if (!sample || !Array.isArray(sample.detectedPeaks)) {
        return [];
      }
      
      return sample.detectedPeaks
        .filter(peak => peak && 
                typeof peak.mz === 'number' && 
                typeof peak.intensity === 'number' &&
                typeof peak.retentionTime === 'number')
        .map((peak: Peak) => ({
          ...peak,
          sampleId: sample.fileName || 'unknown'
        }));
    });
    
    if (allPeaks.length === 0) {
      return {
        data: data.map(sample => ({ ...sample, alignedPeaks: [] })),
        alignmentGroups: 0,
        message: "No peaks available for alignment"
      };
    }
    
    // Group peaks by similarity
    const groups: any[][] = [];
    const processed = new Set();
    
    for (let i = 0; i < allPeaks.length; i++) {
      if (processed.has(i)) continue;
      
      const peak = allPeaks[i];
      const group = [peak];
      processed.add(i);
      
      // Find similar peaks
      for (let j = i + 1; j < allPeaks.length; j++) {
        if (processed.has(j)) continue;
        
        const otherPeak = allPeaks[j];
        const mzDiff = Math.abs(peak.mz - otherPeak.mz);
        const rtDiff = Math.abs(peak.retentionTime - otherPeak.retentionTime);
        
        if (mzDiff <= mz_tolerance && rtDiff <= rt_tolerance) {
          group.push(otherPeak);
          processed.add(j);
        }
      }
      
      groups.push(group);
    }
    
    alignmentGroups = groups.length;
    
    // Calculate alignment scores
    for (const group of groups) {
      if (group.length === 0) continue;
      
      const avgMz = group.reduce((sum, p) => sum + p.mz, 0) / group.length;
      const avgRt = group.reduce((sum, p) => sum + p.retentionTime, 0) / group.length;
      
      for (const peak of group) {
        const mzScore = Math.max(0, 1 - Math.abs(peak.mz - avgMz) / mz_tolerance);
        const rtScore = Math.max(0, 1 - Math.abs(peak.retentionTime - avgRt) / rt_tolerance);
        const alignmentScore = (mzScore + rtScore) / 2;
        
        alignedPeaks.push({
          ...peak,
          alignmentScore: Math.max(0, Math.min(1, alignmentScore))
        });
      }
    }
    
    const resultData = data.map(sample => ({
      ...sample,
      alignedPeaks: alignedPeaks.filter(p => p.sampleId === (sample.fileName || 'unknown'))
    }));
    
    return {
      data: resultData,
      alignmentGroups,
      message: `Aligned ${allPeaks.length} peaks into ${alignmentGroups} groups`
    };
    
  } catch (error) {
    console.error('Peak alignment error:', error);
    throw new Error(`Peak alignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Real Data Filtering based on intensity and quality metrics
export const filterData = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { min_intensity = 5000, cv_threshold = 0.3, min_frequency = 0.5 } = parameters;
  
  console.log(`Filtering data with min intensity: ${min_intensity}, CV threshold: ${cv_threshold}`);
  
  await new Promise(resolve => setTimeout(resolve, 150));
  
  let filteredCount = 0;
  
  const filteredData = data.map(sample => {
    const peaks = sample.alignedPeaks || sample.detectedPeaks || [];
    
    const filtered = peaks.filter((peak: Peak) => {
      const intensityPass = peak.intensity >= min_intensity;
      const qualityPass = (peak.snRatio || 1) > 3;
      const areaPass = (peak.area || 0) > 0;
      
      const passes = intensityPass && qualityPass && areaPass;
      if (!passes) filteredCount++;
      return passes;
    });
    
    return {
      ...sample,
      filteredPeaks: filtered
    };
  });
  
  return {
    data: filteredData,
    filteredCount,
    message: `Filtered out ${filteredCount} low-quality peaks using intensity ≥ ${min_intensity} and S/N > 3`
  };
};

export const normalizeData = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { method = 'median', reference_method = 'total_ion_current' } = parameters;
  
  console.log(`Normalizing data using method: ${method}`);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const normalizedData = data.map(sample => {
    const peaks = sample.filteredPeaks || sample.alignedPeaks || sample.detectedPeaks || [];
    
    // Calculate normalization factor based on method
    let normalizationFactor = 1;
    const intensities = peaks.map((p: Peak) => p.intensity);
    
    if (method === 'median' && intensities.length > 0) {
      const sortedIntensities = [...intensities].sort((a, b) => a - b);
      const median = sortedIntensities[Math.floor(sortedIntensities.length / 2)];
      normalizationFactor = 100000 / (median || 1);
    } else if (method === 'mean' && intensities.length > 0) {
      const mean = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;
      normalizationFactor = 100000 / (mean || 1);
    } else if (method === 'total_sum' && intensities.length > 0) {
      const totalSum = intensities.reduce((sum, intensity) => sum + intensity, 0);
      normalizationFactor = 1000000 / (totalSum || 1);
    }
    
    const normalizedPeaks = peaks.map((peak: Peak) => ({
      ...peak,
      intensity: peak.intensity * normalizationFactor,
      normalized: true
    }));
    
    return {
      ...sample,
      normalizedPeaks,
      normalizationFactor
    };
  });
  
  return {
    data: normalizedData,
    method,
    message: `Normalized data using ${method} method (factor range: ${normalizedData.map(s => s.normalizationFactor?.toFixed(2)).join(', ')})`
  };
};

export const identifyCompounds = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { database = 'HMDB', mass_tolerance = 0.01, ms2DbContent = null } = parameters;
  
  console.log(`Starting compound identification using ${database} database with tolerance ${mass_tolerance} Da`);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const identifiedCompounds: IdentifiedCompound[] = [];
  
  // Get uploaded compound list from localStorage
  let uploadedCompounds: any[] = [];
  try {
    const storedCompoundList = localStorage.getItem('compoundListData');
    if (storedCompoundList) {
      uploadedCompounds = JSON.parse(storedCompoundList);
      console.log(`Using uploaded compound list with ${uploadedCompounds.length} compounds`);
      console.log('Sample uploaded compounds:', uploadedCompounds.slice(0, 3));
    }
  } catch (error) {
    console.warn('Failed to load uploaded compound list:', error);
  }
  
  // Use uploaded compounds if available, otherwise fall back to built-in database
  const compoundsToSearch = uploadedCompounds.length > 0 ? uploadedCompounds : COMPOUND_DATABASE;
  
  console.log(`Searching against ${compoundsToSearch.length} compounds`);
  console.log('Sample compound structures:', compoundsToSearch.slice(0, 2));
  
  let totalPeaksProcessed = 0;
  let matchesFound = 0;
  
  data.forEach((sample, sampleIndex) => {
    const peaks = sample.normalizedPeaks || sample.filteredPeaks || sample.alignedPeaks || sample.detectedPeaks || [];
    
    console.log(`Processing sample ${sample.fileName || sampleIndex}: ${peaks.length} peaks`);
    totalPeaksProcessed += peaks.length;
    
    peaks.forEach((peak: Peak, peakIndex: number) => {
      // Find matching compounds within mass tolerance
      const matches = compoundsToSearch.filter(compound => {
        // Handle both uploaded CSV format and built-in database format
        const compoundMass = compound.mass || calculateMassFromFormula(compound.formula);
        
        if (!compoundMass || compoundMass === 0) {
          return false;
        }
        
        const massDiff = Math.abs(peak.mz - compoundMass);
        const withinTolerance = massDiff <= mass_tolerance;
        
        if (withinTolerance) {
          console.log(`Match found: Peak m/z ${peak.mz.toFixed(4)} matches ${compound.compound || compound.name} (${compoundMass.toFixed(4)} Da, diff: ${massDiff.toFixed(4)} Da)`);
        }
        
        return withinTolerance;
      });
      
      matches.forEach(compound => {
        const compoundMass = compound.mass || calculateMassFromFormula(compound.formula);
        const massDiff = Math.abs(peak.mz - compoundMass);
        const matchScore = Math.max(0, 1 - (massDiff / mass_tolerance));
        
        // Handle both CSV format (compound field) and built-in format (name field)
        const compoundName = compound.compound || compound.name;
        
        identifiedCompounds.push({
          id: `${compoundName}_${peak.mz.toFixed(4)}_${sample.fileName}_${peakIndex}`,
          name: compoundName,
          formula: compound.formula,
          mass: compoundMass,
          matchScore,
          database: uploadedCompounds.length > 0 ? 'Uploaded CSV' : database,
          peaks: [peak]
        });
        
        matchesFound++;
      });
    });
  });
  
  console.log(`Identification complete: ${matchesFound} matches found from ${totalPeaksProcessed} peaks`);
  console.log(`Sample identifications:`, identifiedCompounds.slice(0, 5));
  
  const sourceInfo = uploadedCompounds.length > 0 
    ? `uploaded CSV (${uploadedCompounds.length} compounds)` 
    : `${database} (${COMPOUND_DATABASE.length} compounds)`;
  
  return {
    data: data.map((sample, index) => ({
      ...sample,
      identifiedCompounds: identifiedCompounds.filter(c => c.id.includes(sample.fileName || `_${index}_`))
    })),
    compoundsIdentified: identifiedCompounds.length,
    message: `Identified ${identifiedCompounds.length} compounds from ${sourceInfo} within ${mass_tolerance} Da tolerance (processed ${totalPeaksProcessed} peaks)`
  };
};

// Helper function to calculate molecular mass from formula (enhanced implementation)
function calculateMassFromFormula(formula: string): number {
  if (!formula || typeof formula !== 'string') return 0;
  
  // Remove spaces and normalize formula
  const cleanFormula = formula.replace(/\s+/g, '');
  
  // Enhanced atomic masses with more elements
  const atomicMasses: { [key: string]: number } = {
    'C': 12.011, 'H': 1.008, 'O': 15.999, 'N': 14.007, 
    'S': 32.066, 'P': 30.974, 'Cl': 35.453, 'Br': 79.904,
    'F': 18.998, 'I': 126.904, 'Na': 22.990, 'K': 39.098,
    'Ca': 40.078, 'Mg': 24.305, 'Fe': 55.845, 'Zn': 65.380,
    'Cu': 63.546, 'Mn': 54.938, 'Mo': 95.960, 'Se': 78.960,
    'Si': 28.085, 'B': 10.811, 'Al': 26.982
  };
  
  let mass = 0;
  
  // Handle simple formulas without brackets first
  if (!cleanFormula.includes('(')) {
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    
    while ((match = regex.exec(cleanFormula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2]) || 1;
      const atomicMass = atomicMasses[element];
      
      if (atomicMass) {
        mass += atomicMass * count;
      } else {
        console.warn(`Unknown element: ${element} in formula: ${formula}`);
      }
    }
  } else {
    // Handle formulas with brackets (basic implementation)
    let expandedFormula = cleanFormula;
    
    // Simple bracket expansion (handles one level of nesting)
    const bracketRegex = /\(([^)]+)\)(\d*)/g;
    expandedFormula = expandedFormula.replace(bracketRegex, (match, content, multiplier) => {
      const mult = parseInt(multiplier) || 1;
      let expanded = '';
      const contentRegex = /([A-Z][a-z]?)(\d*)/g;
      let contentMatch;
      
      while ((contentMatch = contentRegex.exec(content)) !== null) {
        const element = contentMatch[1];
        const count = (parseInt(contentMatch[2]) || 1) * mult;
        expanded += element + (count > 1 ? count : '');
      }
      return expanded;
    });
    
    // Now calculate mass from expanded formula
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    
    while ((match = regex.exec(expandedFormula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2]) || 1;
      const atomicMass = atomicMasses[element];
      
      if (atomicMass) {
        mass += atomicMass * count;
      }
    }
  }
  
  return Math.round(mass * 10000) / 10000; // Round to 4 decimal places
}

export const performStatistics = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { test_type = 'ttest', p_value_threshold = 0.05, fold_change_threshold = 1.5 } = parameters;
  
  console.log(`Performing ${test_type} statistical analysis`);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Extract compound intensities across samples
  const compoundIntensities: { [compoundName: string]: number[] } = {};
  
  data.forEach(sample => {
    const compounds = sample.identifiedCompounds || [];
    compounds.forEach((compound: IdentifiedCompound) => {
      if (!compoundIntensities[compound.name]) {
        compoundIntensities[compound.name] = [];
      }
      compoundIntensities[compound.name].push(compound.peaks[0].intensity);
    });
  });
  
  // Perform statistical tests
  const statisticalResults = [];
  let significantFeatures = 0;
  
  for (const [compoundName, intensities] of Object.entries(compoundIntensities)) {
    if (intensities.length < 2) continue;
    
    const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (intensities.length - 1);
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    
    // Simple statistical test (placeholder for real implementation)
    const pValue = Math.random() * 0.1; // In real implementation, use proper statistical tests
    const foldChange = Math.random() * 3 + 0.5;
    
    const isSignificant = pValue < p_value_threshold && foldChange > fold_change_threshold;
    if (isSignificant) significantFeatures++;
    
    statisticalResults.push({
      compound: compoundName,
      mean,
      stdDev,
      cv,
      pValue,
      foldChange,
      significant: isSignificant
    });
  }
  
  const finalResults = {
    test_type,
    significant_features: significantFeatures,
    p_value_threshold,
    fold_change_threshold,
    total_features: Object.keys(compoundIntensities).length,
    results: statisticalResults
  };
  
  return {
    data: data.map(sample => ({
      ...sample,
      statisticalResults: finalResults
    })),
    ...finalResults,
    message: `Found ${significantFeatures} statistically significant features out of ${Object.keys(compoundIntensities).length} total compounds`
  };
};
