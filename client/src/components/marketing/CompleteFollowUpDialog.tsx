import { useState, useRef, useEffect } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Calendar, MessageSquare, Loader2, Camera, Target } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import type { MarketingTask, Lead } from "@shared/schema";

interface TaskWithLead extends MarketingTask {
  lead?: Lead;
}

interface CompleteFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  onComplete?: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  category: string;
  uploadProgress: number;
  uploaded: boolean;
  error?: string;
}

export default function CompleteFollowUpDialog({ open, onOpenChange, taskId, onComplete }: CompleteFollowUpDialogProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [outcome, setOutcome] = useState('');
  const [outcomeStatus, setOutcomeStatus] = useState<'Interested' | 'Not Interested' | 'Follow-up Again' | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: task, isLoading: isLoadingTask } = useQuery<TaskWithLead>({
    queryKey: [`/api/marketing/marketing-tasks/${taskId}`],
    enabled: !!taskId && open,
    queryFn: () => apiRequest(`/marketing/marketing-tasks/${taskId}`),
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { 
      taskId: string; 
      attachmentPaths: string[]; 
      outcome: string; 
      outcomeStatus: string;
      leadId?: string;
      leadStatus?: string;
    }) => {
      return apiRequest(`/marketing/marketing-tasks/${data.taskId}/status`, {
        method: "PUT",
        body: JSON.stringify({ 
          status: "completed",
          notes: data.outcome, 
          outcome: data.outcomeStatus === 'Follow-up Again' ? `Follow-up Again: ${data.outcome}` : `${data.outcomeStatus}: ${data.outcome}`,
          outcomeStatus: data.outcomeStatus,
          attachmentPaths: data.attachmentPaths,
          completedDate: new Date().toISOString(),
          leadId: data.leadId,
          leadStatus: data.leadStatus
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      toast({ title: "Follow-up completed successfully!" });
      onComplete?.();
      handleClose();
    },
    onError: (err: any) => {
      toast({ title: "Error completing follow-up", description: err.message, variant: "destructive" });
    }
  });

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} is larger than 10MB`, variant: "destructive" });
        continue;
      }
      const fileId = `file_${Date.now()}_${i}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        category: file.type.startsWith('image/') ? 'photo' : 'document',
        uploadProgress: 0,
        uploaded: false
      };
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, preview: reader.result as string } : f));
        };
        reader.readAsDataURL(file);
      }
      newFiles.push(uploadedFile);
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = async () => {
    if (!taskId || !outcomeStatus) return;
    setIsUploading(true);
    const uploadedPaths: string[] = [];
    
    try {
      for (const fileObj of files) {
        const { uploadURL } = await apiRequest<{ uploadURL: string }>("/objects/upload", { method: "POST" });
        const response = await fetch(uploadURL, {
          method: "PUT",
          body: fileObj.file,
          headers: { "Content-Type": fileObj.file.type },
        });
        if (!response.ok) throw new Error("Upload failed");
        const { path } = await response.json();
        uploadedPaths.push(path);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, uploadProgress: 100, uploaded: true } : f));
      }

      completeMutation.mutate({
        taskId,
        attachmentPaths: uploadedPaths,
        outcome,
        outcomeStatus,
        leadId: task?.leadId || undefined,
        leadStatus: outcomeStatus === 'Interested' ? 'QUALIFIED' : (outcomeStatus === 'Not Interested' ? 'LOST' : undefined)
      });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setOutcome('');
    setOutcomeStatus('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={!isUploading ? onOpenChange : () => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Complete Follow-up Task
          </DialogTitle>
          <DialogDescription>
            Review scheduled details and add completion proof/notes.
          </DialogDescription>
        </DialogHeader>

        {isLoadingTask ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
        ) : task && (
          <div className="space-y-6 py-4">
            {/* Scheduled Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-50/50 border-slate-200">
                <CardHeader className="py-2 px-4 border-b">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase">Lead Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {task.lead ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold">Contact Name</Label>
                        <p className="text-sm font-semibold text-slate-700">{task.lead.firstName} {task.lead.lastName}</p>
                      </div>
                      {task.lead.companyName && (
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-slate-400 font-bold">Company</Label>
                          <p className="text-xs text-slate-600">{task.lead.companyName}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2">
                        {task.lead.email && (
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-slate-400 font-bold">Email</Label>
                            <p className="text-xs text-slate-600 truncate">{task.lead.email}</p>
                          </div>
                        )}
                        {task.lead.phone && (
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-slate-400 font-bold">Phone</Label>
                            <p className="text-xs text-slate-600">{task.lead.phone}</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No lead information available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50/50 border-slate-200">
                <CardHeader className="py-2 px-4 border-b">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase">Task Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-400 font-bold">Subject</Label>
                      <p className="text-sm font-semibold text-slate-700">{task.title.replace("Follow-up: ", "")}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">{task.priority}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-400 font-bold">Scheduled For</Label>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {task.dueDate ? format(new Date(task.dueDate), "dd MMM, hh:mm a") : "No date"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-400 font-bold">Task Type</Label>
                      <p className="text-[11px] text-slate-600 capitalize">{task.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {task.description && (
                    <div className="space-y-1 border-t pt-2">
                      <Label className="text-[10px] uppercase text-slate-400 font-bold">Description</Label>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{task.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Outcome Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold flex items-center gap-2 text-slate-700">
                <Target className="h-3.5 w-3.5" />
                Result / Outcome <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Interested', label: 'Interested', color: 'emerald' },
                  { id: 'Not Interested', label: 'Not Interested', color: 'rose' },
                  { id: 'Follow-up Again', label: 'Follow-up Again', color: 'blue' }
                ].map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    variant={outcomeStatus === opt.id ? 'default' : 'outline'}
                    className={cn(
                      "text-[11px] h-9 px-2 gap-1.5 transition-all duration-200",
                      outcomeStatus === opt.id ? (
                        opt.id === 'Interested' ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" :
                        opt.id === 'Not Interested' ? "bg-rose-600 hover:bg-rose-700 border-rose-600" :
                        "bg-blue-600 hover:bg-blue-700 border-blue-600"
                      ) : (
                        opt.id === 'Interested' ? "hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-600" :
                        opt.id === 'Not Interested' ? "hover:border-rose-200 hover:bg-rose-50/50 text-slate-600" :
                        "hover:border-blue-200 hover:bg-blue-50/50 text-slate-600"
                      )
                    )}
                    onClick={() => setOutcomeStatus(opt.id as any)}
                  >
                    {outcomeStatus === opt.id && <CheckCircle2 className="h-3 w-3" />}
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Outcome Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-bold flex items-center gap-2 text-slate-700">
                <MessageSquare className="h-3.5 w-3.5" /> 
                Detailed Notes {outcomeStatus === 'Follow-up Again' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea 
                placeholder={
                  outcomeStatus === 'Interested' ? "Why is the client interested? Any specific requirements?" :
                  outcomeStatus === 'Not Interested' ? "Reason for lack of interest?" :
                  outcomeStatus === 'Follow-up Again' ? "What was discussed and when should we follow up next?" :
                  "What was the result of this follow-up?"
                }
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            </div>

            {/* Proof Upload */}
            <div className="space-y-3">
              <Label className="text-xs font-bold flex items-center gap-2 text-slate-700">
                <Upload className="h-3.5 w-3.5" />
                Upload Proof (PDF / Screenshot)
              </Label>
              
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  dragActive ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
              >
                <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Click or drag files here to upload proof</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports images and PDF (Max 10MB)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{file.file.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 mt-4 rounded-b-lg">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!outcomeStatus || (outcomeStatus === 'Follow-up Again' && !outcome) || isUploading || completeMutation.isPending}
            className={cn(
              "text-white gap-2 transition-all min-w-[140px]",
              outcomeStatus === 'Interested' ? "bg-emerald-600 hover:bg-emerald-700" :
              outcomeStatus === 'Not Interested' ? "bg-rose-600 hover:bg-rose-700" :
              "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isUploading || completeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {outcomeStatus === 'Interested' ? 'Submit & Qualify' : 
             outcomeStatus === 'Not Interested' ? 'Submit & Mark Lost' : 
             'Submit & Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
