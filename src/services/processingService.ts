
import { 
  detectPeaks, 
  alignPeaks, 
  filterData, 
  normalizeData, 
  identifyCompounds, 
  performStatistics 
} from '@/utils/dataProcessing';

interface WorkflowOptions {
  workflowName?: string;
  ms2DbContent?: string | null;
  sampleType?: string;
  sampleOrder?: { fileName: string; order: number }[];
  mzTolerance?: number;
  [key: string]: any;
}

interface ProcessingResult {
  success: boolean;
  summary: {
    peaksDetected: number;
    compoundsIdentified: number;
    processingTime: string;
  };
  results: Array<{
    stepName: string;
    success: boolean;
    message?: string;
  }>;
  processedData?: any[];
}

export const processingService = {
  async processWorkflow(
    workflowSteps: any[],
    parsedData: any[],
    options?: WorkflowOptions
  ): Promise<ProcessingResult> {
    const workflowName = options?.workflowName ?? "Untitled Workflow";
    const mzTolerance = options?.mzTolerance ?? 0.01;
    const sampleType = options?.sampleType ?? "Serum";
    const sampleOrder = options?.sampleOrder ?? [];
    const ms2DbContent = options?.ms2DbContent ?? null;

    const startTime = performance.now();
    let peaksDetected = 0;
    let compoundsIdentified = 0;
    const results: Array<{ stepName: string; success: boolean; message?: string }> = [];
    
    // Enhanced input validation
    if (!parsedData || parsedData.length === 0) {
      return {
        success: false,
        summary: { peaksDetected: 0, compoundsIdentified: 0, processingTime: "0" },
        results: [{ stepName: "Input Validation", success: false, message: "No data files provided for processing" }]
      };
    }

    if (!workflowSteps || workflowSteps.length === 0) {
      return {
        success: false,
        summary: { peaksDetected: 0, compoundsIdentified: 0, processingTime: "0" },
        results: [{ stepName: "Workflow Validation", success: false, message: "No workflow steps defined" }]
      };
    }

    console.log("Starting workflow:", workflowName);
    console.log("Workflow steps:", workflowSteps.map(s => s.name || s.type));
    console.log("Data files:", parsedData.map(d => d.fileName));

    // Initialize and validate data structure
    let processedData = parsedData.map(sample => {
      // Ensure all required properties exist with proper defaults
      const validatedSample = {
        ...sample,
        fileName: sample.fileName || 'unknown',
        totalSpectra: sample.totalSpectra || 0,
        spectra: Array.isArray(sample.spectra) ? sample.spectra : [],
        chromatograms: Array.isArray(sample.chromatograms) ? sample.chromatograms : [],
        // Initialize processing results containers
        detectedPeaks: [],
        alignedPeaks: [],
        filteredPeaks: [],
        normalizedPeaks: [],
        identifiedCompounds: [],
        statisticalResults: null
      };

      // Validate spectra structure
      validatedSample.spectra = validatedSample.spectra.map(spectrum => ({
        ...spectrum,
        peaks: Array.isArray(spectrum.peaks) ? spectrum.peaks : [],
        retentionTime: typeof spectrum.retentionTime === 'number' ? spectrum.retentionTime : 0,
        scanNumber: typeof spectrum.scanNumber === 'number' ? spectrum.scanNumber : 0,
        msLevel: typeof spectrum.msLevel === 'number' ? spectrum.msLevel : 1
      }));

      return validatedSample;
    });

    try {
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        const progress = ((i + 1) / workflowSteps.length) * 100;
        
        console.log(`Processing step ${i + 1}/${workflowSteps.length}: ${step.name || step.type}`);
        
        // Dispatch progress event
        try {
          window.dispatchEvent(new CustomEvent('workflow-progress', {
            detail: { currentStep: `Running step: ${step.name || step.type}`, progress }
          }));
        } catch (progressError) {
          console.warn('Failed to dispatch progress event:', progressError);
        }

        // Validate step parameters
        const stepParams = step.parameters || {};
        
        try {
          switch (step.type) {
            case "peak_detection":
              console.log("Running Peak Detection...");
              
              // Validate data has spectra
              const hasValidSpectra = processedData.some(sample => 
                sample.spectra && sample.spectra.length > 0 && 
                sample.spectra.some(spectrum => spectrum.peaks && spectrum.peaks.length > 0)
              );
              
              if (!hasValidSpectra) {
                throw new Error("No valid spectra data found for peak detection");
              }
              
              const peakResult = await detectPeaks(processedData, {
                noise_threshold: stepParams.noise_threshold || 1000,
                min_peak_width: stepParams.min_peak_width || 0.1,
                max_peak_width: stepParams.max_peak_width || 2.0
              });
              
              if (!peakResult || !peakResult.data) {
                throw new Error("Peak detection returned invalid data");
              }
              
              processedData = peakResult.data;
              peaksDetected = peakResult.peaksDetected || 0;
              results.push({ 
                stepName: "Peak Detection", 
                success: true, 
                message: `Detected ${peaksDetected} peaks`
              });
              break;

            case "alignment":
              console.log("Running Peak Alignment...");
              
              // Check if peak detection was run first
              const hasPeaks = processedData.some(sample => 
                sample.detectedPeaks && sample.detectedPeaks.length > 0
              );
              
              if (!hasPeaks) {
                throw new Error("No detected peaks found. Run peak detection first.");
              }
              
              const alignResult = await alignPeaks(processedData, {
                mz_tolerance: stepParams.mz_tolerance || 0.01,
                rt_tolerance: stepParams.rt_tolerance || 0.5
              });
              
              if (!alignResult || !alignResult.data) {
                throw new Error("Peak alignment returned invalid data");
              }
              
              processedData = alignResult.data;
              results.push({ 
                stepName: "Peak Alignment", 
                success: true, 
                message: alignResult.message || "Peak alignment completed"
              });
              break;

            case "filtering":
              console.log("Running Data Filtering...");
              
              const filterResult = await filterData(processedData, {
                min_intensity: stepParams.min_intensity || 500,
                cv_threshold: stepParams.cv_threshold || 0.3,
                min_frequency: stepParams.min_frequency || 0.5
              });
              
              if (!filterResult || !filterResult.data) {
                throw new Error("Data filtering returned invalid data");
              }
              
              processedData = filterResult.data;
              results.push({ 
                stepName: "Data Filtering", 
                success: true, 
                message: filterResult.message || "Data filtering completed"
              });
              break;

            case "normalization":
              console.log("Running Data Normalization...");
              
              const normalizeResult = await normalizeData(processedData, {
                method: stepParams.method || "median",
                reference_method: stepParams.reference_method || "internal_standard"
              });
              
              if (!normalizeResult || !normalizeResult.data) {
                throw new Error("Data normalization returned invalid data");
              }
              
              processedData = normalizeResult.data;
              results.push({ 
                stepName: "Data Normalization", 
                success: true, 
                message: normalizeResult.message || "Data normalization completed"
              });
              break;

            case "identification":
              console.log("Running Compound Identification...");
              
              const identifyResult = await identifyCompounds(processedData, {
                database: stepParams.database || "hmdb",
                mass_tolerance: stepParams.mass_tolerance || mzTolerance,
                ms2DbContent
              });
              
              if (!identifyResult || !identifyResult.data) {
                throw new Error("Compound identification returned invalid data");
              }
              
              processedData = identifyResult.data;
              compoundsIdentified = identifyResult.compoundsIdentified || 0;
              results.push({ 
                stepName: "Compound Identification", 
                success: true, 
                message: `Identified ${compoundsIdentified} compounds`
              });
              break;

            case "statistics":
              console.log("Running Statistical Analysis...");
              
              const statsResult = await performStatistics(processedData, {
                test_type: stepParams.test_type || "t_test",
                p_value_threshold: stepParams.p_value_threshold || 0.05,
                fold_change_threshold: stepParams.fold_change_threshold || 1.5
              });
              
              if (!statsResult || !statsResult.data) {
                throw new Error("Statistical analysis returned invalid data");
              }
              
              processedData = statsResult.data;
              results.push({ 
                stepName: "Statistical Analysis", 
                success: true, 
                message: statsResult.message || "Statistical analysis completed"
              });
              break;

            default:
              console.warn(`Unknown workflow step: ${step.type}`);
              results.push({ 
                stepName: step.name || step.type, 
                success: false, 
                message: `Unknown step type: ${step.type}`
              });
          }
          
          // Brief delay for UI feedback
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (stepError) {
          console.error(`Error in step ${step.name || step.type}:`, stepError);
          const errorMessage = stepError instanceof Error ? stepError.message : "Unknown error occurred";
          
          results.push({ 
            stepName: step.name || step.type, 
            success: false, 
            message: errorMessage
          });
          
          // Continue with next step but mark as having failures
          console.log(`Continuing workflow after error in ${step.name || step.type}`);
        }
      }

      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      const summary = {
        peaksDetected,
        compoundsIdentified,
        processingTime
      };

      // Store analysis results
      try {
        const analysis = {
          workflowName,
          date: new Date().toISOString(),
          summary,
          steps: workflowSteps,
          results,
          processedData
        };
        
        let allAnalyses = [];
        try {
          const existing = localStorage.getItem('myAnalyses');
          allAnalyses = existing ? JSON.parse(existing) : [];
        } catch (parseError) {
          console.warn('Failed to parse existing analyses:', parseError);
          allAnalyses = [];
        }
        
        allAnalyses.push(analysis);
        localStorage.setItem('myAnalyses', JSON.stringify(allAnalyses));
      } catch (storageError) {
        console.error('Failed to store analysis results:', storageError);
      }

      const hasFailures = results.some(r => !r.success);
      
      return { 
        success: !hasFailures, 
        summary,
        results,
        processedData
      };

    } catch (error: any) {
      console.error("Critical error during workflow execution:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown workflow error";
      
      return { 
        success: false, 
        summary: {
          peaksDetected: 0,
          compoundsIdentified: 0,
          processingTime: "0"
        },
        results: [{ 
          stepName: "Workflow Error", 
          success: false, 
          message: errorMessage
        }]
      };
    }
  },

  getLastResult(): any | null {
    try {
      const allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
      if (!allAnalyses.length) return null;
      
      const last = allAnalyses[allAnalyses.length - 1];
      
      return {
        success: true,
        processed: true,
        summary: last.summary || { peaksDetected: 0, compoundsIdentified: 0, processingTime: "0" },
        results: last.results || [],
        processedData: last.processedData || []
      };
    } catch (error) {
      console.error('Error loading last result:', error);
      return null;
    }
  },
};
