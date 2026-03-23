import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch, Route, Link } from "wouter";
import {
  Users,
  UserCheck,
  Package,
  Target,
  MapPin,
  ClipboardList,
  Calendar,
  Truck,
  TruckIcon,
  Box,
  Wrench,
  Factory,
  ListTodo,
  FileText,
  FolderInput,
  ShoppingCart,
  Receipt,
  DollarSign,
  CreditCard,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AccountsDashboard from "./AccountsDashboard";
import EmployeesDashboard from "./EmployeesDashboard";
import LogisticsDashboard from "./LogisticsDashboard";
import InventoryDashboard from "./InventoryDashboard";
import MarketingDashboard from "./MarketingDashboard";
import SalesDashboard from "./SalesDashboard";
import AuditLog from "./AuditLog";
import MasterSettings from "./MasterSettings";
import Approvals from "./Approvals";
import BackupRecovery from "./BackupRecovery";
import Reports from "./Reports";
import TaskConsole from "./TaskConsole";
import AdminLayout from "../components/AdminLayout";
import { StartTourButton } from "@/components/StartTourButton";
import { dashboardTour } from "@/components/tours/dashboardTour";

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Metric Card Component with gradient backgrounds and animations
function MetricCard({
  title,
  value,
  icon: Icon,
  gradientFrom,
  gradientTo,
  iconColor,
  delay = 0,
  trend,
  trendValue,
}: {
  title: string;
  value: number;
  icon: any;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  delay?: number;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ duration: 0.5, delay }}
    >
      <Card
        className={`relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm  text-white/80 mb-1">{title}</p>
              <p className="text-xl  text-white mb-2">{value}</p>
              {trend && trendValue && (
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={`w-3 h-3 ${
                      trend === "up" ? "text-white" : "text-white/60 rotate-180"
                    }`}
                  />
                  <span className="text-xs text-white/90">{trendValue}</span>
                </div>
              )}
            </div>
            <div
              className={`p-2 rounded ${iconColor} bg-white/20 backdrop-blur-sm`}
            >
              <Icon className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Icon className="w-24 h-24 transform translate-x-6 translate-y-6" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// DashboardContent: system overview with entity counts
function DashboardContent() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/admin/overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/admin/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/admin/dashboard/recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/recent-activity");
      if (!res.ok) throw new Error("Failed to fetch recent activity");
      return res.json();
    },
  });

  if (overviewLoading || metricsLoading || activityLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Prepare chart data
  const totalEntities =
    overview.users +
    overview.customers +
    overview.suppliers +
    overview.leads +
    overview.fieldVisits +
    overview.marketingTasks +
    overview.shipments +
    overview.products +
    overview.invoices +
    overview.receivables;

  // System activity percentage (simulated based on active entities)
  const systemActivity = Math.min(95, Math.floor((totalEntities / 1000) * 100));

  // Monthly trend data (last 6 months)
  const monthlyTrendData = [
    { month: "Jan", users: 45, activities: 120, revenue: 28000 },
    { month: "Feb", users: 52, activities: 145, revenue: 32000 },
    { month: "Mar", users: 61, activities: 165, revenue: 38000 },
    { month: "Apr", users: 70, activities: 190, revenue: 42000 },
    { month: "May", users: 85, activities: 210, revenue: 48000 },
    { month: "Jun", users: overview.users || 95, activities: 235, revenue: 55000 },
  ];

  // Department activity data for bar chart
  const departmentData = [
    {
      name: "Marketing",
      count: overview.leads + overview.fieldVisits,
      color: "#f97316",
    },
    {
      name: "Sales",
      count: overview.invoices + overview.outboundQuotations,
      color: "#10b981",
    },
    { name: "Logistics", count: overview.shipments, color: "#ef4444" },
    {
      name: "Inventory",
      count: overview.products + overview.spareParts,
      color: "#06b6d4",
    },
    {
      name: "Accounts",
      count: overview.receivables + overview.payables,
      color: "#8b5cf6",
    },
  ].sort((a, b) => b.count - a.count);

  // Donut chart data for system status
  const systemStatusData = [
    { name: "Active", value: systemActivity, color: "#6366f1" },
    { name: "Inactive", value: 100 - systemActivity, color: "#e5e7eb" },
  ];

  return (
    <div className="space-y-6" data-tour="admin-dashboard">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl  text-black" data-tour="welcome-header">
              Admin Overview
            </h1>
            <p className="text-gray-600 text-xs">
              Real-time insights across all departments
            </p>
          </div>
          <StartTourButton tourConfig={dashboardTour} tourName="admin-dashboard" />
        </div>
      </motion.div>

      {/* KPI Metrics from /api/admin/metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Receivables"
          value={metrics.totalReceivables}
          icon={DollarSign}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
          iconColor="text-green-500"
          delay={0.1}
          trend="up"
          trendValue="+15% vs last month"
        />
        <MetricCard
          title="Overdue Tasks"
          value={metrics.overdueTasks}
          icon={ListTodo}
          gradientFrom="from-red-500"
          gradientTo="to-rose-600"
          iconColor="text-red-500"
          delay={0.2}
          trend="down"
          trendValue="-2 this week"
        />
        <MetricCard
          title="Shipments In Transit"
          value={metrics.shipmentsInTransit}
          icon={Truck}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          iconColor="text-blue-500"
          delay={0.3}
          trend="up"
          trendValue="+5 active"
        />
        <MetricCard
          title="Stock Alerts"
          value={metrics.stockAlerts}
          icon={Package}
          gradientFrom="from-amber-500"
          gradientTo="to-orange-600"
          iconColor="text-amber-500"
          delay={0.4}
          trend="down"
          trendValue="Needs attention"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity Donut Chart */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.6, delay: 0.1 }}
          data-tour="system-activity"
        >
          <Card className="shadow-lg border-0 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm  text-gray-500 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={systemStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {systemStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-8">
                  <p className="text-4xl font-bold text-indigo-600">
                    {systemActivity}%
                  </p>
                  <p className="text-xs text-gray-500">Active Load</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Trend Line Chart */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
          data-tour="growth-trends"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm  text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorActivities"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                    animationDuration={2000}
                    name="Active Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke="#8b5cf6"
                    fill="url(#colorActivities)"
                    strokeWidth={2}
                    animationDuration={2000}
                    name="System Actions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Activity Bar Chart */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.6, delay: 0.3 }}
          data-tour="department-activity"
        >
          <Card className="shadow-lg border-0 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm  text-gray-500">
                Department Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={100}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    barSize={24}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-lg border-0 h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm  text-gray-500">
               Recent System Activity
              </CardTitle>
              <Link href="/admin/audit-log" className="text-xs text-indigo-600 hover:underline">
                View All Logs
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.map((activity: any, i: number) => (
                  <div key={activity.id || i} className="flex gap-4 items-start">
                    <div className={`p-2 rounded-full mt-1 ${
                      activity.type.includes('task') ? 'bg-amber-100 text-amber-600' :
                      activity.type === 'shipment' ? 'bg-blue-100 text-blue-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {activity.type.includes('task') ? <ListTodo className="w-3 h-3" /> :
                       activity.type === 'shipment' ? <Truck className="w-3 h-3" /> :
                       <Activity className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs  text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          activity.status === 'completed' || activity.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-sm  text-gray-400   mb-4 px-1">
          Entity Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={overview.users}
            icon={Users}
            gradientFrom="from-blue-500"
            gradientTo="to-blue-600"
            iconColor="text-blue-500"
            delay={0.1}
          />
          <MetricCard
            title="Total Customers"
            value={overview.customers}
            icon={UserCheck}
            gradientFrom="from-green-500"
            gradientTo="to-green-600"
            iconColor="text-green-500"
            delay={0.2}
          />
          <MetricCard
            title="Total Products"
            value={overview.products}
            icon={Box}
            gradientFrom="from-teal-500"
            gradientTo="to-cyan-600"
            iconColor="text-teal-500"
            delay={0.3}
          />
          <MetricCard
            title="Total Leads"
            value={overview.leads}
            icon={Target}
            gradientFrom="from-pink-500"
            gradientTo="to-rose-600"
            iconColor="text-pink-500"
            delay={0.4}
          />
        </div>
      </div>
    </div>
  );
}

function AllDepartmentsSummary() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["/admin/dashboard/module-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/module-summary");
      if (!res.ok) throw new Error("Failed to fetch module summary");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  const departments = [
    {
      name: "Inventory & Manufacturing",
      icon: Box,
      color: "green",
      data: summary.inventory,
      items: [
        { label: "Products", value: summary.inventory.breakdown.products },
        { label: "Spare Parts", value: summary.inventory.breakdown.spareParts },
        { label: "Fabrication Orders", value: summary.inventory.breakdown.fabricationOrders },
        { label: "Pending Tasks", value: summary.inventory.breakdown.inventoryTasks },
      ],
    },
    {
      name: "Sales & CRM",
      icon: TrendingUp,
      color: "emerald",
      data: summary.sales,
      items: [
        { label: "Total Invoices", value: summary.sales.breakdown.invoices },
        { label: "Outbound Quotes", value: summary.sales.breakdown.outboundQuotations },
        { label: "Inbound Quotes", value: summary.sales.breakdown.inboundQuotations },
        { label: "Purchase Orders", value: summary.sales.breakdown.purchaseOrders },
      ],
    },
    {
      name: "Accounts & Finance",
      icon: DollarSign,
      color: "indigo",
      data: summary.accounts,
      items: [
        { label: "Receivables", value: summary.accounts.breakdown.receivables },
        { label: "Payables", value: summary.accounts.breakdown.payables },
        { label: "GST Returns", value: summary.accounts.breakdown.gstReturns },
        { label: "Account Tasks", value: summary.accounts.breakdown.accountTasks },
      ],
    },
    {
      name: "Marketing",
      icon: Target,
      color: "orange",
      data: summary.marketing,
      items: [
        { label: "Total Leads", value: summary.usersAndContacts.breakdown.leads },
        { label: "Field Visits", value: summary.marketing.breakdown.fieldVisits },
        { label: "Marketing Tasks", value: summary.marketing.breakdown.tasks },
        { label: "Active Customers", value: summary.usersAndContacts.breakdown.customers },
      ],
    },
    {
      name: "Logistics",
      icon: Truck,
      color: "red",
      data: summary.logistics,
      items: [
        { label: "Shipments", value: summary.logistics.breakdown.shipments },
        { label: "Logistics Tasks", value: summary.logistics.breakdown.tasks },
        { label: "Leave Requests", value: summary.logistics.breakdown.leaveRequests },
      ],
    },
    {
      name: "Users & Staff",
      icon: Users,
      color: "blue",
      data: summary.usersAndContacts,
      items: [
        { label: "System Users", value: summary.usersAndContacts.breakdown.users },
        { label: "Suppliers", value: summary.usersAndContacts.breakdown.suppliers },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">All Departments Summary</h1>
        <p className="text-sm text-gray-500">Comprehensive overview of all operational modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <Card key={dept.name} className="overflow-hidden border-0 transition-shadow">
            <CardHeader className={`bg-${dept.color}-600 text-white p-2`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs  flex items-center gap-2">
                  <dept.icon className="w-5 h-5" />
                  {dept.name}
                </CardTitle>
                <span className="text-[10px] bg-white/20 p-1 rounded backdrop-blur-sm">
                  {dept.data.total} Total Entities
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              <div className="space-y-3">
                {dept.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className="text-xs  text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={DashboardContent} />
        <Route path="/admin/summary" component={AllDepartmentsSummary} />
        <Route path="/admin/accounts" component={AccountsDashboard} />
        <Route path="/admin/inventory" component={InventoryDashboard} />
        <Route path="/admin/logistics" component={LogisticsDashboard} />
        <Route path="/admin/marketing" component={MarketingDashboard} />
        <Route path="/admin/sales" component={SalesDashboard} />
        <Route path="/admin/employees" component={EmployeesDashboard} />
        <Route path="/admin/audit-log" component={AuditLog} />
        <Route path="/admin/settings" component={MasterSettings} />
        <Route path="/admin/approvals" component={Approvals} />
        <Route path="/admin/backup" component={BackupRecovery} />
        <Route path="/admin/reports" component={Reports} />
        <Route path="/admin/tasks" component={TaskConsole} />
        {/* Fallback: show dashboard content */}
        <Route>{DashboardContent}</Route>
      </Switch>
    </AdminLayout>
  );
}
