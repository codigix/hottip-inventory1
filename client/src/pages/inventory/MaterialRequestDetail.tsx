import React, { useState } from "react";
import { 
  ArrowLeft, 
  Printer, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  Building2, 
  FileText,
  Package,
  AlertTriangle,
  Info,
  Calendar,
  MoreVertical,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  LayoutGrid,
  ClipboardList,
  History,
  Boxes
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function MaterialRequestDetail() {
  const [, params] = useRoute("/inventory/material-requests/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState("Main Warehouse");

  const { data: requestResponse, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [`/api/material-requests/${id}`],
    queryFn: async () => apiRequest("GET", `/api/material-requests/${id}`),
    enabled: !!id,
  });

  const request = requestResponse?.data || requestResponse;

  const { data: purchaseOrders } = useQuery({
    queryKey: ["/api/purchase-orders"],
    queryFn: async () => apiRequest("GET", "/api/purchase-orders"),
  });

  const linkPOMutation = useMutation({
    mutationFn: async (purchaseOrderId: string) => {
      return apiRequest("PUT", `/api/material-requests/${id}`, { purchaseOrderId });
    },
    onSuccess: () => {
      toast({ title: "PO Linked", description: "Purchase Order has been linked to this material request." });
      queryClient.invalidateQueries({ queryKey: [`/api/material-requests/${id}`] });
    },
  });

  const generateRFQMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/material-requests/${id}/generate-rfq`);
    },
    onSuccess: () => {
      toast({ title: "RFQ Generated", description: "Request for Quotation has been created successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/material-requests/${id}`] });
      setLocation("/inventory/vendor-quotations");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const releaseMaterialMutation = useMutation({
    mutationFn: async () => {
      const itemsToRelease = lineItems.map((item: any) => ({
        productId: item.productId,
        sparePartId: item.sparePartId,
        quantity: item.quantity,
        location: selectedLocation
      }));
      return apiRequest("POST", `/api/material-requests/${id}/release`, { items: itemsToRelease });
    },
    onSuccess: () => {
      toast({ title: "Materials Released", description: "Material release processed and inventory updated." });
      queryClient.invalidateQueries({ queryKey: [`/api/material-requests/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-slate-50/30">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-slate-300" />
          <p className="text-slate-500 font-medium">Retrieving request data...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-center min-h-screen bg-slate-50/30 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
          <AlertTriangle className="h-12 w-12 text-slate-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Request Not Found</h2>
          <p className="text-slate-500 mt-1">The material request you're looking for doesn't exist or has been archived.</p>
        </div>
        <Link href="/inventory/material-requests">
          <Button className="bg-primary hover:bg-primary text-white mt-4">Return to Registry</Button>
        </Link>
      </div>
    );
  }

  const lineItems = request.items || [];
  const allAvailable = lineItems.every((item: any) => {
    const stockValue = item.productId ? item.productStock : (item.sparePartId ? item.sparePartStock : 0);
    return (item.productId || item.sparePartId) && (Number(stockValue || 0) >= Number(item.quantity));
  });

  const metrics = [
    { label: "Status", value: request.status, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Purpose", value: request.purpose, icon: Info, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Department", value: request.department, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Date Issued", value: format(new Date(request.createdAt || Date.now()), "dd MMM yyyy"), icon: Calendar, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Linked PO", value: request.poNumber || "Unlinked", icon: ExternalLink, color: request.purchaseOrderId ? "text-emerald-600" : "text-slate-400", bg: request.purchaseOrderId ? "bg-emerald-50" : "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-6 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/inventory/material-requests">
            <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl  text-slate-900 ">{request.requestNumber}</h1>
              <Badge variant="outline" className={cn(
                "font-normal px-2 py-0.5",
                request.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
              )}>
                {request.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Material requisition audit and fulfillment record.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50">
            <Printer className="h-4 w-4 mr-2 text-slate-400" />
            Print Request
          </Button>
          <Button 
            className="bg-primary hover:bg-primary text-white shadow-sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
            Update Stock
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", metric.bg)}>
                <metric.icon className={cn("h-4 w-4", metric.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{metric.label}</p>
                <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-slate-400" />
                Line Item Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="py-4 px-6 text-slate-500 font-medium">Description</TableHead>
                    <TableHead className="py-4 px-6 text-center text-slate-500 font-medium">Required Qty</TableHead>
                    <TableHead className="py-4 px-6 text-center text-slate-500 font-medium">Available Stock</TableHead>
                    <TableHead className="py-4 px-6 text-right text-slate-500 font-medium">Line Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item: any) => {
                    const stockValue = item.productId ? item.productStock : (item.sparePartId ? item.sparePartStock : null);
                    const isLinked = item.productId || item.sparePartId;
                    const isOutOfStock = isLinked ? (Number(stockValue || 0) < Number(item.quantity)) : true;
                    
                    return (
                      <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{item.productName || item.sparePartName || item.notes}</span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{item.productSku || item.sparePartNumber || "MANUAL ENTRY"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className="text-sm font-medium text-slate-700">{item.quantity} {item.unit || 'pcs'}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn("text-sm font-bold", isOutOfStock ? "text-red-600" : "text-emerald-600")}>
                              {isLinked ? `${stockValue ?? 0} ${item.unit || 'pcs'}` : "--"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase">Warehouse A</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Badge variant="outline" className={cn(
                            "font-normal",
                            item.status === 'FULFILLED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                            (isLinked && !isOutOfStock ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")
                          )}>
                            {item.status === 'FULFILLED' ? "Fulfilled" : (isLinked ? (!isOutOfStock ? "Available" : "Stock Shortage") : "Unlinked")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-slate-400" />
                Fulfillment Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Storage Source</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Warehouse">Main Hub (Warehouse A)</SelectItem>
                      <SelectItem value="Site Yard B">Site Fabrication Yard B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Inventory Compliance</span>
                    <span className={cn("font-bold", allAvailable ? "text-emerald-400" : "text-amber-400")}>
                      {allAvailable ? "100% Ready" : "Stock Missing"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", allAvailable ? "bg-emerald-500" : "bg-amber-500")}
                      style={{ width: allAvailable ? "100%" : "65%" }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    className="w-full bg-white text-slate-900 hover:bg-white/90 font-semibold"
                    disabled={!allAvailable || releaseMaterialMutation.isPending || request.status === 'FULFILLED'}
                    onClick={() => releaseMaterialMutation.mutate()}
                  >
                    {releaseMaterialMutation.isPending ? "Processing..." : "Release Materials"}
                  </Button>
                  
                  {!allAvailable && (
                    <Button 
                      variant="outline" 
                      className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white"
                      onClick={() => generateRFQMutation.mutate()}
                      disabled={generateRFQMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Generate Supplier RFQ
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                <div className="relative">
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                  <p className="text-xs font-semibold text-slate-900">Request Created</p>
                  <p className="text-[10px] text-slate-400">{format(new Date(request.createdAt || Date.now()), "dd MMM, HH:mm")}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm" />
                  <p className="text-xs font-semibold text-slate-900">Awaiting Manager Approval</p>
                  <p className="text-[10px] text-slate-400">System generated status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
