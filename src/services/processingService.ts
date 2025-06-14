
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
      
      // Store results in localStorage for persistence
      localStorage.setItem('lastWorkflowResult', JSON.stringify(result));
      
      return result;
    } finally {
      this.currentExecution = null;
    }
  }

  getLastResult(): WorkflowExecutionResult | null {
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
