import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File as FileIcon, X, Music, Mic, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {uploadFileAndCreateBand, uploadFileToS3} from "@/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'audio' | 'video';
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [bandName, setBandName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback((files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      
      if (isAudio || isVideo) {
        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: isAudio ? 'audio' : 'video'
        };
        
        if (isVideo) {
          // Create video thumbnail
          const video = document.createElement('video');
          video.src = URL.createObjectURL(file);
          video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              uploadedFile.preview = canvas.toDataURL();
              setUploadedFiles(prev => [...prev, uploadedFile]);
            }
            URL.revokeObjectURL(video.src);
          };
        } else {
          newFiles.push(uploadedFile);
        }
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please upload audio or video files only.",
          variant: "destructive"
        });
      }
    });
    
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    processFiles(files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateBand = async () => {
  if (!bandName.trim()) {
    toast({
      title: "Band name required",
      description: "Please enter a name for your band.",
      variant: "destructive"
    });
    return;
  }
  
  if (uploadedFiles.length === 0) {
    toast({
      title: "Recording required",
      description: "Please upload at least one audio or video file.",
      variant: "destructive"
    });
    return;
  }

  try {
    console.log('Starting upload process...', uploadedFiles, bandName);
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append("file", uploadedFiles[0].file);
    formData.append("bandName", bandName);
    
    console.log('FormData created, uploading to S3...');
    
    // Upload to S3 first
    const uploadResult = await uploadFileToS3(formData);
    console.log('Upload result:', uploadResult);
    
    // Create band with S3 URL
    console.log('Creating band with S3 URL:', uploadResult.s3_url);
    await uploadFileAndCreateBand(uploadResult.s3_url, bandName);
    
    // Show success toast
    toast({
      title: "Band created successfully!",
      description: `${bandName} has been created and is ready to use.`,
    });

    // Reset form
    setBandName("");
    setUploadedFiles([]);
    onClose();
    
    // Navigate to new-band page
    navigate("/new-band");
    
  } catch (error) {
    console.error('Error creating band:', error);
    toast({
      title: "Failed to create band",
      description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      variant: "destructive"
    });
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-background border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Create New Band
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Band Name Input */}
          <div className="space-y-2">
            <Label htmlFor="bandName" className="text-base font-medium">
              Band Name
            </Label>
            <Input
              id="bandName"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Enter your band name..."
              className="text-base"
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Upload Your Recording
            </Label>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                isDragOver
                  ? "border-primary bg-gradient-primary/10 scale-105"
                  : "border-primary/30 hover:border-primary/60 hover:bg-gradient-primary/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drag and drop your files here
                  </p>
                  <p className="text-sm text-foreground/60">
                    Supports MP3, WAV, MP4, MOV, and other audio/video formats
                  </p>
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileIcon className="h-4 w-4 mr-2" />
                      Choose Files
                    </label>
                  </Button>
                </div>
                
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="audio/*,video/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Uploaded Files ({uploadedFiles.length})
              </Label>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        {uploadedFile.type === 'audio' ? (
                          <Mic className="h-5 w-5 text-white" />
                        ) : (
                          <Video className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-xs">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="hero" 
              onClick={handleCreateBand}
              disabled={!bandName.trim() || uploadedFiles.length === 0}
            >
              <Music className="h-4 w-4 mr-2" />
              Create Band
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};