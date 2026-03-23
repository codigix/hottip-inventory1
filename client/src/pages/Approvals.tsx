import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StartTourButton } from "@/components/StartTourButton";
import { adminApprovalsTour } from "@/components/tours/dashboardTour";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, Filter, RefreshCcw, User, Calendar as CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";

interface ApprovalRequest {
  id: string;
  type: string;
  requestor: string;
  status: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  priority?: string;
}

const fetchApprovals = async (): Promise<ApprovalRequest[]> => {
  const res = await fetch("/api/admin/approvals");
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
};

const updateApprovalStatus = async ({ id, status }: { id: string; status: string }) => {
  const res = await fetch(`/api/admin/approvals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update approval status");
  return res.json();
};

const Approvals: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/admin/approvals"],
    queryFn: fetchApprovals,
  });

  const mutation = useMutation({
    mutationFn: updateApprovalStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/admin/approvals"] });
      toast({
        title: "Status Updated",
        description: `Request has been ${data.status}.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const requests = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(requests.map((req) => req.type).filter(Boolean)));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesType = typeFilter === "all" || req.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [requests, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 uppercase text-[10px]">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="uppercase text-[10px]">Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 uppercase text-[10px]">Pending</Badge>;
    }
  };

  const columns: Column<ApprovalRequest>[] = [
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-900 capitalize">{item.type?.replace(/_/g, " ")}</span>
        </div>
      ),
    },
    {
      key: "requestor",
      header: "Requestor",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
            {item.requestor?.split(" ").map(n => n[0]).join("")}
          </div>
          <span className="text-slate-600">{item.requestor || "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Details",
      cell: (item) => (
        <div className="text-xs space-y-1">
          {item.startDate && (
            <div className="flex items-center gap-1 text-slate-500">
              <CalendarIcon className="h-3 w-3" />
              <span>{format(new Date(item.startDate), "MMM d")} - {item.endDate ? format(new Date(item.endDate), "MMM d, yyyy") : "N/A"}</span>
            </div>
          )}
          <div className="text-slate-400 italic truncate max-w-[200px]">"{item.reason || "No reason provided"}"</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (item) => getStatusBadge(item.status),
    },
    {
      key: "actions",
      header: "Decision",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.status === "pending" ? (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                onClick={() => mutation.mutate({ id: item.id, status: "approved" })}
                disabled={mutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => mutation.mutate({ id: item.id, status: "rejected" })}
                disabled={mutation.isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 text-slate-400"
              onClick={() => mutation.mutate({ id: item.id, status: "pending" })}
            >
              Reset to Pending
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900  flex items-center gap-2" data-tour="admin-approvals-header">
            <Clock className="h-6 w-6 text-primary" />
            Approvals Console
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Review and manage system-wide approval requests from all departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-white"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <StartTourButton tourConfig={adminApprovalsTour} tourName="admin-approvals" />
        </div>
      </div>

      <div className="border-slate-200 shadow-sm overflow-hidden">
        <div className=" border-b border-slate-100 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 min-w-[150px]">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filter Requests:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">{type?.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            data={filteredRequests}
            columns={columns}
            isLoading={isLoading}
            searchable={true}
            searchPlaceholder="Search requestor or reason..."
            defaultPageSize={10}
          />
        </div>
      </div>
    </div>
  );
};

export default Approvals;
