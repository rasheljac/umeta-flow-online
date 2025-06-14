import { useState, useEffect, ChangeEvent } from "react";
import { Plus, Settings, Trash2, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  parameters: { [key: string]: any };
  expanded: boolean;
}

interface SampleOrder {
  fileName: string;
  order: number;
}

interface WorkflowBuilderProps {
  steps: WorkflowStep[];
  onStepsChange: (steps: WorkflowStep[]) => void;
  hasFiles: boolean;
  uploadedFiles?: { fileName: string }[];
  sampleType: "Serum" | "Tissue";
  onSampleTypeChange: (value: "Serum" | "Tissue") => void;
  sampleOrder: SampleOrder[];
  onSampleOrderChange: (order: SampleOrder[]) => void;
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  ms2DbFile: File | null;
  onMs2DbFileChange: (file: File | null) => void;
}

const availableSteps = [
  {
    type: "peak_detection",
    name: "Peak Detection",
    description: "Detect peaks in MS data",
    parameters: {
      noise_threshold: 1000,
      min_peak_width: 0.1,
      max_peak_width: 2.0
    }
  },
  {
    type: "alignment",
    name: "Peak Alignment",
    description: "Align peaks across samples",
    parameters: {
      mz_tolerance: 0.01,
      rt_tolerance: 0.5
    }
  },
  {
    type: "filtering",
    name: "Data Filtering",
    description: "Filter and clean the data",
    parameters: {
      min_intensity: 500,
      cv_threshold: 0.3
    }
  },
  {
    type: "normalization",
    name: "Data Normalization",
    description: "Normalize peak intensities",
    parameters: {
      method: "median",
      reference_method: "internal_standard"
    }
  },
  {
    type: "identification",
    name: "Compound Identification",
    description: "Identify compounds using databases",
    parameters: {
      database: "hmdb",
      mass_tolerance: 0.005
    }
  },
  {
    type: "statistics",
    name: "Statistical Analysis",
    description: "Perform statistical tests",
    parameters: {
      test_type: "t_test",
      p_value_threshold: 0.05
    }
  }
];

const WorkflowBuilder = ({
  steps,
  onStepsChange,
  hasFiles,
  uploadedFiles = [],
  sampleType,
  onSampleTypeChange,
  sampleOrder,
  onSampleOrderChange,
  workflowName,
  onWorkflowNameChange,
  ms2DbFile,
  onMs2DbFileChange
}: WorkflowBuilderProps) => {
  const [selectedStepType, setSelectedStepType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!uploadedFiles.length) return;
    if (sampleOrder.length !== uploadedFiles.length) {
      const initialOrder = uploadedFiles.map((f, i) => ({
        fileName: f.fileName,
        order: i + 1,
      }));
      onSampleOrderChange(initialOrder);
    }
  }, [uploadedFiles.length]);

  const addStep = () => {
    if (!selectedStepType) return;
    const stepTemplate = availableSteps.find(s => s.type === selectedStepType);
    if (!stepTemplate) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: stepTemplate.type,
      name: stepTemplate.name,
      parameters: { ...stepTemplate.parameters },
      expanded: false
    };

    onStepsChange([...steps, newStep]);
    setSelectedStepType("");
  };

  const removeStep = (stepId: string) => {
    onStepsChange(steps.filter(step => step.id !== stepId));
  };

  const updateStepParameter = (stepId: string, paramName: string, value: any) => {
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          parameters: {
            ...step.parameters,
            [paramName]: value
          }
        };
      }
      return step;
    });
    onStepsChange(updatedSteps);
  };

  const toggleStepExpanded = (stepId: string) => {
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return { ...step, expanded: !step.expanded };
      }
      return step;
    });
    onStepsChange(updatedSteps);
  };

  // New: handle mz_tolerance as free text/numeric input for identification step
  const renderParameterInput = (step: WorkflowStep, paramName: string, paramValue: any) => {
    if (step.type === "identification" && paramName === "mass_tolerance") {
      return (
        <div className="space-y-2">
          <Label htmlFor={`${step.id}_${paramName}`}>m/z tolerance</Label>
          <Input
            id={`${step.id}_${paramName}`}
            type="number"
            step="0.0001"
            min={0}
            value={paramValue}
            onChange={e => updateStepParameter(step.id, paramName, parseFloat(e.target.value))}
          />
        </div>
      );
    }
    if (typeof paramValue === 'number') {
      if (paramName.includes('threshold') || paramName.includes('tolerance')) {
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={`${step.id}_${paramName}`}>{paramName.replace(/_/g, ' ')}</Label>
              <span className="text-sm text-slate-600">{paramValue}</span>
            </div>
            <Slider
              id={`${step.id}_${paramName}`}
              value={[paramValue]}
              onValueChange={([value]) => updateStepParameter(step.id, paramName, value)}
              max={paramName.includes('noise') ? 10000 : 5}
              min={0}
              step={paramName.includes('noise') ? 100 : 0.01}
              className="w-full"
            />
          </div>
        );
      } else {
        return (
          <div className="space-y-2">
            <Label htmlFor={`${step.id}_${paramName}`}>{paramName.replace(/_/g, ' ')}</Label>
            <Input
              id={`${step.id}_${paramName}`}
              type="number"
              value={paramValue}
              onChange={(e) => updateStepParameter(step.id, paramName, parseFloat(e.target.value))}
              step={0.001}
            />
          </div>
        );
      }
    } else if (typeof paramValue === 'string') {
      if (paramName === 'method' || paramName === 'database' || paramName === 'test_type') {
        const options = {
          method: ['median', 'mean', 'quantile'],
          database: ['hmdb', 'kegg', 'chemspider'],
          test_type: ['t_test', 'wilcoxon', 'anova'],
          reference_method: ['internal_standard', 'total_intensity', 'median']
        };

        return (
          <div className="space-y-2">
            <Label>{paramName.replace(/_/g, ' ')}</Label>
            <Select
              value={paramValue}
              onValueChange={(value) => updateStepParameter(step.id, paramName, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options[paramName as keyof typeof options] || []).map(option => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      } else {
        return (
          <div className="space-y-2">
            <Label htmlFor={`${step.id}_${paramName}`}>{paramName.replace(/_/g, ' ')}</Label>
            <Input
              id={`${step.id}_${paramName}`}
              value={paramValue}
              onChange={(e) => updateStepParameter(step.id, paramName, e.target.value)}
            />
          </div>
        );
      }
    }
    return null;
  };

  const renderSampleTypeControl = () => (
    <div className="flex flex-col md:flex-row gap-4 md:items-end mt-2 mb-4">
      <div>
        <Label htmlFor="sample-type">Sample Type</Label>
        <Select
          value={sampleType}
          onValueChange={v => onSampleTypeChange(v as "Serum" | "Tissue")}
        >
          <SelectTrigger className="mt-1 w-48">
            <SelectValue placeholder="Select sample type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Serum">Serum</SelectItem>
            <SelectItem value="Tissue">Tissue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSampleOrderControl = () => {
    if (sampleType !== "Serum" || !uploadedFiles.length) return null;
    return (
      <div className="mb-6">
        <Label>Sample Order (for Time Series Analysis)</Label>
        <div className="flex flex-col gap-2 mt-2">
          {sampleOrder.map((item, idx) => (
            <div className="flex gap-2 items-center" key={item.fileName}>
              <span className="w-6 text-right text-xs">{idx + 1}.</span>
              <span className="flex-1 truncate">{item.fileName}</span>
              <Input
                type="number"
                className="w-20"
                min={1}
                max={sampleOrder.length}
                value={item.order}
                onChange={e => {
                  const newOrder = parseInt(e.target.value) || 1;
                  const updated = sampleOrder.map(o =>
                    o.fileName === item.fileName ? { ...o, order: Math.max(1, Math.min(newOrder, sampleOrder.length)) } : o
                  );
                  onSampleOrderChange(updated);
                }}
              />
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Adjust the order for longitudinal (time series) analysis.
        </div>
      </div>
    );
  };

  // NEW: workflow name input and ms2 db upload
  const handleDbFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onMs2DbFileChange(event.target.files[0]);
    } else {
      onMs2DbFileChange(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Name */}
      <div className="mb-2">
        <Label htmlFor="workflow-name" className="mb-1 block font-bold">
          Workflow Name
          <span className="text-red-600">*</span>
        </Label>
        <Input
          id="workflow-name"
          value={workflowName}
          onChange={e => onWorkflowNameChange(e.target.value)}
          placeholder="Give your workflow a name"
          required
          className="w-full md:w-72"
          maxLength={80}
        />
      </div>

      {/* Compound MS2 DB upload */}
      <div>
        <Label htmlFor="ms2db-upload" className="mb-1 block font-bold">Compound Database (MS2, for spectral matching)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="ms2db-upload"
            type="file"
            accept=".json,.msp,.mgf"
            className="w-auto"
            onChange={handleDbFileChange}
            disabled={!hasFiles}
          />
          {ms2DbFile &&
            <span className="text-xs text-green-700">{ms2DbFile.name}</span>
          }
        </div>
        <span className="text-xs text-slate-500">Supported: .json, .mgf, .msp</span>
      </div>

      {/* Sample type and ordering */}
      {renderSampleTypeControl()}
      {renderSampleOrderControl()}

      {/* Add Step Section */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label>Add Analysis Step</Label>
          <Select value={selectedStepType} onValueChange={setSelectedStepType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a processing step..." />
            </SelectTrigger>
            <SelectContent>
              {availableSteps.map(step => (
                <SelectItem key={step.type} value={step.type}>
                  <div>
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-slate-600">{step.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={addStep}
          disabled={!selectedStepType || !hasFiles}
          className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Step
        </Button>
      </div>

      {/* Workflow Steps */}
      {steps.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Analysis Pipeline ({steps.length} steps)</h3>
          {steps.map((step, index) => (
            <Card key={step.id} className="border-l-4 border-l-blue-500">
              <Collapsible
                open={step.expanded}
                onOpenChange={() => toggleStepExpanded(step.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg">{step.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          {step.expanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(step.parameters).map(([paramName, paramValue]) => (
                        <div key={paramName}>
                          {renderParameterInput(step, paramName, paramValue)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {steps.length === 0 && hasFiles && (
        <div className="text-center py-12 text-slate-500">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No analysis steps added yet.</p>
          <p className="text-sm">Add processing steps to build your workflow.</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;

// NOTE: This file is getting long and should be refactored into subcomponents soon!
