import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  RefreshCw, 
  Package, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Building2,
  User,
  ExternalLink
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MaterialRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId?: string;
  materialRequestId?: string;
}

export default function MaterialRequestDialog({ 
  open, 
  onOpenChange, 
  quotationId,
  materialRequestId 
}: MaterialRequestDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  // First, if we have quotationId but not materialRequestId, fetch it
  const { data: linkedMr, isLoading: isLoadingLink } = useQuery({
    queryKey: [`/outbound-quotations/${quotationId}/material-request`],
    enabled: open && !!quotationId && !materialRequestId,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/outbound-quotations/${quotationId}/material-request`);
        return res;
      } catch (e) {
        return null;
      }
    }
  });

  const effectiveMrId = materialRequestId || linkedMr?.id;

  const { data: request, isLoading: isLoadingRequest, refetch, isRefetching } = useQuery({
    queryKey: [`/material-requests/${effectiveMrId}`],
    enabled: open && !!effectiveMrId,
  });

  const createMrMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/outbound-quotations/${quotationId}/material-request`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Material request created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/outbound-quotations/${quotationId}/material-request`] });
      queryClient.invalidateQueries({ queryKey: ["/material-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create material request.",
        variant: "destructive",
      });
    }
  });

  const releaseMaterialMutation = useMutation({
    mutationFn: async () => {
      const itemsToRelease = (request?.items || []).map((item: any) => ({
        productId: item.productId,
        sparePartId: item.sparePartId,
        quantity: item.quantity,
        location: "Main Warehouse" // Default location
      }));
      return apiRequest("POST", `/material-requests/${effectiveMrId}/release`, {
        items: itemsToRelease
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Material release processed and inventory updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/material-requests/${effectiveMrId}`] });
      queryClient.invalidateQueries({ queryKey: ["/products"] });
      queryClient.invalidateQueries({ queryKey: ["/spare-parts"] });
      queryClient.invalidateQueries({ queryKey: ["/stock-transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to release materials.",
        variant: "destructive",
      });
    }
  });

  const retryLinkingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/material-requests/${effectiveMrId}/retry-linking`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Items re-linked with inventory successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/material-requests/${effectiveMrId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to retry linking.",
        variant: "destructive",
      });
    }
  });

  const isLoading = isLoadingLink || isLoadingRequest;
  const lineItems = request?.items || [];
  
  const pendingItems = lineItems.filter((item: any) => item.status !== 'FULFILLED' && request?.status !== 'FULFILLED');
  const fulfilledItems = lineItems.filter((item: any) => item.status === 'FULFILLED' || request?.status === 'FULFILLED');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50/30">
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl  text-slate-900">Material Request</DialogTitle>
              <DialogDescription className="text-xs   tracking-widest text-primary mt-0.5">
                Resource Acquisition Phase
              </DialogDescription>
            </div>
          </div>
        </div>

        {!effectiveMrId && !isLoading && !!quotationId && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-orange-50 rounded">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg  text-slate-900">No Material Request Found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                A material request hasn't been created for this quotation yet.
              </p>
            </div>
            <Button onClick={() => createMrMutation.mutate()} disabled={createMrMutation.isPending}>
              {createMrMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Material Request
            </Button>
          </div>
        )}

        {(isLoading) && (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm  text-slate-500">Loading request details...</p>
          </div>
        )}

        {request && (
          <div className="p-2 space-y-3">
            {/* Request Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none  bg-white">
                <CardContent className="p-4 flex flex-col justify-center space-y-1">
                  <p className="text-[10px]  text-slate-400 ">Request Identifier</p>
                  <p className="text-sm  text-slate-900">{request.requestNumber}</p>
                </CardContent>
              </Card>
              <Card className="border-none  bg-white">
                <CardContent className="p-4 flex flex-col justify-center space-y-1">
                  <p className="text-[10px]  text-slate-400 ">Originating Dept</p>
                  <p className="text-sm  text-slate-900">{request.department}</p>
                </CardContent>
              </Card>
              <Card className="border-none  bg-white">
                <CardContent className="p-4 flex flex-col justify-center space-y-1">
                  <p className="text-[10px]  text-slate-400 ">SLA Target Date</p>
                  <p className="text-sm  text-slate-900">---</p>
                </CardContent>
              </Card>
            </div>

            {/* Items Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-slate-100/50 p-1 border border-slate-200">
                  <TabsTrigger value="pending" className="px-4 py-1.5 text-xs  data-[state=active]:bg-primary data-[state=active]:text-primary data-[state=active]:">
                    Pending Request <Badge variant="secondary" className="ml-2 bg-slate-200/50 text-slate-600 text-[10px]">{pendingItems.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="complete" className="px-4 py-1.5 text-xs  data-[state=active]:bg-primary data-[state=active]:text-primary data-[state=active]:">
                    Complete Request <Badge variant="secondary" className="ml-2 bg-slate-200/50 text-slate-600 text-[10px]">{fulfilledItems.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <span className="text-[10px]  text-slate-400  mr-2">Items to Request ({lineItems.length})</span>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]   bg-primary/5 text-primary border-primary/20" onClick={() => refetch()} disabled={isRefetching}>
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
                    Refresh Stock
                  </Button>
                  {lineItems.some((item: any) => !item.productId && !item.sparePartId) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px]   bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" 
                      onClick={() => retryLinkingMutation.mutate()} 
                      disabled={retryLinkingMutation.isPending}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1.5 ${retryLinkingMutation.isPending ? "animate-spin" : ""}`} />
                      Retry Linking
                    </Button>
                  )}
                  <Button variant="default" size="sm" className="h-8 text-[10px]   ">
                    <Plus className="h-3 w-3 mr-1.5" />
                    Add Item
                  </Button>
                </div>
              </div>

              <TabsContent value="pending" className="mt-0">
                <div className="bg-white rounded-xl border border-slate-200  overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="text-[10px]   text-slate-500 py-3">Component Intelligence</TableHead>
                        <TableHead className="text-[10px]   text-slate-500 py-3 text-center">Required</TableHead>
                        <TableHead className="text-[10px]   text-slate-500 py-3 text-center">Inventory</TableHead>
                        <TableHead className="text-[10px]   text-slate-500 py-3 text-right">Status Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-slate-400 text-xs italic">
                            No pending items found.
                          </TableCell>
                        </TableRow>
                      ) : pendingItems.map((item: any) => {
                        const stockValue = item.productId ? item.productStock : (item.sparePartId ? item.sparePartStock : null);
                        const isLinked = item.productId || item.sparePartId;
                        const isOutOfStock = isLinked ? (Number(stockValue || 0) < Number(item.quantity)) : true;
                        
                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm  text-slate-800">{item.productName || item.sparePartName || item.notes || "Unknown Item"}</span>
                                <span className="text-[10px] text-slate-400 ">({item.productSku || item.sparePartNumber || "UNLINKED"})</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm  text-slate-900">{parseFloat(item.quantity).toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 ml-1 ">{item.unit}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-sm  ${isOutOfStock ? 'text-red-500' : 'text-slate-900'}`}>
                                {isLinked ? (stockValue != null ? parseFloat(String(stockValue)).toFixed(2) : "0.00") : "Check Stock"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-3">
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className={`text-[10px]  px-2 py-0.5 ${isLinked && !isOutOfStock ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    {isLinked ? (!isOutOfStock ? "AVAILABLE" : "SHORTAGE") : "NOT LINKED"}
                                  </Badge>
                                  <Badge variant="outline" className="text-[8px]  bg-slate-100/50 border-slate-200 px-1.5 py-0">
                                    {item.status || "pending"}
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="complete" className="mt-0">
                <div className="bg-white rounded-xl border border-slate-200  overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="text-[10px]   text-slate-500 py-3">Component Intelligence</TableHead>
                        <TableHead className="text-[10px]   text-slate-500 py-3 text-center">Required</TableHead>
                        <TableHead className="text-[10px]   text-slate-500 py-3 text-center">Inventory</TableHead>
                        <TableHead className="text-[10px]   text-slate-500 py-3 text-right">Status Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fulfilledItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-slate-400 text-xs italic">
                            No fulfilled items yet.
                          </TableCell>
                        </TableRow>
                      ) : fulfilledItems.map((item: any) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors opacity-80">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm  text-slate-800">{item.productName || item.sparePartName || item.notes || "Unknown Item"}</span>
                              <span className="text-[10px] text-slate-400 ">({item.productSku || item.sparePartNumber || "ITEM"})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm  text-slate-900">{parseFloat(item.quantity).toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 ml-1 ">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm  text-slate-900">
                              {(item.productId ? item.productStock : item.sparePartStock) != null ? parseFloat(String(item.productId ? item.productStock : item.sparePartStock)).toFixed(2) : "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="flex items-center text-emerald-600 gap-1.5 bg-emerald-50 px-3 py-1 rounded border border-emerald-100">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-[10px]   tracking-tight">Fulfilled</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>


          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
