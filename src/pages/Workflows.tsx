
import { Settings, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import { useState, useEffect } from "react";
import { processingService } from "@/services/processingService";
import { ParsedMzData } from "@/utils/mzParser";
import { useToast } from "@/hooks/use-toast";

const Workflows = () => {
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const { toast } = useToast();

  // New: hold sample type and sample order for time series
  const [sampleType, setSampleType] = useState<"Serum" | "Tissue">("Serum");
  const [sampleOrder, setSampleOrder] = useState<{ fileName: string; order: number }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ fileName: string }[]>([]);

  useEffect(() => {
    const handleProgress = (event: any) => {
      setProgress(event.detail.progress);
      setCurrentStep(event.detail.currentStep);
    };

    window.addEventListener('workflow-progress', handleProgress);
    return () => window.removeEventListener('workflow-progress', handleProgress);
  }, []);

  // Load uploaded files (fileName) for file ordering
  useEffect(() => {
    const uploaded = localStorage.getItem('uploadedMzData');
    if (uploaded) {
      try {
        const parsed: ParsedMzData[] = JSON.parse(uploaded);
        const files = parsed.map(f => ({ fileName: f.fileName }));
        setUploadedFiles(files);
      } catch {}
    } else {
      setUploadedFiles([]);
    }
  }, []);

  const handleRunWorkflow = async () => {
    if (workflowSteps.length === 0) {
      toast({
        title: "No workflow steps",
        description: "Please add at least one processing step to your workflow.",
        variant: "destructive"
      });
      return;
    }

    const uploadedFilesData = localStorage.getItem('uploadedMzData');
    if (!uploadedFilesData) {
      toast({
        title: "No data files",
        description: "Please upload data files before running the workflow.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      
      const parsedData: ParsedMzData[] = JSON.parse(uploadedFilesData);

      // Optionally, you can process with sampleOrder if required and "Serum"
      if (sampleType === "Serum" && sampleOrder.length === uploadedFiles.length) {
        // Reorder parsedData according to sampleOrder
        parsedData.sort((a, b) => {
          const orderA = sampleOrder.find(o => o.fileName === a.fileName)?.order ?? 0;
          const orderB = sampleOrder.find(o => o.fileName === b.fileName)?.order ?? 0;
          return orderA - orderB;
        });
      }
      
      toast({
        title: "Workflow started",
        description: "Processing your metabolomics data...",
      });

      const result = await processingService.processWorkflow(workflowSteps, parsedData);
      
      if (result.success) {
        toast({
          title: "Workflow completed successfully",
          description: `Processed ${result.summary.peaksDetected} peaks and identified ${result.summary.compoundsIdentified} compounds in ${result.summary.processingTime}s.`,
        });
      } else {
        toast({
          title: "Workflow completed with errors",
          description: "Some processing steps failed. Check the results for details.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error("Workflow execution failed:", error);
      toast({
        title: "Workflow failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const hasFiles = !!localStorage.getItem('uploadedMzData');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">Workflow Management</h1>
            </div>
            <Button 
              onClick={handleRunWorkflow}
              disabled={!hasFiles || workflowSteps.length === 0 || isProcessing}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isProcessing ? `Processing... ${progress.toFixed(0)}%` : "Run Workflow"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Build Your Analysis Workflow
          </h2>
          <p className="text-lg text-slate-600">
            Create custom processing pipelines for your metabolomics data
          </p>
          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 font-medium">{currentStep}</span>
                <span className="text-blue-600">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Workflow Builder</span>
            </CardTitle>
            <Button variant="outline" size="sm" disabled={isProcessing}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            <WorkflowBuilder 
              steps={workflowSteps} 
              onStepsChange={setWorkflowSteps}
              hasFiles={hasFiles}
              uploadedFiles={uploadedFiles}
              sampleType={sampleType}
              onSampleTypeChange={setSampleType}
              sampleOrder={sampleOrder}
              onSampleOrderChange={setSampleOrder}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Workflows;
