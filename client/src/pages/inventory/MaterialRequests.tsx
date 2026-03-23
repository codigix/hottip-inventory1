import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
  AlertCircle,
  FileUp,
  LayoutGrid,
  Package,
  Truck,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MaterialRequests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: materialRequestsResponse, isLoading } = useQuery({
    queryKey: ["/api/material-requests"],
    queryFn: async () => apiRequest("GET", "/api/material-requests"),
  });

  const materialRequests = Array.isArray(materialRequestsResponse?.data) 
    ? materialRequestsResponse.data 
    : (Array.isArray(materialRequestsResponse) ? materialRequestsResponse : []);

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await apiRequest("DELETE", `/api/material-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-requests"] });
      toast({
        title: "Success",
        description: "Material request deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material request",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this material request?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (id: string | number) => {
    setLocation(`/inventory/material-requests/${id}`);
  };

  const metrics = [
    { label: "Total Requests", value: materialRequests.length, icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Pending Review", value: materialRequests.filter((r: any) => r.status === 'DRAFT' || r.status === 'PENDING').length, icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Processing", value: materialRequests.filter((r: any) => r.status === 'PROCESSING').length, icon: RefreshCw, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Completed", value: materialRequests.filter((r: any) => r.status === 'FULFILLED').length, icon: CheckCircle2, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  const columns = [
    {
      key: "requestNumber",
      header: "Request Information",
      cell: (request: any) => (
        <div className="flex items-center gap-3">
          {/* <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <ClipboardList className="h-4 w-4 text-slate-400" />
          </div> */}
          <div className="flex flex-col">
            <Link href={`/inventory/material-requests/${request.id}`} className=" text-slate-900 hover:text-slate-600 transition-colors">
              {request.requestNumber || `MR-${request.id}`}
            </Link>
            <span className="text-xs text-slate-500">{request.department || "Internal Req"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "poNumber",
      header: "Reference",
      cell: (request: any) => (
        <div className="flex flex-col gap-1">
          {request.poNumber ? (
            <Badge variant="outline" className="w-fit text-xs  bg-slate-50 text-slate-600 border-slate-200">
              PO: {request.poNumber}
            </Badge>
          ) : (
            <span className="text-xs text-slate-400  uppercase tracking-wider">Internal Use</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (request: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal p-1",
            request.status === 'Fullfilled' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            request.status === 'Processing' && "bg-blue-50 text-blue-700 border-blue-200",
            (request.status === 'Draft' || request.status === 'PENDING') && "bg-amber-50 text-amber-700 border-amber-200",
            request.status === 'Cancelled' && "bg-red-50 text-red-700 border-red-200",
            !request.status && "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {request.status?.toLowerCase() || 'draft'}
        </Badge>
      ),
    },
    {
      key: "requiredBy",
      header: "Required By",
      cell: (request: any) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs ">
            {request.requiredBy ? format(new Date(request.requiredBy), "dd MMM yyyy") : "TBD"}
          </span>
        </div>
      ),
    },
    {
      key: "isAvailable",
      header: "Inventory Check",
      cell: (request: any) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            request.isAvailable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          )} />
          <span className={cn(
            "text-xs ",
            request.isAvailable ? "text-emerald-700" : "text-amber-700"
          )}>
            {request.isAvailable ? "Stock Available" : "Partial Fulfillment"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (request: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => handleView(request.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleDelete(request.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Material Requisitions</h1>
          <p className="text-xs text-slate-500">Track and manage internal stock requests from production and site teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50 ">
            <Download className="h-4 w-4 mr-2 text-slate-400" />
            Export Data
          </Button>
          <Link href="/inventory/material-requests/new">
            <Button className="bg-primary hover:bg-primary text-white shadow-sm ">
              <Plus className="h-4 w-4 mr-2" />
              New Requisition
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-2 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", metric.bg)}>
                <metric.icon className={cn("h-5 w-5", metric.color)} />
              </div>
              <div>
                <p className="text-xs  text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="">
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="text-lg  text-slate-800 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-slate-400" />
              Requisition Registry
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600  px-2 py-0.5 border-none">
              {materialRequests.length} Total Requests
            </Badge>
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Browse all historical and active material requests. Use search to filter by request number.
          </div>
        </div>
        <div className="p-0 mt-4">
          <DataTable
            data={materialRequests}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Search request number (e.g. MR-001)..."
          />
        </div>
      </div>
    </div>
  );
}
