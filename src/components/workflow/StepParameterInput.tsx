
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  parameters: { [key: string]: any };
  expanded: boolean;
}

interface StepParameterInputProps {
  step: WorkflowStep;
  paramName: string;
  paramValue: any;
  onUpdateParameter: (stepId: string, paramName: string, value: any) => void;
}

const StepParameterInput = ({ step, paramName, paramValue, onUpdateParameter }: StepParameterInputProps) => {
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
          onChange={e => onUpdateParameter(step.id, paramName, parseFloat(e.target.value))}
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
            onValueChange={([value]) => onUpdateParameter(step.id, paramName, value)}
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
            onChange={(e) => onUpdateParameter(step.id, paramName, parseFloat(e.target.value))}
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
            onValueChange={(value) => onUpdateParameter(step.id, paramName, value)}
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
            onChange={(e) => onUpdateParameter(step.id, paramName, e.target.value)}
          />
        </div>
      );
    }
  }
  return null;
};

export default StepParameterInput;
