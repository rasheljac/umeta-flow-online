// If not already present, add a definition for the options type:
interface WorkflowOptions {
  workflowName?: string;
  ms2DbContent?: string | null;
  sampleType?: string;
  sampleOrder?: { fileName: string; order: number }[];
  mzTolerance?: number;
  [key: string]: any;
}

export const processingService = {
  async processWorkflow(
    workflowSteps: any[],
    parsedData: any[],
    options?: WorkflowOptions
  ): Promise<{ success: boolean; summary: any }> {
    const workflowName = options?.workflowName ?? "Untitled Workflow";
    const mzTolerance = options?.mzTolerance ?? 0.01;
    const sampleType = options?.sampleType ?? "Serum";
    const sampleOrder = options?.sampleOrder ?? [];
    const ms2DbContent = options?.ms2DbContent ?? null;

    const startTime = performance.now();
    let peaksDetected = 0;
    let compoundsIdentified = 0;

    try {
      console.log("Starting workflow:", workflowName);
      console.log("Workflow steps:", workflowSteps);
      console.log("Data files:", parsedData.map(d => d.fileName));
      console.log("MS2 DB Content:", ms2DbContent ? 'Present' : 'Not present');
      console.log("Sample Type:", sampleType);
      console.log("Sample Order:", sampleOrder);

      for (const step of workflowSteps) {
        window.dispatchEvent(new CustomEvent('workflow-progress', {
          detail: { currentStep: `Running step: ${step.name}`, progress: 0 }
        }));

        switch (step.name) {
          case "Peak Detection":
            console.log("Running Peak Detection...");
            peaksDetected = parsedData.reduce((sum, data) => sum + data.mz.length, 0);
            break;

          case "Retention Time Correction":
            console.log("Running Retention Time Correction...");
            // Placeholder for retention time correction logic
            break;

          case "Compound Identification":
            console.log("Running Compound Identification...");
            compoundsIdentified = Math.floor(Math.random() * 10); // Simulate compound identification
            break;

          case "Normalization":
            console.log("Running Normalization...");
            // Placeholder for normalization logic
            break;

          case "Statistical Analysis":
            console.log("Running Statistical Analysis...");
            // Placeholder for statistical analysis logic
            break;

          default:
            console.warn(`Unknown workflow step: ${step.name}`);
        }
        
        // Simulate progress
        await new Promise(resolve => setTimeout(resolve, 500));
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
        steps: workflowSteps
      };
      
      let allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
      allAnalyses.push(analysis);
      localStorage.setItem('myAnalyses', JSON.stringify(allAnalyses));

      return { success: true, summary: summary };

    } catch (error: any) {
      console.error("Error during workflow execution:", error);
      return { success: false, summary: { error: error.message } };
    }
  },

  getLastResult(): any | null {
    const allAnalyses = JSON.parse(localStorage.getItem('myAnalyses') || '[]');
    if (!allAnalyses.length) return null;
    const last = allAnalyses[allAnalyses.length - 1];
    // Optionally, format if needed:
    return last;
  },
};
