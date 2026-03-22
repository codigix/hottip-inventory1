import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  Download,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  LeadPriority,
  User,
  Customer,
} from "@/types";

export default function LeadReceived() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithAssignee | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("converted");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">("all");
  const [, setLocation] = useLocation();

  // Fetch customers to link leads to customers for quotations
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  // Build query parameters for server-side filtering
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    return params.toString();
  }, [statusFilter, priorityFilter, searchQuery]);

  // Fetch leads data with server-side filtering
  const { data: leads = [], isLoading } = useQuery<LeadWithAssignee[]>({
    queryKey: [
      "/marketing/leads",
      {
        status: statusFilter,
        priority: priorityFilter,
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

  const handleAddLead = () => {
    setEditingLead(null);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: LeadWithAssignee) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleViewLead = (lead: LeadWithAssignee) => {
    console.log("View lead:", lead);
  };

  const handleAddQuotation = (lead: LeadWithAssignee) => {
    // Find matching customer by company name or email
    const customer = customers.find(
      (c) =>
        (lead.companyName && c.company === lead.companyName) ||
        (lead.email && c.email === lead.email)
    );

    if (customer) {
      setLocation(`/sales/outbound-quotations/new?customerId=${customer.id}`);
    } else {
      // If no customer found, just go to the new quotation page
      setLocation("/sales/outbound-quotations/new");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50/30 min-h-full">
      {/* Header - Clean and Professional */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lead Requests & Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage incoming lead requests through the analysis workflow
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleAddLead} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Manual Lead Entry
          </Button>
        </div>
      </div>

      {/* Filter Toolbar - Compact and Professional */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests by name or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-slate-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workflow:</span>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
                >
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="converted">1. Lead Received</SelectItem>
                    <SelectItem value="contacted">2. Contacted</SelectItem>
                    <SelectItem value="analysis">3. Under Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority:</span>
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => setPriorityFilter(value as LeadPriority | "all")}
                >
                  <SelectTrigger className="w-[130px] h-9 text-sm">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Request List */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b bg-muted/10 py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center">
              <ClipboardList className="h-4 w-4 mr-2 text-primary" />
              Incoming Requests ({leads.length})
            </CardTitle>
            <Badge variant="outline" className="font-bold text-[10px] bg-white uppercase tracking-tighter border-slate-800">
              Viewing: {statusFilter === "converted" ? "Lead Received" : statusFilter.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <LeadTable
            leads={leads}
            isLoading={isLoading}
            onEdit={handleEditLead}
            onView={handleViewLead}
            onAddQuotation={handleAddQuotation}
            isSalesMode={true}
          />
        </CardContent>
      </Card>

      <LeadForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        leadId={editingLead?.id}
        defaultValues={editingLead || undefined}
      />
    </div>
  );
}
