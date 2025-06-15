
import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompoundListUploadProps {
  hasFiles: boolean;
}

const CompoundListUpload = ({ hasFiles }: CompoundListUploadProps) => {
  const [compoundListFile, setCompoundListFile] = useState<File | null>(null);
  const [compoundListData, setCompoundListData] = useState<any[]>([]);
  const { toast } = useToast();

  const handleCompoundListChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setCompoundListFile(file);
      
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const requiredHeaders = ['compound', 'formula', 'id', 'rt', 'category'];
        const hasAllHeaders = requiredHeaders.every(header => 
          headers.some(h => h.toLowerCase().includes(header))
        );
        
        if (!hasAllHeaders) {
          toast({
            title: "Invalid CSV format",
            description: "CSV must contain columns: compound, formula, id, rt, category",
            variant: "destructive"
          });
          setCompoundListFile(null);
          setCompoundListData([]);
          return;
        }
        
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const entry: any = {};
          headers.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase();
            if (normalizedHeader.includes('compound')) entry.compound = values[index];
            else if (normalizedHeader.includes('formula')) entry.formula = values[index];
            else if (normalizedHeader.includes('id')) entry.id = values[index];
            else if (normalizedHeader.includes('rt')) entry.rt = parseFloat(values[index]) || 0;
            else if (normalizedHeader.includes('category')) entry.category = values[index];
          });
          return entry;
        }).filter(entry => entry.compound && entry.formula);
        
        setCompoundListData(data);
        localStorage.setItem('compoundListData', JSON.stringify(data));
        
        toast({
          title: "Compound list uploaded",
          description: `Successfully loaded ${data.length} compounds for MS1 identification`,
        });
        
      } catch (error) {
        console.error('Failed to parse compound list:', error);
        toast({
          title: "Upload failed",
          description: "Failed to parse the CSV file. Please check the format.",
          variant: "destructive"
        });
        setCompoundListFile(null);
        setCompoundListData([]);
      }
    } else {
      setCompoundListFile(null);
      setCompoundListData([]);
      localStorage.removeItem('compoundListData');
    }
  };

  const handleRemoveCompoundList = () => {
    setCompoundListFile(null);
    setCompoundListData([]);
    localStorage.removeItem('compoundListData');
    toast({
      title: "Compound list removed",
      description: "Compound list has been removed from the workflow.",
    });
  };

  return (
    <div>
      <Label htmlFor="compound-list-upload" className="mb-1 block font-bold">
        Compound List (CSV, for MS1 identification)
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="compound-list-upload"
          type="file"
          accept=".csv"
          className="w-auto"
          onChange={handleCompoundListChange}
          disabled={!hasFiles}
        />
        {compoundListFile && (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700">{compoundListFile.name}</span>
            <span className="text-xs text-slate-600">({compoundListData.length} compounds)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCompoundList}
              className="text-red-500 hover:text-red-700 p-1 h-auto"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        CSV format: compound, formula, id, rt, category
      </div>
      {compoundListData.length > 0 && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <div className="font-medium text-green-800">Preview (first 3 compounds):</div>
          {compoundListData.slice(0, 3).map((compound, idx) => (
            <div key={idx} className="text-green-700 text-xs">
              {compound.compound} ({compound.formula}) - RT: {compound.rt}min
            </div>
          ))}
          {compoundListData.length > 3 && (
            <div className="text-green-600 text-xs">
              ...and {compoundListData.length - 3} more compounds
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompoundListUpload;
