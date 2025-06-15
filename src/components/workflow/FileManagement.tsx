
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileManagementProps {
  hasFiles: boolean;
  uploadedFiles: { fileName: string }[];
}

const FileManagement = ({ hasFiles, uploadedFiles }: FileManagementProps) => {
  const { toast } = useToast();

  const handleRemoveUploadedFiles = () => {
    localStorage.removeItem('uploadedMzData');
    localStorage.removeItem('compoundListData');
    
    toast({
      title: "Files removed",
      description: "All uploaded files have been removed from the workflow.",
    });
    
    window.location.reload();
  };

  if (!hasFiles) return null;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-bold">Uploaded Files ({uploadedFiles.length})</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveUploadedFiles}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-2" />
          Remove All Files
        </Button>
      </div>
      <div className="text-sm text-slate-600">
        {uploadedFiles.map(file => file.fileName).join(', ')}
      </div>
    </div>
  );
};

export default FileManagement;
