
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
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
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
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

  const [, setLocation] = useLocation();

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

  const { data: customers = [] } = useQuery({
    queryKey: ["/customers"],
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
      ...inboundQuotations
        .filter((q: any) => q.status === 'approved')
        .map((q: any) => ({ ...q, type: 'Inbound' }))
    ];
  }, [inboundQuotations]);

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

  // Handle URL parameters for auto-opening the dialog with a quotation
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const quotationId = searchParams.get("quotationId");
    
    if (quotationId && !isDialogOpen && !editingPoId && allQuotations.length > 0) {
      const quotation = allQuotations.find((q: any) => q.id === quotationId);
      if (quotation) {
        // First generate a PO number if it doesn't exist
        if (!form.getValues("poNumber")) {
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
        
        form.setValue("quotationId", quotationId);
        setIsDialogOpen(true);
        
        // Clean up URL to prevent re-opening
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [allQuotations, isDialogOpen, editingPoId, form, purchaseOrders]);

  // Auto-generate PO Number
  useEffect(() => {
    if (user?.id) {
      form.setValue("userId", user.id);
    }
  }, [user, form]);

  const selectedQuotationId = form.watch("quotationId");

  const selectedQuotation = useMemo(() => {
    if (!selectedQuotationId || selectedQuotationId === "none") return null;
    return allQuotations.find((q: any) => q.id === selectedQuotationId);
  }, [selectedQuotationId, allQuotations]);

  const selectedSupplierName = useMemo(() => {
    if (selectedQuotation) {
      if (selectedQuotation.type === 'Inbound') {
        return selectedQuotation.sender?.name || "N/A";
      } else {
        return selectedQuotation.customer?.name || "N/A";
      }
    }
    const currentSupplierId = form.watch("supplierId");
    if (currentSupplierId) {
      return suppliers.find((s: any) => s.id === currentSupplierId)?.name || "N/A";
    }
    return null;
  }, [selectedQuotation, form.watch("supplierId"), suppliers]);

  const selectedSupplierEmail = useMemo(() => {
    if (selectedQuotation) {
      if (selectedQuotation.type === 'Inbound') {
        return selectedQuotation.sender?.email;
      } else {
        return selectedQuotation.customer?.email;
      }
    }
    const currentSupplierId = form.watch("supplierId");
    if (currentSupplierId) {
      return suppliers.find((s: any) => s.id === currentSupplierId)?.email;
    }
    return null;
  }, [selectedQuotation, form.watch("supplierId"), suppliers]);

  const selectedSupplierAddress = useMemo(() => {
    if (selectedQuotation) {
      if (selectedQuotation.type === 'Inbound') {
        return selectedQuotation.sender?.address;
      } else {
        return selectedQuotation.customer?.address;
      }
    }
    const currentSupplierId = form.watch("supplierId");
    if (currentSupplierId) {
      return suppliers.find((s: any) => s.id === currentSupplierId)?.address;
    }
    return null;
  }, [selectedQuotation, form.watch("supplierId"), suppliers]);

  const selectedSupplierGst = useMemo(() => {
    if (selectedQuotation) {
      if (selectedQuotation.type === 'Inbound') {
        return selectedQuotation.sender?.gstNumber;
      } else {
        return selectedQuotation.customer?.gstNumber;
      }
    }
    const currentSupplierId = form.watch("supplierId");
    if (currentSupplierId) {
      return suppliers.find((s: any) => s.id === currentSupplierId)?.gstNumber;
    }
    return null;
  }, [selectedQuotation, form.watch("supplierId"), suppliers]);

  const allEntities = useMemo(() => {
    return [
      ...suppliers.map((s: any) => ({ ...s, type: 'Supplier' })),
      ...customers.map((c: any) => ({ ...c, type: 'Customer' }))
    ];
  }, [suppliers, customers]);

  // Handle Quotation Selection
  useEffect(() => {
    if (selectedQuotationId && selectedQuotationId !== "none") {
      const quotation = allQuotations.find((q: any) => q.id === selectedQuotationId);
      if (quotation) {
        // Map common fields
        if (quotation.type === 'Inbound' && quotation.financialBreakdown) {
          form.setValue("totalAmount", parseFloat(String(quotation.financialBreakdown.total)) || 0);
          form.setValue("subtotalAmount", parseFloat(String(quotation.financialBreakdown.subtotal)) || 0);
          form.setValue("gstAmount", parseFloat(String(quotation.financialBreakdown.gstAmount)) || 0);
          form.setValue("gstPercentage", parseFloat(String(quotation.financialBreakdown.gstRate)) || 18);
        } else {
          form.setValue("totalAmount", parseFloat(quotation.totalAmount) || 0);
          form.setValue("subtotalAmount", parseFloat(quotation.subtotalAmount) || 0);
          form.setValue("gstAmount", parseFloat(quotation.taxAmount || quotation.gstAmount) || 0);
          form.setValue("gstPercentage", parseFloat(quotation.gstPercentage) || 18);
        }
        
        // Map Supplier ID
        if (quotation.type === 'Inbound' && quotation.senderId) {
          // If it's an inbound quotation, the sender is the supplier
          // Check if it's in the suppliers list
          const supplierMatch = suppliers.find((s: any) => s.id === quotation.senderId);
          if (supplierMatch) {
            form.setValue("supplierId", quotation.senderId);
          } else {
            // If not found in suppliers, we might be using a customer as a supplier
            // This could fail FK if not handled in DB, but for UI we show the name
            form.setValue("supplierId", quotation.senderId);
          }
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
            // For inbound/outbound quotations:
            // partName/itemName/mouldNo usually contains the SKU/Part Number
            // displayDescription/partDescription/description contains the friendly name
            const itemName = item.partName || item.itemName || item.mouldNo || item.displayDescription || "";
            const description = item.displayDescription || item.partDescription || item.description || "";
            const quantity = parseFloat(String(item.displayQty || item.qty || item.quantity || 1));
            const unit = item.uom || item.unit || "pcs";
            const unitPrice = parseFloat(String(item.displayRate || item.unitPrice || 0));
            const amount = parseFloat(String(item.displayAmount || item.amount || 0));

            // Try to find matching product for stock tracking
            const matchedProduct = products.find((p: any) => 
              p.name.toLowerCase() === itemName.toLowerCase() || 
              p.sku.toLowerCase() === itemName.toLowerCase()
            );

            return {
              productId: matchedProduct?.id || null,
              itemName: itemName,
              description: description,
              quantity: quantity,
              unit: unit,
              unitPrice: unitPrice,
              amount: amount,
            };
          });
          replace(mappedItems);
        }
      }
    }
  }, [selectedQuotationId, allQuotations, form, replace, suppliers, products]);

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
    const processing = purchaseOrders.filter((po: any) => po.status === 'processing').length;
    const totalValue = purchaseOrders.reduce((acc: number, po: any) => acc + (parseFloat(po.totalAmount) || 0), 0);

    return [
      { 
        title: "Total POs", 
        value: total, 
        icon: ShoppingCart, 
        color: "text-slate-600", 
        bg: "bg-slate-100 border-slate-200" 
      },
      { 
        title: "Pending Approval", 
        value: pending, 
        icon: Clock, 
        color: "text-slate-600", 
        bg: "bg-slate-50 border-slate-200" 
      },
      { 
        title: "Processing", 
        value: processing, 
        icon: CheckCircle, 
        color: "text-slate-600", 
        bg: "bg-slate-50 border-slate-200" 
      },
      { 
        title: "Total Value", 
        value: `₹${totalValue.toLocaleString("en-IN")}`, 
        icon: TrendingUp, 
        color: "text-slate-900", 
        bg: "bg-slate-100 border-slate-200 " 
      }
    ];
  }, [purchaseOrders]);

  const columns = [
    { 
      key: "poNumber", 
      header: "PO #", 
      sortable: true,
      cell: (po: any) => (
        <div className=" text-slate-800">{po.poNumber || "N/A"}</div>
      )
    },
    {
      key: "supplier.name",
      header: "Supplier",
      sortable: true,
      cell: (po: any) => {
        const supplierName = po.supplier?.name || allEntities.find((e: any) => e.id === po.supplierId)?.name || "N/A";
        return (
          <div>
            <div className="font-medium text-slate-700">{supplierName}</div>
            <div className="text-xs text-slate-400  ">
              {po.supplier?.type || "VENDOR"}
            </div>
          </div>
        );
      },
    },
    { 
      key: "totalAmount", 
      header: "Total Value", 
      sortable: true,
      cell: (po: any) => {
        const amount = parseFloat(po.totalAmount || 0);
        return (
          <span className="text-xs  text-slate-800">
            ₹{amount.toLocaleString("en-IN")}
          </span>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (po: any) => {
        const statusColors: Record<string, string> = {
          pending: "bg-slate-100 text-slate-600 border-slate-200",
          processing: "bg-blue-50 text-blue-700 border-blue-100",
          shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
          delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
          cancelled: "bg-red-50 text-red-700 border-red-100",
        };
        return (
          <Badge 
            variant="outline"
            className={cn(
              "text-xs   py-0 h-5 shadow-none",
              statusColors[po.status] || "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {po.status}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (po: any) => (
        <div className="flex items-center space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleViewDetails(po)} 
            title="View Details"
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 hover:text-primary"
            onClick={() => setLocation(`/sales/orders?purchaseOrderId=${po.id}`)} 
            title="Create Sales Order"
          >
            <FileText className="h-4 w-4 text-primary" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleEdit(po)} 
            title="Edit"
          >
            <Pencil className="h-4 w-4 text-slate-400" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 hover:bg-red-50"
            onClick={() => handleDelete(po.id)} 
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 space-y-3 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl  text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 text-sm">Manage procurement and vendor purchase orders</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary text-white  transition-all duration-200">
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                                  <Badge variant="outline" className="text-xs ml-2 h-4 px-1">
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
                            <SelectItem value="processing">Processing</SelectItem>
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
                        <FormLabel>Customer</FormLabel>
                        {selectedQuotation ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 group transition-all hover:bg-white hover:border-blue-300">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100   tracking-tight text-xs py-0 px-2 h-5">
                                {selectedQuotation.type}
                              </Badge>
                              <span className="text-xs  text-slate-900 flex-1 truncate">{selectedSupplierName}</span>
                            </div>
                            {selectedSupplierEmail && (
                              <div className="text-[11px] text-gray-500 ml-1">
                                {selectedSupplierEmail}
                              </div>
                            )}
                            {(selectedSupplierAddress || selectedSupplierGst) && (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
                                {selectedSupplierAddress && (
                                  <div className="text-xs text-slate-500 italic flex items-center gap-1">
                                    <span className="  text-[9px] not-italic">Addr:</span> {selectedSupplierAddress}
                                  </div>
                                )}
                                {selectedSupplierGst && (
                                  <div className="text-xs text-slate-500 italic flex items-center gap-1">
                                    <span className="  text-[9px] not-italic text-blue-600">GST:</span> {selectedSupplierGst}
                                  </div>
                                )}
                              </div>
                            )}
                            <input type="hidden" {...field} />
                          </div>
                        ) : (
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {allEntities.map((e: any) => (
                                <SelectItem key={e.id} value={e.id}>
                                  <div className="flex justify-between items-center w-full min-w-[200px]">
                                    <span>{e.name}</span>
                                    <Badge variant="outline" className="text-[9px] ml-2 h-4 px-1 opacity-70">
                                      {e.type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
                        <FormControl><Input {...field} placeholder="" /></FormControl>
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

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm ">Order Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: null, itemName: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0, amount: 0 })}>
                      <Plus className="h-4 w-4 mr-2" />Add Item
                    </Button>
                  </div>
                  <div className="border rounded">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="p-2 text-xs font-medium ">Item Name</th>
                          <th className="p-2 text-xs font-medium ">Description</th>
                          <th className="p-2 text-xs font-medium  w-20">Qty</th>
                          <th className="p-2 text-xs font-medium  w-20">UOM</th>
                          <th className="p-2 text-xs font-medium  w-32">Rate</th>
                          <th className="p-2 text-xs font-medium  w-32">Amount</th>
                          <th className="p-2 text-xs font-medium w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b">
                            <td className="p-2"><Input {...form.register(`items.${index}.itemName`)} placeholder="Item Name" /></td>
                            <td className="p-2"><Input {...form.register(`items.${index}.description`)} placeholder="Description" /></td>
                            <td className="p-2">
                              <Input type="number" step="any" {...form.register(`items.${index}.quantity`, {
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
                              <Input type="number" step="any" {...form.register(`items.${index}.unitPrice`, {
                                valueAsNumber: true,
                                onChange: (e) => {
                                  const rate = parseFloat(e.target.value) || 0;
                                  const qty = form.getValues(`items.${index}.quantity`);
                                  form.setValue(`items.${index}.amount`, qty * rate);
                                }
                              })} />
                            </td>
                            <td className="p-2"><Input type="number" step="any" {...form.register(`items.${index}.amount`, { valueAsNumber: true })} readOnly className="bg-muted" /></td>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2 border rounded p-4 bg-muted/20">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">Subtotal:</span>
                      <span className="text-xs">₹{form.watch("subtotalAmount").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs">GST:</span>
                        <div className="w-16 text-xs"><Input type="number" step="any" {...form.register("gstPercentage", { valueAsNumber: true })} className="h-7 text-xs" /></div>
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      <span className="text-xs">₹{form.watch("gstAmount").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between">
                      <span className="text-sm ">Grand Total:</span>
                      <span className="text-sm">₹{form.watch("totalAmount").toLocaleString("en-IN")}</span>
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
            <Card key={index} className={cn("border ", stat.bg)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs  text-slate-500  ">{stat.title}</p>
                    <h3 className="text-xl  text-slate-900">{stat.value}</h3>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-slate-100 ">
                    <Icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="border-slate-200  overflow-hidden">
        <div className="p-0">
          <DataTable 
            columns={columns} 
            data={purchaseOrders} 
            isLoading={isLoading} 
            searchKey="poNumber"
            searchPlaceholder="Search purchase orders..."
          />
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details - {selectedPo?.poNumber}</DialogTitle>
            <DialogDescription>Full details for purchase order {selectedPo?.poNumber}</DialogDescription>
          </DialogHeader>

          {selectedPo && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500   text-xs">Customer Details</p>
                  <p className=" text-lg">{selectedPo.supplier?.name || allEntities.find((e:any) => e.id === selectedPo.supplierId)?.name || "N/A"}</p>
                  <p>{selectedPo.supplier?.address || allEntities.find((e:any) => e.id === selectedPo.supplierId)?.address || "N/A"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-gray-500   text-xs">Order Info</p>
                  <p><strong>Order Date:</strong> {selectedPo.orderDate ? new Date(selectedPo.orderDate).toLocaleDateString() : (selectedPo.createdAt ? new Date(selectedPo.createdAt).toLocaleDateString() : "N/A")}</p>
                  <p><strong>Status:</strong> <Badge className="ml-1  text-xs">{selectedPo.status}</Badge></p>
                </div>
              </div>

              {selectedPo.items && selectedPo.items.length > 0 && (
                <div className="border rounded overflow-hidden">
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
                            <p className="">{item.itemName}</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </td>
                          <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right">₹{parseFloat(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2 text-right ">₹{parseFloat(item.amount || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between border-t pt-2  text-lg">
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
