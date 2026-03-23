import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Download,
  Users,
  TrendingUp,
  Target,
  UserCheck,
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

import { apiRequest } from "@/lib/queryClient";
import LeadTable from "@/components/marketing/LeadTable";
import LeadForm from "@/components/marketing/LeadForm";
import type {
  LeadWithAssignee,
  LeadStatus,
  LeadSource,
  LeadPriority,
  User,
  LeadMetrics,
} from "@/types";

export default function Leads() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithAssignee | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">(
    "all"
  );
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");

  // Build query parameters for server-side filtering
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (assigneeFilter !== "all") params.set("assignedTo", assigneeFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    return params.toString();
  }, [
    selectedStatus,
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
        status: selectedStatus,
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
    // This is handled by the LeadTable component
    console.log("View lead:", lead);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLead(null);
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
                In Progress
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl text-slate-900">{metrics.inProgressLeads}</div>
              <p className="text-[10px] text-slate-400 mt-1">Active opportunities</p>
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

      {/* Status Tabs and Lead Table */}
      <div className="" data-tour="marketing-leads-table">
        <Tabs
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value as LeadStatus | "all")}
          className="w-full"
        >
          <div className=" border-b border-slate-100">
            <TabsList className="bg-slate-100/50 p-1  w-full justify-between  gap-1">
              <TabsTrigger value="all" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                All <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{leads.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="new" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                New <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{getStatusCount("new")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="contacted" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Contacted <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{getStatusCount("contacted")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="analysis" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Analysis <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{getStatusCount("analysis")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                In Progress <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{getStatusCount("in_progress")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="converted" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Confirmed <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{getStatusCount("converted")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="dropped" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Dropped <Badge variant="secondary" className="ml-2 px-2 bg-gray-600 text-[10px]">{getStatusCount("dropped")}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={selectedStatus} className="mt-0">
            <LeadTable
              leads={filteredLeads}
              isLoading={isLoading}
              onEdit={handleEditLead}
              onView={handleViewLead}
            />
          </TabsContent>
        </Tabs>
      </div>

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
    </div>
  );
}
