
import { Spectrum, ParsedMzData } from './mzParser';
import { 
  detectPeaks, 
  alignPeaks, 
  filterData, 
  normalizeData, 
  identifyCompounds, 
  performStatistics 
} from './dataProcessing';

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  parameters: { [key: string]: any };
  expanded: boolean;
}

export interface ProcessingResult {
  stepId: string;
  stepName: string;
  success: boolean;
  data: any;
  metadata: {
    processingTime: number;
    peaksProcessed?: number;
    compoundsFound?: number;
    message?: string;
  };
}

export interface WorkflowExecutionResult {
  success: boolean;
  results: ProcessingResult[];
  finalData: any;
  totalProcessingTime: number;
  summary: {
    peaksDetected: number;
    compoundsIdentified: number;
    processingTime: number;
  };
}

export class WorkflowEngine {
  private onProgress?: (progress: number, currentStep: string) => void;

  constructor(onProgress?: (progress: number, currentStep: string) => void) {
    this.onProgress = onProgress;
  }

  async executeWorkflow(
    steps: WorkflowStep[], 
    parsedData: ParsedMzData[]
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const results: ProcessingResult[] = [];
    let currentData = parsedData;
    let totalPeaks = 0;
    let totalCompounds = 0;

    console.log(`Starting workflow execution with ${steps.length} steps`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      this.onProgress?.(((i + 1) / steps.length) * 100, step.name);
      console.log(`Executing step ${i + 1}/${steps.length}: ${step.name}`);

      try {
        let stepResult: any;
        
        switch (step.type) {
          case 'peak_detection':
            stepResult = await detectPeaks(currentData, step.parameters);
            totalPeaks = stepResult.peaksDetected || 0;
            break;
            
          case 'alignment':
            stepResult = await alignPeaks(currentData, step.parameters);
            break;
            
          case 'filtering':
            stepResult = await filterData(currentData, step.parameters);
            break;
            
          case 'normalization':
            stepResult = await normalizeData(currentData, step.parameters);
            break;
            
          case 'identification':
            stepResult = await identifyCompounds(currentData, step.parameters);
            totalCompounds = stepResult.compoundsIdentified || 0;
            break;
            
          case 'statistics':
            stepResult = await performStatistics(currentData, step.parameters);
            break;
            
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }

        const processingTime = Date.now() - stepStartTime;
        
        results.push({
          stepId: step.id,
          stepName: step.name,
          success: true,
          data: stepResult,
          metadata: {
            processingTime,
            peaksProcessed: stepResult.peaksProcessed,
            compoundsFound: stepResult.compoundsFound,
            message: stepResult.message
          }
        });

        currentData = stepResult.data || currentData;
        
      } catch (error) {
        console.error(`Error in step ${step.name}:`, error);
        
        results.push({
          stepId: step.id,
          stepName: step.name,
          success: false,
          data: null,
          metadata: {
            processingTime: Date.now() - stepStartTime,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });
        
        // Continue with next step even if one fails
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    
    console.log(`Workflow completed in ${totalProcessingTime}ms`);

    return {
      success: results.every(r => r.success),
      results,
      finalData: currentData,
      totalProcessingTime,
      summary: {
        peaksDetected: totalPeaks,
        compoundsIdentified: totalCompounds,
        processingTime: Math.round(totalProcessingTime / 1000)
      }
    };
  }
}
