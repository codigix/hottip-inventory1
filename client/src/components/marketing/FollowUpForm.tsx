import { useState, useEffect } from "react";
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
} from "lucide-react";
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
}

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}

export default function FollowUpForm({ open, onOpenChange, leadId }: FollowUpFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: allLeads = [] } = useQuery<Lead[]>({
    queryKey: ["/marketing/leads"],
    enabled: open,
    select: (data: any) => data || []
  });

  useEffect(() => {
    const selectedLead = allLeads.find(l => l.id === form.relatedId);
    if (selectedLead) {
      setForm(prev => ({
        ...prev,
        clientEmail: selectedLead.email || "",
        clientPhone: selectedLead.phone || "",
        invitationMessage: `Dear ${selectedLead.firstName} ${selectedLead.lastName}, I would like to schedule a ${form.type || 'meeting'} to discuss our collaboration. Looking forward to connecting with you.`
      }));
    }
  }, [form.relatedId, form.type, allLeads]);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const followUpMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const currentRelatedId = data.relatedId;
      // 1. Create Follow-up (Marketing Task)
      await apiRequest(`/api/marketing/followups`, {
        method: "POST",
        body: { leadId: currentRelatedId, ...data },
      });

      // 2. Log Activity
      const activityType = ["Phone Call", "WhatsApp Call", "Google Meet", "Zoom Meeting", "Internal Video Call"].includes(data.type) 
        ? "CALL" 
        : ["Email", "WhatsApp Message"].includes(data.type) 
          ? "EMAIL" 
          : "FOLLOW_UP";

      await apiRequest("/api/activity", {
        method: "POST",
        body: {
          leadId: currentRelatedId,
          type: activityType,
          note: data.subject || `Scheduled ${data.type}`,
        },
      });

      // 3. Update Status
      let status = "contacted";
      if (["Demo", "In-Person Meeting"].includes(data.type)) {
        status = "qualified";
      }
      if (data.type === "Proposal Discussion") {
        status = "converted"; // Mapping 'DEAL' from user snippet to 'converted' from schema
      }

      await apiRequest(`/api/marketing/leads/${currentRelatedId}/status`, {
        method: "PUT",
        body: { status },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketing/leads/${variables.relatedId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-tasks"] });
      toast({ title: "Follow-up added successfully!" });
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 border-dashed border-slate-300">
                   <FilePlus className="h-3 w-3" /> Quotation PDF
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 border-dashed border-slate-300">
                   <Paperclip className="h-3 w-3" /> Upload Document
                </Button>
              </div>
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
            Schedule Follow-Up Task
          </DialogTitle>
          <p className="text-xs text-white/80 mt-1 font-medium">Create and assign activities for your sales pipeline.</p>
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
              "SCHEDULE TASK"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
