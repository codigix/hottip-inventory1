import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Package, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  List, 
  Search, 
  Eye, 
  Edit2, 
  MoreHorizontal,
  LayoutGrid,
  FileText,
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  History,
  ClipboardList
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  costPrice: z.string().min(1, "Cost price is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  lowStockThreshold: z.number().min(0, "Threshold cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
});

type ProductForm = z.infer<typeof productFormSchema>;

// Stock Details Modal
function StockDetailsModal({ open, onOpenChange, product }: { open: boolean; onOpenChange: (v: boolean) => void; product: any }) {
  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xs">Stock Details</DialogTitle>
          <DialogDescription className="text-slate-500">Full inventory information for {product.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs  text-slate-400  tracking-wider">Product Name</p>
              <p className="text-xs  text-slate-900">{product.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs  text-slate-400  tracking-wider">SKU</p>
              <p className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">{product.sku}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs  text-slate-400  tracking-wider">Category</p>
              <p className="text-sm text-slate-700">{product.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs  text-slate-400  tracking-wider">Unit</p>
              <p className="text-sm text-slate-700 ">{product.unit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs  text-slate-400  tracking-wider">Current Stock</p>
              <p className="text-lg  text-slate-900">{product.stock}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs  text-slate-400  tracking-wider">Status</p>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs   px-2 py-0.5",
                  product.stock <= product.lowStockThreshold 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}
              >
                {product.stock <= product.lowStockThreshold ? 'Critical' : 'Optimal'}
              </Badge>
            </div>
          </div>
          <div className="space-y-1 border-t pt-4 border-slate-100">
            <p className="text-xs  text-slate-400  tracking-wider">Description</p>
            <p className="text-sm text-slate-600 italic">"{product.description || 'No description provided'}"</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stock Edit Modal
function StockEditModal({ open, onOpenChange, product, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; product: any, onSave: (patch: any) => void }) {
  const [form, setForm] = useState<any>(product || {});
  
  React.useEffect(() => { 
    if (open) setForm(product || {}); 
  }, [product, open]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-xl">
        <DialogHeader className="p-2 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-slate-900 text-xs">Edit Stock Details</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 ">Update inventory records and tracking thresholds.</DialogDescription>
        </DialogHeader>
        <div className="p-2 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">Product Name</Label>
            <Input 
              value={form.name || ''} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="h-10 border-slate-200 focus-visible:ring-slate-400 shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">SKU</Label>
            <Input 
              value={form.sku || ''} 
              onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              className="h-10 border-slate-200 focus-visible:ring-slate-400 font-mono shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">Category</Label>
            <Input 
              value={form.category || ''} 
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="h-10 border-slate-200 focus-visible:ring-slate-400 shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">Unit</Label>
            <Input 
              value={form.unit || ''} 
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              className="h-10 border-slate-200 focus-visible:ring-slate-400 shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">Current Stock</Label>
            <Input 
              type="number" 
              value={form.stock ?? ''} 
              onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
              className="h-10 border-slate-200 focus-visible:ring-slate-400 shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">Low Stock Alert Level</Label>
            <Input 
              type="number" 
              value={form.lowStockThreshold ?? ''} 
              onChange={e => setForm(f => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
              className="h-10 border-slate-200 focus-visible:ring-slate-400 shadow-none"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-xs text-slate-700">Description</Label>
            <Textarea 
              value={form.description || ''} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="min-h-[100px] border-slate-200 focus-visible:ring-slate-400 shadow-none"
            />
          </div>
        </div>
        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 border-slate-200 text-slate-600">Cancel</Button>
          <Button onClick={() => onSave(form)} className="h-10 bg-primary hover:bg-primary text-white text-xs px-6 shadow-sm border-none">Update Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StockManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isStockTransactionDialogOpen, setIsStockTransactionDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const [activeTab, setActiveTab] = useState("overview");
  
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPo, setSelectedPo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      category: "",
      costPrice: "",
      stock: 0,
      lowStockThreshold: 10,
      unit: "pcs",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddProductDialogOpen(false);
      productForm.reset();
      toast({ title: "Success", description: "Product created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create product", variant: "destructive" });
    },
  });

  const onAddProductSubmit = (data: ProductForm) => {
    createProductMutation.mutate(data);
  };

  const editMutation = useMutation({
    mutationFn: async (patch: any) => {
      if (!patch.id) throw new Error("Missing product id");
      return apiRequest('PUT', `/api/products/${patch.id}`, patch);
    },
    onSuccess: () => {
      toast({ title: "Product updated", description: "Stock details updated successfully" });
      setIsEditModalOpen(false);
      setEditProduct(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update product", variant: "destructive" });
    }
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => apiRequest("GET", "/api/products"),
  });

  const productsArray = Array.isArray(products?.data) ? products.data : (Array.isArray(products) ? products : []);

  const productName = productForm.watch("name");
  React.useEffect(() => {
    const currentSku = productForm.getValues("sku");
    if (isAddProductDialogOpen && productName && !currentSku && productsArray) {
      let nextNumber = 1;
      if (productsArray.length > 0) {
        const skuNumbers = productsArray
          .map((p: any) => {
            const match = p.sku?.match(/SKU-(\d+)/i);
            return match ? parseInt(match[1]) : 0;
          })
          .filter((n: number) => n > 0);
        if (skuNumbers.length > 0) {
          nextNumber = Math.max(...skuNumbers) + 1;
        }
      }
      const generatedSku = `SKU-${nextNumber.toString().padStart(3, '0')}`;
      productForm.setValue("sku", generatedSku, { shouldValidate: true });
    }
  }, [productName, productsArray, productForm, isAddProductDialogOpen]);

  const { data: stockTransactions, isLoading: transactionsLoading } = useQuery<any>({
    queryKey: ["/api/stock-transactions"],
    queryFn: async () => apiRequest("GET", "/api/stock-transactions"),
  });

  const transactionsArray = Array.isArray(stockTransactions?.data) ? stockTransactions.data : (Array.isArray(stockTransactions) ? stockTransactions : []);

  const { data: purchaseOrders } = useQuery({
    queryKey: ["/api/purchase-orders"],
    queryFn: async () => apiRequest("GET", "/api/purchase-orders"),
    enabled: transactionType === 'in',
  });

  const stockTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/stock-transactions', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Stock ${transactionType === 'in' ? 'received' : 'issued'} successfully`,
      });
      setIsStockTransactionDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record stock transaction", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedProduct('');
    setSelectedPo('');
    setQuantity('');
    setReason('');
    setNotes('');
  };

  const handleStockTransaction = () => {
    if (!selectedProduct || !quantity || !reason) {
      toast({ title: "Error", description: `Please fill in all required fields`, variant: "destructive" });
      return;
    }

    const transactionData = {
      userId: user?.id || null, 
      productId: Number(selectedProduct),
      type: transactionType,
      quantity: parseInt(quantity),
      reason,
      referenceNumber: `${transactionType.to()}-${Date.now()}`,
      notes,
    };

    stockTransactionMutation.mutate(transactionData);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stock-transactions"] });
    toast({ title: "Refreshed", description: "Stock data has been refreshed" });
  };

  const totalProducts = productsArray.length;
  const lowStockProducts = productsArray.filter((p: any) => p.stock <= (p.lowStockThreshold || 0)).length;
  const totalValue = productsArray.reduce((sum: number, product: any) => {
    const costPrice = typeof product.costPrice === 'string' ? parseFloat(product.costPrice) : (product.costPrice || 0);
    const stock = typeof product.stock === 'string' ? parseInt(product.stock) : (product.stock || 0);
    return sum + (costPrice * stock);
  }, 0);

  const productColumns = [
    {
      key: "sku",
      header: "Product / SKU",
      cell: (p: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-900">{p.name}</span>
          <span className="text-xs font-mono text-slate-400  ">{p.sku}</span>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      cell: (p: any) => <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">{p.category}</Badge>
    },
    {
      key: "stock",
      header: "Availability",
      cell: (p: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs ", p.stock <= p.lowStockThreshold ? "text-red-600" : "text-slate-900")}>
              {p.stock} {p.unit}
            </span>
            {p.stock <= p.lowStockThreshold && <AlertTriangle className="h-3 w-3 text-red-500" />}
          </div>
          <span className="text-xs text-slate-400   ">Threshold: {p.lowStockThreshold}</span>
        </div>
      ),
    },
    {
      key: "value",
      header: "Inventory Value",
      cell: (p: any) => (
        <div className="flex flex-col">
          <span className="text-xs  text-slate-900">₹{(parseFloat(p.costPrice) * p.stock).toLocaleString()}</span>
          <span className="text-xs text-slate-400 ">Rate: ₹{parseFloat(p.costPrice).toLocaleString()}</span>
        </div>
      )
    },
    {
      key: "actions",
      header: "",
      cell: (p: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => { setViewProduct(p); setIsDetailsModalOpen(true); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => { setEditProduct(p); setIsEditModalOpen(true); }}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const transactionColumns = [
    {
      key: "date",
      header: "Timestamp",
      cell: (t: any) => (
        <div className="flex flex-col">
          <span className="text-sm  text-slate-900">{new Date(t.createdAt || Date.now()).toLocaleDateString()}</span>
          <span className="text-xs text-slate-400  ">{new Date(t.createdAt || Date.now()).toLocaleTimeString()}</span>
        </div>
      )
    },
    {
      key: "product",
      header: "Asset Detail",
      cell: (t: any) => {
        const product = productsArray.find((p: any) => p.id === t.productId);
        return (
          <div className="flex flex-col">
            <span className="text-xs text-slate-900">{product?.name || `Product #${t.productId}`}</span>
            <span className="text-xs text-slate-400  ">{product?.sku || t.referenceNumber}</span>
          </div>
        );
      }
    },
    {
      key: "type",
      header: "Movement",
      cell: (t: any) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-full",
            t.type === 'in' ? "bg-emerald-50" : "bg-red-50"
          )}>
            {t.type === 'in' ? <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowUpCircle className="h-3.5 w-3.5 text-red-600" />}
          </div>
          <span className={cn(
            "text-sm ",
            t.type === 'in' ? "text-emerald-700" : "text-red-700"
          )}>
            {t.type === 'in' ? '+' : '-'}{t.quantity}
          </span>
        </div>
      )
    },
    {
      key: "reason",
      header: "Classification",
      cell: (t: any) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700  capitalize">{t.reason.replace('_', ' ')}</span>
          <span className="text-xs text-slate-400 truncate max-w-[150px] italic">{t.notes || 'No notes'}</span>
        </div>
      )
    }
  ];

  const metrics = [
    { label: "Total Asset Types", value: totalProducts, icon: Boxes, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Inventory Valuation", value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Threshold Alerts", value: lowStockProducts, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Recent Movements", value: transactionsArray.length, icon: History, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Stock & Asset Management</h1>
          <p className="text-xs text-slate-500">Inventory lifecycle tracking, stock adjustments, and valuation auditing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2 text-slate-400" />
            Synchronize
          </Button>
          <Button className="bg-primary hover:bg-primary text-white shadow-sm" onClick={() => setIsAddProductDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-2 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", metric.bg)}>
                <metric.icon className={cn("h-5 w-5", metric.color)} />
              </div>
              <div>
                <p className="text-xs  text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-4" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-slate-100/80 p-1 rounded-lg w-fit border border-slate-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
              <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
              Stock Ledger
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
              <History className="h-4 w-4 mr-2 text-slate-400" />
              Movement History
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setIsStockTransactionDialogOpen(true)} className="bg-primary hover:bg-primary text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Stock Adjustment
          </Button>
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="">
            <div className="">
              <div className="text-lg  text-slate-800 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-slate-400" />
                Inventory Registry
              </div>
            </div>
            <div className="p-0 mt-2">
              <DataTable
                data={productsArray}
                columns={productColumns}
                loading={productsLoading}
                searchPlaceholder="Filter assets by name, SKU or category..."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <div className="">
            <div className="p-2">
              <div className="text-lg  text-slate-800 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Audit Trail
              </div>
            </div>
            <div className="p-0 mt-4">
              <DataTable
                data={transactionsArray}
                columns={transactionColumns}
                loading={transactionsLoading}
                searchPlaceholder="Search movement history..."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isStockTransactionDialogOpen} onOpenChange={setIsStockTransactionDialogOpen}>
        <DialogContent className="max-w-xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">Stock Movement Recording</DialogTitle>
            <DialogDescription>Record receipt or issuance of items from the warehouse.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Movement Type</Label>
                <Select value={transactionType} onValueChange={(v: any) => setTransactionType(v)}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Receipt)</SelectItem>
                    <SelectItem value="out">Stock Out (Issuance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Select Asset</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Search product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productsArray.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Quantity</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  className="border-slate-200"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Classification</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionType === 'in' ? (
                      <>
                        <SelectItem value="purchase">Purchase Receipt</SelectItem>
                        <SelectItem value="return">Customer Return</SelectItem>
                        <SelectItem value="adjustment">Audit Correction</SelectItem>
                        <SelectItem value="initial">Opening Stock</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="sale">Project Issue</SelectItem>
                        <SelectItem value="internal">Internal Consumption</SelectItem>
                        <SelectItem value="damage">Damage / Scrapped</SelectItem>
                        <SelectItem value="adjustment">Audit Correction</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Audit Notes</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                className="border-slate-200 min-h-[80px]"
                placeholder="Enter movement details for audit trail..."
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
              <Button variant="ghost" onClick={() => setIsStockTransactionDialogOpen(false)} className="text-slate-600">Cancel</Button>
              <Button onClick={handleStockTransaction} className="bg-primary hover:bg-primary text-white text-xs px-8" disabled={stockTransactionMutation.isPending}>
                {stockTransactionMutation.isPending ? "Recording..." : "Finalize Movement"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="max-w-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-xs text-slate-900">New Asset Registration</DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onAddProductSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Rotor Assembly" {...field} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated" {...field} className="border-slate-200 font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Spare Part">Spare Part</SelectItem>
                          <SelectItem value="Fabrication">Fabrication</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Mechanical Spares">Mechanical Spares</SelectItem>
                          <SelectItem value="Electrical Spares">Electrical Spares</SelectItem>
                          <SelectItem value="Consumable">Consumable</SelectItem>
                          <SelectItem value="Raw Material">Raw Material</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure</FormLabel>
                      <FormControl>
                        <Input placeholder="PCS, KGS, MTRS" {...field} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Alert Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Technical specifications or storage instructions..." {...field} className="border-slate-200 min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddProductDialogOpen(false)} className="text-slate-600">Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary text-white text-xs px-8" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? "Saving..." : "Register Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <StockDetailsModal 
        open={isDetailsModalOpen} 
        onOpenChange={setIsDetailsModalOpen} 
        product={viewProduct} 
      />
      
      <StockEditModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        product={editProduct} 
        onSave={(patch) => editMutation.mutate(patch)}
      />
    </div>
  );
}
