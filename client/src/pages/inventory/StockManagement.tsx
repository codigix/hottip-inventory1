import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Package, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";

export default function StockManagement() {
  const [isStockTransactionDialogOpen, setIsStockTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const { toast } = useToast();

  // Fetch products for stock management
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch stock transactions
  const { data: stockTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/stock-transactions"],
  });

  // Fetch reorder points
  const { data: reorderPoints, isLoading: reorderLoading } = useQuery({
    queryKey: ["/api/reorder-points"],
  });

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
          <span className="font-medium">{product.stock}</span>
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
  const totalProducts = (products || []).length;
  const lowStockProducts = (products || []).filter((p: any) => p.stock <= p.lowStockThreshold).length;
  const totalValue = (products || []).reduce((sum: number, product: any) => {
    return sum + (parseFloat(product.price) * product.stock);
  }, 0);
  const totalTransactions = (stockTransactions || []).length;

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
        <div className="flex items-center space-x-4">
          <Dialog open={isStockTransactionDialogOpen} onOpenChange={setIsStockTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-stock-in">
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
                    <SelectTrigger>
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(products || []).map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity..."
                    data-testid="input-quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    placeholder="PO number, invoice, etc..."
                    data-testid="input-reference"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    data-testid="textarea-notes"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsStockTransactionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-save-transaction">
                    Record Transaction
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" data-testid="button-stock-out">
            <TrendingDown className="h-4 w-4 mr-2" />
            Stock Out
          </Button>
          
          <Button variant="outline" data-testid="button-refresh-stock">
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
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
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
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
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
                <p className="text-sm font-medium text-muted-foreground">Transactions Today</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              onEdit={() => {}}
              onView={() => {}}
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
              <DataTable
                data={stockTransactions || []}
                columns={transactionColumns}
                searchable={false}
                onView={() => {}}
              />
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
                    className="flex items-center justify-between p-3 bg-white rounded-md border border-orange-200"
                  >
                    <div>
                      <p className="font-medium text-orange-900">{product.name}</p>
                      <p className="text-sm text-orange-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-900">
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