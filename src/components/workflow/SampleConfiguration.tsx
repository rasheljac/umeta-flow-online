
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SampleOrder {
  fileName: string;
  order: number;
}

interface SampleConfigurationProps {
  sampleType: "Serum" | "Tissue";
  onSampleTypeChange: (value: "Serum" | "Tissue") => void;
  sampleOrder: SampleOrder[];
  onSampleOrderChange: (order: SampleOrder[]) => void;
  uploadedFiles: { fileName: string }[];
}

const SampleConfiguration = ({
  sampleType,
  onSampleTypeChange,
  sampleOrder,
  onSampleOrderChange,
  uploadedFiles
}: SampleConfigurationProps) => {
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

  return (
    <>
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
      {renderSampleOrderControl()}
    </>
  );
};

export default SampleConfiguration;
