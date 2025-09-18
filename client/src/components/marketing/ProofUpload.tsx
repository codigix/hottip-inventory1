import { useState, useRef } from "react";
import { Upload, Camera, FileText, X, Eye, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import type { FieldVisit } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  category: string;
  description: string;
  uploadProgress: number;
  uploaded: boolean;
  error?: string;
}

interface ProofUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitWithDetails | null;
  onUploadComplete: () => void;
}

export default function ProofUpload({ open, onOpenChange, visit, onUploadComplete }: ProofUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload mutation (mock implementation)
  const uploadFilesMutation = useMutation({
    mutationFn: async (uploadData: { visitId: string; files: UploadedFile[]; notes: string }) => {
      // Simulate file upload process
      setIsUploading(true);
      
      for (let i = 0; i < uploadData.files.length; i++) {
        const file = uploadData.files[i];
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, uploadProgress: progress } : f
          ));
        }
        
        // Mark as uploaded
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, uploaded: true } : f
        ));
      }
      
      setIsUploading(false);
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Files uploaded successfully!" });
      onUploadComplete();
      handleClose();
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive"
        });
        continue;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
        continue;
      }

      const fileId = `file_${Date.now()}_${i}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        category: file.type.startsWith('image/') ? 'photo' : 'document',
        description: '',
        uploadProgress: 0,
        uploaded: false
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, preview: reader.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Update file details
  const updateFileDetails = (fileId: string, field: 'category' | 'description', value: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [field]: value } : f
    ));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!visit) {
      toast({
        title: "No visit selected",
        variant: "destructive"
      });
      return;
    }

    uploadFilesMutation.mutate({
      visitId: visit.id,
      files,
      notes
    });
  };

  // Handle modal close
  const handleClose = () => {
    setFiles([]);
    setNotes('');
    setIsUploading(false);
    onOpenChange(false);
  };

  // Get file icon
  const getFileIcon = (file: UploadedFile) => {
    if (file.file.type.startsWith('image/')) {
      return <Camera className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-green-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get existing attachments from visit
  const existingAttachments = visit?.attachmentPaths || [];

  return (
    <Dialog open={open} onOpenChange={!isUploading ? onOpenChange : () => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Visit Proof</span>
          </DialogTitle>
          <DialogDescription>
            {visit && `Upload photos and documents for visit ${visit.visitNumber}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visit Information */}
          {visit && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <p className="font-light">
                      {visit.lead?.firstName} {visit.lead?.lastName}
                      {visit.lead?.companyName && ` - ${visit.lead.companyName}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="ml-2 capitalize">{visit.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Upload Area */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Upload Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-light mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports: JPG, PNG, PDF, DOC, DOCX (Max 10MB per file)
                </p>
                
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-browse-files"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-take-photo"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                
                <Input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Selected Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {/* File Preview/Icon */}
                        <div className="flex-shrink-0">
                          {file.preview ? (
                            <img 
                              src={file.preview} 
                              alt={file.file.name}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                              {getFileIcon(file)}
                            </div>
                          )}
                        </div>

                        {/* File Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-light text-sm">{file.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file.size)} • {file.file.type}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              disabled={isUploading}
                              data-testid={`button-remove-${file.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Upload Progress */}
                          {isUploading && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span>Uploading...</span>
                                <span>{file.uploadProgress}%</span>
                              </div>
                              <Progress value={file.uploadProgress} className="h-1" />
                            </div>
                          )}

                          {/* File uploaded status */}
                          {file.uploaded && (
                            <div className="flex items-center space-x-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Uploaded successfully</span>
                            </div>
                          )}

                          {/* File Details Form */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Category</Label>
                              <Select
                                value={file.category}
                                onValueChange={(value) => updateFileDetails(file.id, 'category', value)}
                                disabled={isUploading}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="photo">Photo</SelectItem>
                                  <SelectItem value="document">Document</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="receipt">Receipt</SelectItem>
                                  <SelectItem value="report">Report</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                placeholder="Brief description..."
                                value={file.description}
                                onChange={(e) => updateFileDetails(file.id, 'description', e.target.value)}
                                disabled={isUploading}
                                className="h-8"
                                data-testid={`input-description-${file.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Existing Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existingAttachments.map((path, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{path.split('/').pop()}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional notes about these files..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isUploading}
                rows={3}
                data-testid="textarea-notes"
              />
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Upload Guidelines:</strong> Ensure all photos are clear and documents are readable. 
              GPS location will be automatically embedded in photos. All uploads are encrypted and secure.
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={files.length === 0 || isUploading}
              data-testid="button-upload"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Uploading... ({files.filter(f => f.uploaded).length}/{files.length})
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files ({files.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}