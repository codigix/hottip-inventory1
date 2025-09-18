import { useState } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { LogisticsShipment } from "@shared/schema";

interface PodUploadComponentProps {
  shipment: LogisticsShipment | null;
  onClose: () => void;
  onComplete: (podData: PodUploadData) => void;
}

const podUploadSchema = z.object({
  notes: z.string().optional(),
  customerSignature: z.string().optional(),
  deliveredTo: z.string().min(1, "Delivered to field is required"),
});

type PodUploadForm = z.infer<typeof podUploadSchema>;

export interface PodUploadData {
  notes?: string;
  customerSignature?: string;
  deliveredTo: string;
  podImageUrl?: string;
}

export default function PodUploadComponent({ 
  shipment, 
  onClose, 
  onComplete 
}: PodUploadComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PodUploadForm>({
    resolver: zodResolver(podUploadSchema),
    defaultValues: {
      notes: "",
      customerSignature: "",
      deliveredTo: "",
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG, PNG, WebP, or PDF file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const uploadPodToStorage = async (file: File): Promise<string> => {
    setUploadStatus('uploading');
    
    try {
      if (!shipment?.id) {
        throw new Error('Shipment ID is required');
      }

      // Step 1: Get upload URL from backend
      const uploadUrlResponse = await fetch('/api/logistics/pod/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: shipment.id,
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!uploadUrlResponse.ok) {
        const error = await uploadUrlResponse.json();
        throw new Error(error.error || `Failed to get upload URL: ${uploadUrlResponse.statusText}`);
      }

      const { uploadURL, objectPath } = await uploadUrlResponse.json();

      // Step 2: Upload file directly to object storage using signed URL
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
      }

      setUploadStatus('success');
      
      // Return the permanent object path (not the temporary signed URL)
      return objectPath;
    } catch (error) {
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    }
  };

  const onSubmit = async (data: PodUploadForm) => {
    try {
      let podImageUrl: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        podImageUrl = await uploadPodToStorage(selectedFile);
      }

      // Prepare POD data
      const podData: PodUploadData = {
        ...data,
        podImageUrl,
      };

      onComplete(podData);
      
      toast({
        title: "POD Uploaded Successfully",
        description: "Proof of delivery has been uploaded and shipment will be closed.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload POD",
        variant: "destructive",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadError(null);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="space-y-4">
        <div className="text-sm font-light">Upload Proof of Delivery</div>
        
        {!selectedFile ? (
          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground mb-2">
                Choose POD image or PDF file
              </div>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="w-full"
                data-testid="input-pod-file"
              />
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {uploadStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                <div>
                  <div className="text-sm font-light">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                data-testid="button-remove-file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {uploadStatus === 'uploading' && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground">Uploading...</div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div className="bg-primary h-2 rounded-full w-1/2 animate-pulse"></div>
                </div>
              </div>
            )}
            
            {uploadError && (
              <div className="mt-3 text-xs text-red-500">{uploadError}</div>
            )}
          </div>
        )}
      </div>

      {/* POD Details Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="deliveredTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivered To *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Name of person who received the shipment"
                    data-testid="input-delivered-to"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerSignature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Signature (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Digital signature or confirmation code"
                    data-testid="input-customer-signature"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Additional notes about the delivery..."
                    rows={3}
                    data-testid="input-delivery-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-pod"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={uploadStatus === 'uploading'}
              data-testid="button-complete-delivery"
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Complete Delivery'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}