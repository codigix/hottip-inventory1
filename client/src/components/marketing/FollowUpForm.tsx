import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
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
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const followUpMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      // 1. Create Follow-up (Marketing Task)
      await apiRequest(`/api/marketing/followups`, {
        method: "POST",
        body: { leadId, ...data },
      });

      // 2. Log Activity
      await apiRequest("/api/activity", {
        method: "POST",
        body: {
          leadId,
          type: data.type === "Phone Call" ? "CALL" : data.type === "Email" ? "EMAIL" : "FOLLOW_UP",
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

      await apiRequest(`/api/marketing/leads/${leadId}/status`, {
        method: "PUT",
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketing/leads/${leadId}`] });
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
    });
  };

  const renderDynamicFields = () => {
    if (
      ["WhatsApp Call", "Google Meet", "Zoom Meeting", "Internal Video Call"].includes(
        form.type
      )
    ) {
      return (
        <div className="space-y-2">
          <Label>Meeting Link</Label>
          <Input
            placeholder="Enter Link"
            value={form.link}
            onChange={(e) => handleChange("link", e.target.value)}
          />
        </div>
      );
    }
    if (form.type === "In-Person Meeting") {
      return (
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            placeholder="Enter Location"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
      );
    }
    if (form.type === "WhatsApp Message") {
      return (
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Enter Message"
            value={form.message}
            onChange={(e) => handleChange("message", e.target.value)}
          />
        </div>
      );
    }
    if (form.type === "Payment Reminder") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Due Date</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Follow-Up</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SECTION 1: RELATED INFO */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-slate-500">Related Info</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Related Type</Label>
                <Select
                  value={form.relatedType}
                  onValueChange={(v) => handleChange("relatedType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Deal">Deal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: SCHEDULE & DETAILS */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-slate-500">Schedule & Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => handleChange("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => handleChange("priority", v)}
                >
                  <SelectTrigger>
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
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={form.assignedTo}
                onValueChange={(v) => handleChange("assignedTo", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SECTION 3: DESCRIPTION */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-slate-500">Description</h4>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter notes..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => followUpMutation.mutate(form)}
            className="bg-red-500 hover:bg-red-600 text-white"
            disabled={followUpMutation.isPending}
          >
            {followUpMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Follow-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
