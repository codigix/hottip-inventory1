
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  ShoppingCart, 
  Plus, 
  Search, 
  Eye, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  FileText,
  Pencil
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Define a comprehensive schema for Purchase Orders
const purchaseOrderFormSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  supplierId: z.string().uuid("Supplier is required"),
  quotationId: z.string().optional(),
  userId: z.string().uuid("User is required"),
  orderDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
  deliveryPeriod: z.string().optional(),
  status: z
    .enum(["pending", "approved", "shipped", "delivered", "cancelled"])
    .default("pending"),
  subtotalAmount: z.coerce.number().min(0),
  gstType: z.enum(["IGST", "CGST_SGST"]).default("IGST"),
  gstPercentage: z.coerce.number().default(18),
  gstAmount: z.coerce.number().min(0),
  totalAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional().nullable(),
        itemName: z.string().min(1, "Item name is required"),
        description: z.string().optional(),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        unit: z.string().optional().default("pcs"),
        unitPrice: z.coerce.number().min(0),
        amount: z.coerce.number().optional(),
      })
    )
    .min(1, "At least one item is required"),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export default function PurchaseOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["/purchase-orders"],
  });

  const filteredPurchaseOrders = useMemo(() => {
    if (!searchTerm) return purchaseOrders;
    return purchaseOrders.filter((po: any) =>
      po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchaseOrders, searchTerm]);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setEditingPoId(null);
    } else if (!editingPoId) {
      // Auto-generate PO Number when opening for new order
      const year = new Date().getFullYear();
      let nextCount = 1;
      if (purchaseOrders && purchaseOrders.length > 0) {
        const poNumbers = purchaseOrders
          .map((po: any) => po.poNumber)
          .filter((num: string) => num && typeof num === 'string' && num.startsWith(`PO-${year}-`));
        
        if (poNumbers.length > 0) {
          const counts = poNumbers.map((num: string) => {
            const parts = num.split("-");
            return parseInt(parts[parts.length - 1]) || 0;
          });
          nextCount = Math.max(...counts) + 1;
        }
      }
      form.setValue("poNumber", `PO-${year}-${String(nextCount).padStart(3, "0")}`);
    }
  };

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/suppliers"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/products"],
  });

  const { data: inboundQuotations = [] } = useQuery({
    queryKey: ["/inbound-quotations"],
  });

  const { data: outboundQuotations = [] } = useQuery({
    queryKey: ["/outbound-quotations"],
  });

  const allQuotations = useMemo(() => {
    return [
      ...inboundQuotations.map((q: any) => ({ ...q, type: 'Inbound' })),
      ...outboundQuotations.map((q: any) => ({ ...q, type: 'Outbound' }))
    ];
  }, [inboundQuotations, outboundQuotations]);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      poNumber: "",
      supplierId: "",
      quotationId: undefined,
      userId: user?.id || "",
      orderDate: new Date(),
      deliveryPeriod: "15-20 Days",
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

  // Auto-generate PO Number
  useEffect(() => {
    if (user?.id) {
      form.setValue("userId", user.id);
    }
  }, [user, form]);

  const selectedQuotationId = form.watch("quotationId");

  // Handle Quotation Selection
  useEffect(() => {
    if (selectedQuotationId && selectedQuotationId !== "none") {
      const quotation = allQuotations.find((q: any) => q.id === selectedQuotationId);
      if (quotation) {
        // Map common fields
        form.setValue("totalAmount", parseFloat(quotation.totalAmount) || 0);
        form.setValue("subtotalAmount", parseFloat(quotation.subtotalAmount) || 0);
        form.setValue("gstAmount", parseFloat(quotation.taxAmount || quotation.gstAmount) || 0);
        form.setValue("gstPercentage", parseFloat(quotation.gstPercentage) || 18);
        
        // Map Supplier ID
        if (quotation.type === 'Inbound' && quotation.senderId) {
          form.setValue("supplierId", quotation.senderId);
        } else if (quotation.type === 'Outbound' && quotation.customerId) {
          // Check if this customer also exists as a supplier
          const supplierMatch = suppliers.find((s: any) => s.id === quotation.customerId);
          if (supplierMatch) {
            form.setValue("supplierId", quotation.customerId);
          } else {
            // Reset supplierId if no match found to avoid FK errors
            form.setValue("supplierId", "");
          }
        }
        
        // Map items if available
        const items = quotation.quotationItems || quotation.items || [];
        if (items.length > 0) {
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
              unit: item.uom || item.unit || "pcs",
              unitPrice: item.unitPrice || 0,
              amount: item.amount || 0,
            };
          });
          replace(mappedItems);
        }
      }
    }
  }, [selectedQuotationId, allQuotations, form, replace]);

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

  const createPoMutation = useMutation({
    mutationFn: (data: PurchaseOrderFormValues) => {
      return apiRequest("POST", "/purchase-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create purchase order.",
        variant: "destructive",
      });
    },
  });

  const editPoMutation = useMutation({
    mutationFn: (data: PurchaseOrderFormValues) => {
      return apiRequest("PUT", `/purchase-orders/${editingPoId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order updated successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingPoId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update purchase order.",
        variant: "destructive",
      });
    },
  });

  const deletePoMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest("DELETE", `/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/purchase-orders"] });
      toast({
        title: "Deleted",
        description: "Purchase order deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete purchase order.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseOrderFormValues) => {
    // Basic validation to avoid foreign key errors
    if (!data.supplierId || data.supplierId === "") {
      toast({
        title: "Validation Error",
        description: "Please select a valid supplier.",
        variant: "destructive",
      });
      return;
    }

    // Transform "none" to null for quotationId to avoid UUID validation errors
    const submissionData = {
      ...data,
      quotationId: data.quotationId === "none" ? null : data.quotationId,
    };
    
    if (editingPoId) {
      editPoMutation.mutate(submissionData);
    } else {
      createPoMutation.mutate(submissionData);
    }
  };

  const handleEdit = (po: any) => {
    setEditingPoId(po.id);
    form.reset({
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      quotationId: po.quotationId || "none",
      userId: po.userId,
      orderDate: new Date(po.orderDate),
      deliveryPeriod: po.deliveryPeriod,
      status: po.status,
      subtotalAmount: parseFloat(po.subtotalAmount),
      gstType: po.gstType,
      gstPercentage: parseFloat(po.gstPercentage),
      gstAmount: parseFloat(po.gstAmount),
      totalAmount: parseFloat(po.totalAmount),
      notes: po.notes,
      items: po.items.map((item: any) => ({
        productId: item.productId,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice),
        amount: parseFloat(item.amount),
      })),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      deletePoMutation.mutate(id);
    }
  };

  const handleViewDetails = (po: any) => {
    setSelectedPo(po);
    setIsViewDialogOpen(true);
  };

  // Analysis Stats
  const analysisStats = useMemo(() => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter((po: any) => po.status === 'pending').length;
    const approved = purchaseOrders.filter((po: any) => po.status === 'approved').length;
    const totalValue = purchaseOrders.reduce((acc: number, po: any) => acc + (parseFloat(po.totalAmount) || 0), 0);

    return [
      { title: "Total POs", value: total, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
      { title: "Pending Approval", value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
      { title: "Approved", value: approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
      { title: "Total Value", value: `₹${totalValue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" }
    ];
  }, [purchaseOrders]);

  const columns = [
    { key: "poNumber", header: "PO #", cell: (po: any) => <div className="font-medium">{po.poNumber || "N/A"}</div> },
    {
      key: "supplier.name",
      header: "Supplier",
      cell: (po: any) => {
        const supplierName = po.supplier?.name || suppliers.find((s: any) => s.id === po.supplierId)?.name || "N/A";
        return <div>{supplierName}</div>;
      },
    },
    { 
      key: "totalAmount", 
      header: "Total Amount", 
      cell: (po: any) => {
        const amount = parseFloat(po.totalAmount || 0);
        return `₹${amount.toLocaleString("en-IN")}`;
      }
    },
    {
      key: "status",
      header: "Status",
      cell: (po: any) => {
        const statusColors: Record<string, string> = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          shipped: "bg-blue-100 text-blue-800",
          delivered: "bg-purple-100 text-purple-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return <Badge className={statusColors[po.status] || "bg-gray-100"}>{po.status.toUpperCase()}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (po: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleViewDetails(po)} title="View Details">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEdit(po)} title="Edit">
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(po.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage procurement and vendor purchase orders</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPoId ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
              <DialogDescription>{editingPoId ? "Update purchase order details" : "Create a new purchase order for a vendor"}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="poNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PO Number</FormLabel>
                        <FormControl><Input {...field} readOnly className="bg-muted" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quotationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Quotation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select quotation" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Manual)</SelectItem>
                            {allQuotations.map((q: any) => (
                              <SelectItem key={q.id} value={q.id}>
                                <div className="flex justify-between items-center w-full min-w-[200px]">
                                  <span>{q.quotationNumber}</span>
                                  <Badge variant="outline" className="text-[10px] ml-2 h-4 px-1">
                                    {q.type}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {suppliers.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                        <FormControl><Input {...field} placeholder="e.g. 15-20 Days" /></FormControl>
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
                          <FormControl><SelectTrigger><SelectValue placeholder="Select GST Type" /></SelectTrigger></FormControl>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: null, itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, amount: 0 })}>
                      <Plus className="h-4 w-4 mr-2" />Add Item
                    </Button>
                  </div>
                  <div className="border rounded-md">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="p-2 font-medium w-48">Product</th>
                          <th className="p-2 font-medium">Item Name</th>
                          <th className="p-2 font-medium">Description</th>
                          <th className="p-2 font-medium w-20">Qty</th>
                          <th className="p-2 font-medium w-20">UOM</th>
                          <th className="p-2 font-medium w-32">Rate</th>
                          <th className="p-2 font-medium w-32">Amount</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b">
                            <td className="p-2">
                              <Select 
                                onValueChange={(val) => {
                                  const prod = products.find((p: any) => p.id === val);
                                  if (prod) {
                                    form.setValue(`items.${index}.productId`, prod.id);
                                    form.setValue(`items.${index}.itemName`, prod.name);
                                    form.setValue(`items.${index}.description`, prod.description || "");
                                    form.setValue(`items.${index}.unitPrice`, parseFloat(prod.price) || 0);
                                    const qty = form.getValues(`items.${index}.quantity`) || 1;
                                    form.setValue(`items.${index}.amount`, qty * (parseFloat(prod.price) || 0));
                                  } else {
                                    form.setValue(`items.${index}.productId`, null);
                                  }
                                }}
                                value={form.watch(`items.${index}.productId`) || "manual"}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Manual Entry" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Manual Entry</SelectItem>
                                  {products.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2"><Input {...form.register(`items.${index}.itemName`)} placeholder="Item Name" /></td>
                            <td className="p-2"><Input {...form.register(`items.${index}.description`)} placeholder="Description" /></td>
                            <td className="p-2">
                              <Input type="number" {...form.register(`items.${index}.quantity`, {
                                valueAsNumber: true,
                                onChange: (e) => {
                                  const qty = parseFloat(e.target.value) || 0;
                                  const rate = form.getValues(`items.${index}.unitPrice`);
                                  form.setValue(`items.${index}.amount`, qty * rate);
                                }
                              })} />
                            </td>
                            <td className="p-2"><Input {...form.register(`items.${index}.unit`)} /></td>
                            <td className="p-2">
                              <Input type="number" {...form.register(`items.${index}.unitPrice`, {
                                valueAsNumber: true,
                                onChange: (e) => {
                                  const rate = parseFloat(e.target.value) || 0;
                                  const qty = form.getValues(`items.${index}.quantity`);
                                  form.setValue(`items.${index}.amount`, qty * rate);
                                }
                              })} />
                            </td>
                            <td className="p-2"><Input type="number" {...form.register(`items.${index}.amount`, { valueAsNumber: true })} readOnly className="bg-muted" /></td>
                            <td className="p-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
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
                        <FormControl><Textarea {...field} placeholder="Internal notes..." rows={4} /></FormControl>
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
                        <div className="w-16"><Input type="number" {...form.register("gstPercentage", { valueAsNumber: true })} className="h-7 text-xs" /></div>
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
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={createPoMutation.isPending || editPoMutation.isPending}>
                    {editingPoId 
                      ? (editPoMutation.isPending ? "Updating..." : "Update Purchase Order")
                      : (createPoMutation.isPending ? "Creating..." : "Create Purchase Order")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysisStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>All Purchase Orders</CardTitle>
            <CardDescription>A list of all purchase orders issued to suppliers</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search POs..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredPurchaseOrders} isLoading={isLoading} searchable={false} />
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details - {selectedPo?.poNumber}</DialogTitle>
            <DialogDescription>Full details for purchase order {selectedPo?.poNumber}</DialogDescription>
          </DialogHeader>

          {selectedPo && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium uppercase text-[10px]">Supplier Details</p>
                  <p className="font-bold text-lg">{suppliers.find((s:any) => s.id === selectedPo.supplierId)?.name || "N/A"}</p>
                  <p>{suppliers.find((s:any) => s.id === selectedPo.supplierId)?.address || "N/A"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-muted-foreground font-medium uppercase text-[10px]">Order Info</p>
                  <p><strong>Order Date:</strong> {selectedPo.orderDate ? new Date(selectedPo.orderDate).toLocaleDateString() : (selectedPo.createdAt ? new Date(selectedPo.createdAt).toLocaleDateString() : "N/A")}</p>
                  <p><strong>Status:</strong> <Badge className="ml-1 uppercase text-[10px]">{selectedPo.status}</Badge></p>
                </div>
              </div>

              {selectedPo.items && selectedPo.items.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2">Item Name</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPo.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </td>
                          <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right">₹{parseFloat(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2 text-right font-medium">₹{parseFloat(item.amount || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{parseFloat(selectedPo.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
