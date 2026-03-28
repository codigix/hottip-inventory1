import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  MessageSquare,
  Calendar,
  Briefcase,
  FileText,
  User,
  Building,
  Mail,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  TrendingUp,
  Target,
  BadgeAlert,
  Loader2,
  MapPin,
  Info,
  Coins,
  MessageSquareQuote,
  History,
  Download,
  Printer,
  FileUp,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge } from "@/components/marketing/StatusBadge";
import FollowUpForm from "@/components/marketing/FollowUpForm";
import FollowupHierarchy from "@/components/marketing/FollowupHierarchy";
import ProofUpload from "@/components/marketing/ProofUpload";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  status: string;
  priority: string;
  source: string;
  sourceDetails?: string;
  referredBy?: string;
  estimatedBudget?: string;
  budgetRange?: string;
  expectedClosingDate?: string;
  requirementDescription?: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  assignedToUser?: {
    firstName: string;
    lastName: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
}

export default function LeadDetails() {
  const [, params] = useRoute("/marketing/leads/:id");
  const [, setLocation] = useLocation();
  const leadId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activityNote, setActivityNote] = useState("");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isProofUploadOpen, setIsProofUploadOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  const { data, isLoading, error } = useQuery<{ lead: Lead; activities: Activity[] }>({
    queryKey: [`/api/marketing/leads/${leadId}`],
    enabled: !!leadId,
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: visits = [] } = useQuery<any[]>({
    queryKey: [`/api/field-visits`, { leadId: leadId }],
    enabled: !!leadId,
  });

  // Find linked customer to fetch quotations
  // Rules of Hooks: Define this before early returns
  const leadData = data?.lead;
  const fullNameData = leadData ? `${leadData.firstName} ${leadData.lastName}` : "";
  const linkedCustomer = customers.find(
    (c: any) =>
      (leadData?.companyName && c.company === leadData.companyName) ||
      (leadData?.email && c.email === leadData.email) ||
      (fullNameData && c.name === fullNameData)
  );

  const { data: quotations = [] } = useQuery<any[]>({
    queryKey: [
      "/api/outbound-quotations",
      { 
        customerId: linkedCustomer?.id, 
        companyName: leadData?.companyName 
      },
    ],
    enabled: !!linkedCustomer?.id || !!leadData?.companyName,
  });

  const recordActivityMutation = useMutation({
    mutationFn: async ({ type, note }: { type: string; note?: string }) => {
      return apiRequest("/api/activity", {
        method: "POST",
        body: { leadId, type, note },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketing/leads/${leadId}`] });
      toast({ title: "Activity recorded successfully" });
      setIsActivityModalOpen(false);
      setActivityNote("");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest(`/api/marketing/leads/${leadId}/status`, {
        method: "PUT",
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketing/leads/${leadId}`] });
      toast({ title: "Status updated successfully" });
    },
  });

  const convertToDealMutation = useMutation({
    mutationFn: async () => {
      // 1. Log Activity as requested in snippet
      await apiRequest("/api/activity", {
        method: "POST",
        body: { leadId, type: "DEAL_CREATED", note: "Deal created from lead" },
      });

      // 2. Convert Lead
      return apiRequest(`/api/marketing/leads/${leadId}/convert`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketing/leads/${leadId}`] });
      toast({ title: "Lead converted to deal successfully" });
    },
  });

  const handleAction = async (type: string, note?: string) => {
    recordActivityMutation.mutate({ type, note: note || `${type.replace(/_/g, " ")} done` });

    // Auto status updates based on action
    if (type === "CALL" || type === "WHATSAPP") {
      if (data?.lead.status === "new") {
        updateStatusMutation.mutate("contacted");
      }
    }

    if (type === "DEAL_CREATED") {
      updateStatusMutation.mutate("converted");
    }

    if (type === "QUOTATION") {
      // Any specific status for quotation? Snippet doesn't say, but usually it might be 'qualified'
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">Error loading lead</h2>
        <Button variant="link" onClick={() => setLocation("/marketing/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  const { lead, activities } = data;
  const fullName = `${lead.firstName} ${lead.lastName}`;

  const getActionIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="h-4 w-4" />;
      case "EMAIL": return <Mail className="h-4 w-4" />;
      case "WHATSAPP": return <MessageSquare className="h-4 w-4" />;
      case "FOLLOW_UP": return <Calendar className="h-4 w-4" />;
      case "DEAL_CREATED": return <Briefcase className="h-4 w-4" />;
      case "QUOTATION": return <FileText className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "CALL": return "Call Logged";
      case "EMAIL": return "Email Sent/Scheduled";
      case "WHATSAPP": return "WhatsApp Sent";
      case "FOLLOW_UP": return "Follow-up Scheduled";
      case "DEAL_CREATED": return "Deal Created";
      case "QUOTATION": return "Quotation Sent";
      case "CREATE_LEAD": return "Lead Created";
      case "UPDATE_LEAD": return "Lead Details Updated";
      case "UPDATE_LEAD_STATUS": return "Status Changed";
      case "MANUAL_LOG": return "Internal Note Added";
      case "UPDATE_FIELD_VISIT": return "Visit Updated";
      case "CHECK_IN": return "Checked In at Location";
      case "CHECK_OUT": return "Checked Out from Location";
      default: return type.replace(/_/g, " ");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/30">
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/marketing/leads")}
            className="rounded-full bg-white shadow-sm border"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Lead Info Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16 border-2 border-slate-100">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {lead.firstName[0]}{lead.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building className="h-4 w-4" />
                    <span className="text-base font-medium">{lead.companyName || "Independent"}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-2 text-base text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lead.phone || "No phone"}</span>
                      {lead.alternatePhone && <span className="text-slate-300 ml-1">/ {lead.alternatePhone}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-base text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{lead.email || "No email"}</span>
                    </div>
                    {lead.assignedToUser && (
                      <div className="flex items-center gap-2 text-base text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-sm font-medium">
                          {lead.assignedToUser.firstName} {lead.assignedToUser.lastName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>Created {format(new Date(lead.createdAt), "dd MMM, yyyy")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 items-start h-fit">
                <Button 
                  onClick={() => handleAction("CALL", "Outgoing call to lead")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                  size="sm"
                >
                  <Phone className="h-4 w-4" /> Call
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleAction("WHATSAPP", "WhatsApp message sent")}
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 gap-2"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsFollowUpModalOpen(true)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2"
                  size="sm"
                >
                  <Calendar className="h-4 w-4" /> Follow-up
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex gap-3">
              <Button 
                onClick={() => convertToDealMutation.mutate()}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                disabled={lead.status === "converted" || convertToDealMutation.isPending}
              >
                <Briefcase className="h-4 w-4" /> 
                {lead.status === "converted" ? "Lead is Deal" : "Create Deal"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleAction("QUOTATION", "Quotation shared with lead")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" /> Quotation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requirements & Location Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 text-blue-500" />
                Requirements Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Description</Label>
                <div className="text-base text-slate-700 bg-slate-50/50 p-3 rounded-md border border-slate-100 min-h-[80px]">
                  {lead.requirementDescription || "No specific requirements provided."}
                </div>
              </div>
              {lead.notes && (
                <div>
                  <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Internal Notes</Label>
                  <div className="text-base text-slate-600">
                    {lead.notes}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Budget Range</Label>
                  <div className="text-base font-medium flex items-center gap-1.5 text-slate-700">
                    <Coins className="h-3.5 w-3.5 text-amber-500" />
                    {lead.budgetRange || "Not specified"}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Exp. Closing</Label>
                  <div className="text-base font-medium flex items-center gap-1.5 text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    {lead.expectedClosingDate ? format(new Date(lead.expectedClosingDate), "dd MMM, yyyy") : "Not specified"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Location & Origin
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Full Address</Label>
                <div className="text-base text-slate-700">
                  {lead.address ? (
                    <div className="space-y-1">
                      <p>{lead.address}</p>
                      <p className="font-medium text-base">{[lead.city, lead.state, lead.zipCode].filter(Boolean).join(", ")}</p>
                      <p className="text-xs text-slate-500">{lead.country || "India"}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No address provided.</span>
                  )}
                </div>
              </div>
              
              <Separator className="bg-slate-50" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Lead Origin</Label>
                  <div className="text-base font-medium capitalize text-slate-700">
                    {lead.source.replace(/_/g, " ")}
                  </div>
                  {lead.sourceDetails && (
                    <p className="text-[12px] text-slate-500 mt-0.5">{lead.sourceDetails}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1 block">Referred By</Label>
                  <div className="text-base font-medium text-slate-700">
                    {lead.referredBy || "None"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Section */}
        <div className="space-y-4">
          <Tabs defaultValue="activities" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-100 border p-1 rounded-lg">
                <TabsTrigger value="activities" className="rounded-md px-4 py-2 text-sm">Activities</TabsTrigger>
                <TabsTrigger value="hierarchy" className="rounded-md px-4 py-2 text-sm">Hierarchy</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-md px-4 py-2 text-sm">Notes</TabsTrigger>
                <TabsTrigger value="calls" className="rounded-md px-4 py-2 text-sm">Calls</TabsTrigger>
                <TabsTrigger value="files" className="rounded-md px-4 py-2 text-sm">Files</TabsTrigger>
                <TabsTrigger value="email" className="rounded-md px-4 py-2 text-sm">Email</TabsTrigger>
              </TabsList>
              
              <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Log Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Manual Activity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="note">Activity Notes</Label>
                      <Textarea 
                        id="note" 
                        placeholder="Enter details of the activity..." 
                        value={activityNote}
                        onChange={(e) => setActivityNote(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleAction("MANUAL_LOG", activityNote)}
                      disabled={!activityNote.trim() || recordActivityMutation.isPending}
                    >
                      {recordActivityMutation.isPending ? "Logging..." : "Save Activity"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="activities">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Activity Timeline
                    <Badge variant="secondary" className="font-normal">{activities.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100">
                    {activities.map((activity) => (
                      <div key={activity.id} className="relative flex items-start gap-6 group">
                        <div className="absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-slate-50 shadow-sm z-10 transition-colors group-hover:border-primary/20">
                          <div className="text-slate-500 group-hover:text-primary">
                            {getActionIcon(activity.action)}
                          </div>
                        </div>
                        <div className="ml-12 pt-1 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                            <p className="font-semibold text-slate-900">{getActionLabel(activity.action)}</p>
                            <p className="text-xs text-slate-400 font-medium">
                              {format(new Date(activity.createdAt), "MMM dd, yyyy · hh:mm a")}
                            </p>
                          </div>
                          {activity.details && (
                            <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-md mt-1 border border-slate-100/50">
                              {activity.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Clock className="h-12 w-12 mb-2 opacity-20" />
                        <p>No activity recorded yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hierarchy">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                  <FollowupHierarchy activities={activities} leadName={fullName} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Notes & Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requirement Analysis</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {lead.requirementDescription || "No requirement description provided."}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Notes</h4>
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        {lead.notes || "No internal notes added."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-sm font-bold text-slate-800 mb-4">Note History</h4>
                    <div className="space-y-4">
                      {activities.filter(a => a.action === "MANUAL_LOG" || a.action === "UPDATE_LEAD" || a.action === "FOLLOW_UP").map((activity) => (
                        <div key={activity.id} className="flex gap-3 text-sm">
                          <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900">{getActionLabel(activity.action)}</span>
                              <span className="text-[10px] text-slate-400">{format(new Date(activity.createdAt), "dd MMM, hh:mm a")}</span>
                            </div>
                            <p className="text-slate-600 italic">"{activity.details || "No details provided"}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calls">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Call Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {activities.filter(a => a.action === "CALL" || (a.action === "FOLLOW_UP" && a.details?.toLowerCase().includes("call"))).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{getActionLabel(activity.action)}</p>
                            <p className="text-xs text-slate-500">{activity.details || "Call activity logged"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-900">{format(new Date(activity.createdAt), "dd MMM, yyyy")}</p>
                          <p className="text-[10px] text-slate-400">{format(new Date(activity.createdAt), "hh:mm a")}</p>
                        </div>
                      </div>
                    ))}
                    {activities.filter(a => a.action === "CALL" || (a.action === "FOLLOW_UP" && a.details?.toLowerCase().includes("call"))).length === 0 && (
                      <div className="text-center py-12 text-slate-400 italic">No call logs found.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Files & Quotations</CardTitle>
                  </div>
                  <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none">
                    <Plus className="h-4 w-4" /> Create Document
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Quotations Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">QUOTATIONS (PDF VERSIONS)</h4>
                    <div className="space-y-3">
                      {quotations.map((quotation, index) => (
                        <div key={quotation.id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-10 bg-red-50 rounded flex items-center justify-center border border-red-100 shadow-sm shrink-0">
                              <FileText className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{quotation.quotationNumber} - Version v{quotations.length - index}</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <span>INR {Number(quotation.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                <span>·</span>
                                <span className="capitalize text-emerald-600 font-bold">{quotation.status}</span>
                                <span>·</span>
                                <span>{format(new Date(quotation.quotationDate), "dd MMM, hh:mm:ss a")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary"
                              onClick={() => {
                                const pdfUrl = `${import.meta.env.VITE_API_BASE_URL}/outbound-quotations/${quotation.id}/pdf`;
                                window.open(pdfUrl.replace(/\/api\/api\//g, "/api/"), "_blank");
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary"
                              onClick={() => {
                                let printUrl = `${import.meta.env.VITE_API_BASE_URL}/outbound-quotations/${quotation.id}/pdf`;
                                printUrl = printUrl.replace(/\/api\/api\//g, "/api/");
                                const printWindow = window.open(printUrl, "_blank");
                                if (printWindow) {
                                  printWindow.onload = () => {
                                    printWindow.print();
                                  };
                                }
                              }}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {quotations.length === 0 && (
                        <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-lg text-slate-400 text-sm">
                          No quotations found for this lead/customer.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Other Documents Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">OTHER DOCUMENTS</h4>
                    <div className="space-y-3">
                      {visits.filter(v => v.checkInPhotoPath || v.checkOutPhotoPath || v.attachmentPaths?.length > 0).map((visit) => (
                        <div key={visit.id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-10 bg-blue-50 rounded flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                              <FileUp className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Visit Proof - {visit.visitNumber}</p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {visit.purpose || "Field Visit"} · {format(new Date(visit.plannedDate), "dd MMM, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-bold"
                              onClick={() => {
                                setSelectedVisit(visit);
                                setIsProofUploadOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Files
                            </Button>
                          </div>
                        </div>
                      ))}
                      {visits.length === 0 && (
                        <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-lg text-slate-400 text-sm italic">
                          No additional documents or visit proofs found.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Email Correspondence</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {activities.filter(a => a.action === "EMAIL" || (a.action === "FOLLOW_UP" && a.details?.toLowerCase().includes("email"))).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{getActionLabel(activity.action)}</p>
                            <p className="text-xs text-slate-500">{activity.details || "Email activity logged"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-900">{format(new Date(activity.createdAt), "dd MMM, yyyy")}</p>
                          <p className="text-[10px] text-slate-400">{format(new Date(activity.createdAt), "hh:mm a")}</p>
                        </div>
                      </div>
                    ))}
                    {activities.filter(a => a.action === "EMAIL" || (a.action === "FOLLOW_UP" && a.details?.toLowerCase().includes("email"))).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-slate-400">
                        <Mail className="h-12 w-12 mb-4 opacity-10" />
                        <p className="text-sm font-medium">No email history found</p>
                        <p className="text-xs mt-1">Emails sent through the platform will appear here.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Sidebar Panel */}
      <div className="w-full md:w-80 p-4 md:p-6 bg-white border-l border-slate-100 space-y-6">
        <Card className="border-slate-100 shadow-none bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              ₹{Number(lead.estimatedBudget || 0).toLocaleString("en-IN")}
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-slate-500">Source</span>
                <span className="font-medium text-slate-700 capitalize">{lead.source.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-slate-500">Priority</span>
                <span className="font-medium">
                  <StatusBadge status={lead.priority} />
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-slate-500">Status</span>
                <span className="font-medium capitalize">
                  <StatusBadge status={lead.status} />
                </span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none rounded-full px-3">
                <TrendingUp className="h-3 w-3 mr-1" /> Hot Lead
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none rounded-full px-3">
                <BadgeAlert className="h-3 w-3 mr-1" /> Important
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lead.requirementDescription || "No specific requirements mentioned for this lead."}
            </p>
          </CardContent>
        </Card>

        {/* Mini Timeline Widget */}
        <Card className="border-slate-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold">Deal Initialized</p>
                <p className="text-[10px] text-slate-400">Source: {lead.source}</p>
              </div>
              <p className="text-xs font-bold text-slate-900">₹{Number(lead.estimatedBudget || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex justify-end gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <MessageSquare className="h-3.5 w-3.5 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <FollowUpForm
        open={isFollowUpModalOpen}
        onOpenChange={setIsFollowUpModalOpen}
        leadId={leadId!}
      />

      <ProofUpload
        open={isProofUploadOpen}
        onOpenChange={setIsProofUploadOpen}
        visit={selectedVisit}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: [`/api/field-visits`, { leadId: leadId }] });
        }}
      />
    </div>
  );
}
