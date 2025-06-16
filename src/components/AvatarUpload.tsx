
import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, User } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUpload: (file: File) => Promise<string | null>;
  userName?: string;
}

const AvatarUpload = ({ currentAvatarUrl, onUpload, userName }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    await onUpload(file);
    setUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="text-lg">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {uploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}
    </div>
  );
};

export default AvatarUpload;
