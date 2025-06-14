
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

// Peak Detection
export const detectPeaks = async (
  data: ParsedMzData[], 
  parameters: any
): Promise<any> => {
  const { noise_threshold, min_peak_width, max_peak_width } = parameters;
  
  console.log(`Detecting peaks with threshold: ${noise_threshold}`);
  
  const allPeaks: Peak[] = [];
  
  for (const sample of data) {
    for (const spectrum of sample.spectra) {
      // Simulate peak detection algorithm
      const detectedPeaks = spectrum.peaks
        .filter(peak => peak.intensity > noise_threshold)
        .map(peak => ({
          mz: peak.mz,
          intensity: peak.intensity,
          retentionTime: spectrum.retentionTime,
          area: peak.intensity * 0.1, // Simulated area calculation
          snRatio: peak.intensity / noise_threshold
        }));
      
      allPeaks.push(...detectedPeaks);
    }
  }
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    data: data.map(sample => ({
      ...sample,
      peaks: allPeaks.filter((_, index) => index % data.length === data.indexOf(sample))
    })),
    peaksDetected: allPeaks.length,
    message: `Detected ${allPeaks.length} peaks above threshold`
  };
};

// Peak Alignment
export const alignPeaks = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { mz_tolerance, rt_tolerance } = parameters;
  
  console.log(`Aligning peaks with mz tolerance: ${mz_tolerance}, rt tolerance: ${rt_tolerance}`);
  
  // Simulate alignment algorithm
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const alignedPeaks: AlignedPeak[] = [];
  let alignmentGroups = 0;
  
  // Simple alignment simulation
  data.forEach((sample, sampleIndex) => {
    if (sample.peaks) {
      sample.peaks.forEach((peak: Peak) => {
        alignedPeaks.push({
          ...peak,
          sampleId: sample.fileName,
          alignmentScore: Math.random() * 0.5 + 0.5 // Random score between 0.5-1
        });
      });
    }
  });
  
  alignmentGroups = Math.floor(alignedPeaks.length * 0.8); // Simulate grouping
  
  return {
    data: data.map(sample => ({
      ...sample,
      alignedPeaks: alignedPeaks.filter(p => p.sampleId === sample.fileName)
    })),
    alignmentGroups,
    message: `Aligned peaks into ${alignmentGroups} groups`
  };
};

// Data Filtering
export const filterData = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { min_intensity, cv_threshold } = parameters;
  
  console.log(`Filtering data with min intensity: ${min_intensity}, CV threshold: ${cv_threshold}`);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredCount = 0;
  
  const filteredData = data.map(sample => {
    const peaks = sample.peaks || sample.alignedPeaks || [];
    const filtered = peaks.filter((peak: Peak) => {
      const passes = peak.intensity >= min_intensity && (peak.snRatio || 1) > 2;
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
    message: `Filtered out ${filteredCount} low-quality peaks`
  };
};

// Data Normalization
export const normalizeData = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { method, reference_method } = parameters;
  
  console.log(`Normalizing data using method: ${method}`);
  
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const normalizedData = data.map(sample => {
    const peaks = sample.filteredPeaks || sample.alignedPeaks || sample.peaks || [];
    
    // Calculate normalization factor based on method
    let normalizationFactor = 1;
    if (method === 'median') {
      const intensities = peaks.map((p: Peak) => p.intensity);
      const median = intensities.sort((a, b) => a - b)[Math.floor(intensities.length / 2)];
      normalizationFactor = 1000 / (median || 1);
    } else if (method === 'mean') {
      const mean = peaks.reduce((sum: number, p: Peak) => sum + p.intensity, 0) / peaks.length;
      normalizationFactor = 1000 / (mean || 1);
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
    message: `Normalized data using ${method} method`
  };
};

// Compound Identification
export const identifyCompounds = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { database, mass_tolerance } = parameters;
  
  console.log(`Identifying compounds using ${database} database`);
  
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Mock compound database
  const mockCompounds = [
    { name: 'Glucose', formula: 'C6H12O6', mass: 180.1559 },
    { name: 'Alanine', formula: 'C3H7NO2', mass: 89.0932 },
    { name: 'Citric acid', formula: 'C6H8O7', mass: 192.1235 },
    { name: 'Caffeine', formula: 'C8H10N4O2', mass: 194.1906 },
    { name: 'Tryptophan', formula: 'C11H12N2O2', mass: 204.2252 }
  ];
  
  const identifiedCompounds: IdentifiedCompound[] = [];
  
  data.forEach(sample => {
    const peaks = sample.normalizedPeaks || sample.filteredPeaks || sample.peaks || [];
    
    peaks.forEach((peak: Peak) => {
      // Find matching compounds within mass tolerance
      mockCompounds.forEach(compound => {
        const massDiff = Math.abs(peak.mz - compound.mass);
        if (massDiff <= mass_tolerance) {
          const matchScore = 1 - (massDiff / mass_tolerance);
          identifiedCompounds.push({
            id: `${compound.name}_${peak.mz.toFixed(4)}`,
            name: compound.name,
            formula: compound.formula,
            mass: compound.mass,
            matchScore,
            database,
            peaks: [peak]
          });
        }
      });
    });
  });
  
  return {
    data: data.map((sample, index) => ({
      ...sample,
      identifiedCompounds: identifiedCompounds.filter((_, i) => i % data.length === index)
    })),
    compoundsIdentified: identifiedCompounds.length,
    message: `Identified ${identifiedCompounds.length} compounds from ${database}`
  };
};

// Statistical Analysis
export const performStatistics = async (
  data: any[], 
  parameters: any
): Promise<any> => {
  const { test_type, p_value_threshold } = parameters;
  
  console.log(`Performing ${test_type} statistical analysis`);
  
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Mock statistical results
  const statisticalResults = {
    test_type,
    significant_features: Math.floor(Math.random() * 50) + 10,
    p_value_threshold,
    total_features: data.reduce((sum, sample) => {
      const compounds = sample.identifiedCompounds || [];
      return sum + compounds.length;
    }, 0)
  };
  
  return {
    data: data.map(sample => ({
      ...sample,
      statisticalResults
    })),
    ...statisticalResults,
    message: `Found ${statisticalResults.significant_features} statistically significant features`
  };
};
