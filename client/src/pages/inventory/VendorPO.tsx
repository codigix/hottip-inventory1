import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Truck,
  MoreHorizontal,
  Package,
  ArrowRight,
  PlusCircle,
  X,
  Calendar,
  Send
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const summaryCards = [
  {
    title: "Total POs",
    status: "ALL",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Pending",
    status: "pending",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Processing",
    status: "processing",
    icon: RefreshCw,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Shipped",
    status: "shipped",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50/50",
  },
  {
    title: "Delivered",
    status: "delivered",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Cancelled",
    status: "cancelled",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  }
];

export default function VendorPO() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [, setLocation] = useLocation();

  const createShipmentMutation = useMutation({
    mutationFn: async (po: any) => {
      console.log("📦 Creating shipment from PO:", po);
      const shipmentItems = Array.isArray(po.items) 
        ? po.items.map((item: any) => ({
            materialName: item.itemName,
            type: item.description,
            qty: item.quantity,
            unit: item.unit
          }))
        : [];

      return apiRequest("POST", "/logistics/shipments", {
        consignmentNumber: `SHP-${po.poNumber}-${Date.now().toString().slice(-4)}`,
        poNumber: po.poNumber,
        source: "Main Warehouse",
        destination: "Customer Site",
        vendorId: po.supplierId,
        notes: `Automatically created from Purchase Order ${po.poNumber}`,
        currentStatus: "created",
        createdBy: user?.id,
        assignedTo: user?.id,
        items: shipmentItems
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shipment order created successfully. Redirecting...",
      });
      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
      // Redirect to shipment orders page as requested
      setTimeout(() => {
        setLocation("/logistics/shipment-orders");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment order",
        variant: "destructive",
      });
    },
  });

  // PO Form State
  const [poItems, setPoItems] = useState<any[]>([
    { id: Math.random().toString(36).substr(2, 9), itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, amount: 0 }
  ]);
  const [poSupplier, setPoSupplier] = useState("");
  const [poQuotation, setPoQuotation] = useState("");
  const [poDeliveryPeriod, setPoDeliveryPeriod] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [gstType, setGstType] = useState<"IGST" | "CGST_SGST">("IGST");

  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/purchase-orders", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase Order created successfully.",
      });
      setIsPODialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/purchase-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create PO",
        variant: "destructive",
      });
    },
  });

  const deletePOMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/purchase-orders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Purchase Order deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/purchase-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete PO",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPoItems([{ id: Math.random().toString(36).substr(2, 9), itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, amount: 0 }]);
    setPoSupplier("");
    setPoQuotation("");
    setPoDeliveryPeriod("");
    setPoNotes("");
    setGstType("IGST");
  };

  const { data: purchaseOrders = [], isLoading: isLoadingPO } = useQuery<any[]>({
    queryKey: ["/purchase-orders"],
  });

  const { data: suppliersData = [] } = useQuery<any>({
    queryKey: ["/suppliers"],
  });

  const { data: quotations = [] } = useQuery<any[]>({
    queryKey: ["/vendor-quotations"],
  });

  const suppliers = Array.isArray(suppliersData) ? suppliersData : ((suppliersData as any)?.suppliers || []);

  const handleQuotationSelect = (quotationId: string) => {
    setPoQuotation(quotationId);
    if (!quotationId || quotationId === "none") return;

    const quotation = quotations.find((q: any) => q.id === quotationId);
    if (quotation) {
      setPoSupplier(quotation.senderId);
      if (quotation.quotationItems && Array.isArray(quotation.quotationItems)) {
        const mappedItems = quotation.quotationItems.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          itemName: item.materialName || item.itemName,
          description: item.type || item.description || "",
          quantity: item.designQty || item.quantity || 1,
          unit: item.unit || "pcs",
          unitPrice: item.rate || item.unitPrice || 0,
          amount: (item.designQty || item.quantity || 1) * (item.rate || item.unitPrice || 0)
        }));
        setPoItems(mappedItems);
      }
    }
  };

  const addItem = () => {
    setPoItems([...poItems, { id: Math.random().toString(36).substr(2, 9), itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    setPoItems(poItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setPoItems(poItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.amount = Number(updatedItem.quantity || 0) * Number(updatedItem.unitPrice || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = poItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const gstAmount = subtotal * 0.18;
  const totalAmount = subtotal + gstAmount;

  const handleCreatePO = () => {
    if (!poSupplier) {
      toast({ title: "Error", description: "Please select a supplier", variant: "destructive" });
      return;
    }

    if (poItems.length === 0 || !poItems[0].itemName) {
      toast({ title: "Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }

    const poData = {
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: poSupplier,
      quotationId: poQuotation === "none" ? null : poQuotation,
      orderDate: new Date().toISOString(),
      deliveryPeriod: poDeliveryPeriod,
      status: "pending",
      subtotalAmount: subtotal,
      gstType,
      gstPercentage: 18,
      gstAmount,
      totalAmount,
      notes: poNotes,
      items: poItems.map(({ id, ...item }) => item)
    };

    createPOMutation.mutate(poData);
  };

  const handleViewDetails = async (id: string) => {
    try {
      const data = await apiRequest("GET", `/purchase-orders/${id}`);
      setSelectedPO(data);
      setIsViewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load purchase order details",
        variant: "destructive",
      });
    }
  };

  const handleDeletePO = (id: string) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      deletePOMutation.mutate(id);
    }
  };

  const filteredPO = useMemo(() => {
    return purchaseOrders.filter((po: any) => 
      po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchaseOrders, searchTerm]);

  const getStatusCount = (status: string) => {
    if (status === "ALL") return purchaseOrders.length;
    return purchaseOrders.filter((po: any) => po.status === status).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-normal">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-red-50 text-red-600 border-red-100 font-normal">Cancelled</Badge>;
      case "pending":
        return <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-normal">Pending</Badge>;
      case "processing":
        return <Badge className="bg-purple-50 text-purple-600 border-purple-100 font-normal">Processing</Badge>;
      case "shipped":
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-normal">Shipped</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 border-slate-100 font-normal">{status || "Draft"}</Badge>;
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    return supplier?.name || "Unknown Supplier";
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vendor Purchase Orders</h1>
          <p className="text-muted-foreground">
            Track and manage purchase orders issued to suppliers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setIsPODialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create PO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className="text-xs font-medium text-emerald-500">+0%</span>
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
              placeholder="Search by PO number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-none h-11 shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="h-11 px-5 border-slate-200">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" className="h-11 px-5 border-slate-200">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="w-[180px] py-4 font-semibold text-slate-700">PO Number</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Supplier</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Order Date</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Total Amount</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Expected Delivery</TableHead>
                <TableHead className="text-right py-4 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPO ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                    Loading purchase orders...
                  </TableCell>
                </TableRow>
              ) : filteredPO.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              ) : filteredPO.map((po: any) => (
                <TableRow key={po.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-bold text-indigo-600 py-4">
                    {po.poNumber}
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-700">
                    {getSupplierName(po.supplierId)}
                  </TableCell>
                  <TableCell className="py-4 text-slate-500">
                    {po.orderDate ? format(new Date(po.orderDate), "dd MMM yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-slate-900">
                    ₹{(parseFloat(po.totalAmount) || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4">
                    {getStatusBadge(po.status)}
                  </TableCell>
                  <TableCell className="py-4 text-slate-600">
                    {po.deliveryPeriod || "N/A"}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Create Shipment Order"
                        onClick={async () => {
                          try {
                            // Fetch full PO details with items before creating shipment
                            const fullPO = await apiRequest("GET", `/purchase-orders/${po.id}`);
                            createShipmentMutation.mutate(fullPO);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to fetch PO details",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={createShipmentMutation.isPending}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => handleViewDetails(po.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeletePO(po.id)}
                        disabled={deletePOMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create PO Dialog */}
      <Dialog open={isPODialogOpen} onOpenChange={setIsPODialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
              <PlusCircle className="h-6 w-6 text-indigo-600" />
              <span>Create Purchase Order (PO)</span>
            </DialogTitle>
            <DialogDescription>
              Create a new purchase order for a vendor
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Quotation (Optional)</label>
              <Select onValueChange={handleQuotationSelect} value={poQuotation}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select Quotation to Load Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Quotation --</SelectItem>
                  {quotations.map((q: any) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.quotationNumber} - {getSupplierName(q.senderId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Supplier *</label>
              <Select onValueChange={setPoSupplier} value={poSupplier}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select a Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Expected Delivery Period</label>
              <Input 
                placeholder="e.g. 15-20 Days" 
                value={poDeliveryPeriod}
                onChange={(e) => setPoDeliveryPeriod(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">GST Type</label>
              <Select onValueChange={(v: any) => setGstType(v)} value={gstType}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select GST Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IGST">IGST (Inter-state)</SelectItem>
                  <SelectItem value="CGST_SGST">CGST + SGST (Intra-state)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Package className="mr-2 h-4 w-4 text-indigo-500" />
                PO ITEMS
              </h3>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={addItem}
                className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {poItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100 relative group">
                  <div className="col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name</label>
                    <Input 
                      placeholder="Material/Service Name" 
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                      className="h-9 bg-white border-slate-200"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                    <Input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      className="h-9 bg-white border-slate-200"
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</label>
                    <Input 
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                      className="h-9 bg-white border-slate-200 text-center px-1"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price</label>
                    <Input 
                      type="number" 
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      className="h-9 bg-white border-slate-200"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                    <div className="h-9 flex items-center px-3 bg-white border border-slate-200 rounded-md font-bold text-slate-700">
                      ₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1 pt-6 text-right">
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-slate-300 hover:text-red-500"
                      disabled={poItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end space-y-2 py-4 border-t border-slate-100">
              <div className="flex justify-between w-64 text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="text-slate-800 font-bold">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 text-sm">
                <span className="text-slate-500 font-medium">GST (18%)</span>
                <span className="text-slate-800 font-bold">₹{gstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-slate-200">
                <span className="text-indigo-600 font-bold">Total Amount</span>
                <span className="text-indigo-600 text-lg font-black font-mono">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Notes (Optional)</label>
            <Textarea 
              placeholder="Add any specific terms or instructions..." 
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="bg-slate-50 border-slate-200 min-h-[100px]"
            />
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-slate-100 gap-3">
            <Button variant="outline" onClick={() => setIsPODialogOpen(false)} className="h-11 px-8">
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePO} 
              className="h-11 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={createPOMutation.isPending}
            >
              {createPOMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Purchase Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          {selectedPO && (
            <div className="flex flex-col h-full bg-white">
              <div className="p-8 bg-slate-900 text-white relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsViewDialogOpen(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </Button>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-indigo-600 text-white border-none px-3 py-1 font-bold">PURCHASE ORDER</Badge>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedPO.poNumber}</h2>
                <div className="flex items-center space-x-6 text-slate-400 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedPO.orderDate ? format(new Date(selectedPO.orderDate), "dd MMM yyyy") : "N/A"}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Delivery: {selectedPO.deliveryPeriod || "Not Specified"}
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8 border-b border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Supplier Details</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-lg font-bold text-slate-800">{getSupplierName(selectedPO.supplierId)}</p>
                    {selectedPO.quotationId && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center">
                        <FileText className="mr-1 h-3 w-3" />
                        Ref Quotation: {quotations.find((q: any) => q.id === selectedPO.quotationId)?.quotationNumber || "Unknown"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Order Status</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 font-medium">Current Status</span>
                      {getStatusBadge(selectedPO.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Line Items</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-4 font-bold text-slate-700">Item Name</TableHead>
                        <TableHead className="py-4 font-bold text-slate-700 text-center">Qty</TableHead>
                        <TableHead className="py-4 font-bold text-slate-700 text-center">Unit</TableHead>
                        <TableHead className="py-4 font-bold text-slate-700 text-right">Unit Price</TableHead>
                        <TableHead className="py-4 font-bold text-slate-700 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items?.map((item: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50 border-slate-100">
                          <TableCell className="py-4 font-medium text-slate-800">
                            <div>
                              <p>{item.itemName}</p>
                              {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center font-bold text-slate-700">{item.quantity}</TableCell>
                          <TableCell className="py-4 text-center text-slate-500">{item.unit || "pcs"}</TableCell>
                          <TableCell className="py-4 text-right font-medium text-slate-600">₹{(parseFloat(item.unitPrice) || 0).toLocaleString()}</TableCell>
                          <TableCell className="py-4 text-right font-black text-slate-900">₹{(parseFloat(item.amount) || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end pt-4">
                  <div className="w-80 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-inner">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Subtotal</span>
                      <span className="text-slate-800 font-bold">₹{(parseFloat(selectedPO.subtotalAmount) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">GST ({selectedPO.gstPercentage || 18}%)</span>
                      <span className="text-slate-800 font-bold">₹{(parseFloat(selectedPO.gstAmount) || 0).toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-indigo-600 font-black text-xs uppercase tracking-wider">Total Amount</span>
                      <span className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">₹{(parseFloat(selectedPO.totalAmount) || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 italic text-amber-900 text-sm shadow-sm">
                    <div className="flex items-center font-bold mb-2 uppercase tracking-widest text-[10px]">Notes:</div>
                    {selectedPO.notes}
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 flex justify-between items-center border-t border-slate-200">
                <Button variant="outline" className="h-11 px-8 border-slate-300">
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                <div className="space-x-3">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="h-11 px-8">
                    Close
                  </Button>
                  <Button className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    <Send className="mr-2 h-4 w-4" /> Email to Vendor
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
