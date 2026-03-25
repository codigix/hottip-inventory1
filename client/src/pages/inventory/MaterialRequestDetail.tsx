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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [isRFQDialogOpen, setIsRFQDialogOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const { data: requestResponse, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [`/api/material-requests/${id}`],
    queryFn: async () => apiRequest("GET", `/api/material-requests/${id}`),
    enabled: !!id,
  });

  const request = requestResponse?.data || requestResponse;

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => apiRequest("GET", "/api/suppliers"),
  });

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
    mutationFn: async (vendorIds: string[]) => {
      return apiRequest("POST", `/api/material-requests/${id}/generate-rfq`, { vendorIds });
    },
    onSuccess: () => {
      toast({ title: "RFQ Generated", description: "Request for Quotation has been created successfully for selected vendors." });
      setIsRFQDialogOpen(false);
      setSelectedVendors([]);
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

  const retryLinkingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/material-requests/${id}/retry-linking`);
    },
    onSuccess: (data) => {
      toast({ 
        title: "Linking Complete", 
        description: `Successfully linked ${data.linkedCount || 0} items to stock.` 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/material-requests/${id}`] });
    },
    onError: (error: Error) => {
      toast({ title: "Linking Failed", description: error.message, variant: "destructive" });
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
          <h2 className="text-xl  text-slate-900">Request Not Found</h2>
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

  const columns = [
    {
      key: "productName",
      header: "Description",
      cell: (item: any) => (
        <div className="flex flex-col py-1">
          <span className=" text-slate-900">{item.productName || item.sparePartName || item.notes}</span>
          <span className="text-xs font-mono text-slate-400  tracking-tight">{item.productSku || item.sparePartNumber || "MANUAL ENTRY"}</span>
        </div>
      )
    },
    {
      key: "quantity",
      header: "Required Qty",
      cell: (item: any) => (
        <div className="text-center text-xs text-slate-700">
          {item.quantity} {item.unit || 'pcs'}
        </div>
      )
    },
    {
      key: "stock",
      header: "Available Stock",
      cell: (item: any) => {
        const stockValue = item.productId ? item.productStock : (item.sparePartId ? item.sparePartStock : null);
        const isLinked = item.productId || item.sparePartId;
        const isOutOfStock = isLinked ? (Number(stockValue || 0) < Number(item.quantity)) : true;
        return (
          <div className="flex flex-col items-center">
            <span className={cn("text-xs ", isOutOfStock ? "text-red-600" : "text-emerald-600")}>
              {isLinked ? `${stockValue ?? 0} ${item.unit || 'pcs'}` : "--"}
            </span>
            <span className="text-xs text-slate-400 font-medium ">Warehouse A</span>
          </div>
        );
      }
    },
    {
      key: "shortage",
      header: "Shortage",
      cell: (item: any) => {
        const stockValue = item.productId ? item.productStock : (item.sparePartId ? item.sparePartStock : 0);
        const shortage = Math.max(0, Number(item.quantity) - Number(stockValue || 0));
        return (
          <div className="text-center text-xs font-medium">
            <span className={cn(shortage > 0 ? "text-red-600" : "text-slate-400")}>
              {shortage > 0 ? `${shortage} ${item.unit || 'pcs'}` : "-"}
            </span>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Line Status",
      cell: (item: any) => {
        const stockValue = item.productId ? item.productStock : (item.sparePartId ? item.sparePartStock : null);
        const isLinked = item.productId || item.sparePartId;
        const isOutOfStock = isLinked ? (Number(stockValue || 0) < Number(item.quantity)) : true;
        return (
          <div className="">
            <Badge variant="outline" className={cn(
              "font-normal",
              item.status === 'FULFILLED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
              (isLinked && !isOutOfStock ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")
            )}>
              {item.status === 'FULFILLED' ? "Fulfilled" : (isLinked ? (!isOutOfStock ? "Available" : "Stock Shortage") : "Unlinked")}
            </Badge>
          </div>
        );
      }
    }
  ];

  const renderMainContent = () => {
    return (
      <>
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
                "font-normal p-2",
                request.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
              )}>
                {request.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Material requisition audit and fulfillment record.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50"
            onClick={() => retryLinkingMutation.mutate()}
            disabled={retryLinkingMutation.isPending}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", retryLinkingMutation.isPending && "animate-spin")} />
            Retry Linking
          </Button>
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50">
            <Printer className="h-4 w-4 mr-2 text-slate-400" />
            Print Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", metric.bg)}>
                <metric.icon className={cn("h-4 w-4", metric.color)} />
              </div>
              <div>
                <p className="text-xs  text-slate-400   leading-none mb-1">{metric.label}</p>
                <p className="text-xs  text-slate-900 truncate max-w-[120px]">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <div className="">
            <div className="p-2">
              <div className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-slate-400" />
                Line Item Registry
              </div>
            </div>
            <div className="">
              <DataTable 
                data={lineItems}
                columns={columns}
                searchable={true}
                searchKey="productName"
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Card className="border-none shadow-sm bg-primary text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs  flex items-center gap-2">
                <Send className="h-4 w-4 text-slate-400" />
                Fulfillment Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400   ">Storage Source</Label>
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
                    <span className={cn("", allAvailable ? "text-emerald-400" : "text-amber-400")}>
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
                    className="w-full bg-white text-slate-900 hover:bg-white/90 "
                    disabled={!allAvailable || releaseMaterialMutation.isPending || request.status === 'FULFILLED'}
                    onClick={() => releaseMaterialMutation.mutate()}
                  >
                    {releaseMaterialMutation.isPending ? "Processing..." : "Release Materials"}
                  </Button>
                  
                  {!allAvailable && (
                    <Button 
                      variant="outline" 
                      className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white"
                      onClick={() => setIsRFQDialogOpen(true)}
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

          <Card className="">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs  text-slate-800 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-4">
              <div className="relative pl-6 space-y-2 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                <div className="relative">
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                  <p className="text-xs  text-slate-900">Request Created</p>
                  <p className="text-xs text-slate-400">{format(new Date(request.createdAt || Date.now()), "dd MMM, HH:mm")}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm" />
                  <p className="text-xs  text-slate-900">Awaiting Manager Approval</p>
                  <p className="text-xs text-slate-400">System generated status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  };

  return (
    <div className="p-2 space-y-4 bg-slate-50/30 min-h-screen">
      {renderMainContent()}

      <Dialog open={isRFQDialogOpen} onOpenChange={setIsRFQDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Vendors for RFQ</DialogTitle>
            <DialogDescription>
              Choose multiple vendors to send this Request for Quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto pr-2">
            {suppliers.length === 0 ? (
              <p className="text-sm text-slate-500">No vendors found. Please add vendors first.</p>
            ) : (
              suppliers.map((supplier: any) => (
                <div key={supplier.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`vendor-${supplier.id}`} 
                    checked={selectedVendors.includes(supplier.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedVendors([...selectedVendors, supplier.id]);
                      } else {
                        setSelectedVendors(selectedVendors.filter(id => id !== supplier.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`vendor-${supplier.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {supplier.name}
                  </label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRFQDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => generateRFQMutation.mutate(selectedVendors)}
              disabled={selectedVendors.length === 0 || generateRFQMutation.isPending}
            >
              {generateRFQMutation.isPending ? "Generating..." : `Generate ${selectedVendors.length} RFQ(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
