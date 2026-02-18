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
      "/marketing/leads",
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
        ? `/marketing/leads?${queryParams}`
        : "/marketing/leads";
      return apiRequest(url);
    },
  });

  // Fetch lead metrics
  const { data: metrics } = useQuery<LeadMetrics>({
    queryKey: ["/marketing/leads/metrics"],
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Leads Management
          </h1>
          <p className="text-muted-foreground">
            Manage leads through the sales pipeline with status workflow and
            auto-handover
          </p>
        </div>
        <Button onClick={handleAddLead} data-testid="button-add-lead">
          <Plus className="mr-2 h-4 w-4" />
          Add New Lead
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-light">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Active leads in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-light">New Leads</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newLeads}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting first contact
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-light">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.inProgressLeads}
              </div>
              <p className="text-xs text-muted-foreground">
                Active opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-light">
                Conversion Rate
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics?.conversionRate ?? 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Leads to customers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads by name, company, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-light">Filters:</span>
              </div>

              <Select
                value={sourceFilter}
                onValueChange={(value) =>
                  setSourceFilter(value as LeadSource | "all")
                }
              >
                <SelectTrigger
                  className="w-[140px]"
                  data-testid="filter-source"
                >
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
                onValueChange={(value) =>
                  setPriorityFilter(value as LeadPriority | "all")
                }
              >
                <SelectTrigger
                  className="w-[120px]"
                  data-testid="filter-priority"
                >
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
                <SelectTrigger
                  className="w-[140px]"
                  data-testid="filter-assignee"
                >
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

              {(sourceFilter !== "all" ||
                priorityFilter !== "all" ||
                assigneeFilter !== "all" ||
                searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSourceFilter("all");
                    setPriorityFilter("all");
                    setAssigneeFilter("all");
                    setSearchQuery("");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs and Lead Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads ({filteredLeads.length})</span>
            {selectedStatus !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {selectedStatus.replace("_", " ")} leads
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedStatus}
            onValueChange={(value) =>
              setSelectedStatus(value as LeadStatus | "all")
            }
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" data-testid="tab-all">
                All ({leads.length})
              </TabsTrigger>
              <TabsTrigger value="new" data-testid="tab-new">
                New ({getStatusCount("new")})
              </TabsTrigger>
              <TabsTrigger value="contacted" data-testid="tab-contacted">
                Contacted ({getStatusCount("contacted")})
              </TabsTrigger>
              <TabsTrigger value="in_progress" data-testid="tab-in-progress">
                In Progress ({getStatusCount("in_progress")})
              </TabsTrigger>
              <TabsTrigger value="converted" data-testid="tab-converted">
                Converted ({getStatusCount("converted")})
              </TabsTrigger>
              <TabsTrigger value="dropped" data-testid="tab-dropped">
                Dropped ({getStatusCount("dropped")})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-6">
              <LeadTable
                leads={filteredLeads}
                isLoading={isLoading}
                onEdit={handleEditLead}
                onView={handleViewLead}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                tags: editingLead.tags || [],
              }
            : undefined
        }
      />
    </div>
  );
}
