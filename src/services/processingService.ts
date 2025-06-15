
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
    
    // Validate input data
    if (!parsedData || parsedData.length === 0) {
      throw new Error("No data files provided for processing");
    }

    if (!workflowSteps || workflowSteps.length === 0) {
      throw new Error("No workflow steps defined");
    }

    console.log("Starting workflow:", workflowName);
    console.log("Workflow steps:", workflowSteps.map(s => s.name || s.type));
    console.log("Data files:", parsedData.map(d => d.fileName));

    // Initialize data that will be passed through the pipeline
    let processedData = parsedData.map(sample => ({
      ...sample,
      // Ensure required properties exist
      spectra: sample.spectra || [],
      chromatograms: sample.chromatograms || [],
      fileName: sample.fileName || 'unknown',
      totalSpectra: sample.totalSpectra || 0
    }));

    try {
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        const progress = ((i + 1) / workflowSteps.length) * 100;
        
        console.log(`Processing step ${i + 1}/${workflowSteps.length}: ${step.name || step.type}`);
        
        window.dispatchEvent(new CustomEvent('workflow-progress', {
          detail: { currentStep: `Running step: ${step.name || step.type}`, progress }
        }));

        try {
          switch (step.type) {
            case "peak_detection":
              console.log("Running Peak Detection...");
              const peakResult = await detectPeaks(processedData, step.parameters || {});
              if (!peakResult || !peakResult.data) {
                throw new Error("Peak detection failed to return valid data");
              }
              processedData = peakResult.data;
              peaksDetected = peakResult.peaksDetected || 0;
              results.push({ 
                stepName: "Peak Detection", 
                success: true, 
                message: peakResult.message || `Detected ${peaksDetected} peaks`
              });
              break;

            case "alignment":
              console.log("Running Peak Alignment...");
              const alignResult = await alignPeaks(processedData, step.parameters || {});
              if (!alignResult || !alignResult.data) {
                throw new Error("Peak alignment failed to return valid data");
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
              const filterResult = await filterData(processedData, step.parameters || {});
              if (!filterResult || !filterResult.data) {
                throw new Error("Data filtering failed to return valid data");
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
              const normalizeResult = await normalizeData(processedData, step.parameters || {});
              if (!normalizeResult || !normalizeResult.data) {
                throw new Error("Data normalization failed to return valid data");
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
                ...step.parameters,
                database: step.parameters?.database || "HMDB",
                mass_tolerance: mzTolerance,
                ms2DbContent
              });
              if (!identifyResult || !identifyResult.data) {
                throw new Error("Compound identification failed to return valid data");
              }
              processedData = identifyResult.data;
              compoundsIdentified = identifyResult.compoundsIdentified || 0;
              results.push({ 
                stepName: "Compound Identification", 
                success: true, 
                message: identifyResult.message || `Identified ${compoundsIdentified} compounds`
              });
              break;

            case "statistics":
              console.log("Running Statistical Analysis...");
              const statsResult = await performStatistics(processedData, step.parameters || {});
              if (!statsResult || !statsResult.data) {
                throw new Error("Statistical analysis failed to return valid data");
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
          
          // Small delay for UI feedback
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (stepError) {
          console.error(`Error in step ${step.name || step.type}:`, stepError);
          results.push({ 
            stepName: step.name || step.type, 
            success: false, 
            message: stepError instanceof Error ? stepError.message : "Unknown error"
          });
          // Continue with next step instead of failing completely
        }
      }

      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      const summary = {
        peaksDetected,
        compoundsIdentified,
        processingTime
      };

      // Store analysis with processed data in local storage
      const analysis = {
        workflowName: workflowName,
        date: new Date().toISOString(),
        summary: summary,
        steps: workflowSteps,
        results: results,
        processedData: processedData
      };
      
      let allAnalyses = [];
      try {
        allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
      } catch (error) {
        console.warn('Failed to parse existing analyses:', error);
        allAnalyses = [];
      }
      
      allAnalyses.push(analysis);
      localStorage.setItem('myAnalyses', JSON.stringify(allAnalyses));

      const hasFailures = results.some(r => !r.success);
      
      return { 
        success: !hasFailures, 
        summary: summary,
        results: results,
        processedData: processedData
      };

    } catch (error: any) {
      console.error("Error during workflow execution:", error);
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
          message: error.message || "Unknown workflow error"
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
        summary: last.summary,
        results: last.results || [],
        processedData: last.processedData || []
      };
    } catch (error) {
      console.error('Error loading last result:', error);
      return null;
    }
  },
};
