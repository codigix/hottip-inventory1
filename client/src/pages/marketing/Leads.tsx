import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  Filter,
  Download,
  Users,
  TrendingUp,
  Target,
  UserCheck,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import LeadTable from "@/components/marketing/LeadTable";
import LeadForm from "@/components/marketing/LeadForm";
import LeadCard from "@/components/marketing/LeadCard";
import ProofUpload from "@/components/marketing/ProofUpload";
import type {
  LeadWithAssignee,
  LeadStatus,
  LeadSource,
  LeadPriority,
  User,
  LeadMetrics,
} from "@/types";
import type { FieldVisit } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: { 
    id: string; 
    firstName: string; 
    lastName: string; 
    companyName?: string;
  };
}

export default function Leads() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithAssignee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">(
    "all"
  );
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [statusChangeLeadId, setStatusChangeLeadId] = useState<string | null>(
    null
  );
  const [, setLocation] = useLocation();
  const [newStatus, setNewStatus] = useState<LeadStatus | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedVisitForProof, setSelectedVisitForProof] = useState<VisitWithDetails | null>(null);
  const [isFetchingVisit, setIsFetchingVisit] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query parameters for server-side filtering
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (assigneeFilter !== "all") params.set("assignedTo", assigneeFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    return params.toString();
  }, [
    sourceFilter,
    priorityFilter,
    assigneeFilter,
    searchQuery,
  ]);

  // Fetch leads data with server-side filtering
  const { data: leads = [], isLoading } = useQuery<LeadWithAssignee[]>({
    queryKey: [
      "/api/marketing/leads",
      {
        source: sourceFilter,
        priority: priorityFilter,
        assignedTo: assigneeFilter,
        search: searchQuery.trim(),
      },
    ],
    queryFn: () => {
      const url = queryParams
        ? `/api/marketing/leads?${queryParams}`
        : "/api/marketing/leads";
      return apiRequest(url);
    },
  });

  // Fetch lead metrics
  const { data: metrics } = useQuery<LeadMetrics>({
    queryKey: ["/api/marketing/leads/metrics"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/users"],
  });

  // ✅ Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/marketing/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      toast({ title: "Lead deleted successfully!" });
      setDeleteLeadId(null);
    },
  });

  // ✅ Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiRequest(`/api/marketing/leads/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks"] });
      toast({
        title:
          variables.status === "converted"
            ? "Lead confirmed for sales successfully!"
            : "Lead status updated successfully!",
      });
      setStatusChangeLeadId(null);
      setNewStatus(null);
    },
  });

  // ✅ Convert lead mutation
  const convertMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/marketing/leads/${id}/convert`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks"] });
      toast({
        title: "Lead confirmed for Sales and handed over!",
      });
    },
  });

  const handleDelete = () => {
    if (deleteLeadId) deleteMutation.mutate(deleteLeadId);
  };

  const handleStatusChange = () => {
    if (statusChangeLeadId && newStatus) {
      if (newStatus === "converted") {
        convertMutation.mutate(statusChangeLeadId);
      } else {
        updateStatusMutation.mutate({
          id: statusChangeLeadId,
          status: newStatus,
        });
      }
    }
  };

  const handleStatusChangeAction = (id: string, status: LeadStatus) => {
    if (status === "converted") {
      setStatusChangeLeadId(id);
      setNewStatus(status);
    } else {
      updateStatusMutation.mutate({
        id,
        status,
      });
    }
  };

  // Use leads directly from server-side filtering (no client-side filtering needed)
  const filteredLeads = leads;

  // Get lead counts by status (use filtered results)
  const getStatusCount = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status).length;
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: LeadWithAssignee) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleViewLead = (lead: LeadWithAssignee) => {
    setLocation(`/marketing/leads/${lead.id}`);
  };

  const handleUploadProof = async (lead: LeadWithAssignee) => {
    try {
      setIsFetchingVisit(true);
      // Fetch visits for this specific lead
      const visits = await apiRequest(`/api/field-visits?leadId=${lead.id}`);
      
      if (Array.isArray(visits) && visits.length > 0) {
        // Find the most recent visit or one that is 'Completed' or 'In Progress'
        // For now, let's take the first one (most recent as per server default sorting)
        const visit = visits[0];
        setSelectedVisitForProof({
          ...visit,
          lead: {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            companyName: lead.companyName
          }
        });
        setIsProofModalOpen(true);
      } else {
        toast({
          title: "No visits found",
          description: "This lead has no field visits scheduled. Please schedule a deal/visit first to upload proof.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch visits for this lead",
        variant: "destructive"
      });
    } finally {
      setIsFetchingVisit(false);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (status: string) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      handleStatusChangeAction(leadId, status);
    }
  };

  return (
    <div className="space-y-2 p-4 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-tour="marketing-leads-header">
        <div>
          <h1 className="text-xl  text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Leads Management
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage leads through the sales pipeline with status workflow and auto-handover.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-md border p-1 h-9 items-center mr-2">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="bg-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddLead} size="sm" data-testid="button-add-lead" data-tour="marketing-add-lead-button">
            <Plus className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
                Total Leads
                <Users className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl text-slate-900">{metrics.totalLeads}</div>
              <p className="text-[10px] text-slate-400 mt-1">Active leads in pipeline</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
                New Leads
                <Target className="h-4 w-4 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl text-slate-900">{metrics.newLeads}</div>
              <p className="text-[10px] text-slate-400 mt-1">Awaiting first contact</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
                Qualified
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl text-slate-900">{metrics.qualifiedLeads}</div>
              <p className="text-[10px] text-slate-400 mt-1">Qualified leads</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
                Conversion Rate
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl text-slate-900">{(metrics?.conversionRate ?? 0).toFixed(1)}%</div>
              <p className="text-[10px] text-slate-400 mt-1">Leads to customers</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads by name, company, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 h-10"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>

            <Select
              value={sourceFilter}
              onValueChange={(value) => setSourceFilter(value as LeadSource | "all")}
            >
              <SelectTrigger className="w-[160px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="advertisement">Advertisement</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="trade_show">Trade Show</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="email_campaign">Email Campaign</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as LeadPriority | "all")}
            >
              <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[160px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(sourceFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSourceFilter("all");
                  setPriorityFilter("all");
                  setAssigneeFilter("all");
                  setSearchQuery("");
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lead Table/Kanban */}
      <div className="" data-tour="marketing-leads-table">
        {viewMode === "list" ? (
          <div className="mt-4">
            <LeadTable
              leads={filteredLeads}
              isLoading={isLoading}
              onEdit={handleEditLead}
              onView={handleViewLead}
              onUploadProof={handleUploadProof}
            />
          </div>
        ) : (
          <div className="mt-4 pb-4 h-[calc(100vh-280px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-full">
              {/* Kanban Columns */}
              {[
                { id: "new", label: "Not Contacted", color: "bg-blue-500", border: "border-t-blue-500" },
                { id: "contacted", label: "Contacted", color: "bg-yellow-500", border: "border-t-yellow-500" },
                { id: "qualified", label: "Qualified", color: "bg-green-500", border: "border-t-green-500" },
                { id: "lost", label: "Lost", color: "bg-red-500", border: "border-t-red-500" }
              ].map((column) => {
                const columnLeads = leads.filter(l => l.status === column.id);
                const totalBudget = columnLeads.reduce((sum, l) => sum + (l.estimatedBudget ? parseFloat(l.estimatedBudget) : 0), 0);
                
                return (
                  <div 
                    key={column.id} 
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id as LeadStatus)}
                    className={`flex flex-col bg-slate-50/80 rounded-lg border-t-4 ${column.border} shadow-sm overflow-hidden min-w-0 transition-all ${
                      dragOverColumn === column.id ? "bg-slate-200/80 ring-2 ring-primary/20 scale-[1.01]" : ""
                    }`}
                  >
                    <div className="p-2 border-b bg-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${column.color}`} />
                        <span className="font-bold text-[11px] text-slate-700 truncate">{column.label}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-white/50 border-b flex items-center justify-between text-[9px] text-slate-500 shrink-0">
                      <span>{columnLeads.length} Leads</span>
                      <span className="font-medium">₹{totalBudget.toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-2 custom-scrollbar">
                      {columnLeads.length === 0 ? (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg py-12">
                          <span className="text-[10px] text-slate-400">No Leads</span>
                        </div>
                      ) : (
                        columnLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={handleEditLead}
                            onView={handleViewLead}
                            onDelete={setDeleteLeadId}
                            onStatusChange={handleStatusChangeAction}
                            onUploadProof={handleUploadProof}
                            variant="kanban"
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Delete Confirmation */}
      <AlertDialog
        open={!!deleteLeadId}
        onOpenChange={() => setDeleteLeadId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Status Change Confirmation */}
      <AlertDialog
        open={!!statusChangeLeadId}
        onOpenChange={() => {
          setStatusChangeLeadId(null);
          setNewStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Lead Status</AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === "converted"
                ? "Confirming this lead for sales will create a Sales customer record."
                : `Are you sure you want to mark as "${newStatus === "converted" ? "Converted to Deal" : (newStatus || "").charAt(0).toUpperCase() + (newStatus || "").slice(1)}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} data-tour={newStatus === "converted" ? "marketing-lead-conversion-button" : undefined}>
              {newStatus === "converted" ? "Confirm for Sales" : "Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lead Form Modal */}
      <LeadForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        leadId={editingLead?.id}
        defaultValues={
          editingLead
            ? {
                firstName: editingLead.firstName,
                lastName: editingLead.lastName,
                companyName: editingLead.companyName || "",
                email: editingLead.email || "",
                phone: editingLead.phone || "",
                alternatePhone: editingLead.alternatePhone || "",
                address: editingLead.address || "",
                city: editingLead.city || "",
                state: editingLead.state || "",
                zipCode: editingLead.zipCode || "",
                country: editingLead.country,
                source: editingLead.source,
                sourceDetails: editingLead.sourceDetails || "",
                referredBy: editingLead.referredBy || "",
                requirementDescription:
                  editingLead.requirementDescription || "",
                estimatedBudget: editingLead.estimatedBudget?.toString() || "",
                budgetRange: editingLead.budgetRange || "",
                priority: editingLead.priority,
                assignedTo: editingLead.assignedTo || "",
                followUpDate: editingLead.followUpDate
                  ? new Date(editingLead.followUpDate)
                      .toISOString()
                      .split("T")[0]
                  : "",
                expectedClosingDate: editingLead.expectedClosingDate
                  ? new Date(editingLead.expectedClosingDate)
                      .toISOString()
                      .split("T")[0]
                  : "",
                notes: editingLead.notes || "",
              }
            : undefined
        }
      />

      <ProofUpload
        open={isProofModalOpen}
        onOpenChange={setIsProofModalOpen}
        visit={selectedVisitForProof}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
          setIsProofModalOpen(false);
        }}
      />
    </div>
  );
}
