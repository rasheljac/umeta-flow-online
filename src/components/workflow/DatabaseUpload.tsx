
import { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatabaseUploadProps {
  ms2DbFile: File | null;
  onMs2DbFileChange: (file: File | null) => void;
  hasFiles: boolean;
}

const DatabaseUpload = ({ ms2DbFile, onMs2DbFileChange, hasFiles }: DatabaseUploadProps) => {
  const handleDbFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onMs2DbFileChange(event.target.files[0]);
    } else {
      onMs2DbFileChange(null);
    }
  };

  return (
    <div>
      <Label htmlFor="ms2db-upload" className="mb-1 block font-bold">
        Compound Database (MS2, for spectral matching)
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="ms2db-upload"
          type="file"
          accept=".json,.msp,.mgf"
          className="w-auto"
          onChange={handleDbFileChange}
          disabled={!hasFiles}
        />
        {ms2DbFile && (
          <span className="text-xs text-green-700">{ms2DbFile.name}</span>
        )}
      </div>
      <span className="text-xs text-slate-500">Supported: .json, .mgf, .msp</span>
    </div>
  );
};

export default DatabaseUpload;
