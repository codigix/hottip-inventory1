import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
  TrendingUp,
  Package,
  UserPlus,
  Calculator,
  Truck,
  BarChart3,
  Plus,
  FileText,
  Settings,
  ArrowUp,
  Clock,
  Info,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  if (metricsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const orderColumns = [
    {
      key: "orderNumber",
      header: "Order ID",
    },
    {
      key: "customer.name",
      header: "Customer",
    },
    {
      key: "totalAmount",
      header: "Amount",
      cell: (order: any) => `$${parseFloat(order.totalAmount).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (order: any) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          processing: "bg-blue-100 text-blue-800",
          shipped: "bg-purple-100 text-purple-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        
        return (
          <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {order.status}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (order: any) => new Date(order.createdAt).toLocaleDateString(),
    },
  ];

  const handleViewOrder = (order: any) => {
    console.log("View order:", order);
  };

  const handleEditOrder = (order: any) => {
    console.log("Edit order:", order);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business operations</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  ${metrics?.totalRevenue ? parseFloat(metrics.totalRevenue.toString()).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.activeOrders || 0}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +8.2% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.lowStockItems || 0}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.totalEmployees || 0}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Plus className="h-3 w-3 mr-1" />
                  3 new this month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && Array.isArray(activities) && activities.length > 0 ? (
                <div className="space-y-4">
                  {(activities || []).map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Info className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.details}
                          {activity.user && (
                            <span className="font-light">
                              {' '}by {activity.user.firstName} {activity.user.lastName}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent activities</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Create new order")}
                data-testid="button-create-order"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Order
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Add product")}
                data-testid="button-add-product"
              >
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Generate report")}
                data-testid="button-generate-report"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Manage users")}
                data-testid="button-manage-users"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(metrics?.lowStockItems || 0) > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-foreground">Low Stock Alert</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics?.lowStockItems || 0} products are running low on stock
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-sm">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-foreground">System Update</p>
                  <p className="text-xs text-muted-foreground">New features available in v2.1.0</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-foreground">Pending Approvals</p>
                  <p className="text-xs text-muted-foreground">5 expense reports need approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Sales</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">92%</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Inventory</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">87%</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Logistics</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">94%</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calculator className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Accounts</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">89%</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="outline" size="sm" data-testid="button-view-all-orders">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <DataTable
                data={(orders || []).slice(0, 10)}
                columns={orderColumns}
                onView={handleViewOrder}
                onEdit={handleEditOrder}
                searchable={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
