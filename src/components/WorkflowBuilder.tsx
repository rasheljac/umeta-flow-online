
import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileManagement from "./workflow/FileManagement";
import DatabaseUpload from "./workflow/DatabaseUpload";
import CompoundListUpload from "./workflow/CompoundListUpload";
import SampleConfiguration from "./workflow/SampleConfiguration";
import WorkflowStepCard from "./workflow/WorkflowStepCard";

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

  return (
    <div className="space-y-6">
      <FileManagement hasFiles={hasFiles} uploadedFiles={uploadedFiles} />

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

      <DatabaseUpload
        ms2DbFile={ms2DbFile}
        onMs2DbFileChange={onMs2DbFileChange}
        hasFiles={hasFiles}
      />

      <CompoundListUpload hasFiles={hasFiles} />

      <SampleConfiguration
        sampleType={sampleType}
        onSampleTypeChange={onSampleTypeChange}
        sampleOrder={sampleOrder}
        onSampleOrderChange={onSampleOrderChange}
        uploadedFiles={uploadedFiles}
      />

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
            <WorkflowStepCard
              key={step.id}
              step={step}
              index={index}
              onToggleExpanded={toggleStepExpanded}
              onRemoveStep={removeStep}
              onUpdateParameter={updateStepParameter}
            />
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
