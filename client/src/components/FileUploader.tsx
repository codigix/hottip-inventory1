import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, X } from "lucide-react";

interface FileUploaderProps {
  onUploadComplete?: (result: { uploadURL: string; fileName: string }) => void;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string;
  className?: string;
}

export function FileUploader({
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  className = "",
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get upload URL from backend
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await uploadResponse.json();

      // Step 2: Upload file directly to object storage
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Handle upload completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          toast({
            title: "Upload successful",
            description: `${selectedFile.name} has been uploaded successfully.`,
          });

          // Call completion callback
          onUploadComplete?.({
            uploadURL,
            fileName: selectedFile.name,
          });

          // Reset state
          setSelectedFile(null);
          setUploadProgress(0);
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`);
        }
        setIsUploading(false);
      });

      // Handle upload errors
      xhr.addEventListener("error", () => {
        throw new Error("Upload failed");
      });

      // Start upload
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", selectedFile.type);
      xhr.send(selectedFile);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      {!selectedFile && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById("file-input")?.click()}
            disabled={isUploading}
            data-testid="button-select-file"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select File
          </Button>
          <input
            id="file-input"
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />
          <span className="text-sm text-muted-foreground">
            Max {Math.round(maxFileSize / (1024 * 1024))}MB
          </span>
        </div>
      )}

      {/* Selected File Display */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span className="text-sm font-medium" data-testid="text-filename">
              {selectedFile.name}
            </span>
            <span className="text-xs text-muted-foreground">
              ({Math.round(selectedFile.size / 1024)} KB)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={isUploading}
            data-testid="button-clear-file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" data-testid="progress-upload" />
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <Button
          onClick={uploadFile}
          className="w-full"
          data-testid="button-upload"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      )}
    </div>
  );
}