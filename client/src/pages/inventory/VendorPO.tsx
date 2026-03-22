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
  Send,
  ArrowUpRight,
  LayoutGrid,
  TrendingUp,
  AlertCircle,
  History,
  ClipboardList,
  ShieldCheck
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
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
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
import { cn } from "@/lib/utils";

export default function VendorPO() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: poResponse, isLoading: poLoading } = useQuery({
    queryKey: ["/api/purchase-orders"],
    queryFn: async () => apiRequest("GET", "/api/purchase-orders"),
  });

  const { data: suppliersResponse } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => apiRequest("GET", "/api/suppliers"),
  });

  const purchaseOrders = Array.isArray(poResponse?.data) ? poResponse.data : (Array.isArray(poResponse) ? poResponse : []);
  const suppliers = Array.isArray(suppliersResponse?.data) ? suppliersResponse.data : (Array.isArray(suppliersResponse) ? suppliersResponse : []);

  const getSupplierName = (supplierId: string | number) => {
    if (!supplierId) return "N/A";
    const supplier = suppliers.find((s: any) => s.id === supplierId || s.id.toString() === supplierId.toString());
    return supplier?.name || `Vendor ID: ${supplierId}`;
  };

  const metrics = [
    { label: "Active Orders", value: purchaseOrders.filter((p: any) => p.status !== 'delivered' && p.status !== 'cancelled').length, icon: Truck, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Pending Review", value: purchaseOrders.filter((p: any) => p.status === 'pending').length, icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Completed", value: purchaseOrders.filter((p: any) => p.status === 'delivered').length, icon: CheckCircle2, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Total Value", value: `₹${purchaseOrders.reduce((acc: number, p: any) => acc + (parseFloat(p.totalAmount) || 0), 0).toLocaleString()}`, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  const columns = [
    {
      key: "poNumber",
      header: "Order Information",
      cell: (po: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-900">{po.poNumber}</span>
            <span className="text-xs text-slate-500">{getSupplierName(po.supplierId)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (po: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal p-1",
            po.status === 'delivered' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            po.status === 'shipped' && "bg-blue-50 text-blue-700 border-blue-200",
            po.status === 'processing' && "bg-indigo-50 text-indigo-700 border-indigo-200",
            po.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
            po.status === 'cancelled' && "bg-red-50 text-red-700 border-red-200",
            !po.status && "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {po.status || 'draft'}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Financials",
      cell: (po: any) => (
        <div className="flex flex-col">
          <span className="text-xs  text-slate-900">₹{parseFloat(po.totalAmount || 0).toLocaleString()}</span>
          <span className="text-xs text-slate-400  ">{po.gstType === 'IGST' ? 'IGST @ 18%' : 'CGST+SGST @ 18%'}</span>
        </div>
      ),
    },
    {
      key: "orderDate",
      header: "Timeline",
      cell: (po: any) => (
        <div className="flex flex-col text-[11px]">
          <span className="text-slate-700 ">Issued: {po.orderDate ? format(new Date(po.orderDate), "dd MMM yyyy") : "N/A"}</span>
          <span className="text-slate-400">Target: {po.deliveryPeriod || "Standard"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (po: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => handleViewDetails(po.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() => downloadPOMutation.mutate(po.id)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleDeletePO(po.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const viewPoColumns = [
    {
      key: "itemName",
      header: "Item Name",
      cell: (item: any) => (
        <span className="text-xs text-slate-800">{item.itemName}</span>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      cell: (item: any) => (
        <div className="text-center text-xs">{item.quantity}</div>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      cell: (item: any) => (
        <div className="text-center text-xs text-slate-500">{item.unit}</div>
      ),
    },
    {
      key: "unitPrice",
      header: "Price",
      cell: (item: any) => (
        <div className="text-right text-xs text-slate-600">
          ₹{parseFloat(item.unitPrice).toLocaleString()}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (item: any) => (
        <div className="text-right text-xs font-semibold">
          ₹{parseFloat(item.amount).toLocaleString()}
        </div>
      ),
    },
  ];

  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Missing state for PO creation
  const [poQuotation, setPoQuotation] = useState("none");
  const [poSupplier, setPoSupplier] = useState("");
  const [poMaterialRequest, setPoMaterialRequest] = useState("none");
  const [poDeliveryPeriod, setPoDeliveryPeriod] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [gstType, setGstType] = useState("CGST_SGST");
  const [poItems, setPoItems] = useState([{ id: 1, itemName: "", quantity: 1, unit: "Nos", unitPrice: 0, amount: 0 }]);

  // Dummy data for missing queries
  const quotations: any[] = [];
  const materialRequests: any[] = [];

  const subtotal = poItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const gstAmount = subtotal * 0.18;
  const totalAmount = subtotal + gstAmount;

  const resetForm = () => {
    setPoQuotation("none");
    setPoSupplier("");
    setPoMaterialRequest("none");
    setPoDeliveryPeriod("");
    setPoNotes("");
    setGstType("CGST_SGST");
    setPoItems([{ id: 1, itemName: "", quantity: 1, unit: "Nos", unitPrice: 0, amount: 0 }]);
  };

  const handleQuotationSelect = (val: string) => {
    setPoQuotation(val);
    // Logic to auto-fill would go here
  };

  const addItem = () => {
    setPoItems([...poItems, { id: Math.random(), itemName: "", quantity: 1, unit: "Nos", unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (id: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setPoItems(poItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.amount = (parseFloat(updatedItem.quantity) || 0) * (parseFloat(updatedItem.unitPrice) || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleCreatePO = async () => {
    try {
      const poData = {
        poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
        supplierId: poSupplier,
        quotationId: poQuotation === "none" ? null : poQuotation,
        materialRequestId: poMaterialRequest === "none" ? null : poMaterialRequest,
        items: poItems,
        subtotalAmount: subtotal.toString(),
        gstAmount: gstAmount.toString(),
        totalAmount: totalAmount.toString(),
        gstType,
        deliveryPeriod: poDeliveryPeriod,
        notes: poNotes,
        status: "pending",
        orderDate: new Date().toISOString(),
      };

      await apiRequest("POST", "/api/purchase-orders", poData);
      toast({ title: "Success", description: "Purchase Order created successfully" });
      setIsPODialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create PO", variant: "destructive" });
    }
  };

  const summaryCards = [
    { title: "Total Orders", status: "ALL", icon: ClipboardList },
    { title: "Pending Review", status: "pending", icon: Clock },
    { title: "Processing", status: "processing", icon: RefreshCw },
    { title: "Shipped", status: "shipped", icon: Truck },
    { title: "Delivered", status: "delivered", icon: CheckCircle2 },
    { title: "Cancelled", status: "cancelled", icon: XCircle },
  ];

  const createShipmentMutation = useMutation({
    mutationFn: async (po: any) => {
      toast({ title: "Logistics", description: "Logistics module coming soon" });
    },
  });

  const isLoadingPO = poLoading;

  const deletePOMutation = useMutation({
    mutationFn: async (id: string | number) => apiRequest("DELETE", `/api/purchase-orders/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted", description: "Purchase Order deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    },
  });

  const downloadPOMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const blob = await apiRequest(`/api/purchase-orders/${id}/pdf`, { method: "GET", responseType: "blob" });
      const fileURL = URL.createObjectURL(blob);
      const fileLink = document.createElement('a');
      fileLink.href = fileURL;
      fileLink.download = `PO-${id}.pdf`;
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      window.URL.revokeObjectURL(fileURL);
    },
  });

  const handleViewDetails = async (id: string | number) => {
    try {
      const response = await apiRequest("GET", `/api/purchase-orders/${id}`);
      setSelectedPO(response.data || response);
      setIsViewDialogOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load PO details", variant: "destructive" });
    }
  };

  const handleDeletePO = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      deletePOMutation.mutate(id);
    }
  };

  const getStatusCount = (status: string) => {
    if (status === "ALL") return purchaseOrders.length;
    return purchaseOrders.filter((po: any) => po.status === status).length;
  };

  return (
    <div className="p-4 space-y-2 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl  text-slate-800">Vendor Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and track official purchase orders for suppliers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 bg-white" onClick={() => queryClient.invalidateQueries({ queryKey: ["/purchase-orders"] })}>
            <RefreshCw className="h-4 w-4 mr-2 text-slate-400" />
            Sync
          </Button>
          <Button 
            className="bg-primary hover:bg-primary text-white h-9 shadow-sm border-none"
            onClick={() => { resetForm(); setIsPODialogOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create PO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm bg-white">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded bg-slate-50">
                  <card.icon className="h-4 w-4 text-slate-400" />
                </div>
                <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-xs  border-none">STATUS</Badge>
              </div>
              <p className="text-xs    text-slate-400 mb-1">{card.title}</p>
              <p className="text-xl  text-slate-800">{getStatusCount(card.status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm  text-slate-700">Purchase Order Registry</h2>
            <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 text-xs ">
              {purchaseOrders.length} Records
            </Badge>
          </div>
        </div>
        <div className="p-2">
          <DataTable
            data={purchaseOrders}
            columns={columns}
            isLoading={isLoadingPO}
            searchable={true}
            searchKey="poNumber"
            searchPlaceholder="Filter by PO number..."
          />
        </div>
      </div>

      {/* PO Dialog */}
      <Dialog open={isPODialogOpen} onOpenChange={setIsPODialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded">
          <DialogHeader className="px-5 py-4 bg-slate-50 border-b">
            <div className="flex items-center justify-between w-full pr-8">
              <div className="space-y-0.5">
                <DialogTitle className="text-base  text-slate-800">Create Purchase Order</DialogTitle>
                <DialogDescription className="text-xs text-slate-500   ">Formal procurement request</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-2 space-y-2 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs  text-slate-700">Select Quotation (Auto-fill)</Label>
                <Select value={poQuotation} onValueChange={handleQuotationSelect}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-slate-400 text-sm">
                    <SelectValue placeholder="Select Quotation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Manual Creation</SelectItem>
                    {quotations.filter(q => q.status === 'approved' || q.status === 'received').map((q: any) => (
                      <SelectItem key={q.id} value={q.id}>{q.quotationNumber} - {getSupplierName(q.senderId)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs  text-slate-700">Supplier *</Label>
                <Select value={poSupplier} onValueChange={setPoSupplier}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-slate-400 text-sm">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs  text-slate-700">Material Request Ref</Label>
                <Select value={poMaterialRequest} onValueChange={setPoMaterialRequest}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-slate-400 text-sm">
                    <SelectValue placeholder="Select MR" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {materialRequests.map((mr: any) => (
                      <SelectItem key={mr.id} value={mr.id}>{mr.requestNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px]  text-slate-400  ">Order Items</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-primary text-white hover:bg-primary border-none h-7 px-3 text-xs"
                  onClick={addItem}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Line
                </Button>
              </div>

              <div className="border rounded overflow-hidden border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100 h-8">
                      <TableHead className="text-xs  text-slate-400  h-8 py-0">Item Name</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-center w-16">Qty</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-center w-20">Unit</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-right w-24">Price</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-right w-24">Amount</TableHead>
                      <TableHead className="h-8 py-0 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-transparent border-slate-50">
                        <TableCell className="py-2 px-3">
                          <Input 
                            placeholder="Item Name" 
                            value={item.itemName}
                            onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-slate-400 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-slate-400 text-center text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input 
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-slate-400 text-center text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input 
                            type="number" 
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-slate-400 text-right text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right  text-sm">
                          ₹{(item.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(item.id)}
                            disabled={poItems.length === 1}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 ">Subtotal</span>
                    <span className="text-slate-700 ">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 ">GST (18%)</span>
                    <span className="text-slate-700 ">₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-slate-800 font-extrabold  text-xs ">Total Value</span>
                    <span className="text-slate-800  text-lg">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs  text-slate-700">Delivery Period / Date</Label>
                <Input value={poDeliveryPeriod} onChange={(e) => setPoDeliveryPeriod(e.target.value)} placeholder="e.g. 15 Days or 20/12/2024" className="h-9 border-slate-200 focus-visible:ring-slate-400 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs  text-slate-700">Tax Structure</Label>
                <Select value={gstType} onValueChange={(val: any) => setGstType(val)}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-slate-400 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IGST">IGST (Inter-state)</SelectItem>
                    <SelectItem value="CGST_SGST">CGST + SGST (Intra-state)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs  text-slate-700">Purchase Order Terms / Notes</Label>
              <Textarea placeholder="Special instructions for the vendor..." value={poNotes} onChange={(e) => setPoNotes(e.target.value)} className="min-h-[80px] border-slate-200 focus-visible:ring-slate-400 text-sm" />
            </div>
          </div>

          <DialogFooter className="px-5 p-2 bg-slate-50 border-t flex flex-row justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPODialogOpen(false)} className="border-slate-200 text-slate-600 px-4 h-9 text-sm">
              Cancel
            </Button>
            <Button onClick={handleCreatePO} className="bg-primary hover:bg-primary text-white px-6 h-9 text-sm  shadow-sm">
              Generate & Save PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded">
          <DialogHeader className="p-2 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl  text-slate-800">Purchase Order Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Viewing {selectedPO?.poNumber}</DialogDescription>
            </div>
            {/* <Button variant="ghost" size="icon" className="h-9 w-9 rounded" onClick={() => setIsViewDialogOpen(false)}>
              <X className="h-5 w-5" />
            </Button> */}
          </DialogHeader>

          <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <h3 className="text-xs  text-slate-400  ">Order Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">PO Number</p>
                    <p className="text-sm  text-slate-800">{selectedPO?.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Date</p>
                    <p className="text-xs  text-slate-700">{selectedPO?.orderDate ? format(new Date(selectedPO.orderDate), "dd MMM yyyy") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Status</p>
                    <Badge variant="outline" className="text-xs   mt-1 h-5">{selectedPO?.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Delivery</p>
                    <p className="text-sm  text-slate-700">{selectedPO?.deliveryPeriod || "As per agreement"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm  text-slate-400  ">Supplier</h3>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 h-[100px] flex flex-col justify-center">
                  <p className="text-xs text-slate-500   tracking-tighter">Vendor Name</p>
                  <p className="text-sm  text-slate-800">{getSupplierName(selectedPO?.supplierId)}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono ">ID: {selectedPO?.supplierId}</p>
                </div>
              </div>
            </div>

            <div className="border rounded overflow-hidden border-slate-200">
              <DataTable
                data={selectedPO?.items || []}
                columns={viewPoColumns}
                searchable={true}
                searchKey="itemName"
                searchPlaceholder="Search items..."
                pageSizeOptions={[10, 20]}
                defaultPageSize={10}
              />
            </div>

            <div className="flex justify-end">
              <div className="w-72 space-y-2 bg-primary text-white p-2 rounded border border-slate-800 shadow-xl">
                <div className="flex justify-between items-center text-sm opacity-70">
                  <span className="  text-xs">Subtotal</span>
                  <span className="font-mono">₹{parseFloat(selectedPO?.subtotalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm opacity-70">
                  <span className="  text-xs">GST (18%)</span>
                  <span className="font-mono">₹{parseFloat(selectedPO?.gstAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="   text-xs">Grand Total</span>
                  <span className=" text-sm">₹{parseFloat(selectedPO?.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedPO?.notes && (
              <div className="space-y-2">
                <h3 className="text-sm  text-slate-400  ">Order Terms</h3>
                <div className="bg-slate-50 p-4 rounded text-sm text-slate-600 border border-slate-100 italic">
                  "{selectedPO.notes}"
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex flex-row justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-slate-200 text-slate-600   text-xs ">
              Close
            </Button>
            {selectedPO?.status === 'pending' && (
              <Button 
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50   text-xs "
                onClick={() => createShipmentMutation.mutate(selectedPO)}
              >
                <Truck className="mr-2 h-3.5 w-3.5" /> Logistics
              </Button>
            )}
            <Button 
              className="bg-primary hover:bg-primary text-white px-6   text-xs  shadow-sm"
              onClick={() => downloadPOMutation.mutate(selectedPO?.id)}
            >
              <Download className="mr-2 h-3.5 w-3.5" /> PDF Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
