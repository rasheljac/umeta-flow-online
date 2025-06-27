import { 
  detectPeaks, 
  alignPeaks, 
  filterData, 
  normalizeData, 
  identifyCompounds, 
  performStatistics 
} from '@/utils/dataProcessing';
import { supabase } from '@/integrations/supabase/client';

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

// Auto-start backend service if needed
const autoStartBackend = async (): Promise<boolean> => {
  try {
    console.log("Attempting to auto-start PyOpenMS backend service...");
    
    // Try to check if service is already running
    const healthCheck = await fetch('http://localhost:8001/health');
    if (healthCheck.ok) {
      const health = await healthCheck.json();
      console.log("Backend service is already running:", health);
      return true;
    }
  } catch (error) {
    console.log("Backend service not running, attempting to start...");
  }
  
  try {
    // Attempt to start the service through the edge function
    const { data, error } = await supabase.functions.invoke('ms-processing', {
      body: { 
        action: 'start_service',
        message: 'Auto-starting MS processing backend' 
      }
    });
    
    if (!error && data) {
      console.log("Backend service start initiated:", data);
      
      // Wait a moment and check health
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const healthCheck = await fetch('http://localhost:8001/health');
      if (healthCheck.ok) {
        const health = await healthCheck.json();
        console.log("Backend service started successfully:", health);
        return true;
      }
    }
    
    console.log("Backend service auto-start failed, using JavaScript fallback");
    return false;
  } catch (error) {
    console.log("Could not auto-start backend service:", error);
    return false;
  }
};

// Enhanced backend availability check with auto-start
const checkPyOpenMSAvailable = async (): Promise<boolean> => {
  try {
    // First try direct connection
    const response = await fetch('http://localhost:8001/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const health = await response.json();
      console.log("PyOpenMS backend is available:", health);
      return true;
    }
  } catch (error) {
    console.log("Direct backend connection failed, trying auto-start...");
  }
  
  // Try to auto-start the service
  return await autoStartBackend();
};

// Call PyOpenMS backend for processing with enhanced error handling
const callPyOpenMSBackend = async (step: string, data: any[], parameters: any): Promise<any> => {
  try {
    console.log(`Calling PyOpenMS backend for step: ${step}`);
    
    // Try direct connection first
    try {
      const response = await fetch('http://localhost:8001/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data, parameters })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`PyOpenMS backend success for ${step}:`, result);
        return result;
      }
    } catch (directError) {
      console.log("Direct backend call failed, trying through edge function...");
    }
    
    // Fall back to edge function
    const { data: result, error } = await supabase.functions.invoke('ms-processing', {
      body: { step, data, parameters }
    });

    if (error) {
      throw new Error(`Backend error: ${error.message}`);
    }

    console.log(`PyOpenMS backend success via edge function for ${step}:`, result);
    return result;
  } catch (error) {
    console.error(`PyOpenMS backend call failed for ${step}:`, error);
    throw error;
  }
};

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

    console.log("Starting enhanced workflow:", workflowName);
    console.log("Workflow steps:", workflowSteps.map(s => s.name || s.type));
    console.log("Data files:", parsedData.map(d => d.fileName));

    // Check and auto-start PyOpenMS backend
    const usePyOpenMS = await checkPyOpenMSAvailable();
    if (usePyOpenMS) {
      console.log("✓ Using PyOpenMS backend for professional MS processing");
    } else {
      console.log("⚠ PyOpenMS backend unavailable, using enhanced JavaScript fallback");
    }

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
        statisticalResults: null,
        processingStatus: 'processing'
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
            detail: { 
              currentStep: `Running step: ${step.name || step.type}${usePyOpenMS ? ' (PyOpenMS)' : ' (Enhanced Fallback)'}`, 
              progress 
            }
          }));
        } catch (progressError) {
          console.warn('Failed to dispatch progress event:', progressError);
        }

        const stepParams = step.parameters || {};
        
        try {
          switch (step.type) {
            case "peak_detection":
              console.log("Running Enhanced Peak Detection...");
              
              // Validate data has spectra
              const hasValidSpectra = processedData.some(sample => 
                sample.spectra && sample.spectra.length > 0 && 
                sample.spectra.some(spectrum => spectrum.peaks && spectrum.peaks.length > 0)
              );
              
              if (!hasValidSpectra) {
                throw new Error("No valid spectra data found for peak detection");
              }
              
              let peakResult;
              if (usePyOpenMS) {
                try {
                  peakResult = await callPyOpenMSBackend('peak_detection', processedData, {
                    noise_threshold: stepParams.noise_threshold || 1000,
                    min_peak_width: stepParams.min_peak_width || 0.1,
                    max_peak_width: stepParams.max_peak_width || 2.0
                  });
                } catch (backendError) {
                  console.warn("PyOpenMS backend failed, falling back to JavaScript:", backendError);
                  peakResult = await detectPeaks(processedData, {
                    noise_threshold: stepParams.noise_threshold || 1000,
                    min_peak_width: stepParams.min_peak_width || 0.1,
                    max_peak_width: stepParams.max_peak_width || 2.0
                  });
                }
              } else {
                peakResult = await detectPeaks(processedData, {
                  noise_threshold: stepParams.noise_threshold || 1000,
                  min_peak_width: stepParams.min_peak_width || 0.1,
                  max_peak_width: stepParams.max_peak_width || 2.0
                });
              }
              
              if (!peakResult || !peakResult.data) {
                throw new Error("Peak detection returned invalid data");
              }
              
              processedData = peakResult.data;
              peaksDetected = peakResult.peaksDetected || 0;
              results.push({ 
                stepName: "Peak Detection", 
                success: true, 
                message: peakResult.message || `Detected ${peaksDetected} peaks using ${usePyOpenMS ? 'PyOpenMS' : 'Enhanced Fallback'}`
              });
              break;

            case "alignment":
              console.log("Running Enhanced Peak Alignment...");
              
              // Check if peak detection was run first
              const hasPeaks = processedData.some(sample => 
                sample.detectedPeaks && sample.detectedPeaks.length > 0
              );
              
              if (!hasPeaks) {
                throw new Error("No detected peaks found. Run peak detection first.");
              }
              
              let alignResult;
              if (usePyOpenMS) {
                try {
                  alignResult = await callPyOpenMSBackend('alignment', processedData, {
                    mz_tolerance: stepParams.mz_tolerance || 0.01,
                    rt_tolerance: stepParams.rt_tolerance || 0.5
                  });
                } catch (backendError) {
                  console.warn("PyOpenMS backend failed, falling back to JavaScript:", backendError);
                  alignResult = await alignPeaks(processedData, {
                    mz_tolerance: stepParams.mz_tolerance || 0.01,
                    rt_tolerance: stepParams.rt_tolerance || 0.5
                  });
                }
              } else {
                alignResult = await alignPeaks(processedData, {
                  mz_tolerance: stepParams.mz_tolerance || 0.01,
                  rt_tolerance: stepParams.rt_tolerance || 0.5
                });
              }
              
              if (!alignResult || !alignResult.data) {
                throw new Error("Peak alignment returned invalid data");
              }
              
              processedData = alignResult.data;
              results.push({ 
                stepName: "Peak Alignment", 
                success: true, 
                message: alignResult.message || `Peak alignment completed using ${usePyOpenMS ? 'PyOpenMS' : 'Enhanced Fallback'}`
              });
              break;

            case "statistics":
              console.log("Running Enhanced Statistical Analysis...");
              
              let statsResult;
              if (usePyOpenMS) {
                try {
                  statsResult = await callPyOpenMSBackend('statistics', processedData, {
                    test_type: stepParams.test_type || "t_test",
                    p_value_threshold: stepParams.p_value_threshold || 0.05,
                    fold_change_threshold: stepParams.fold_change_threshold || 1.5
                  });
                } catch (backendError) {
                  console.warn("PyOpenMS backend failed, falling back to JavaScript:", backendError);
                  statsResult = await performStatistics(processedData, {
                    test_type: stepParams.test_type || "t_test",
                    p_value_threshold: stepParams.p_value_threshold || 0.05,
                    fold_change_threshold: stepParams.fold_change_threshold || 1.5
                  });
                }
              } else {
                statsResult = await performStatistics(processedData, {
                  test_type: stepParams.test_type || "t_test",
                  p_value_threshold: stepParams.p_value_threshold || 0.05,
                  fold_change_threshold: stepParams.fold_change_threshold || 1.5
                });
              }
              
              if (!statsResult || !statsResult.data) {
                throw new Error("Statistical analysis returned invalid data");
              }
              
              processedData = statsResult.data;
              results.push({ 
                stepName: "Statistical Analysis", 
                success: true, 
                message: statsResult.message || `Statistical analysis completed using ${usePyOpenMS ? 'PyOpenMS' : 'Enhanced Fallback'}`
              });
              break;

            case "filtering":
            case "normalization":
            case "identification":
              // Enhanced processing with backend support
              let stepResult;
              
              if (usePyOpenMS) {
                try {
                  stepResult = await callPyOpenMSBackend(step.type, processedData, stepParams);
                } catch (backendError) {
                  console.warn(`PyOpenMS backend failed for ${step.type}, using fallback:`, backendError);
                  stepResult = await this.runFallbackStep(step.type, processedData, stepParams, ms2DbContent, mzTolerance);
                }
              } else {
                stepResult = await this.runFallbackStep(step.type, processedData, stepParams, ms2DbContent, mzTolerance);
              }
              
              if (!stepResult || !stepResult.data) {
                throw new Error(`${step.name || step.type} returned invalid data`);
              }
              
              processedData = stepResult.data;
              if (stepResult.compoundsIdentified) {
                compoundsIdentified = stepResult.compoundsIdentified;
              }
              
              results.push({ 
                stepName: step.name || step.type, 
                success: true, 
                message: stepResult.message || `${step.name || step.type} completed using ${usePyOpenMS ? 'PyOpenMS' : 'Enhanced Fallback'}`
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

      // Mark all samples as completed
      processedData = processedData.map(sample => ({
        ...sample,
        processingStatus: 'completed'
      }));

      const summary = {
        peaksDetected,
        compoundsIdentified,
        processingTime
      };

      const hasFailures = results.some(r => !r.success);
      const finalResult = {
        success: !hasFailures,
        processed: true,
        summary,
        results,
        processedData
      };

      // Enhanced storage with quota handling
      try {
        // Create a lightweight summary for storage
        const lightweightSummary = {
          workflowName,
          date: new Date().toISOString(),
          summary,
          steps: workflowSteps.map(s => ({ name: s.name || s.type, type: s.type })),
          results,
          success: !hasFailures,
          processed: true,
          sampleCount: processedData.length,
          sampleNames: processedData.map(s => s.fileName)
        };

        // Try to store the full result first
        try {
          const fullAnalysis = {
            ...lightweightSummary,
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
          
          allAnalyses.push(fullAnalysis);
          localStorage.setItem('myAnalyses', JSON.stringify(allAnalyses));
          localStorage.setItem('lastProcessingResult', JSON.stringify(finalResult));
          
          console.log('Full analysis results saved successfully');
        } catch (quotaError) {
          console.warn('Storage quota exceeded, saving lightweight summary:', quotaError);
          
          // Fallback: Store only lightweight summary
          let lightweightAnalyses = [];
          try {
            const existing = localStorage.getItem('myAnalysesLight');
            lightweightAnalyses = existing ? JSON.parse(existing) : [];
          } catch (parseError) {
            lightweightAnalyses = [];
          }
          
          lightweightAnalyses.push(lightweightSummary);
          
          // Keep only last 10 analyses to save space
          if (lightweightAnalyses.length > 10) {
            lightweightAnalyses = lightweightAnalyses.slice(-10);
          }
          
          localStorage.setItem('myAnalysesLight', JSON.stringify(lightweightAnalyses));
          
          // Store lightweight result for immediate access
          const lightweightResult = {
            success: !hasFailures,
            processed: true,
            summary,
            results,
            processedData: processedData.map(sample => ({
              fileName: sample.fileName,
              detectedPeaks: sample.detectedPeaks ? sample.detectedPeaks.slice(0, 100) : [], // Keep only first 100 peaks
              identifiedCompounds: sample.identifiedCompounds ? sample.identifiedCompounds.slice(0, 50) : [], // Keep only first 50 compounds
              processingStatus: sample.processingStatus,
              totalSpectra: sample.totalSpectra
            }))
          };
          
          localStorage.setItem('lastProcessingResult', JSON.stringify(lightweightResult));
          console.log('Lightweight analysis results saved successfully');
        }
        
      } catch (storageError) {
        console.error('Failed to store any analysis results:', storageError);
        // Even if storage fails, we still return the result for immediate use
      }

      return finalResult;

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

  async runFallbackStep(stepType: string, processedData: any[], stepParams: any, ms2DbContent: any, mzTolerance: number) {
    switch (stepType) {
      case "filtering":
        return await filterData(processedData, {
          min_intensity: stepParams.min_intensity || 500,
          cv_threshold: stepParams.cv_threshold || 0.3,
          min_frequency: stepParams.min_frequency || 0.5
        });
      case "normalization":
        return await normalizeData(processedData, {
          method: stepParams.method || "median",
          reference_method: stepParams.reference_method || "internal_standard"
        });
      case "identification":
        return await identifyCompounds(processedData, {
          database: stepParams.database || "hmdb",
          mass_tolerance: stepParams.mass_tolerance || mzTolerance,
          ms2DbContent
        });
      default:
        throw new Error(`Unknown fallback step: ${stepType}`);
    }
  },

  getLastResult(): any | null {
    try {
      // First try to get from the direct storage
      const lastResult = localStorage.getItem('lastProcessingResult');
      if (lastResult) {
        const parsed = JSON.parse(lastResult);
        console.log('Found last processing result:', parsed);
        return parsed;
      }

      // Fallback to getting from full analyses
      try {
        const allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
        if (allAnalyses.length > 0) {
          const last = allAnalyses[allAnalyses.length - 1];
          console.log('Using last full analysis result:', last);
          
          return {
            success: last.success !== false,
            processed: true,
            summary: last.summary || { peaksDetected: 0, compoundsIdentified: 0, processingTime: "0" },
            results: last.results || [],
            processedData: last.processedData || []
          };
        }
      } catch (error) {
        console.warn('Failed to load from full analyses, trying lightweight:', error);
      }

      // Fallback to lightweight analyses
      try {
        const lightAnalyses = JSON.parse(localStorage.getItem('myAnalysesLight') || '[]');
        if (lightAnalyses.length > 0) {
          const last = lightAnalyses[lightAnalyses.length - 1];
          console.log('Using last lightweight analysis result:', last);
          
          return {
            success: last.success !== false,
            processed: true,
            summary: last.summary || { peaksDetected: 0, compoundsIdentified: 0, processingTime: "0" },
            results: last.results || [],
            processedData: []
          };
        }
      } catch (error) {
        console.warn('Failed to load from lightweight analyses:', error);
      }
      
      console.log('No analyses found in any storage');
      return null;
    } catch (error) {
      console.error('Error loading last result:', error);
      return null;
    }
  },
};
