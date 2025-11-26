import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  TrendingUp,
  Building2,
  BarChart3,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function InventoryReports() {
  // Fetch reports data
  const { data: stockBalance, isLoading: stockBalanceLoading } = useQuery({
    queryKey: ["/api/reports/stock-balance"],
  });

  const { data: vendorHistory, isLoading: vendorHistoryLoading } = useQuery({
    queryKey: ["/api/reports/vendor-history"],
  });

  const { data: reorderForecast, isLoading: reorderForecastLoading } = useQuery(
    {
      queryKey: ["/api/reports/reorder-forecast"],
    }
  );

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/reports/analytics"],
  });

  // Export functions
  const handleExportStockBalance = async () => {
    try {
      const response = await fetch("/api/reports/stock-balance/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stock-balance-report.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportVendorHistory = async () => {
    try {
      const response = await fetch("/api/reports/vendor-history/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vendor-history-report.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportReorderForecast = async () => {
    try {
      const response = await fetch("/api/reports/reorder-forecast/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reorder-forecast-report.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportAnalytics = async () => {
    try {
      const response = await fetch("/api/reports/analytics/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "analytics-report.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportAll = async () => {
    try {
      const response = await fetch("/api/reports/export-all", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "all-reports.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (
    stockBalanceLoading ||
    vendorHistoryLoading ||
    reorderForecastLoading ||
    analyticsLoading
  ) {
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
          <h1 className="text-3xl font-bold text-foreground mb-2" data-tour="inventory-reports-header">
            Inventory Reports
          </h1>
          <p className="text-muted-foreground">
            Comprehensive inventory analytics and reporting
          </p>
        </div>
        <Button
          onClick={handleExportAll}
          className="bg-primary hover:bg-primary/90"
        >
          <Download className="h-4 w-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">
                  {stockBalance?.summary?.totalProducts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ₹{stockBalance?.summary?.totalValue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">
                  {stockBalance?.summary?.lowStockItems || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">
                  {vendorHistory?.vendors?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="stock-balance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-tour="inventory-reports-tabs">
          <TabsTrigger value="stock-balance" data-tour="inventory-stock-balance-tab">Stock Balance</TabsTrigger>
          <TabsTrigger value="vendor-analysis" data-tour="inventory-vendor-history-tab">Vendor Analysis</TabsTrigger>
          <TabsTrigger value="reorder-forecast" data-tour="inventory-forecast-tab">Reorder Forecast</TabsTrigger>
          <TabsTrigger value="analytics" data-tour="inventory-analytics-tab">Analytics</TabsTrigger>
        </TabsList>

        {/* Stock Balance Report */}
        <TabsContent value="stock-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Current Stock Balance</span>
                </div>
                <Button
                  onClick={handleExportStockBalance}
                  size="sm"
                  variant="outline"
                  data-tour="inventory-export-stock-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockBalance?.data?.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                      <div>Product Name</div>
                      <div className="text-center">SKU</div>
                      <div className="text-center">Current Stock</div>
                      <div className="text-center">Unit Price</div>
                      <div className="text-center">Total Value</div>
                      <div className="text-center">Status</div>
                    </div>
                    {stockBalance.data.map((product: any, index: number) => (
                      <div
                        key={index}
                        className="grid grid-cols-6 gap-4 p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-light">{product.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {product.sku}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">{product.currentStock}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">₹{product.price}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">₹{product.value}</p>
                        </div>
                        <div className="text-center">
                          <Badge
                            variant={
                              product.status === "In Stock"
                                ? "default"
                                : product.status === "Low Stock"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No stock data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Analysis Report */}
        <TabsContent value="vendor-analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Vendor Performance Analysis</span>
                </div>
                <Button
                  onClick={handleExportVendorHistory}
                  size="sm"
                  variant="outline"
                  data-tour="inventory-export-vendor-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorHistory?.data?.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                      <div>Vendor Name</div>
                      <div className="text-center">Total Orders</div>
                      <div className="text-center">Total Value</div>
                      <div className="text-center">On-Time Delivery</div>
                      <div className="text-center">Quality Rating</div>
                      <div className="text-center">Performance</div>
                    </div>
                    {vendorHistory.data.map((vendor: any, index: number) => (
                      <div
                        key={index}
                        className="grid grid-cols-6 gap-4 p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-light">{vendor.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">{vendor.totalOrders}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">₹{vendor.totalValue}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">{vendor.onTimeDelivery}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">{vendor.qualityRating}</p>
                        </div>
                        <div className="text-center">
                          <Badge variant="default">Good</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No vendor data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reorder Forecast Report */}
        <TabsContent value="reorder-forecast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Reorder Forecast & Recommendations</span>
                </div>
                <Button
                  onClick={handleExportReorderForecast}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reorderForecast?.data?.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                      <div>Product Name</div>
                      <div className="text-center">Current Stock</div>
                      <div className="text-center">Minimum Level</div>
                      <div className="text-center">Suggested Order</div>
                      <div className="text-center">Days Until Stockout</div>
                      <div className="text-center">Priority</div>
                    </div>
                    {reorderForecast.data.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="grid grid-cols-6 gap-4 p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-light">{item.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">{item.currentStock}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">{item.lowStockThreshold}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">
                            {item.recommendedReorder}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-light">
                            {item.estimatedDaysToStockout}
                          </p>
                        </div>
                        <div className="text-center">
                          <Badge
                            variant={
                              item.urgency === "High"
                                ? "destructive"
                                : item.urgency === "Medium"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {item.urgency}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No reorder recommendations available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Report */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Inventory Analytics</span>
                </div>
                <Button
                  onClick={handleExportAnalytics}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Category Breakdown */}
                {analytics?.categoryBreakdown?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Category Breakdown</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                        <div>Category</div>
                        <div className="text-center">Products</div>
                        <div className="text-center">Total Value</div>
                        <div className="text-center">Percentage</div>
                      </div>
                      {analytics.categoryBreakdown.map(
                        (category: any, index: number) => (
                          <div
                            key={index}
                            className="grid grid-cols-4 gap-4 p-4 border rounded-lg"
                          >
                            <div>
                              <p className="font-light">{category.category}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-light">{category.items}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-light">₹{category.value}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-light">
                                {(
                                  (parseFloat(category.value) /
                                    analytics.totalInventoryValue) *
                                  100
                                ).toFixed(1)}
                                %
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Top Selling Products */}
                {analytics?.topSellingProducts?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Top Selling Products</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                        <div>Product Name</div>
                        <div className="text-center">Units Sold</div>
                        <div className="text-center">Revenue</div>
                        <div className="text-center">Growth</div>
                      </div>
                      {analytics.topSellingProducts.map(
                        (product: any, index: number) => (
                          <div
                            key={index}
                            className="grid grid-cols-4 gap-4 p-4 border rounded-lg"
                          >
                            <div>
                              <p className="font-light">{product.name}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-light">
                                {product.outboundQty}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="font-light">
                                ₹{(product.outboundQty * 100).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-center">
                              <Badge variant="default">+5%</Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
