// Transaction Details Modal
function TransactionDetailsModal({ open, onOpenChange, transaction }: { open: boolean; onOpenChange: (v: boolean) => void; transaction: any }) {
  if (!transaction) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div><b>Type:</b> {transaction.type}</div>
          <div><b>Product ID:</b> {transaction.productId}</div>
          <div><b>Quantity:</b> {transaction.quantity}</div>
          <div><b>Reason:</b> {transaction.reason}</div>
          <div><b>Reference Number:</b> {transaction.referenceNumber}</div>
          <div><b>Notes:</b> {transaction.notes || '-'}</div>
          <div><b>Date:</b> {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '-'}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div><b>Name:</b> {product.name}</div>
          <div><b>SKU:</b> {product.sku}</div>
          <div><b>Category:</b> {product.category}</div>
          <div><b>Current Stock:</b> {product.stock} {product.unit}</div>
          <div><b>Low Stock Threshold:</b> {product.lowStockThreshold}</div>
          <div><b>Status:</b> {product.stock <= product.lowStockThreshold ? 'Low Stock' : 'In Stock'}</div>
          <div><b>Price:</b> ₹{product.price}</div>
          <div><b>Description:</b> {product.description || '-'}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stock Edit Modal
function StockEditModal({ open, onOpenChange, product, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; product: any, onSave: (patch: any) => void }) {
  const [form, setForm] = useState<any>(product || {});
  // Sync form with product when opening
  React.useEffect(() => { setForm(product || {}); }, [product, open]);
  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-tour="inventory-edit-name-input" />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={form.sku || ''} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} data-tour="inventory-edit-sku-input" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} data-tour="inventory-edit-category-input" />
          </div>
          <div>
            <Label>Current Stock</Label>
            <Input type="number" value={form.stock ?? ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} data-tour="inventory-edit-stock-input" />
          </div>
          <div>
            <Label>Low Stock Threshold</Label>
            <Input type="number" value={form.lowStockThreshold ?? ''} onChange={e => setForm(f => ({ ...f, lowStockThreshold: Number(e.target.value) }))} data-tour="inventory-edit-threshold-input" />
          </div>
          <div>
            <Label>Unit</Label>
            <Input value={form.unit || ''} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} data-tour="inventory-edit-unit-input" />
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" value={form.price ?? ''} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} data-tour="inventory-edit-price-input" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} data-tour="inventory-edit-description-textarea" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-tour="inventory-edit-cancel-button">Cancel</Button>
            <Button onClick={() => onSave(form)} data-tour="inventory-edit-save-button">Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StartTourButton } from "@/components/StartTourButton";
import { inventoryStockManagementTour } from "@/components/tours/dashboardTour";
import { Plus, Package, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StockManagement() {
  const [isStockTransactionDialogOpen, setIsStockTransactionDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  
  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      category: "",
      price: "",
      costPrice: "",
      stock: 0,
      lowStockThreshold: 10,
      unit: "pcs",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      return await apiRequest("POST", "/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/products"] });
      setIsAddProductDialogOpen(false);
      productForm.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const onAddProductSubmit = (data: ProductForm) => {
    createProductMutation.mutate(data);
  };
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPo, setSelectedPo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  // For stock details modal
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // For transaction details modal
  const [viewTransaction, setViewTransaction] = useState<any>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  // For stock edit modal
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (patch: any) => {
      if (!patch.id) throw new Error("Missing product id");
      return apiRequest('PUT', `/products/${patch.id}`, patch);
    },
    onSuccess: () => {
      toast({ title: "Product updated", description: "Stock details updated successfully" });
      setIsEditModalOpen(false);
      setEditProduct(null);
      queryClient.invalidateQueries({ queryKey: ["/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update product", variant: "destructive" });
    }
  });

  // Fetch products for stock management
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/products"],
  });

  // Fetch stock transactions
  const { data: stockTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/stock-transactions"],
  });

  // Fetch reorder points
  const { data: reorderPoints, isLoading: reorderLoading, refetch: refetchReorderPoints } = useQuery({
    queryKey: ["/reorder-points"],
  });

  // Fetch purchase orders for "Stock In"
  const { data: purchaseOrders } = useQuery({
    queryKey: ["/purchase-orders"],
    enabled: transactionType === 'in',
  });

  // Stock transaction mutation
  const stockTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/stock-transactions', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Stock ${transactionType === 'in' ? 'received' : 'issued'} successfully`,
      });
      setIsStockTransactionDialogOpen(false);
      resetForm();
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["/stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/products"] });
      queryClient.invalidateQueries({ queryKey: ["/reorder-points"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to record stock transaction",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedProduct('');
    setSelectedPo('');
    setQuantity('');
    setReason('');
    setReferenceNumber('');
    setNotes('');
  };

  const { user } = useAuth();

  const handleStockTransaction = () => {
    if (!selectedProduct || !quantity || !reason) {
      let missingField = "";
      if (!selectedProduct) missingField = "Product";
      else if (!quantity) missingField = "Quantity";
      else if (!reason) missingField = "Reason";
      
      toast({
        title: "Error",
        description: `Please fill in the ${missingField} field`,
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      userId: user?.id || null, 
      productId: selectedProduct,
      type: transactionType,
      quantity: parseInt(quantity),
      reason,
      referenceNumber: referenceNumber || `${transactionType.toUpperCase()}-${Date.now()}`,
      notes,
    };

    stockTransactionMutation.mutate(transactionData);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/products"] });
    queryClient.invalidateQueries({ queryKey: ["/stock-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/reorder-points"] });
    toast({
      title: "Refreshed",
      description: "Stock data has been refreshed",
    });
  };

  // Product columns for stock overview
  const productColumns = [
    {
      key: "name",
      header: "Product Name",
    },
    {
      key: "sku",
      header: "SKU",
    },
    {
      key: "stock",
      header: "Current Stock",
      cell: (product: any) => (
        <div className="flex items-center space-x-2">
          <span className="font-light">{product.stock}</span>
          <span className="text-muted-foreground text-xs">{product.unit}</span>
        </div>
      ),
    },
    {
      key: "lowStockThreshold",
      header: "Low Stock Alert",
      cell: (product: any) => product.lowStockThreshold,
    },
    {
      key: "status",
      header: "Status",
      cell: (product: any) => {
        const isLowStock = product.stock <= product.lowStockThreshold;
        return (
          <Badge variant={isLowStock ? "destructive" : "default"}>
            {isLowStock ? "Low Stock" : "In Stock"}
          </Badge>
        );
      },
    },
    {
      key: "category",
      header: "Category",
    }
  ];

  // Stock transaction columns
  const transactionColumns = [
    {
      key: "type",
      header: "Type",
      cell: (transaction: any) => (
        <Badge variant={transaction.type === 'in' ? 'default' : 'outline'}>
          {transaction.type === 'in' ? (
            <>
              <TrendingUp className="h-3 w-3 mr-1" />
              Stock In
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3 mr-1" />
              Stock Out
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "productName",
      header: "Product",
      cell: (transaction: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{transaction.productName || '-'}</span>
          {transaction.productSku && (
            <span className="text-xs text-muted-foreground">{transaction.productSku}</span>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
    },
    {
      key: "reason",
      header: "Reason",
      cell: (transaction: any) => (
        <span className="capitalize">{transaction.reason.replace('_', ' ')}</span>
      ),
    },
    {
      key: "referenceNumber",
      header: "Reference",
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (transaction: any) => new Date(transaction.createdAt).toLocaleDateString(),
    }
  ];

  // Calculate metrics
  const productsArray = Array.isArray(products) ? products : [];
  const stockTransactionsArray = Array.isArray(stockTransactions) ? stockTransactions : [];
  
  const totalProducts = productsArray.length;
  const lowStockProducts = productsArray.filter((p: any) => p.stock <= (p.lowStockThreshold || 0)).length;
  const totalValue = productsArray.reduce((sum: number, product: any) => {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
    const stock = typeof product.stock === 'string' ? parseInt(product.stock) : (product.stock || 0);
    return sum + (price * stock);
  }, 0);
  const totalTransactions = stockTransactionsArray.length;

  if (productsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8" data-tour="inventory-stock-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Stock Management</h1>
          <p className="text-muted-foreground">Manage stock in/out, track balances, and monitor low-stock alerts</p>
        </div>
        <StartTourButton tourConfig={inventoryStockManagementTour} tourName="inventory-stock-management" />
        <div className="flex items-center space-x-4">
          <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onAddProductSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={productForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
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
                          <FormLabel>Cost Price (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={productForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
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
                          <FormLabel>Low Stock Alert</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pcs">Pieces</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="meters">Meters</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isStockTransactionDialogOpen} onOpenChange={setIsStockTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-stock-in" data-tour="inventory-stock-in-button">
                <TrendingUp className="h-4 w-4 mr-2" />
                Stock In
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transaction-type">Transaction Type</Label>
                  <Select value={transactionType} onValueChange={setTransactionType as any}>
                    <SelectTrigger data-tour="inventory-transaction-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {transactionType === 'in' && (
                  <div>
                    <Label htmlFor="purchase-order">Reference Purchase Order (Optional)</Label>
                    <Select 
                      value={selectedPo} 
                      onValueChange={(val) => {
                        setSelectedPo(val);
                        const po = (purchaseOrders || []).find((p: any) => p.id === val);
                        if (po) {
                          setReferenceNumber(po.poNumber);
                          setReason('purchase');
                          // If PO has items, try to select the first item's product
                          if (po.items && po.items.length > 0) {
                            const firstItem = po.items[0];
                            if (firstItem.productId) {
                              setSelectedProduct(firstItem.productId);
                              setQuantity(firstItem.quantity.toString());
                            } else {
                              // If no productId, try to find product by name
                              const product = productsArray.find((p: any) => p.name === firstItem.itemName);
                              if (product) {
                                setSelectedProduct(product.id);
                                setQuantity(firstItem.quantity.toString());
                              }
                            }
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select PO to auto-fill..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Manual)</SelectItem>
                        {(purchaseOrders || []).map((po: any) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.poNumber} - {po.supplier?.name || 'Manual'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="product">Product *</Label>
                  {productsArray.length === 0 ? (
                    <div className="w-full p-3 border border-red-300 bg-red-50 rounded-md text-sm text-red-700">
                      <span className="font-semibold">No products available.</span> Please add a product first using the "Add Product" button.
                    </div>
                  ) : (
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger data-tour="inventory-product-select">
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {productsArray.map((product: any) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    data-testid="input-quantity"
                    data-tour="inventory-quantity-input"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger data-tour="inventory-reason-select">
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="PO/Invoice number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    data-tour="inventory-reference-input"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-tour="inventory-notes-textarea"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsStockTransactionDialogOpen(false)} data-tour="inventory-cancel-transaction-button">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStockTransaction}
                    disabled={stockTransactionMutation.isPending || productsArray.length === 0 || !selectedProduct || !quantity || !reason}
                    data-testid="button-save-transaction"
                    data-tour="inventory-save-transaction-button"
                  >
                    {stockTransactionMutation.isPending ? "Processing..." : "Record Transaction"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            onClick={() => {
              setTransactionType('out');
              setIsStockTransactionDialogOpen(true);
            }}
            data-testid="button-stock-out"
            data-tour="inventory-stock-out-button"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Stock Out
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            data-testid="button-refresh-stock"
            data-tour="inventory-refresh-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-foreground">{lowStockProducts}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Stock Value</p>
                <p className="text-2xl font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Transactions Today</p>
                <p className="text-2xl font-bold text-foreground">{totalTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Overview Table */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Stock Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={products || []}
              columns={productColumns}
              searchable={true}
              searchKey="name"
              onEdit={(product) => {
                setEditProduct(product);
                setIsEditModalOpen(true);
              }}
              onView={(product) => {
                setViewProduct(product);
                setIsDetailsModalOpen(true);
              }}
              actionsTourId="inventory-product-actions"
              viewTourId="inventory-product-view"
              editTourId="inventory-product-edit"
            />
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
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <>
                <DataTable
                  data={stockTransactions || []}
                  columns={transactionColumns}
                  searchable={false}
                  onView={(transaction) => {
                    setViewTransaction(transaction);
                    setIsTransactionModalOpen(true);
                  }}
                  actionsTourId="inventory-transaction-actions"
                  viewTourId="inventory-transaction-view"
                />
                <TransactionDetailsModal
                  open={isTransactionModalOpen}
                  onOpenChange={setIsTransactionModalOpen}
                  transaction={viewTransaction}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts > 0 && (
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              <span>Low Stock Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-4">
              {lowStockProducts} product(s) are running low on stock. Consider reordering soon.
            </p>
            <div className="space-y-2">
              {(products || [])
                .filter((p: any) => p.stock <= p.lowStockThreshold)
                .map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-white border border-orange-200"
                  >
                    <div>
                      <p className="font-light text-orange-900">{product.name}</p>
                      <p className="text-sm text-orange-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-light text-orange-900">
                        {product.stock} {product.unit}
                      </p>
                      <p className="text-xs text-orange-600">
                        Alert at: {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}