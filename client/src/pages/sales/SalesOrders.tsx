
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSalesOrderSchema } from "@shared/schema";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Plus,
  Search,
  Eye,
  CheckCircle,
  Truck,
  Receipt,
  XCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type SalesOrderFormValues = z.infer<typeof insertSalesOrderSchema>;

export default function SalesOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | number | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/sales-orders"],
  });

  const { data: customerPurchaseOrders = [] } = useQuery({
    queryKey: ["/customer-purchase-orders"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/customers"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/products"],
  });

  const allReferences = useMemo(() => {
    return [
      ...customerPurchaseOrders.map((p: any) => ({ 
        id: `PO:${p.id}`, 
        originalId: p.id,
        number: p.poNumber, 
        customerName: p.customer?.name || "Unknown",
        type: 'PO', 
        data: p 
      }))
    ];
  }, [customerPurchaseOrders]);

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(insertSalesOrderSchema),
    defaultValues: {
      orderNumber: "",
      customerId: "",
      quotationId: null,
      purchaseOrderId: null,
      userId: user?.id || "",
      orderDate: new Date(),
      expectedDeliveryDate: undefined,
      deliveryPeriod: "25–30 Days",
      status: "pending",
      subtotalAmount: 0,
      gstType: "IGST",
      gstPercentage: 18,
      gstAmount: 0,
      totalAmount: 0,
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Handle URL parameters for auto-opening the dialog with a PO
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const poId = searchParams.get("purchaseOrderId");
    
    if (poId && !isDialogOpen && customerPurchaseOrders.length > 0) {
      const po = customerPurchaseOrders.find((p: any) => p.id === poId);
      if (po) {
        // First generate a SO number if it doesn't exist
        if (!form.getValues("orderNumber")) {
          const year = new Date().getFullYear();
          let nextCount = 1;
          if (orders && orders.length > 0) {
            const soNumbers = orders
              .map((o: any) => o.orderNumber)
              .filter((num: string) => num && typeof num === 'string' && num.startsWith(`SO-${year}-`));
            
            if (soNumbers.length > 0) {
              const counts = soNumbers.map((num: string) => {
                const parts = num.split("-");
                return parseInt(parts[parts.length - 1]) || 0;
              });
              nextCount = Math.max(...counts) + 1;
            }
          }
          form.setValue("orderNumber", `SO-${year}-${String(nextCount).padStart(3, "0")}`);
        }
        
        form.setValue("purchaseOrderId", poId);
        setIsDialogOpen(true);
        
        // Clean up URL to prevent re-opening
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [customerPurchaseOrders, isDialogOpen, form, orders]);

  // Auto-generate Order Number
  useEffect(() => {
    if (user?.id) {
      form.setValue("userId", user.id);
    }
  }, [user, form]);

  const selectedPurchaseOrderId = form.watch("purchaseOrderId");

  // Handle Reference Selection
  useEffect(() => {
    let reference = null;
    if (selectedPurchaseOrderId && selectedPurchaseOrderId !== "none") {
      reference = customerPurchaseOrders.find((p: any) => p.id === selectedPurchaseOrderId);
    }

    if (reference) {
      const cid = reference.customerId || reference.supplierId;
      if (cid) {
        form.setValue("customerId", cid);
      }
      form.setValue("gstType", reference.gstType || "IGST");
      form.setValue("gstPercentage", parseFloat(reference.gstPercentage) || 18);
      form.setValue("subtotalAmount", parseFloat(reference.subtotalAmount) || 0);
      form.setValue("gstAmount", parseFloat(reference.gstAmount || reference.taxAmount) || 0);
      form.setValue("totalAmount", parseFloat(reference.totalAmount) || 0);
      
      const items = reference.items || reference.quotationItems || [];
      if (Array.isArray(items)) {
        const mappedItems = items.map((item: any) => {
          const itemName = item.partName || item.itemName || "";
          // Try to find matching product for stock tracking
          const matchedProduct = products.find((p: any) => 
            p.name.toLowerCase() === itemName.toLowerCase() || 
            p.sku.toLowerCase() === itemName.toLowerCase()
          );

          return {
            productId: matchedProduct?.id || null,
            itemName: itemName,
            description: item.partDescription || item.description || "",
            quantity: item.qty || item.quantity || 1,
            unit: item.uom || item.unit || "NOS",
            unitPrice: parseFloat(item.unitPrice) || 0,
            amount: parseFloat(item.amount) || 0,
          };
        });
        replace(mappedItems);
      }
    }
  }, [selectedPurchaseOrderId, customerPurchaseOrders, products, form, replace]);

  // Calculate Totals
  const watchItems = form.watch("items");
  const watchGstPercentage = form.watch("gstPercentage");

  useEffect(() => {
    const subtotal = watchItems.reduce((acc, item) => acc + (parseFloat(item.amount?.toString() || "0") || 0), 0);
    const gstAmount = (subtotal * (parseFloat(watchGstPercentage.toString()) || 0)) / 100;
    const total = subtotal + gstAmount;

    form.setValue("subtotalAmount", subtotal);
    form.setValue("gstAmount", gstAmount);
    form.setValue("totalAmount", total);
  }, [watchItems, watchGstPercentage, form]);

  const createOrderMutation = useMutation({
    mutationFn: (data: SalesOrderFormValues) => {
      return apiRequest("POST", "/sales-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sales-orders"] });
      toast({
        title: "Success",
        description: "Sales order created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create sales order.",
        variant: "destructive",
      });
    },
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (order: any) => {
      console.log("📦 Creating shipment from Sales Order:", order);
      const shipmentItems = Array.isArray(order.items) 
        ? order.items.map((item: any) => ({
            materialName: item.itemName,
            type: item.description,
            qty: item.quantity,
            unit: item.unit
          }))
        : [];

      return apiRequest("POST", "/logistics/shipments", {
        consignmentNumber: `SHP-${order.orderNumber}-${Date.now().toString().slice(-4)}`,
        poNumber: order.orderNumber,
        source: "Main Warehouse",
        destination: order.customer?.address || "Customer Site",
        clientId: order.customerId,
        notes: `Automatically created from Sales Order ${order.orderNumber}`,
        currentStatus: "created",
        createdBy: user?.id,
        assignedTo: user?.id,
        items: shipmentItems
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shipment order created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment order",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string | number; status: string }) => {
      return apiRequest("PUT", `/sales-orders/${orderId}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/sales-orders"] });
      // If status was changed to shipped, also invalidate logistics queries
      if (variables.status === 'shipped') {
        queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
        queryClient.invalidateQueries({ queryKey: ["/logistics/dashboard"] });
      }
      toast({
        title: "Success",
        description: `Order status updated to ${variables.status} successfully.`,
      });
      setActionInProgressId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update order status.",
        variant: "destructive",
      });
      setActionInProgressId(null);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string | number) => {
      return apiRequest("DELETE", `/sales-orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sales-orders"] });
      toast({
        title: "Success",
        description: "Sales order deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete sales order.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (orderId: string) => {
    if (confirm("Are you sure you want to delete this sales order?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleUpdateStatus = (orderId: string, status: string) => {
    setActionInProgressId(orderId);
    updateStatusMutation.mutate({ orderId, status });
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const onSubmit = (data: SalesOrderFormValues) => {
    // Ensure quotationId and purchaseOrderId are valid or null
    const finalData = { ...data };
    if (!finalData.userId && user?.id) {
      finalData.userId = user.id;
    }
    if (finalData.quotationId === "none" || !finalData.quotationId) {
      finalData.quotationId = null;
    }
    if (finalData.purchaseOrderId === "none" || !finalData.purchaseOrderId) {
      finalData.purchaseOrderId = null;
    }
    console.log("Submitting order data:", finalData);
    createOrderMutation.mutate(finalData);
  };

  const columns = [
    {
      key: "orderNumber",
      header: "Order #",
      sortable: true,
      cell: (order: any) => (
        <div className=" text-slate-800">{order.orderNumber}</div>
      ),
    },
    {
      key: "customer.name",
      header: "Customer",
      sortable: true,
      cell: (order: any) => (
        <div>
          <div className="font-medium text-slate-700">{order.customer?.name || "N/A"}</div>
          <div className="text-xs text-slate-400  ">
            {order.customer?.type || "CLIENT"}
          </div>
        </div>
      ),
    },
    {
      key: "orderDate",
      header: "Date",
      sortable: true,
      cell: (order: any) => (
        <div className="text-xs text-slate-600">
          {new Date(order.orderDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      sortable: true,
      cell: (order: any) => (
        <span className="text-xs  text-slate-800">
          ₹{parseFloat(order.totalAmount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (order: any) => {
        const statusColors: Record<string, string> = {
          pending: "bg-slate-100 text-slate-600 border-slate-200",
          confirmed: "bg-blue-50 text-blue-700 border-blue-100",
          material_released: "bg-indigo-50 text-indigo-700 border-indigo-100",
          processing: "bg-indigo-50 text-indigo-700 border-indigo-100",
          shipped: "bg-emerald-50 text-emerald-700 border-emerald-100",
          delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
          cancelled: "bg-red-50 text-red-700 border-red-100",
        };

        const displayStatus = (order.status === 'confirmed' && order.materialReleased) 
          ? 'material_released' 
          : order.status;

        return (
          <Badge 
            variant="outline"
            className={cn(
              "text-xs   py-0 h-5 shadow-none",
              statusColors[displayStatus] || "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {displayStatus.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (order: any) => {
        const isProcessing = actionInProgressId === order.id;

        return (
          <div className="flex items-center space-x-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              title="View Details"
              onClick={() => handleViewDetails(order)}
            >
              <Eye className="h-4 w-4 text-slate-400" />
            </Button>
            {order.status === 'shipped' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:text-emerald-600"
                onClick={() => setLocation(`/sales/invoices/new?orderId=${order.id}`)}
                title="Create Invoice"
              >
                <Receipt className="h-4 w-4 text-emerald-400" />
              </Button>
            )}
            {order.status === 'pending' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:text-emerald-600"
                onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                disabled={isProcessing}
                title="Confirm Order"
              >
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </Button>
            )}
            {(order.status === 'confirmed' || order.status === 'processing') && (
               <Button 
               size="sm" 
               variant="ghost" 
               className="h-8 w-8 p-0 hover:text-indigo-600"
               onClick={() => {
                 handleUpdateStatus(order.id, 'shipped');
               }}
               disabled={isProcessing}
               title="Ship Order & Create Shipment"
             >
               <Truck className="h-4 w-4 text-indigo-400" />
             </Button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:text-red-600"
                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                disabled={isProcessing}
                title="Cancel Order"
              >
                <XCircle className="h-4 w-4 text-red-400" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-red-50"
              onClick={() => handleDelete(order.id)}
              disabled={deleteOrderMutation.isPending}
              title="Delete Order"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
    } else if (!form.getValues("orderNumber")) {
      const year = new Date().getFullYear();
      let nextCount = 1;
      if (orders && orders.length > 0) {
        const soNumbers = orders
          .map((o: any) => o.orderNumber)
          .filter((num: string) => num && typeof num === 'string' && num.startsWith(`SO-${year}-`));
        
        if (soNumbers.length > 0) {
          const counts = soNumbers.map((num: string) => {
            const parts = num.split("-");
            return parseInt(parts[parts.length - 1]) || 0;
          });
          nextCount = Math.max(...counts) + 1;
        }
      }
      form.setValue("orderNumber", `SO-${year}-${String(nextCount).padStart(3, "0")}`);
    }
  };

  return (
    <div className="p-2 space-y-3 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl  text-slate-900 tracking-tight">Sales Orders</h1>
          <p className="text-slate-500 text-sm">Manage confirmed customer orders and fulfillment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary text-white  transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              New Sales Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Order</DialogTitle>
              <DialogDescription>
                Create a new sales order from a quotation or from scratch
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  console.error("Form validation errors:", errors);
                  toast({
                    title: "Validation Error",
                    description: "Please check the form for errors.",
                    variant: "destructive",
                  });
                })} 
                className="space-y-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SO Number</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quotationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select PO</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            if (val === "none") {
                              form.setValue("quotationId", null);
                              form.setValue("purchaseOrderId", null);
                            } else {
                              form.setValue("quotationId", null);
                              form.setValue("purchaseOrderId", val.split(":")[1]);
                            }
                          }} 
                          value={selectedPurchaseOrderId ? `PO:${selectedPurchaseOrderId}` : "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select PO" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Manual)</SelectItem>
                            {allReferences.map((ref: any) => (
                              <SelectItem key={ref.id} value={ref.id}>
                                <div className="flex justify-between items-center w-full min-w-[300px]">
                                  <div className="flex flex-col">
                                    <span className="">{ref.number}</span>
                                    <span className="text-xs text-gray-500">{ref.customerName}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs ml-2 h-4 px-1">
                                    {ref.type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Period</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gstType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="IGST">IGST</SelectItem>
                            <SelectItem value="CGST_SGST">CGST + SGST</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg ">Order Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          itemName: "",
                          description: "",
                          quantity: 1,
                          unit: "NOS",
                          unitPrice: 0,
                          amount: 0,
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border rounded">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="p-2 text-left ">Item Name</th>
                          <th className="p-2 text-left ">Description</th>
                          <th className="p-2 text-left  w-20">Qty</th>
                          <th className="p-2 text-left  w-20">UOM</th>
                          <th className="p-2 text-left  w-32">Rate</th>
                          <th className="p-2 text-left  w-32">Amount</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b">
                            <td className="p-2">
                              <Input
                                {...form.register(`items.${index}.itemName`)}
                                placeholder="Item Name"
                                className={form.formState.errors.items?.[index]?.itemName ? "border-destructive" : ""}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                {...form.register(`items.${index}.description`)}
                                placeholder="Description"
                                className={form.formState.errors.items?.[index]?.description ? "border-destructive" : ""}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                {...form.register(`items.${index}.quantity`, {
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const qty = parseFloat(e.target.value) || 0;
                                    const rate = form.getValues(`items.${index}.unitPrice`);
                                    form.setValue(`items.${index}.amount`, qty * rate);
                                  }
                                })}
                                className={form.formState.errors.items?.[index]?.quantity ? "border-destructive" : ""}
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                {...form.register(`items.${index}.unit`)} 
                                className={form.formState.errors.items?.[index]?.unit ? "border-destructive" : ""}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                {...form.register(`items.${index}.unitPrice`, {
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const rate = parseFloat(e.target.value) || 0;
                                    const qty = form.getValues(`items.${index}.quantity`);
                                    form.setValue(`items.${index}.amount`, qty * rate);
                                  }
                                })}
                                className={form.formState.errors.items?.[index]?.unitPrice ? "border-destructive" : ""}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                {...form.register(`items.${index}.amount`, { valueAsNumber: true })}
                                readOnly
                                className="bg-muted"
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Internal notes..." rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 border rounded p-4 bg-muted/20">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal:</span>
                      <span className="">₹{form.watch("subtotalAmount").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">GST:</span>
                        <div className="w-16">
                          <Input 
                            type="number" 
                            {...form.register("gstPercentage", { valueAsNumber: true })} 
                            className="h-7 text-xs"
                          />
                        </div>
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      <span className="">₹{form.watch("gstAmount").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between">
                      <span className="text-lg ">Grand Total:</span>
                      <span className="text-lg ">₹{form.watch("totalAmount").toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <div className="flex-1">
                    {Object.keys(form.formState.errors).length > 0 && (
                      <p className="text-destructive text-sm ">
                        Please fix the errors in the form before submitting.
                        {Object.entries(form.formState.errors).map(([key, error]: any) => (
                          <span key={key} className="block text-xs">
                            {key}: {error.message || (typeof error === 'object' ? 'Invalid field' : error)}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? "Creating..." : "Create Sales Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200  overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            data={orders}
            columns={columns}
            searchable={true}
            searchKey="orderNumber"
            searchPlaceholder="Search sales orders..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Full details for sales order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500   text-xs">Customer Details</p>
                  <p className=" text-sm">{selectedOrder.customer?.name}</p>
                  <p>{selectedOrder.customer?.address}</p>
                  <p>GST: {selectedOrder.customer?.gstNumber}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-gray-500   text-xs">Order Info</p>
                  <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                  {(selectedOrder.quotation || selectedOrder.purchaseOrder) && (
                    <p><strong>Reference:</strong> {selectedOrder.quotation?.quotationNumber || selectedOrder.purchaseOrder?.poNumber}</p>
                  )}
                  <p><strong>Status:</strong> <Badge className="ml-1  text-xs">{selectedOrder.status}</Badge></p>
                  <p><strong>Delivery Period:</strong> {selectedOrder.deliveryPeriod}</p>
                </div>
              </div>

              <div className="border rounded ">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-xs text-left">Item Name</th>
                      <th className="p-2 text-xs text-right">Qty</th>
                      <th className="p-2 text-xs text-right">Price</th>
                      <th className="p-2 text-xs text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <p className="text-xs">{item.itemName}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </td>
                        <td className="p-2 text-xs text-right">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-xs text-right">₹{parseFloat(item.unitPrice).toLocaleString("en-IN")}</td>
                        <td className="p-2 text-xs text-right ">₹{parseFloat(item.amount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>₹{parseFloat(selectedOrder.subtotalAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{selectedOrder.gstType} ({selectedOrder.gstPercentage}%):</span>
                    <span>₹{parseFloat(selectedOrder.gstAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2  text-lg">
                    <span className="text-sm">Total:</span>
                    <span className="text-sm">₹{parseFloat(selectedOrder.totalAmount).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-1">
                  <p className="text-gray-500   text-xs">Notes</p>
                  <p className="text-sm p-3 bg-muted rounded">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
