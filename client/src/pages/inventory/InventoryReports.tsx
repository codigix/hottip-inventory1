import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  TrendingUp,
  Building2,
  Download,
  AlertTriangle,
  LayoutGrid,
  FileText,
  BarChart3,
  Calendar,
  History,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryReports() {
  // Fetch reports data
  const { data: stockBalance, isLoading: stockBalanceLoading } = useQuery({
    queryKey: ["/reports/stock-balance"],
  });

  const { data: vendorHistory, isLoading: vendorHistoryLoading } = useQuery({
    queryKey: ["/reports/vendor-history"],
  });

  const { data: reorderForecast, isLoading: reorderForecastLoading } = useQuery({
    queryKey: ["/reports/reorder-forecast"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/reports/analytics"],
  });

  const stockColumns = [
    {
      key: "name",
      header: "Product Details",
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-900">{row.name}</span>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{row.sku}</span>
        </div>
      )
    },
    {
      key: "currentStock",
      header: "Inventory",
      cell: (row: any) => <span className="font-semibold text-slate-700">{row.currentStock} Units</span>
    },
    {
      key: "value",
      header: "Valuation",
      cell: (row: any) => <span className="text-slate-900">₹{row.value?.toLocaleString()}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: (row: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal",
            row.status === 'In Stock' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            row.status === 'Low Stock' && "bg-red-50 text-red-700 border-red-200",
            row.status === 'Out of Stock' && "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {row.status}
        </Badge>
      )
    }
  ];

  const vendorColumns = [
    {
      key: "name",
      header: "Vendor Name",
      cell: (row: any) => <span className="text-xs text-slate-900">{row.name}</span>
    },
    {
      key: "totalOrders",
      header: "Orders",
      cell: (row: any) => <span className="text-slate-700">{row.totalOrders} Units</span>
    },
    {
      key: "totalValue",
      header: "Total Spend",
      cell: (row: any) => <span className="text-xs text-slate-900">₹{row.totalValue?.toLocaleString()}</span>
    },
    {
      key: "onTimeDelivery",
      header: "SLA / Performance",
      cell: (row: any) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">On-Time: {row.onTimeDelivery}%</span>
          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${row.onTimeDelivery}%` }} />
          </div>
        </div>
      )
    }
  ];

  const forecastColumns = [
    {
      key: "name",
      header: "Item Forecast",
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-900">{row.name}</span>
          <span className="text-xs text-slate-400">{row.sku}</span>
        </div>
      )
    },
    {
      key: "forecastedDemand",
      header: "Demand (Est.)",
      cell: (row: any) => <span className="text-slate-700 font-medium">{row.forecastedDemand} Units</span>
    },
    {
      key: "recommendedReorder",
      header: "Recommendation",
      cell: (row: any) => (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-normal">
          Reorder {row.recommendedReorder} units
        </Badge>
      )
    }
  ];

  const metrics = [
    { label: "Total Inventory Value", value: `₹${stockBalance?.summary?.totalValue?.toLocaleString() || '0'}`, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Active SKUs", value: stockBalance?.summary?.totalProducts || "0", icon: Package, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Critical Low Stock", value: stockBalance?.summary?.lowStockItems || "0", icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Vendor Compliance", value: "94.2%", icon: Building2, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Inventory Insights & Reports</h1>
          <p className="text-xs text-slate-500">Analytics dashboard for stock levels, vendor performance, and forecasting.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary hover:bg-primary text-white shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export Comprehensive Report
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
                <p className="text-xs font-medium text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="stock" className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-lg w-fit border border-slate-200">
          <TabsTrigger value="stock" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
            Stock Ledger
          </TabsTrigger>
          <TabsTrigger value="vendors" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <History className="h-4 w-4 mr-2 text-slate-400" />
            Vendor Analysis
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <TrendingUp className="h-4 w-4 mr-2 text-slate-400" />
            Demand Forecast
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <BarChart3 className="h-4 w-4 mr-2 text-slate-400" />
            Usage Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  Inventory Stock Balance
                </div>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                  <Download className="h-4 w-4 mr-2" />
                  Export Ledger
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable 
                columns={stockColumns} 
                data={stockBalance?.data || []} 
                loading={stockBalanceLoading}
                searchPlaceholder="Search product by name or SKU..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Supplier Performance Registry
                </div>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                  <Download className="h-4 w-4 mr-2" />
                  Export History
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable 
                columns={vendorColumns} 
                data={vendorHistory?.data || []} 
                loading={vendorHistoryLoading}
                searchPlaceholder="Search vendor..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  Predictive Reorder Analysis
                </div>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                  <Download className="h-4 w-4 mr-2" />
                  Export Forecast
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable 
                columns={forecastColumns} 
                data={reorderForecast?.data || []} 
                loading={reorderForecastLoading}
                searchPlaceholder="Search items..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-medium text-slate-800">Inventory Turn-over Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <span className="text-slate-400 text-sm">Consumption chart placeholder</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-medium text-slate-800">Category Valuation Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <span className="text-slate-400 text-sm">Category chart placeholder</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
