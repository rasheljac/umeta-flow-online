import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { parseMzFile, ParsedMzData } from "@/utils/mzParser";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedMzData[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    handleFileUpload(acceptedFiles);
  }, [handleFileUpload]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'application/xml': ['.mzML', '.mzXML']
    },
    multiple: true
  });

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setParsingProgress(0);
    setParsedData([]);

    const newParsedData: ParsedMzData[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const parsed = await parseMzFile(file);
          newParsedData.push(parsed);
          setParsingProgress(((i + 1) / files.length) * 100);
        } catch (error) {
          console.error(`Failed to parse ${file.name}:`, error);
          // Continue with other files
        }
      }

      setParsedData(newParsedData);
      
      // Store parsed data in localStorage for workflow engine
      localStorage.setItem('uploadedMzData', JSON.stringify(newParsedData));
      
      onFileUpload(files);
      
      toast({
        title: "Files processed successfully",
        description: `Parsed ${newParsedData.length} files and detected ${newParsedData.reduce((sum, data) => sum + data.totalSpectra, 0)} spectra.`,
      });
      
    } catch (error) {
      console.error("File processing failed:", error);
      toast({
        title: "Processing failed",
        description: "Failed to process uploaded files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <Upload className="w-6 h-6 text-slate-500 mb-2" />
        <p className="text-slate-500 text-sm">
          {isDragActive ? "Drop the files here..." : "Drag 'n' drop some files here, or click to select files"}
        </p>
        <p className="text-slate-400 text-xs">Only .mzML and .mzXML files will be accepted</p>
      </div>

      {isProcessing && (
        <Progress value={parsingProgress} className="w-full" />
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files:</Label>
          <ul className="list-none pl-0">
            {files.map((file, index) => (
              <li key={index} className="py-2 px-3 bg-slate-50 rounded-md flex items-center justify-between">
                <span>{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file)}>
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
