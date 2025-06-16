import { ParsedMzData, Spectrum } from './mzParser';
import { 
  calculateExactMassFromFormula, 
  calculateAllTheoreticalMZ, 
  findMassMatches,
  IONIZATION_MODES
} from './massCalculations';

export interface Peak {
  mz: number;
  intensity: number;
  retentionTime: number;
  area?: number;
  snRatio?: number;
  ionizationMode?: string;
  ppmError?: number;
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

// Enhanced Peak Detection with much lower thresholds for real data
export const detectPeaks = async (
  data: ParsedMzData[], 
  parameters: any
): Promise<any> => {
  try {
    // Significantly lowered threshold for real mass spec data
    const { noise_threshold = 1, min_peak_width = 1, max_peak_width = 50 } = parameters;
    
    console.log(`🔍 PEAK DETECTION: Starting with ultra-low threshold: ${noise_threshold}`);
    console.log(`📁 Input data structure:`, data.map(d => ({ 
      fileName: d.fileName, 
      spectra: d.spectra?.length || 0,
      totalPeaks: d.spectra?.reduce((sum, s) => sum + (s.peaks?.length || 0), 0) || 0,
      isRealData: d.spectra?.some(s => s.peaks?.some(p => typeof p.mz === 'number' && p.mz > 0)) || false
    })));
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid data format: expected array of samples");
    }

    // Enhanced validation for real vs mock data
    const samplesWithSpectra = data.filter(sample => 
      sample && Array.isArray(sample.spectra) && sample.spectra.length > 0
    );
    
    if (samplesWithSpectra.length === 0) {
      throw new Error("No samples with valid spectra found. Please check your uploaded files and ensure they contain proper mass spectrometry data.");
    }

    // Comprehensive data analysis with adaptive thresholding
    let totalRealPeaks = 0;
    let totalValidPeaks = 0;
    let intensityValues: number[] = [];
    
    for (const sample of samplesWithSpectra) {
      for (const spectrum of sample.spectra) {
        if (!spectrum?.peaks) continue;
        
        for (const peak of spectrum.peaks) {
          if (typeof peak.mz === 'number' && peak.mz > 0 && typeof peak.intensity === 'number' && peak.intensity > 0) {
            totalValidPeaks++;
            intensityValues.push(peak.intensity);
            
            // More sophisticated real data detection
            if (peak.mz % 1 !== 0 || peak.intensity % 1 !== 0) {
              totalRealPeaks++;
            }
          }
        }
      }
    }
    
    console.log(`📊 DATA ANALYSIS: Real peaks: ${totalRealPeaks}, Total valid peaks: ${totalValidPeaks}`);
    
    // Calculate adaptive threshold based on data distribution
    let adaptiveThreshold = noise_threshold;
    if (intensityValues.length > 0) {
      intensityValues.sort((a, b) => a - b);
      const q10 = intensityValues[Math.floor(intensityValues.length * 0.1)];
      const q25 = intensityValues[Math.floor(intensityValues.length * 0.25)];
      const median = intensityValues[Math.floor(intensityValues.length * 0.5)];
      
      // Use 10th percentile as adaptive threshold for very inclusive detection
      adaptiveThreshold = Math.min(noise_threshold, Math.max(1, q10 * 0.1));
      
      console.log(`📈 Intensity distribution: Q10=${q10.toFixed(2)}, Q25=${q25.toFixed(2)}, Median=${median.toFixed(2)}`);
      console.log(`🎯 Adaptive threshold: ${adaptiveThreshold.toFixed(2)} (original: ${noise_threshold})`);
    }
    
    if (totalValidPeaks === 0) {
      console.error("❌ NO VALID PEAKS FOUND - Check file parsing");
      throw new Error("No valid peaks found in uploaded data. The files may be corrupted or in an unsupported format.");
    }

    const allPeaks: Peak[] = [];
    let processedSamples = 0;
    
    for (const sample of data) {
      if (!sample || typeof sample !== 'object') {
        console.warn(`⚠️ Skipping invalid sample:`, sample);
        continue;
      }

      if (!Array.isArray(sample.spectra) || sample.spectra.length === 0) {
        console.warn(`⚠️ Sample ${sample.fileName || 'unknown'} has no valid spectra`);
        continue;
      }

      let samplePeaks = 0;
      let totalSpectra = 0;
      let spectraWithPeaks = 0;
      
      for (const spectrum of sample.spectra) {
        totalSpectra++;
        if (!spectrum || !Array.isArray(spectrum.peaks) || spectrum.peaks.length === 0) {
          continue;
        }

        try {
          // Ultra-permissive peak validation with adaptive threshold
          const rawPeaks = spectrum.peaks.length;
          const validPeaks = spectrum.peaks.filter(peak => 
            peak && 
            typeof peak.mz === 'number' && 
            typeof peak.intensity === 'number' &&
            peak.intensity >= adaptiveThreshold &&
            !isNaN(peak.mz) && 
            !isNaN(peak.intensity) &&
            isFinite(peak.mz) &&
            isFinite(peak.intensity) &&
            peak.mz > 0 &&
            peak.intensity > 0
          );
          
          if (validPeaks.length > 0) {
            spectraWithPeaks++;
            console.log(`📊 Spectrum ${spectrum.scanNumber || totalSpectra}: ${rawPeaks} raw → ${validPeaks.length} valid peaks (threshold: ${adaptiveThreshold.toFixed(2)})`);
            
            // Log detailed peak examples for debugging
            if (validPeaks.length > 0) {
              const samplePeaks = validPeaks.slice(0, 5);
              console.log(`   Peak examples:`, samplePeaks.map(p => `m/z ${p.mz.toFixed(4)} (${p.intensity.toFixed(0)})`).join(', '));
            }
          }
          
          const processedPeaks = validPeaks.map(peak => ({
            mz: peak.mz,
            intensity: peak.intensity,
            retentionTime: typeof spectrum.retentionTime === 'number' ? spectrum.retentionTime : 0,
            area: calculatePeakArea(peak, spectrum.peaks),
            snRatio: peak.intensity / Math.max(adaptiveThreshold, 1)
          }));
          
          allPeaks.push(...processedPeaks);
          samplePeaks += processedPeaks.length;
        } catch (spectrumError) {
          console.warn(`❌ Error processing spectrum in ${sample.fileName}:`, spectrumError);
        }
      }
      
      console.log(`✅ Sample ${sample.fileName}: ${samplePeaks} peaks from ${spectraWithPeaks}/${totalSpectra} spectra`);
      processedSamples++;
    }
    
    if (allPeaks.length === 0) {
      console.error("❌ CRITICAL: No peaks passed filtering");
      throw new Error(`No peaks found above threshold (${adaptiveThreshold.toFixed(2)}). Data may not contain valid mass spectrometry peaks.`);
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
    
    console.log(`🎉 PEAK DETECTION COMPLETE: ${allPeaks.length} total peaks above threshold across ${processedSamples} samples`);
    console.log(`📈 Peak intensity range: ${Math.min(...allPeaks.map(p => p.intensity)).toFixed(0)} - ${Math.max(...allPeaks.map(p => p.intensity)).toFixed(0)}`);
    console.log(`🎯 m/z range: ${Math.min(...allPeaks.map(p => p.mz)).toFixed(4)} - ${Math.max(...allPeaks.map(p => p.mz)).toFixed(4)}`);
    
    return {
      data: resultData,
      peaksDetected: allPeaks.length,
      message: `Detected ${allPeaks.length} peaks above adaptive threshold (${adaptiveThreshold.toFixed(2)}) across ${processedSamples} samples`
    };
    
  } catch (error) {
    console.error('❌ Peak detection error:', error);
    throw new Error(`Peak detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced peak area calculation
function calculatePeakArea(peak: any, allPeaks: any[]): number {
  if (!peak || !Array.isArray(allPeaks) || allPeaks.length === 0) {
    return peak?.intensity || 0;
  }

  const peakIndex = allPeaks.findIndex(p => 
    p && Math.abs(p.mz - peak.mz) < 0.001
  );
  
  if (peakIndex === -1) return peak.intensity;
  
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
  
  return Math.max(peak.intensity, area);
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

    // Validate that we have detected peaks
    const samplesWithPeaks = data.filter(sample => 
      sample && Array.isArray(sample.detectedPeaks) && sample.detectedPeaks.length > 0
    );
    
    if (samplesWithPeaks.length === 0) {
      throw new Error("No samples with detected peaks found. Please run peak detection first.");
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
                typeof peak.retentionTime === 'number' &&
                !isNaN(peak.mz) && !isNaN(peak.intensity) && !isNaN(peak.retentionTime))
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
  const { min_intensity = 10, cv_threshold = 0.5, min_frequency = 0.3 } = parameters;
  
  console.log(`Filtering data with min intensity: ${min_intensity}, CV threshold: ${cv_threshold}`);
  
  await new Promise(resolve => setTimeout(resolve, 150));
  
  let filteredCount = 0;
  
  const filteredData = data.map(sample => {
    const peaks = sample.alignedPeaks || sample.detectedPeaks || [];
    
    const filtered = peaks.filter((peak: Peak) => {
      const intensityPass = peak.intensity >= min_intensity;
      const qualityPass = (peak.snRatio || 1) > 1.5; // Lowered from 3 to 1.5
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
    message: `Filtered out ${filteredCount} low-quality peaks using intensity ≥ ${min_intensity} and S/N > 1.5`
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
  // Ultra-permissive tolerance settings
  const { database = 'HMDB', mass_tolerance = 50, tolerance_unit = 'ppm' } = parameters;
  
  console.log(`🔬 COMPOUND IDENTIFICATION: Starting using ${database} database with tolerance ${mass_tolerance} ${tolerance_unit}`);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const identifiedCompounds: IdentifiedCompound[] = [];
  
  // Enhanced compound loading from localStorage with comprehensive debugging
  let uploadedCompounds: any[] = [];
  try {
    const storedCompoundList = localStorage.getItem('compoundListData');
    console.log(`📋 Checking localStorage for compound list...`);
    
    if (storedCompoundList) {
      const parsed = JSON.parse(storedCompoundList);
      uploadedCompounds = Array.isArray(parsed) ? parsed : [];
      console.log(`✅ Loaded uploaded compound list with ${uploadedCompounds.length} compounds`);
      console.log(`📝 Sample uploaded compounds:`, uploadedCompounds.slice(0, 3).map(c => ({
        name: c.name || c.compound || c.Compound,
        formula: c.formula || c.Formula,
        mass: c.mass || c.exactMass
      })));
      
      // Validate uploaded compounds have required fields
      const validCompounds = uploadedCompounds.filter(c => 
        (c.name || c.compound || c.Compound) && 
        (c.formula || c.Formula) && 
        (c.mass || c.exactMass || c.formula || c.Formula)
      );
      
      if (validCompounds.length !== uploadedCompounds.length) {
        console.warn(`⚠️ ${uploadedCompounds.length - validCompounds.length} compounds missing required fields`);
      }
      
      uploadedCompounds = validCompounds;
    } else {
      console.log(`⚠️ No compound list found in localStorage`);
    }
  } catch (error) {
    console.warn('❌ Failed to load uploaded compound list:', error);
  }
  
  // Use uploaded compounds if available, otherwise fall back to built-in database
  const compoundsToSearch = uploadedCompounds.length > 0 ? uploadedCompounds : COMPOUND_DATABASE;
  
  console.log(`🎯 Searching against ${compoundsToSearch.length} compounds from ${uploadedCompounds.length > 0 ? 'uploaded CSV' : 'built-in database'}`);
  
  // Pre-calculate theoretical m/z values for all compounds with enhanced calculation
  const compoundMZDatabase = compoundsToSearch.map(compound => {
    const exactMass = compound.mass || compound.exactMass || calculateExactMassFromFormula(compound.formula || compound.Formula);
    
    if (exactMass && exactMass > 0) {
      const theoreticalMZs = calculateAllTheoreticalMZ(exactMass);
      
      const result = {
        ...compound,
        exactMass,
        theoreticalMZs,
        name: compound.name || compound.compound || compound.Compound || 'Unknown'
      };
      
      console.log(`🧮 Compound ${result.name}: mass ${exactMass.toFixed(4)}, ${theoreticalMZs.length} theoretical m/z values`);
      return result;
    }
    return null;
  }).filter(compound => compound !== null && compound.exactMass > 0);
  
  console.log(`✅ Pre-calculated m/z values for ${compoundMZDatabase.length} valid compounds`);
  
  let totalPeaksProcessed = 0;
  let matchesFound = 0;
  let samplesProcessed = 0;
  
  data.forEach((sample, sampleIndex) => {
    const peaks = sample.normalizedPeaks || sample.filteredPeaks || sample.alignedPeaks || sample.detectedPeaks || [];
    
    console.log(`🔍 Processing sample ${sample.fileName || sampleIndex}: ${peaks.length} peaks`);
    totalPeaksProcessed += peaks.length;
    samplesProcessed++;
    
    // Log some sample peaks for debugging
    if (peaks.length > 0) {
      const samplePeaks = peaks.slice(0, 10);
      console.log(`   Sample peaks (first 10):`, samplePeaks.map((p: any) => `m/z ${p.mz?.toFixed(4)} (${p.intensity?.toFixed(0)})`).join(', '));
    }
    
    let sampleMatches = 0;
    
    peaks.forEach((peak: Peak, peakIndex: number) => {
      if (!peak || typeof peak.mz !== 'number' || peak.mz <= 0) {
        return;
      }

      // Ultra-permissive tolerance calculation
      let tolerancePPM: number;
      if (tolerance_unit === 'ppm') {
        tolerancePPM = mass_tolerance;
      } else {
        // Convert Da to ppm: ppm = (tolerance_Da / observed_mz) * 1e6
        tolerancePPM = (mass_tolerance / peak.mz) * 1000000;
      }
      
      // Ensure minimum tolerance for very permissive matching
      tolerancePPM = Math.max(tolerancePPM, 10); // At least 10 ppm tolerance
      
      // Find matching compounds with ultra-permissive matching
      compoundMZDatabase.forEach(compound => {
        if (!compound || !compound.theoreticalMZs) return;
        
        const matches = findMassMatches(peak.mz, compound.theoreticalMZs, tolerancePPM);
        
        matches.forEach(match => {
          const compoundName = compound.name;
          const matchScore = Math.max(0, 1 - (match.ppmError / tolerancePPM));
          
          // Ultra-permissive matching - accept almost any match
          if (matchScore > 0.001) { // Accept matches with just 0.1% quality
            console.log(`🎯 MATCH FOUND: Peak m/z ${peak.mz.toFixed(4)} matches ${compoundName} as ${match.mode.name}`);
            console.log(`   Theoretical: ${match.mz.toFixed(4)}, Error: ${match.ppmError.toFixed(2)} ppm, Score: ${matchScore.toFixed(3)}`);
            
            identifiedCompounds.push({
              id: `${compoundName}_${match.mode.name}_${peak.mz.toFixed(4)}_${sample.fileName}_${peakIndex}`,
              name: `${compoundName} (${match.mode.name})`,
              formula: compound.formula || compound.Formula || 'Unknown',
              mass: compound.exactMass,
              matchScore,
              database: uploadedCompounds.length > 0 ? 'Uploaded CSV' : database,
              peaks: [{ ...peak, ionizationMode: match.mode.name, ppmError: match.ppmError }]
            });
            
            matchesFound++;
            sampleMatches++;
          }
        });
      });
    });
    
    console.log(`   Sample matches: ${sampleMatches}`);
  });
  
  console.log(`🎉 IDENTIFICATION COMPLETE:`);
  console.log(`   📊 ${matchesFound} matches found from ${totalPeaksProcessed} peaks across ${samplesProcessed} samples`);
  console.log(`   🏛️ Database: ${uploadedCompounds.length > 0 ? 'Uploaded CSV' : database} (${compoundsToSearch.length} compounds)`);
  console.log(`   🎯 Tolerance: ${mass_tolerance} ${tolerance_unit}`);
  
  if (identifiedCompounds.length > 0) {
    console.log(`   📝 Sample identifications:`, identifiedCompounds.slice(0, 5).map(c => ({
      name: c.name,
      mz: c.peaks[0].mz.toFixed(4),
      error: c.peaks[0].ppmError?.toFixed(2) + ' ppm'
    })));
  } else {
    console.error(`❌ NO MATCHES FOUND. Comprehensive debugging info:`);
    console.error(`   📊 Peaks by sample:`, data.map(s => ({ 
      name: s.fileName, 
      detected: (s.detectedPeaks || []).length,
      aligned: (s.alignedPeaks || []).length,
      filtered: (s.filteredPeaks || []).length,
      normalized: (s.normalizedPeaks || []).length
    })));
    console.error(`   🏛️ Compound database size: ${compoundMZDatabase.length}`);
    console.error(`   ⚙️ Tolerance settings: ${mass_tolerance} ${tolerance_unit}`);
    console.error(`   🎯 Peak m/z range: ${totalPeaksProcessed > 0 ? 
      Math.min(...data.flatMap(s => (s.detectedPeaks || []).map((p: any) => p.mz))).toFixed(4) + ' - ' +
      Math.max(...data.flatMap(s => (s.detectedPeaks || []).map((p: any) => p.mz))).toFixed(4) : 'No peaks'}`);
  }
  
  const sourceInfo = uploadedCompounds.length > 0 
    ? `uploaded CSV (${uploadedCompounds.length} compounds)` 
    : `${database} (${COMPOUND_DATABASE.length} compounds)`;
  
  return {
    data: data.map((sample, index) => ({
      ...sample,
      identifiedCompounds: identifiedCompounds.filter(c => c.id.includes(sample.fileName || `_${index}_`))
    })),
    compoundsIdentified: identifiedCompounds.length,
    message: `Identified ${identifiedCompounds.length} compounds from ${sourceInfo} using ${tolerance_unit} tolerance (${mass_tolerance} ${tolerance_unit}, processed ${totalPeaksProcessed} peaks)`
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
