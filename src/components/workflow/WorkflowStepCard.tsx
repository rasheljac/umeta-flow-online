
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import StepParameterInput from "./StepParameterInput";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  parameters: { [key: string]: any };
  expanded: boolean;
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  onToggleExpanded: (stepId: string) => void;
  onRemoveStep: (stepId: string) => void;
  onUpdateParameter: (stepId: string, paramName: string, value: any) => void;
}

const WorkflowStepCard = ({
  step,
  index,
  onToggleExpanded,
  onRemoveStep,
  onUpdateParameter
}: WorkflowStepCardProps) => {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <Collapsible
        open={step.expanded}
        onOpenChange={() => onToggleExpanded(step.id)}
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
                onClick={() => onRemoveStep(step.id)}
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
                  <StepParameterInput
                    step={step}
                    paramName={paramName}
                    paramValue={paramValue}
                    onUpdateParameter={onUpdateParameter}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default WorkflowStepCard;
