import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import {
  CalendarIcon, Download, TrendingUp, TrendingDown,
  Package, Clock, Users, CheckCircle, AlertCircle,
  FileText, BarChart3, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DashboardMetrics {
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  overdueShipments: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  totalRevenue: number;
  activeVendors: number;
}

interface DailyShipmentData {
  date: string;
  shipped: number;
  delivered: number;
  revenue: number;
}

interface VendorPerformance {
  vendorName: string;
  totalShipments: number;
  onTimeDeliveries: number;
  onTimeRate: number;
  averageDeliveryTime: number;
  rating: number;
}

interface VolumeMetrics {
  period: string;
  volume: number;
  growth: number;
}

interface PerformanceMetrics {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function LogisticsReports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Fetch dashboard metrics
  const { data: dashboardMetrics, isLoading: loadingDashboard } = useQuery<DashboardMetrics>({
    queryKey: ['/logistics/dashboard'],
  });

  // Create normalized metrics with safe defaults to prevent runtime errors
  const normalizedMetrics = dashboardMetrics ? {
    totalShipments: dashboardMetrics.totalShipments || 0,
    deliveredShipments: dashboardMetrics.deliveredShipments || 0,
    pendingShipments: dashboardMetrics.pendingShipments || 0,
    overdueShipments: dashboardMetrics.overdueShipments || 0,
    averageDeliveryTime: dashboardMetrics.averageDeliveryTime || 0,
    onTimeDeliveryRate: dashboardMetrics.onTimeDeliveryRate || 0,
    totalRevenue: dashboardMetrics.totalRevenue || 0,
    activeVendors: dashboardMetrics.activeVendors || 0,
  } : {
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    overdueShipments: 0,
    averageDeliveryTime: 0,
    onTimeDeliveryRate: 0,
    totalRevenue: 0,
    activeVendors: 0,
  };

  // Fetch daily shipments report
  const { data: dailyData, isLoading: loadingDaily } = useQuery<DailyShipmentData[]>({
    queryKey: ['/logistics/reports/daily', dateRange],
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Fetch vendor performance
  const { data: vendorPerformance, isLoading: loadingVendors } = useQuery<VendorPerformance[]>({
    queryKey: ['/logistics/reports/vendor-performance', dateRange],
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Fetch volume metrics
  const { data: volumeMetrics, isLoading: loadingVolume } = useQuery<VolumeMetrics[]>({
    queryKey: ['/logistics/reports/volume', dateRange],
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Fetch performance metrics
  const { data: performanceMetrics, isLoading: loadingPerformance } = useQuery<PerformanceMetrics[]>({
    queryKey: ['/logistics/reports/performance', dateRange],
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Normalize array data with safe defaults to prevent runtime errors
  const normalizedDailyData = (dailyData ?? []).map(item => ({
  date: item.date || '',
  shipped: Number(item.shipped) || 0,
  delivered: Number(item.delivered) || 0,
  revenue: Number(item.revenue) || 0,
}));

  const normalizedVendorPerformance = vendorPerformance?.map(vendor => ({
    vendorName: vendor.vendorName || 'Unknown Vendor',
    totalShipments: Number(vendor.totalShipments) || 0,
    onTimeDeliveries: Number(vendor.onTimeDeliveries) || 0,
    onTimeRate: Number(vendor.onTimeRate) || 0,
    averageDeliveryTime: Number(vendor.averageDeliveryTime) || 0,
    rating: Number(vendor.rating) || 0,
  })) || [];

 const normalizedVolumeMetrics = (volumeMetrics ?? []).map(item => ({
  period: item.period || '',
  volume: Number(item.volume) || 0,
  averagePerShipment: Number(item.averagePerShipment) || 0,
}));

 const normalizedPerformanceMetrics = (performanceMetrics ?? []).map(item => ({
  period: item.period || '',
  avgDeliveryTimeHours: Number(item.avgDeliveryTimeHours) || 0,
  onTimePercentage: Number(item.onTimePercentage) || 0,
}));

  const handleExportReport = async (reportType: string) => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || '',
        format: 'pdf'
      });

      const response = await fetch(`/logistics/reports/${reportType}/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `logistics-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Calculate status distribution for pie chart with safe numeric values
  const statusDistribution = [
    { name: 'Delivered', value: normalizedMetrics.deliveredShipments, color: '#00C49F' },
    { name: 'Pending', value: normalizedMetrics.pendingShipments, color: '#0088FE' },
    { name: 'Overdue', value: normalizedMetrics.overdueShipments, color: '#FF8042' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-reports">
            Logistics Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive delivery analytics and performance metrics
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
                data-testid="button-date-range"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange(range);
                  }
                }}
                numberOfMonths={2}
                data-testid="calendar-date-range"
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => handleExportReport('comprehensive')}
            variant="outline"
            data-testid="button-export-all"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {loadingDashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardMetrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="metric-total-shipments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Total Shipments</p>
                  <p className="text-2xl font-bold">{normalizedMetrics.totalShipments.toLocaleString()}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-delivered-shipments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{normalizedMetrics.deliveredShipments.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-pending-shipments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{normalizedMetrics.pendingShipments.toLocaleString()}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-overdue-shipments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{normalizedMetrics.overdueShipments.toLocaleString()}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-avg-delivery-time">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Avg. Delivery Time</p>
                  <p className="text-2xl font-bold">{normalizedMetrics.averageDeliveryTime.toFixed(1)} days</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-ontime-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">On-Time Rate</p>
                  <p className="text-2xl font-bold">{(normalizedMetrics.onTimeDeliveryRate * 100).toFixed(1)}%</p>
                  <Progress value={normalizedMetrics.onTimeDeliveryRate * 100} className="mt-2" />
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{(normalizedMetrics.totalRevenue ?? 0).toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-active-vendors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-muted-foreground">Active Vendors</p>
                  <p className="text-2xl font-bold">{normalizedMetrics.activeVendors}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">Vendors</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Shipments Chart */}
            <Card data-testid="chart-daily-shipments">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Daily Shipments</CardTitle>
                  <CardDescription>Shipped vs Delivered over time</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport('daily')}
                  data-testid="button-export-daily"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loadingDaily ? (
                  <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
                ) : normalizedDailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={normalizedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="shipped" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="delivered" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No data available for selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card data-testid="chart-status-distribution">
              <CardHeader>
                <CardTitle>Shipment Status Distribution</CardTitle>
                <CardDescription>Current status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDashboard ? (
                  <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
                ) : statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No status data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card data-testid="chart-volume-trends">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Volume Trends</CardTitle>
                <CardDescription>Shipment volume over time with growth indicators</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportReport('volume')}
                data-testid="button-export-volume"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingVolume ? (
                <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
              ) : normalizedVolumeMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={normalizedVolumeMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="volume" stroke="#0088FE" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No volume data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card data-testid="table-vendor-performance">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendor Performance</CardTitle>
                <CardDescription>Delivery performance by vendor</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportReport('vendor-performance')}
                data-testid="button-export-vendors"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingVendors ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : normalizedVendorPerformance.length > 0 ? (
                <div className="space-y-4">
                  {normalizedVendorPerformance.map((vendor, index) => (
                    <div key={index} className="border rounded-lg p-4" data-testid={`vendor-${index}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{vendor.vendorName}</h4>
                        <Badge variant={vendor.onTimeRate >= 0.9 ? "default" : vendor.onTimeRate >= 0.7 ? "secondary" : "destructive"}>
                          {(vendor.onTimeRate * 100).toFixed(1)}% On-Time
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-light">Total Shipments:</span> {vendor.totalShipments}
                        </div>
                        <div>
                          <span className="font-light">Avg. Delivery:</span> {vendor.averageDeliveryTime.toFixed(1)} days
                        </div>
                        <div>
                          <span className="font-light">Rating:</span> {vendor.rating.toFixed(1)}/5.0
                        </div>
                      </div>
                      <Progress value={vendor.onTimeRate * 100} className="mt-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No vendor performance data available for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card data-testid="table-performance-metrics">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators with trends</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportReport('performance')}
                data-testid="button-export-performance"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse flex justify-between items-center p-4 border rounded">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : normalizedPerformanceMetrics.length > 0 ? (
                <div className="space-y-4">
                  {normalizedPerformanceMetrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg" data-testid={`performance-${index}`}>
                      <div>
                        <h4 className="font-semibold">{metric.metric}</h4>
                        <p className="text-2xl font-bold">{(metric.current ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "flex items-center space-x-1",
                          metric.trend === 'up' ? "text-green-600" : metric.trend === 'down' ? "text-red-600" : "text-gray-600"
                        )}>
                          {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                            metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> :
                              <span className="h-4 w-4">→</span>}
                          <span className="font-light">{(metric.change ?? 0).toFixed(1) > 0 ? '+' : ''}{(metric.change ?? 0).toFixed(1)}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">vs previous period</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}