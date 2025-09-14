import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, File, X, Music, Mic, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (
    sessionId: string,
    userInstrument: string,
    userMidiPath: string,
    userWavUrl?: string
  ) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "audio" | "video";
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [bandName, setBandName] = useState("");
  const [userInstrument, setUserInstrument] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(
    (files: FileList) => {
      const newFiles: UploadedFile[] = [];

      Array.from(files).forEach((file) => {
        const isAudio = file.type.startsWith("audio/");
        const isMidi =
          file.name.toLowerCase().endsWith(".mid") ||
          file.name.toLowerCase().endsWith(".midi");

        if (isAudio || isMidi) {
          const uploadedFile: UploadedFile = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            type: isAudio ? "audio" : "audio", // Treat MIDI as audio
          };

          if (false) {
            // Remove video processing
            // Create video thumbnail
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.onloadeddata = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 200;
              canvas.height = 120;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                uploadedFile.preview = canvas.toDataURL();
                setUploadedFiles((prev) => [...prev, uploadedFile]);
              }
              URL.revokeObjectURL(video.src);
            };
          } else {
            newFiles.push(uploadedFile);
          }
        } else {
          toast({
            title: "Unsupported file type",
            description:
              "Please upload audio files (MP3, WAV) or MIDI files only.",
            variant: "destructive",
          });
        }
      });

      if (newFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCreateBand = async () => {
    if (!bandName.trim()) {
      toast({
        title: "Band name required",
        description: "Please enter a name for your band.",
        variant: "destructive",
      });
      return;
    }

    if (!userInstrument) {
      toast({
        title: "Instrument required",
        description: "Please select the instrument you played.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Recording required",
        description:
          "Please upload at least one audio file (MP3, WAV) or MIDI file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFiles[0].file);
      formData.append("instrument", userInstrument);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const fileExtension = uploadedFiles[0].file.name
          .split(".")
          .pop()
          ?.toLowerCase();
        const isAudioFile =
          fileExtension && ["mp3", "wav"].includes(fileExtension);

        toast({
          title: "Upload successful!",
          description: isAudioFile
            ? "Your audio file has been converted to MIDI. Starting band creation..."
            : "Your MIDI file has been processed. Starting band creation...",
        });

        // Call the callback with the session data
        onUploadComplete(
          data.session_id,
          data.instrument,
          data.file_path,
          data.user_wav_url
        );

        // Reset form
        setBandName("");
        setUserInstrument("");
        setUploadedFiles([]);
        onClose();
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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

          {/* Instrument Selection */}
          <div className="space-y-2">
            <Label htmlFor="instrument" className="text-base font-medium">
              What instrument did you play?
            </Label>
            <Select value={userInstrument} onValueChange={setUserInstrument}>
              <SelectTrigger>
                <SelectValue placeholder="Select your instrument..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piano">Piano</SelectItem>
                <SelectItem value="guitar">Guitar</SelectItem>
                <SelectItem value="violin">Violin</SelectItem>
                <SelectItem value="trumpet">Trumpet</SelectItem>
                <SelectItem value="drums">Drums</SelectItem>
                <SelectItem value="bass">Bass</SelectItem>
                <SelectItem value="saxophone">Saxophone</SelectItem>
                <SelectItem value="flute">Flute</SelectItem>
                <SelectItem value="cello">Cello</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
                    Supports MP3, WAV, MIDI files. MP3/WAV will be converted to
                    MIDI automatically.
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <File className="h-4 w-4 mr-2" />
                      Choose Files
                    </label>
                  </Button>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="audio/*,.mid,.midi"
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
                        {uploadedFile.type === "audio" ? (
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
                          {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)}{" "}
                          MB
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
              disabled={
                !bandName.trim() ||
                !userInstrument ||
                uploadedFiles.length === 0 ||
                isUploading
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Band...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4 mr-2" />
                  Create Band
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
