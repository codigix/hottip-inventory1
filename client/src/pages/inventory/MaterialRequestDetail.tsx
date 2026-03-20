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
  CheckCircle
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

export default function MaterialRequestDetail() {
  const [, params] = useRoute("/inventory/material-requests/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState("Main Warehouse");

  const { data: request, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [`/material-requests/${id}`],
    enabled: !!id,
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["/purchase-orders"],
  });

  const linkPOMutation = useMutation({
    mutationFn: async (purchaseOrderId: string) => {
      return apiRequest("PUT", `/material-requests/${id}`, { purchaseOrderId });
    },
    onSuccess: () => {
      toast({
        title: "PO Linked",
        description: "Purchase Order has been linked to this material request.",
      });
      queryClient.invalidateQueries({ queryKey: [`/material-requests/${id}`] });
    },
  });

  const generateRFQMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/material-requests/${id}/generate-rfq`);
    },
    onSuccess: () => {
      toast({
        title: "RFQ Generated",
        description: "Request for Quotation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/material-requests/${id}`] });
      setLocation("/inventory/vendor-quotations");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const releaseMaterialMutation = useMutation({
    mutationFn: async () => {
      const itemsToRelease = lineItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        location: selectedLocation
      }));
      return apiRequest("POST", `/material-requests/${id}/release`, {
        items: itemsToRelease
      });
    },
    onSuccess: () => {
      toast({
        title: "Materials Released",
        description: "Material release processed and inventory updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/material-requests/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/products"] });
      queryClient.invalidateQueries({ queryKey: ["/stock-transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Request Not Found</h2>
        <Link href="/inventory/material-requests">
          <Button>Back to Material Requests</Button>
        </Link>
      </div>
    );
  }

  const lineItems = request.items || [];

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/inventory/material-requests">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{request.requestNumber}</h1>
          <p className="text-sm text-muted-foreground">Material Request Details</p>
        </div>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-none border-none bg-orange-50/50">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider font-medium mb-1">Status</p>
              <p className="text-sm font-bold text-orange-600">{request.status}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-none bg-blue-50/50">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider font-medium mb-1">Purpose</p>
              <p className="text-sm font-bold">{request.purpose}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-none bg-purple-50/50">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider font-medium mb-1">Department</p>
              <p className="text-sm font-bold">{request.department}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-none bg-emerald-50/50">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider font-medium mb-1">Requested By</p>
              <p className="text-sm font-bold">System User</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-none bg-slate-100/50">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider font-medium mb-1">Linked PO</p>
              {request.purchaseOrderId ? (
                <Link href={`/inventory/vendor-po/${request.purchaseOrderId}`}>
                  <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">
                    #{request.poNumber || "View PO"}
                  </p>
                </Link>
              ) : (
                <p className="text-sm font-bold text-slate-400">#N/A</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <Package className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Line Items</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-blue-600 border-blue-100 bg-blue-50/50"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} /> 
                {isRefetching ? "Refreshing..." : "Refresh Stock"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50/50">
                    <TableHead className="py-4 px-6 text-[0.8rem] font-medium text-muted-foreground">Item Details</TableHead>
                    <TableHead className="py-4 px-6 text-center text-[0.8rem] font-medium text-muted-foreground">Design Qty</TableHead>
                    <TableHead className="py-4 px-6 text-center text-[0.8rem] font-medium text-muted-foreground">Stock Level</TableHead>
                    <TableHead className="py-4 px-6 text-right text-[0.8rem] font-medium text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No items in this request.</TableCell>
                    </TableRow>
                  ) : lineItems.map((item: any) => {
                    const stockValue = item.productId ? item.productStock : item.sparePartStock;
                    const isOutOfStock = stockValue < item.quantity;
                    
                    return (
                      <TableRow key={item.id} className="group">
                        <TableCell className="py-5 px-6">
                          <div className="space-y-1">
                            <p className="text-[0.7rem] font-medium text-slate-400 uppercase tracking-wider">
                              {item.productSku || item.sparePartNumber || (item.notes ? "ITEM" : "N/A")}
                            </p>
                            <p className="text-sm font-semibold text-slate-700">
                              {item.productName || item.sparePartName || item.notes || "Unknown Item"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-center font-medium">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-center">
                          <div className="space-y-1">
                            <p className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-slate-700'}`}>
                              {stockValue != null ? `${stockValue} ${item.unit}` : "Check Stock"}
                            </p>
                            <p className="text-[0.7rem] text-blue-500 font-medium">Main Warehouse</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" 
                              className={`text-[0.65rem] font-medium px-1.5 py-0 ${
                                !isOutOfStock 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                  : "bg-red-50 text-red-600 border-red-100"
                              }`}
                            >
                              {!isOutOfStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                            <Badge variant="outline" className="text-[0.65rem] font-medium bg-slate-100/50 border-slate-200 px-1.5 py-0">
                              {request.status}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* RFQ Card */}
          <Card className="bg-indigo-600 text-white shadow-md border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded">
                    <Send className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase">Sent Requests (RFQ)</span>
                </div>
                <Badge variant="outline" className="text-[0.65rem] border-white/30 text-white/80">0 REQUESTS</Badge>
              </div>
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-3 bg-white/5">
                <p className="text-xs text-white/60">No RFQs generated yet</p>
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Card */}
          <Card className="bg-orange-500 text-white shadow-md border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white/10 rounded">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase">Fulfillment Source</span>
                </div>
                <Badge className="bg-white text-orange-600 text-[0.6rem] font-bold hover:bg-white/90">ACTION REQUIRED</Badge>
              </div>
              <div className="p-5 space-y-4 bg-white text-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Select Warehouse</label>
                    <div className="flex items-center space-x-1 text-orange-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-[0.7rem] font-bold">Partial Stock</span>
                    </div>
                  </div>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full justify-between text-slate-800 border-slate-200 font-medium text-sm h-11 bg-white">
                      <SelectValue placeholder="Select Warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                      <SelectItem value="Secondary Warehouse">Secondary Warehouse</SelectItem>
                      <SelectItem value="Production Floor">Production Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex space-x-3">
                  <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[0.75rem] text-orange-800 leading-relaxed font-medium">
                    Stock is insufficient globally. A Purchase Order may be required for some items.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex items-center space-x-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Request Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-lg space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <span className="text-[0.7rem] font-bold text-slate-500">Linked Purchase Order:</span>
                </div>
                <div className="space-y-3">
                  {request.purchaseOrderId ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-600">#{request.poNumber || "Linked PO"}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-[0.7rem] text-slate-400">Status:</span>
                        <Badge variant="outline" className="text-[0.6rem] bg-emerald-50 text-emerald-600 border-emerald-100">
                          Linked
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-400 italic">No PO Linked</p>
                      <Select 
                        onValueChange={(value) => linkPOMutation.mutate(value)}
                        disabled={linkPOMutation.isPending}
                      >
                        <SelectTrigger className="w-full h-9 text-[0.7rem]">
                          <SelectValue placeholder="Link existing PO..." />
                        </SelectTrigger>
                        <SelectContent>
                          {purchaseOrders?.filter((po: any) => po.status !== 'cancelled').map((po: any) => (
                            <SelectItem key={po.id} value={po.id} className="text-[0.7rem]">
                              #{po.poNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Required By</span>
                  <Button variant="outline" size="sm" className="h-8 text-[0.75rem] font-medium text-slate-700 bg-slate-50 border-slate-200">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-slate-400" /> {request.requiredBy ? format(new Date(request.requiredBy), "dd-MM-yyyy") : "N/A"}
                  </Button>
                </div>
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <span className="text-xs text-slate-400 font-medium">Created On</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">{format(new Date(request.createdAt), "dd-MM-yyyy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Items Total</span>
                  <span className="text-xs font-bold text-blue-600">{lineItems.length} Unique Items</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full text-slate-600 border-slate-200 font-medium text-xs h-10 bg-slate-50/50">
                <Printer className="mr-2 h-4 w-4" /> Print Document
              </Button>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {request.notes && (
            <Card className="shadow-sm border-slate-200/60 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Info className="h-4 w-4" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Request Notes & Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {request.notes}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 right-0 left-[320px] bg-white border-t border-slate-100 p-4 flex justify-end items-center space-x-3 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-10">
        <Button variant="ghost" className="text-slate-500 font-medium px-8 h-11">Cancel</Button>
        
        {request.status !== "FULFILLED" && request.status !== "CANCELLED" && (
          <>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 rounded-lg"
              onClick={() => releaseMaterialMutation.mutate()}
              disabled={
                releaseMaterialMutation.isPending || 
                lineItems.length === 0 ||
                lineItems.some((item: any) => !item.productId || (item.productStock < item.quantity))
              }
            >
              {releaseMaterialMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Release Material
            </Button>

            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-11 rounded-lg"
              onClick={() => generateRFQMutation.mutate()}
              disabled={generateRFQMutation.isPending}
            >
              {generateRFQMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
              Request Quote (RFQ)
            </Button>
          </>
        )}
      </div>
      <div className="h-20"></div> {/* Spacer for fixed footer */}
    </div>
  );
}
