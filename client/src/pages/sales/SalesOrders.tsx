
import { useState, useMemo, useEffect } from "react";
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
  XCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type SalesOrderFormValues = z.infer<typeof insertSalesOrderSchema>;

export default function SalesOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | number | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/sales-orders"],
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["/outbound-quotations"],
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["/purchase-orders"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/customers"],
  });

  const allReferences = useMemo(() => {
    return [
      ...quotations.map((q: any) => ({ 
        id: `Quotation:${q.id}`, 
        originalId: q.id,
        number: q.quotationNumber, 
        type: 'Quotation', 
        data: q 
      })),
      ...purchaseOrders.map((p: any) => ({ 
        id: `PO:${p.id}`, 
        originalId: p.id,
        number: p.poNumber, 
        type: 'PO', 
        data: p 
      }))
    ];
  }, [quotations, purchaseOrders]);

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

  // Auto-generate Order Number
  useEffect(() => {
    if (isDialogOpen && !form.getValues("orderNumber")) {
      const year = new Date().getFullYear();
      const count = (orders?.length || 0) + 1;
      const soNumber = `SO-${year}-${String(count).padStart(3, "0")}`;
      form.setValue("orderNumber", soNumber);
    }
  }, [isDialogOpen, orders, form]);

  const selectedQuotationId = form.watch("quotationId");
  const selectedPurchaseOrderId = form.watch("purchaseOrderId");

  // Handle Reference Selection
  useEffect(() => {
    let reference = null;
    if (selectedQuotationId && selectedQuotationId !== "none") {
      reference = quotations.find((q: any) => q.id === selectedQuotationId);
    } else if (selectedPurchaseOrderId && selectedPurchaseOrderId !== "none") {
      reference = purchaseOrders.find((p: any) => p.id === selectedPurchaseOrderId);
    }

    if (reference) {
      form.setValue("customerId", reference.customerId || reference.supplierId || "");
      form.setValue("gstType", reference.gstType || "IGST");
      form.setValue("gstPercentage", parseFloat(reference.gstPercentage) || 18);
      form.setValue("subtotalAmount", parseFloat(reference.subtotalAmount) || 0);
      form.setValue("gstAmount", parseFloat(reference.gstAmount || reference.taxAmount) || 0);
      form.setValue("totalAmount", parseFloat(reference.totalAmount) || 0);
      
      const items = reference.items || reference.quotationItems || [];
      if (Array.isArray(items)) {
        const mappedItems = items.map((item: any) => ({
          itemName: item.partName || item.itemName || "",
          description: item.partDescription || item.description || "",
          quantity: item.qty || item.quantity || 1,
          unit: item.uom || item.unit || "NOS",
          unitPrice: parseFloat(item.unitPrice) || 0,
          amount: parseFloat(item.amount) || 0,
        }));
        replace(mappedItems);
      }
    }
  }, [selectedQuotationId, selectedPurchaseOrderId, quotations, purchaseOrders, form, replace]);

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string | number; status: string }) => {
      return apiRequest("PUT", `/sales-orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sales-orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully.",
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
    if (finalData.quotationId === "none" || !finalData.quotationId) {
      finalData.quotationId = null;
    }
    if (finalData.purchaseOrderId === "none" || !finalData.purchaseOrderId) {
      finalData.purchaseOrderId = null;
    }
    createOrderMutation.mutate(finalData);
  };

  const columns = [
    {
      key: "orderNumber",
      header: "Order #",
      cell: (order: any) => (
        <div className="font-light">{order.orderNumber}</div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (order: any) => (
        <div className="font-light">{order.customer?.name || "N/A"}</div>
      ),
    },
    {
      key: "orderDate",
      header: "Date",
      cell: (order: any) => new Date(order.orderDate).toLocaleDateString(),
    },
    {
      key: "totalAmount",
      header: "Amount",
      cell: (order: any) => `₹${parseFloat(order.totalAmount).toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (order: any) => {
        const statusColors: Record<string, string> = {
          pending: "bg-yellow-100 text-yellow-800",
          confirmed: "bg-blue-100 text-blue-800",
          processing: "bg-purple-100 text-purple-800",
          shipped: "bg-orange-100 text-orange-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <Badge className={statusColors[order.status] || "bg-gray-100"}>
            {order.status.toUpperCase()}
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
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="ghost" 
              title="View Details"
              onClick={() => handleViewDetails(order)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {order.status === 'pending' && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                disabled={isProcessing}
                title="Confirm Order"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleUpdateStatus(order.id, 'processing')}
                disabled={isProcessing}
                title="Start Processing"
              >
                <Truck className="h-4 w-4 text-blue-600" />
              </Button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                disabled={isProcessing}
                title="Cancel Order"
              >
                <XCircle className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">
            Manage confirmed customer orders and fulfillment
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel>Reference (Quotation/PO)</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            if (val === "none") {
                              form.setValue("quotationId", null);
                              form.setValue("purchaseOrderId", null);
                            } else if (val.startsWith("Quotation:")) {
                              form.setValue("quotationId", val.split(":")[1]);
                              form.setValue("purchaseOrderId", null);
                            } else if (val.startsWith("PO:")) {
                              form.setValue("quotationId", null);
                              form.setValue("purchaseOrderId", val.split(":")[1]);
                            }
                          }} 
                          value={selectedQuotationId ? `Quotation:${selectedQuotationId}` : (selectedPurchaseOrderId ? `PO:${selectedPurchaseOrderId}` : "none")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Manual)</SelectItem>
                            {allReferences.map((ref: any) => (
                              <SelectItem key={ref.id} value={ref.id}>
                                <div className="flex justify-between items-center w-full min-w-[200px]">
                                  <span>{ref.number}</span>
                                  <Badge variant="outline" className="text-[10px] ml-2 h-4 px-1">
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
                              <SelectValue placeholder="Select customer" />
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
                          <Input {...field} placeholder="e.g. 25-30 Days" />
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
                              <SelectValue placeholder="Select GST Type" />
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
                    <h3 className="text-lg font-semibold">Order Items</h3>
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

                  <div className="border rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="p-2 text-left font-medium">Item Name</th>
                          <th className="p-2 text-left font-medium">Description</th>
                          <th className="p-2 text-left font-medium w-20">Qty</th>
                          <th className="p-2 text-left font-medium w-20">UOM</th>
                          <th className="p-2 text-left font-medium w-32">Rate</th>
                          <th className="p-2 text-left font-medium w-32">Amount</th>
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
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                {...form.register(`items.${index}.description`)}
                                placeholder="Description"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                {...form.register(`items.${index}.quantity`, {
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const qty = parseFloat(e.target.value) || 0;
                                    const rate = form.getValues(`items.${index}.unitPrice`);
                                    form.setValue(`items.${index}.amount`, qty * rate);
                                  }
                                })}
                              />
                            </td>
                            <td className="p-2">
                              <Input {...form.register(`items.${index}.unit`)} />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                {...form.register(`items.${index}.unitPrice`, {
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const rate = parseFloat(e.target.value) || 0;
                                    const qty = form.getValues(`items.${index}.quantity`);
                                    form.setValue(`items.${index}.amount`, qty * rate);
                                  }
                                })}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                  <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">₹{form.watch("subtotalAmount").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">GST:</span>
                        <div className="w-16">
                          <Input 
                            type="number" 
                            {...form.register("gstPercentage", { valueAsNumber: true })} 
                            className="h-7 text-xs"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <span className="font-medium">₹{form.watch("gstAmount").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between">
                      <span className="text-lg font-bold">Grand Total:</span>
                      <span className="text-lg font-bold">₹{form.watch("totalAmount").toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>All Sales Orders</span>
          </CardTitle>
          <CardDescription>
            Overview of all customer orders and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={orders}
            columns={columns}
            searchable={true}
            searchKey="orderNumber"
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium uppercase text-[10px]">Customer Details</p>
                  <p className="font-bold text-lg">{selectedOrder.customer?.name}</p>
                  <p>{selectedOrder.customer?.address}</p>
                  <p>GST: {selectedOrder.customer?.gstNumber}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-muted-foreground font-medium uppercase text-[10px]">Order Info</p>
                  <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <Badge className="ml-1 uppercase text-[10px]">{selectedOrder.status}</Badge></p>
                  <p><strong>Delivery Period:</strong> {selectedOrder.deliveryPeriod}</p>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Item Name</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </td>
                        <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-2 text-right">₹{parseFloat(item.unitPrice).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2 text-right font-medium">₹{parseFloat(item.amount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{parseFloat(selectedOrder.subtotalAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedOrder.gstType} ({selectedOrder.gstPercentage}%):</span>
                    <span>₹{parseFloat(selectedOrder.gstAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{parseFloat(selectedOrder.totalAmount).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium uppercase text-[10px]">Notes</p>
                  <p className="text-sm p-3 bg-muted rounded-md">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
