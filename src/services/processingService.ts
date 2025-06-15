
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

    try {
      console.log("Starting workflow:", workflowName);
      console.log("Workflow steps:", workflowSteps);
      console.log("Data files:", parsedData.map(d => d.fileName));
      console.log("MS2 DB Content:", ms2DbContent ? 'Present' : 'Not present');
      console.log("Sample Type:", sampleType);
      console.log("Sample Order:", sampleOrder);

      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        const progress = ((i + 1) / workflowSteps.length) * 100;
        
        window.dispatchEvent(new CustomEvent('workflow-progress', {
          detail: { currentStep: `Running step: ${step.name}`, progress }
        }));

        try {
          switch (step.type) {
            case "peak_detection":
              console.log("Running Peak Detection...");
              peaksDetected = parsedData.reduce((sum, data) => sum + (data.spectra?.length || 0), 0);
              results.push({ stepName: "Peak Detection", success: true });
              break;

            case "alignment":
              console.log("Running Peak Alignment...");
              results.push({ stepName: "Peak Alignment", success: true });
              break;

            case "filtering":
              console.log("Running Data Filtering...");
              results.push({ stepName: "Data Filtering", success: true });
              break;

            case "normalization":
              console.log("Running Data Normalization...");
              results.push({ stepName: "Data Normalization", success: true });
              break;

            case "identification":
              console.log("Running Compound Identification...");
              compoundsIdentified = Math.floor(Math.random() * 50) + 10;
              results.push({ stepName: "Compound Identification", success: true });
              break;

            case "statistics":
              console.log("Running Statistical Analysis...");
              results.push({ stepName: "Statistical Analysis", success: true });
              break;

            default:
              console.warn(`Unknown workflow step: ${step.name}`);
              results.push({ 
                stepName: step.name, 
                success: false, 
                message: "Unknown step type" 
              });
          }
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (stepError) {
          console.error(`Error in step ${step.name}:`, stepError);
          results.push({ 
            stepName: step.name, 
            success: false, 
            message: stepError instanceof Error ? stepError.message : "Unknown error"
          });
        }
      }

      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      const summary = {
        peaksDetected,
        compoundsIdentified,
        processingTime
      };

      // Store analysis in local storage
      const analysis = {
        workflowName: workflowName,
        date: new Date().toISOString(),
        summary: summary,
        steps: workflowSteps,
        results: results
      };
      
      let allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
      allAnalyses.push(analysis);
      localStorage.setItem('myAnalyses', JSON.stringify(allAnalyses));

      return { 
        success: true, 
        summary: summary,
        results: results
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
          message: error.message 
        }]
      };
    }
  },

  getLastResult(): any | null {
    try {
      const allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
      if (!allAnalyses.length) return null;
      const last = allAnalyses[allAnalyses.length - 1];
      
      // Format the result to match expected structure
      return {
        success: true,
        processed: true,
        summary: last.summary,
        results: last.results || []
      };
    } catch (error) {
      console.error('Error loading last result:', error);
      return null;
    }
  },
};
