
import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { parseMzFile, ParsedMzData } from "@/utils/mzParser";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Json } from "@/integrations/supabase/types";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedMzData[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('ms-files')
      .upload(fileName, file);

    if (error) {
      console.error('Storage upload error:', error);
      toast({
        title: "Storage upload failed",
        description: `Failed to upload ${file.name}: ${error.message}`,
        variant: "destructive"
      });
      return null;
    }

    console.log('File uploaded to storage:', data.path);
    return data.path;
  };

  const saveSampleToDatabase = async (parsedData: ParsedMzData, filePath: string, fileSize: number) => {
    if (!user) return null;

    console.log('Saving sample to database:', parsedData.fileName);
    
    const { data: sample, error: sampleError } = await supabase
      .from('samples')
      .insert({
        user_id: user.id,
        file_name: parsedData.fileName,
        file_path: filePath,
        file_size: fileSize,
        instrument_model: parsedData.instrumentModel,
        total_spectra: parsedData.totalSpectra,
        ms_levels: parsedData.msLevels,
        rt_range_min: parsedData.rtRange.min,
        rt_range_max: parsedData.rtRange.max,
        status: 'completed'
      })
      .select()
      .single();

    if (sampleError) {
      console.error('Sample insert error:', sampleError);
      toast({
        title: "Database error",
        description: `Failed to save sample: ${sampleError.message}`,
        variant: "destructive"
      });
      return null;
    }

    console.log('Sample saved with ID:', sample.id);

    // Save spectra
    if (parsedData.spectra.length > 0) {
      console.log(`Saving ${parsedData.spectra.length} spectra...`);
      
      const spectraToInsert = parsedData.spectra.map(spectrum => ({
        sample_id: sample.id,
        scan_number: spectrum.scanNumber,
        ms_level: spectrum.msLevel,
        retention_time: spectrum.retentionTime,
        base_peak_mz: spectrum.basePeakMz,
        base_peak_intensity: spectrum.basePeakIntensity,
        total_ion_current: spectrum.totalIonCurrent,
        peaks: spectrum.peaks as unknown as Json
      }));

      const { error: spectraError } = await supabase
        .from('spectra')
        .insert(spectraToInsert);

      if (spectraError) {
        console.error('Spectra insert error:', spectraError);
        toast({
          title: "Database error",
          description: `Failed to save spectra: ${spectraError.message}`,
          variant: "destructive"
        });
      } else {
        console.log('Spectra saved successfully');
      }
    }

    // Save chromatograms
    if (parsedData.chromatograms.length > 0) {
      console.log(`Saving ${parsedData.chromatograms.length} chromatograms...`);
      
      const chromatogramsToInsert = parsedData.chromatograms.map(chrom => ({
        sample_id: sample.id,
        chromatogram_id: chrom.id,
        time_array: chrom.timeArray,
        intensity_array: chrom.intensityArray,
        precursor_mz: chrom.precursorMz
      }));

      const { error: chromError } = await supabase
        .from('chromatograms')
        .insert(chromatogramsToInsert);

      if (chromError) {
        console.error('Chromatograms insert error:', chromError);
        toast({
          title: "Database error",
          description: `Failed to save chromatograms: ${chromError.message}`,
          variant: "destructive"
        });
      } else {
        console.log('Chromatograms saved successfully');
      }
    }

    return sample;
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0 || !user) return;

    console.log(`Starting upload of ${files.length} files...`);
    setIsProcessing(true);
    setParsingProgress(0);
    setParsedData([]);

    const newParsedData: ParsedMzData[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
        
        try {
          // Parse the file
          console.log('Parsing file...');
          const parsed = await parseMzFile(file);
          console.log('File parsed successfully:', {
            spectra: parsed.totalSpectra,
            chromatograms: parsed.chromatograms.length
          });
          
          newParsedData.push(parsed);
          
          // Upload to storage
          console.log('Uploading to storage...');
          const filePath = await uploadFileToStorage(file);
          
          if (filePath) {
            // Save to database
            console.log('Saving to database...');
            await saveSampleToDatabase(parsed, filePath, file.size);
          }
          
          setParsingProgress(((i + 1) / files.length) * 100);
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          toast({
            title: "File processing failed",
            description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      }

      setParsedData(newParsedData);
      
      // Store parsed data in localStorage for workflow engine
      localStorage.setItem('uploadedMzData', JSON.stringify(newParsedData));
      
      onFileUpload(files);
      
      toast({
        title: "Files processed successfully",
        description: `Uploaded and parsed ${newParsedData.length} files with ${newParsedData.reduce((sum, data) => sum + data.totalSpectra, 0)} spectra.`,
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles.map(f => f.name));
    setFiles(acceptedFiles);
    handleFileUpload(acceptedFiles);
  }, [user]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'application/xml': ['.mzML', '.mzXML']
    },
    multiple: true,
    disabled: !user || isProcessing
  });

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Please sign in to upload files</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <Upload className="w-6 h-6 text-slate-500 mb-2" />
        <p className="text-slate-500 text-sm text-center">
          {isDragActive ? "Drop the files here..." : "Drag 'n' drop some files here, or click to select files"}
        </p>
        <p className="text-slate-400 text-xs">Only .mzML and .mzXML files will be accepted</p>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing files...</span>
            <span>{parsingProgress.toFixed(0)}%</span>
          </div>
          <Progress value={parsingProgress} className="w-full" />
        </div>
      )}

      {files.length > 0 && !isProcessing && (
        <div className="space-y-2">
          <Label>Uploaded Files:</Label>
          <ul className="list-none pl-0">
            {files.map((file, index) => (
              <li key={index} className="py-2 px-3 bg-slate-50 rounded-md flex items-center justify-between">
                <span>{file.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveFile(file)}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">Upload Summary</h3>
          <div className="text-sm text-green-700">
            <p>Files processed: {parsedData.length}</p>
            <p>Total spectra: {parsedData.reduce((sum, data) => sum + data.totalSpectra, 0)}</p>
            <p>Total chromatograms: {parsedData.reduce((sum, data) => sum + data.chromatograms.length, 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
