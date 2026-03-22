import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Download,
  ClipboardList,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { apiRequest } from "@/lib/queryClient";
import { DataTable, Column } from "@/components/ui/data-table";
import LeadForm from "@/components/marketing/LeadForm";
import { StatusBadge, PriorityBadge } from "@/components/marketing/StatusBadge";
import type {
  LeadWithAssignee,
  LeadStatus,
  LeadPriority,
  User,
} from "@/types";

export default function LeadReceived() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithAssignee | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("converted");
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">("all");

  // Fetch leads data (filtering handled by DataTable or server-side if needed)
  // For now, let's keep server-side status/priority filters as they are part of the workflow
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    return params.toString();
  }, [statusFilter, priorityFilter]);

  const { data: leads = [], isLoading } = useQuery<LeadWithAssignee[]>({
    queryKey: [
      "/marketing/leads",
      {
        status: statusFilter,
        priority: priorityFilter,
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

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const columns: Column<LeadWithAssignee>[] = [
    {
      key: "firstName",
      header: "Lead",
      sortable: true,
      cell: (lead) => (
        <div className="space-y-1">
          <div className=" text-slate-800">
            {lead.firstName} {lead.lastName}
          </div>
          {lead.companyName && (
            <div className="text-xs text-slate-500">
              {lead.companyName}
            </div>
          )}
          <div className="text-xs text-slate-400">
            Created {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM, yyyy") : "-"}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      sortable: true,
      cell: (lead) => (
        <div className="space-y-1">
          {lead.email && (
            <div className="flex items-center text-xs text-slate-600">
              <Mail className="h-3 w-3 mr-1.5 text-slate-400" />
              {lead.email}
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center text-xs text-slate-600">
              <Phone className="h-3 w-3 mr-1.5 text-slate-400" />
              {lead.phone}
            </div>
          )}
          {lead.city && (
            <div className="flex items-center text-xs text-slate-400">
              <MapPin className="h-3 w-3 mr-1.5" />
              {lead.city}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (lead) => <StatusBadge status={lead.status} className="text-xs py-0 h-5" />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      cell: (lead) => <PriorityBadge priority={lead.priority} className="text-xs py-0 h-5" />,
    },
    {
      key: "estimatedBudget",
      header: "Budget",
      sortable: true,
      cell: (lead) => lead.estimatedBudget ? (
        <span className="text-xs font-medium text-slate-700">
          ₹{parseFloat(lead.estimatedBudget).toLocaleString("en-IN")}
        </span>
      ) : "-",
    },
    {
      key: "assignee",
      header: "Assigned To",
      cell: (lead) => (
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6 border border-slate-200">
            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
              {lead.assignee?.firstName?.[0] || ""}{lead.assignee?.lastName?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-600">
            {lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      key: "lastContactedDate",
      header: "Last Contact",
      sortable: true,
      cell: (lead) => lead.lastContactedDate ? (
        <div className="flex items-center text-xs text-slate-500">
          <Calendar className="h-3 w-3 mr-1.5" />
          {format(new Date(lead.lastContactedDate), "MMM dd")}
        </div>
      ) : "-",
    },
  ];

  return (
    <div className="p-2 space-y-3 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl  text-slate-900 tracking-tight">Leads Received</h1>
          <p className="text-slate-500 text-sm">Lead received, quotation and invoice management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white border-slate-200 text-slate-600 "
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            onClick={handleAddLead} 
            size="sm" 
            className="bg-primary hover:bg-primary text-white  transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="">
        <div className="p-2">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-3">
              <span className="text-xs   text-slate-400">Workflow:</span>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="converted">Lead Received</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="analysis">Under Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs   text-slate-400">Priority:</span>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as LeadPriority | "all")}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs bg-slate-50/50">
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
      </div>

      {/* Main Table Container */}
      <div className=" overflow-hidden">
        <div className="p-0">
          <DataTable
            data={leads}
            columns={columns}
            isLoading={isLoading}
            onEdit={handleEditLead}
            onView={handleViewLead}
            searchable={true}
            searchKey="firstName"
            searchPlaceholder="Search leads by name..."
          />
        </div>
      </div>

      <LeadForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        leadId={editingLead?.id}
        defaultValues={editingLead || undefined}
      />
    </div>
  );
}
