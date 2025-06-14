import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { parseMzFile, ParsedMzData } from "@/utils/mzParser";

interface ProcessedFile extends File {
  parsedData?: ParsedMzData;
  parseError?: string;
}

interface FileUploadProps {
  onFileUpload: (files: ProcessedFile[]) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [parseProgress, setParseProgress] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['.mzml', '.mzxml', '.csv', '.txt', '.xlsx'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Please upload mzML, mzXML, CSV, TXT, or XLSX files only.",
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      const processedFiles: ProcessedFile[] = [];

      for (const file of validFiles) {
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Start parsing if it's an mz file
            if (file.name.toLowerCase().includes('mz')) {
              setParseProgress(prev => ({ ...prev, [file.name]: true }));
              parseMzFileData(file, processedFiles);
            }
          }
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }, 200);

        processedFiles.push(file as ProcessedFile);
      }

      setUploadedFiles(prev => [...prev, ...processedFiles]);

      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) ready for processing.`
      });
    }
  };

  const parseMzFileData = async (file: File, processedFiles: ProcessedFile[]) => {
    try {
      console.log(`Starting to parse ${file.name}...`);
      const parsedData = await parseMzFile(file);
      
      // Update the file with parsed data
      const fileIndex = processedFiles.findIndex(f => f.name === file.name);
      if (fileIndex !== -1) {
        processedFiles[fileIndex].parsedData = parsedData;
      }

      setUploadedFiles(prev => {
        const updated = prev.map(f => 
          f.name === file.name ? { ...f, parsedData } : f
        );
        onFileUpload(updated);
        return updated;
      });

      setParseProgress(prev => ({ ...prev, [file.name]: false }));

      toast({
        title: "File parsed successfully",
        description: `${file.name}: Found ${parsedData.totalSpectra} spectra`
      });

      console.log(`Parsed ${file.name}:`, parsedData);
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      
      setUploadedFiles(prev => {
        const updated = prev.map(f => 
          f.name === file.name ? { ...f, parseError: errorMessage } : f
        );
        onFileUpload(updated);
        return updated;
      });

      setParseProgress(prev => ({ ...prev, [file.name]: false }));

      toast({
        title: "Parsing failed",
        description: `${file.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileName: string) => {
    const newFiles = uploadedFiles.filter(file => file.name !== fileName);
    setUploadedFiles(newFiles);
    onFileUpload(newFiles);
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-slate-300 hover:border-slate-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Upload your metabolomics data
        </h3>
        <p className="text-slate-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Supported formats: mzML, mzXML, CSV, TXT, XLSX
        </p>
        <input
          type="file"
          multiple
          accept=".mzml,.mzxml,.csv,.txt,.xlsx"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <Button asChild className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
          <label htmlFor="file-upload" className="cursor-pointer">
            Select Files
          </label>
        </Button>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">{formatFileSize(file.size)}</p>
                  {file.parsedData && (
                    <p className="text-xs text-green-600">
                      Parsed: {file.parsedData.totalSpectra} spectra, MS levels {file.parsedData.msLevels.join(', ')}
                    </p>
                  )}
                  {file.parseError && (
                    <p className="text-xs text-red-600">Parse error: {file.parseError}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 ? (
                  <div className="w-24">
                    <Progress value={uploadProgress[file.name]} className="h-2" />
                  </div>
                ) : parseProgress[file.name] ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-blue-600">Parsing...</span>
                  </div>
                ) : file.parseError ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.name)}
                  className="text-slate-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
