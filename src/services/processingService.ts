
import { WorkflowEngine, WorkflowStep, WorkflowExecutionResult } from '../utils/workflowEngine';
import { ParsedMzData } from '../utils/mzParser';

export class ProcessingService {
  private engine: WorkflowEngine;
  private currentExecution: Promise<WorkflowExecutionResult> | null = null;

  constructor() {
    this.engine = new WorkflowEngine(this.onProgress.bind(this));
  }

  private onProgress(progress: number, currentStep: string) {
    console.log(`Processing progress: ${progress.toFixed(1)}% - ${currentStep}`);
    // You can emit events here for UI updates
    window.dispatchEvent(new CustomEvent('workflow-progress', {
      detail: { progress, currentStep }
    }));
  }

  async processWorkflow(
    steps: WorkflowStep[], 
    parsedData: ParsedMzData[]
  ): Promise<WorkflowExecutionResult> {
    if (this.currentExecution) {
      throw new Error('Another workflow is already running');
    }

    console.log('Starting workflow processing...');
    
    try {
      this.currentExecution = this.engine.executeWorkflow(steps, parsedData);
      const result = await this.currentExecution;
      
      console.log('Workflow processing completed:', result.summary);

      // Store only workflow summary and step metadata (not gigantic result objects)
      const lightResult = {
        success: result.success,
        summary: result.summary,
        totalProcessingTime: result.totalProcessingTime,
        results: result.results.map(r => ({
          stepId: r.stepId,
          stepName: r.stepName,
          success: r.success,
          metadata: r.metadata,
        })),
        // Do NOT store finalData or any giant arrays/raw spectra here!
        processed: true,
      };

      localStorage.setItem('lastWorkflowResult', JSON.stringify(lightResult));
      
      return result;
    } finally {
      this.currentExecution = null;
    }
  }

  getLastResult(): any {
    try {
      const stored = localStorage.getItem('lastWorkflowResult');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  isProcessing(): boolean {
    return this.currentExecution !== null;
  }
}

// Singleton instance
export const processingService = new ProcessingService();

