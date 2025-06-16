import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateExactMassFromFormula } from '@/utils/massCalculations';

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
        
        if (lines.length === 0) {
          throw new Error('File is empty');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        console.log('CSV headers found:', headers);
        
        // More flexible header checking
        const requiredFields = ['compound', 'formula'];
        const hasRequiredFields = requiredFields.every(field => 
          headers.some(h => h.includes(field.toLowerCase()))
        );
        
        if (!hasRequiredFields) {
          toast({
            title: "Invalid CSV format",
            description: "CSV must contain at least 'compound' and 'formula' columns",
            variant: "destructive"
          });
          setCompoundListFile(null);
          setCompoundListData([]);
          return;
        }
        
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const entry: any = {};
          
          headers.forEach((header, headerIndex) => {
            const value = values[headerIndex] || '';
            if (header.includes('compound') || header.includes('name')) {
              entry.compound = value;
              entry.name = value; // Support both field names
            } else if (header.includes('formula')) {
              entry.formula = value;
            } else if (header.includes('id')) {
              entry.id = value;
            } else if (header.includes('rt') || header.includes('time')) {
              entry.rt = parseFloat(value) || 0;
            } else if (header.includes('category') || header.includes('class')) {
              entry.category = value;
            } else if (header.includes('mass')) {
              entry.mass = parseFloat(value) || 0;
            }
          });
          
          // Calculate mass from formula if not provided using enhanced function
          if (!entry.mass && entry.formula) {
            entry.mass = calculateExactMassFromFormula(entry.formula);
            console.log(`Calculated mass for ${entry.compound}: ${entry.mass} from formula: ${entry.formula}`);
          }
          
          return entry;
        }).filter(entry => entry.compound && entry.formula && entry.mass > 0);
        
        console.log(`Processed ${data.length} valid compounds from CSV`);
        console.log('Sample compounds:', data.slice(0, 3));
        
        setCompoundListData(data);
        localStorage.setItem('compoundListData', JSON.stringify(data));
        
        toast({
          title: "Compound list uploaded",
          description: `Successfully loaded ${data.length} compounds with calculated exact masses for MS1 identification`,
        });
        
      } catch (error) {
        console.error('Failed to parse compound list:', error);
        toast({
          title: "Upload failed",
          description: `Failed to parse the CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        CSV format: compound, formula (+ optional: id, rt, category, mass)
      </div>
      {compoundListData.length > 0 && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <div className="font-medium text-green-800">Preview (first 3 compounds):</div>
          {compoundListData.slice(0, 3).map((compound, idx) => (
            <div key={idx} className="text-green-700 text-xs">
              {compound.compound} ({compound.formula}) - Mass: {compound.mass?.toFixed(4)} Da
              {compound.rt > 0 && ` - RT: ${compound.rt}min`}
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
