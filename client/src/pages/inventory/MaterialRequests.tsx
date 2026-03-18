import React from "react";
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
  AlertCircle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const summaryCards = [
  {
    title: "Total Requests",
    status: "ALL",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Draft",
    status: "DRAFT",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Approved",
    status: "APPROVED",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Processing",
    status: "PROCESSING",
    icon: RefreshCw,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Fulfilled",
    status: "FULFILLED",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Cancelled",
    status: "CANCELLED",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  }
];

export default function MaterialRequests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: materialRequests = [], isLoading } = useQuery({
    queryKey: ["/material-requests"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/material-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/material-requests"] });
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

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this material request?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (id: string) => {
    setLocation(`/inventory/material-requests/${id}`);
  };

  const getStatusCount = (status: string) => {
    if (status === "ALL") return materialRequests.length;
    return materialRequests.filter((r: any) => r.status === status).length;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Material Requests</h1>
          <p className="text-muted-foreground">
            Updated {format(new Date(), "HH:mm:ss")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className="text-xs font-medium text-blue-500">+0%</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{getStatusCount(card.status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, requester or department..." 
              className="pl-10 bg-muted/30 border-none h-11"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="h-11">
              <Filter className="mr-2 h-4 w-4" /> Columns
            </Button>
            <Button variant="outline" className="h-11">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] py-4">ID</TableHead>
                <TableHead className="py-4">Requester</TableHead>
                <TableHead className="py-4">Status</TableHead>
                <TableHead className="py-4">Required By</TableHead>
                <TableHead className="py-4">Availability</TableHead>
                <TableHead className="text-right py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading material requests...</TableCell>
                </TableRow>
              ) : materialRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No material requests found.</TableCell>
                </TableRow>
              ) : materialRequests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium py-4">
                    <Link href={`/inventory/material-requests/${request.id}`} className="hover:underline">
                      {request.requestNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">{request.department}</TableCell>
                  <TableCell className="py-4">
                    <Badge variant={request.status === "DRAFT" ? "outline" : "default"} 
                      className={request.status === "DRAFT" ? "font-normal bg-muted/50" : "font-normal bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50"}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 font-light">
                    {request.requiredBy ? format(new Date(request.requiredBy), "dd-MM-yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${request.status === 'FULFILLED' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`text-sm font-medium ${request.status === 'FULFILLED' ? 'text-emerald-600' : 'text-slate-500 italic'}`}>
                        {request.status === 'FULFILLED' ? "Available" : "Check Details"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => handleView(request.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDelete(request.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
