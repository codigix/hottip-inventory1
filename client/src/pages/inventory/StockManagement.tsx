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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export default function StockManagement() {
  const [isStockTransactionDialogOpen, setIsStockTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const [selectedProduct, setSelectedProduct] = useState('');
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
    setQuantity('');
    setReason('');
    setReferenceNumber('');
    setNotes('');
  };

  const handleStockTransaction = () => {
    if (!selectedProduct || !quantity || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      userId: 'current-user', // Default user for now - should be from auth context in production
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
      key: "product.name",
      header: "Product",
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
  const lowStockProducts = productsArray.filter((p: any) => p.stock <= p.lowStockThreshold).length;
  const totalValue = productsArray.reduce((sum: number, product: any) => {
    return sum + (parseFloat(product.price || 0) * (product.stock || 0));
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Stock Management</h1>
          <p className="text-muted-foreground">Manage stock in/out, track balances, and monitor low-stock alerts</p>
        </div>
        <StartTourButton tourConfig={inventoryStockManagementTour} tourName="inventory-stock-management" />
        <div className="flex items-center space-x-4">
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
                <div>
                  <Label htmlFor="product">Product</Label>
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
                    disabled={stockTransactionMutation.isPending}
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