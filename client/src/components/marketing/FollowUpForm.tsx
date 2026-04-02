import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Video, 
  Mail, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Link as LinkIcon,
  Calendar as CalendarIcon,
  ChevronDown,
  Info,
  Clock as ClockIcon,
  User as UserIcon,
  AlertCircle,
  Paperclip,
  FilePlus,
  X,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  quotationId?: string;
}

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  editId?: string | null;
}

export default function FollowUpForm({ open, onOpenChange, leadId, editId }: FollowUpFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<{name: string, path: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { uploadURL } = await apiRequest<{ uploadURL: string }>("/objects/upload", {
          method: "POST"
        });

        const response = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        });

        if (!response.ok) throw new Error("Upload failed");
        
        const { path } = await response.json();
        setAttachments(prev => [...prev, { name: file.name, path }]);
      }
      toast({ title: "Files uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const attachQuotation = () => {
    if (lead?.quotationId) {
      setAttachments(prev => {
        if (prev.some(a => a.path.includes(lead.quotationId!))) return prev;
        return [...prev, { name: "Quotation PDF", path: `/api/sales/quotations/${lead.quotationId}/pdf` }];
      });
      toast({ title: "Quotation attached" });
    } else {
      toast({ title: "No quotation found", description: "This lead has no associated quotation.", variant: "destructive" });
    }
  };

  const [form, setForm] = useState({
    relatedType: "Lead",
    relatedId: leadId || "",
    subject: "",
    type: "",
    priority: "medium",
    date: "",
    time: "",
    assignedTo: "",
    link: "",
    location: "",
    message: "",
    amount: "",
    dueDate: "",
    description: "",
    clientEmail: "",
    clientPhone: "",
    invitationMessage: "",
    ccEmail: "",
    bccEmail: "",
    emailSubject: "",
    emailBody: "",
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const { data: lead } = useQuery<Lead>({
    queryKey: [`/api/marketing/leads/${leadId}`],
    enabled: !!leadId && open,
    select: (data: any) => data.lead
  });

  const { data: editTask } = useQuery<MarketingTask>({
    queryKey: [`/api/marketing/marketing-tasks/${editId}`],
    enabled: !!editId && open,
    queryFn: () => apiRequest(`/marketing/marketing-tasks/${editId}`),
  });

  const { data: allLeads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/marketing/leads"],
    enabled: open,
    queryFn: () => apiRequest("/marketing/leads"),
  });

  useEffect(() => {
    if (editTask) {
      setForm({
        relatedType: "Lead",
        relatedId: editTask.leadId || leadId,
        subject: editTask.title.replace("Follow-up: ", "").replace("Scheduled ", ""),
        type: editTask.type === "follow_up" ? "Meeting" : editTask.type, // Basic mapping
        priority: editTask.priority as any,
        date: editTask.dueDate ? format(new Date(editTask.dueDate), "yyyy-MM-dd") : "",
        time: editTask.dueDate ? format(new Date(editTask.dueDate), "HH:mm") : "",
        assignedTo: editTask.assignedTo || "",
        link: "", // Parse from description if needed
        location: "", // Parse from description if needed
        message: "",
        amount: "",
        dueDate: "",
        description: editTask.description || "",
        clientEmail: "",
        clientPhone: "",
        invitationMessage: "",
        ccEmail: "",
        bccEmail: "",
        emailSubject: "",
        emailBody: "",
      });
      
      // Try to parse dynamic fields from description
      if (editTask.description) {
        const desc = editTask.description;
        const prefixes = [
          "Type:", "Link:", "Location:", "Message:", "Amount:", "Due Date:", 
          "To:", "Phone:", "Invitation:", "Subject:", "CC:", "BCC:", "Body:", 
          "Attachments:", "Notes:"
        ].join('|');
        
        const extractField = (fieldName: string, isMultiline = false) => {
          const regex = new RegExp(`${fieldName}:\\s*([\\s\\S]*?)(?=\\n(?:${prefixes})|$)`, 'i');
          const match = desc.match(regex);
          return match ? match[1].trim() : null;
        };

        const typeValue = extractField("Type");
        const linkValue = extractField("Link");
        const locValue = extractField("Location");
        const msgValue = extractField("Message");
        const amtValue = extractField("Amount");
        const notesValue = extractField("Notes");
        const toValue = extractField("To");
        const phoneValue = extractField("Phone");
        const invitationValue = extractField("Invitation", true);
        const subValue = extractField("Subject");
        const ccValue = extractField("CC");
        const bccValue = extractField("BCC");
        const bodyValue = extractField("Body", true);
        const attachmentsValue = extractField("Attachments");

        if (attachmentsValue) {
          try {
            setAttachments(JSON.parse(attachmentsValue));
          } catch (e) {
            console.error("Failed to parse attachments", e);
          }
        }

        setForm(prev => ({
          ...prev,
          type: typeValue || prev.type,
          link: linkValue || "",
          location: locValue || "",
          message: msgValue || "",
          amount: amtValue ? amtValue.replace(/[^0-9.]/g, "") : "",
          description: notesValue || prev.description,
          clientEmail: toValue || prev.clientEmail,
          clientPhone: phoneValue || prev.clientPhone,
          invitationMessage: invitationValue || prev.invitationMessage,
          emailSubject: subValue || prev.emailSubject,
          ccEmail: ccValue || prev.ccEmail,
          bccEmail: bccValue || prev.bccEmail,
          emailBody: bodyValue || prev.emailBody,
        }));
      }
    } else {
      resetForm();
    }
  }, [editTask, open]);

  useEffect(() => {
    if (!editId) {
      const selectedLead = allLeads.find(l => l.id === form.relatedId);
      if (selectedLead) {
        setForm(prev => ({
          ...prev,
          clientEmail: selectedLead.email || "",
          clientPhone: selectedLead.phone || "",
          invitationMessage: `Dear ${selectedLead.firstName} ${selectedLead.lastName}, I would like to schedule a ${form.type || 'meeting'} to discuss our collaboration. Looking forward to connecting with you.`
        }));
      }
    }
  }, [form.relatedId, form.type, allLeads, editId]);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => {
      const newState = { ...prev, [name]: value };

      // Auto-generate link when type changes or related lead changes
      const isOnlineMeeting = ["WhatsApp Call", "Google Meet", "Zoom Meeting", "Internal Video Call", "WhatsApp Message"].includes(name === "type" ? value : prev.type);
      
      if (isOnlineMeeting) {
        const selectedLead = allLeads.find(l => l.id === (name === "relatedId" ? value : prev.relatedId));
        const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const currentType = name === "type" ? value : prev.type;

        // If type changed or relatedId changed, we might need a new link
        if (name === "type" || name === "relatedId") {
          if (currentType === "Google Meet" && (name === "type" || !prev.link)) {
            newState.link = `https://meet.google.com/${sessionId.toLowerCase().substring(0, 3)}-${sessionId.toLowerCase().substring(3, 7)}-${sessionId.toLowerCase().substring(7, 10)}`;
          } else if ((currentType === "WhatsApp Call" || currentType === "WhatsApp Message") && (name === "type" || name === "relatedId" || !prev.link)) {
            const cleanPhone = selectedLead?.phone?.replace(/\D/g, '') || "";
            newState.link = cleanPhone ? `https://wa.me/${cleanPhone}` : `SESSION-${sessionId}`;
          } else if (currentType === "Zoom Meeting" && (name === "type" || !prev.link)) {
            newState.link = `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`;
          } else if (!prev.link || name === "type") {
            newState.link = `SESSION-${sessionId}`;
          }
        }
      } else if (name === "type") {
        // Clear link for non-online meeting types unless manually set
        if (!["In-Person Meeting", "Demo"].includes(value)) {
          newState.link = "";
        }
      }
      return newState;
    });
  };

  const followUpMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const currentRelatedId = data.relatedId;

      // Build description with dynamic fields
      let dynamicDescription = `Type: ${data.type}\n`;
      if (data.link) dynamicDescription += `Link: ${data.link}\n`;
      if (data.location) dynamicDescription += `Location: ${data.location}\n`;
      if (data.message) dynamicDescription += `Message: ${data.message}\n`;
      if (data.amount) dynamicDescription += `Amount: ₹${parseFloat(data.amount).toLocaleString("en-IN")}\n`;
      if (data.dueDate) dynamicDescription += `Due Date: ${data.dueDate}\n`;
      
      // Email fields
      if (data.clientEmail) dynamicDescription += `To: ${data.clientEmail}\n`;
      if (data.clientPhone) dynamicDescription += `Phone: ${data.clientPhone}\n`;
      if (data.invitationMessage) dynamicDescription += `Invitation: ${data.invitationMessage}\n`;
      if (data.emailSubject) dynamicDescription += `Subject: ${data.emailSubject}\n`;
      if (data.ccEmail) dynamicDescription += `CC: ${data.ccEmail}\n`;
      if (data.bccEmail) dynamicDescription += `BCC: ${data.bccEmail}\n`;
      if (data.emailBody) dynamicDescription += `Body: ${data.emailBody}\n`;

      // Attachments
      if (attachments.length > 0) {
        dynamicDescription += `Attachments: ${JSON.stringify(attachments)}\n`;
      }

      if (data.description) dynamicDescription += `Notes: ${data.description}\n`;

      // Map UI types to schema types
      const typeMapping: Record<string, string> = {
        "Phone Call": "phone_call",
        "WhatsApp Call": "follow_up",
        "WhatsApp Message": "follow_up",
        "SMS": "follow_up",
        "Email": "email_campaign",
        "Google Meet": "follow_up",
        "Zoom Meeting": "follow_up",
        "Internal Video Call": "follow_up",
        "In-Person Meeting": "follow_up",
        "Demo": "demo",
        "Proposal Discussion": "proposal",
        "Payment Reminder": "follow_up"
      };

      const taskData = {
        title: data.subject || `Follow-up: ${data.type}`,
        description: dynamicDescription,
        type: typeMapping[data.type] || "follow_up",
        assignedTo: (data.assignedTo && data.assignedTo !== "") ? data.assignedTo : undefined,
        priority: data.priority,
        leadId: (currentRelatedId && currentRelatedId !== "") ? currentRelatedId : null,
        dueDate: data.date ? new Date(`${data.date}T${data.time || "00:00"}`).toISOString() : null,
      };

      if (editId) {
        // Update existing task
        await apiRequest(`/marketing/marketing-tasks/${editId}`, {
          method: "PUT",
          body: taskData,
        });
      } else {
        // 1. Create Follow-up (Marketing Task)
        await apiRequest(`/marketing/followups`, {
          method: "POST",
          body: { 
            leadId: currentRelatedId, 
            ...data,
            type: data.type, // Send UI type, backend handler createFollowUpTask will handle mapping/description
          },
        });

        // 2. Log Activity (Only for new follow-ups)
        const activityType = ["Phone Call", "WhatsApp Call", "Google Meet", "Zoom Meeting", "Internal Video Call"].includes(data.type) 
          ? "CALL" 
          : ["Email", "WhatsApp Message"].includes(data.type) 
            ? "EMAIL" 
            : "FOLLOW_UP";

        await apiRequest("/activity", {
          method: "POST",
          body: {
            leadId: currentRelatedId,
            type: activityType,
            note: data.subject || `Scheduled ${data.type}`,
          },
        });

        // 3. Update Status (Only for new follow-ups)
        let status = "contacted";
        if (["Demo", "In-Person Meeting"].includes(data.type)) {
          status = "qualified";
        }
        if (data.type === "Proposal Discussion") {
          status = "converted"; 
        }

        await apiRequest(`/marketing/leads/${currentRelatedId}/status`, {
          method: "PUT",
          body: { status },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/marketing/leads/${variables.relatedId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks", { leadId: variables.relatedId }] });
      toast({ title: editId ? "Follow-up updated successfully!" : "Follow-up added successfully!" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding follow-up",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAttachments([]);
    setForm({
      relatedType: "Lead",
      relatedId: leadId || "",
      subject: "",
      type: "",
      priority: "high",
      date: "",
      time: "",
      assignedTo: "",
      link: "",
      location: "",
      message: "",
      amount: "",
      dueDate: "",
      description: "",
      clientEmail: "",
      clientPhone: "",
      invitationMessage: "",
      ccEmail: "",
      bccEmail: "",
      emailSubject: "",
      emailBody: "",
    });
  };

  const renderDynamicFields = () => {
    const isOnlineMeeting = ["WhatsApp Call", "Google Meet", "Zoom Meeting", "Internal Video Call"].includes(form.type);
    const isInPerson = form.type === "In-Person Meeting";
    const isDemo = form.type === "Demo";
    const isPayment = form.type === "Payment Reminder";
    const isEmail = form.type === "Email";

    if (!isOnlineMeeting && !isInPerson && !isDemo && !isPayment && !isEmail) return null;

    return (
      <div className="space-y-4 p-4 bg-blue-50/30 rounded-lg border border-blue-100/50">
        {isEmail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                  <Mail className="h-3 w-3" /> To Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.clientEmail}
                  onChange={(e) => handleChange("clientEmail", e.target.value)}
                  placeholder="to@example.com"
                  className="bg-white h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                  <Mail className="h-3 w-3" /> Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.emailSubject}
                  onChange={(e) => handleChange("emailSubject", e.target.value)}
                  placeholder="Email Subject"
                  className="bg-white h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                   CC Email
                </Label>
                <Input
                  value={form.ccEmail}
                  onChange={(e) => handleChange("ccEmail", e.target.value)}
                  placeholder="cc@example.com"
                  className="bg-white h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                   BCC Email
                </Label>
                <Input
                  value={form.bccEmail}
                  onChange={(e) => handleChange("bccEmail", e.target.value)}
                  placeholder="bcc@example.com"
                  className="bg-white h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                <MessageSquare className="h-3 w-3" /> Message / Body <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Write your message here..."
                value={form.emailBody}
                onChange={(e) => handleChange("emailBody", e.target.value)}
                className="min-h-[120px] bg-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <Paperclip className="h-3 w-3" /> Attachments
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  onClick={attachQuotation}
                  className="h-8 text-[10px] gap-1.5 border-dashed border-slate-300"
                >
                   <FilePlus className="h-3 w-3" /> Quotation PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-8 text-[10px] gap-1.5 border-dashed border-slate-300"
                >
                   {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />} 
                   Upload Document
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                  multiple
                />
              </div>

              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100 group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="text-[10px] text-slate-600 truncate">{file.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isOnlineMeeting && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
              <Video className="h-3 w-3" /> Connection ID / Link <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Session ID will be generated..."
                value={form.link}
                onChange={(e) => handleChange("link", e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
        )}

        {isDemo && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
              <Video className="h-3 w-3" /> Demo Link <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Paste Demo link here..."
                value={form.link}
                onChange={(e) => handleChange("link", e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
        )}

        {isInPerson && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
              <MapPin className="h-3 w-3" /> Meeting Location <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Enter Location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
        )}

        {isPayment && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        )}

        {/* Client Email and Phone (Always shown for meetings/calls) */}
        {!isPayment && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                  <Mail className="h-3 w-3" /> Client Email
                </Label>
                <Input
                  value={form.clientEmail}
                  onChange={(e) => handleChange("clientEmail", e.target.value)}
                  placeholder="email@example.com"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                  <Phone className="h-3 w-3" /> Client Phone
                </Label>
                <Input
                  value={form.clientPhone}
                  onChange={(e) => handleChange("clientPhone", e.target.value)}
                  placeholder="+91 00000 00000"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                <MessageSquare className="h-3 w-3" /> Formal Invitation Message
              </Label>
              <Textarea
                placeholder="Invitation message..."
                value={form.invitationMessage}
                onChange={(e) => handleChange("invitationMessage", e.target.value)}
                className="min-h-[80px] bg-white text-xs"
              />
              <p className="text-[10px] text-blue-400 mt-1">
                This message will be included in the Google Calendar invitation sent to the client.
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-white" />
            {editId ? "Edit Follow-Up Task" : "Schedule Follow-Up Task"}
          </DialogTitle>
          <p className="text-xs text-white/80 mt-1 font-medium">
            {editId ? "Update follow-up details and activities for your sales pipeline." : "Create and assign activities for your sales pipeline."}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* SECTION 1: RELATED INFO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <div className="bg-blue-100 p-1 rounded">
                <Info className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Related Info</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  Related Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.relatedType}
                  onValueChange={(v) => handleChange("relatedType", v)}
                >
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Deal">Deal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  Related Record <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.relatedId}
                  onValueChange={(v) => handleChange("relatedId", v)}
                >
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                    <SelectValue placeholder={`Select ${form.relatedType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {form.relatedType === "Lead" ? (
                      allLeads.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.firstName} {l.lastName} {l.companyName ? `(${l.companyName})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No Deals found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Subject / Goal</Label>
              <Input
                placeholder="e.g. Initial Introduction"
                value={form.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                className="h-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* SECTION 2: SCHEDULE & DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-1 rounded">
                  <CalendarIcon className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Schedule & Details</h4>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-300" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => handleChange("type", v)}
                >
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                    <SelectItem value="WhatsApp Call">WhatsApp Call</SelectItem>
                    <SelectItem value="WhatsApp Message">WhatsApp Message</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Zoom Meeting">Zoom Meeting</SelectItem>
                    <SelectItem value="Internal Video Call">Internal Video Call</SelectItem>
                    <SelectItem value="In-Person Meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="Demo">Demo</SelectItem>
                    <SelectItem value="Proposal Discussion">Proposal Discussion</SelectItem>
                    <SelectItem value="Payment Reminder">Payment Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => handleChange("priority", v)}
                >
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderDynamicFields()}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> Scheduled Date
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="h-10 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" /> Scheduled Time
                </Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className="h-10 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ASSIGNMENT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <div className="bg-emerald-100 p-1 rounded">
                <UserIcon className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Assignment & Task Details</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Assign To User</Label>
                <Select
                  value={form.assignedTo}
                  onValueChange={(v) => handleChange("assignedTo", v)}
                >
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Internal Task Notes</Label>
                <Textarea
                  placeholder="Add any specific instructions for the assignee..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-[80px] bg-slate-50/50 text-xs border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 rounded-b-lg">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500 font-bold text-xs"
          >
            CANCEL
          </Button>
          <Button
            onClick={() => followUpMutation.mutate(form)}
            disabled={followUpMutation.isPending || !form.type || !form.date}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6"
          >
            {followUpMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              editId ? "UPDATE TASK" : "SCHEDULE TASK"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
