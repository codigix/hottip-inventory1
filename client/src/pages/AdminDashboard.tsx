import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch, Route } from "wouter";
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
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
              <p className="text-3xl font-bold text-white mb-2">{value}</p>
              {trend && trendValue && (
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      trend === "up" ? "text-white" : "text-white/60 rotate-180"
                    }`}
                  />
                  <span className="text-xs text-white/90">{trendValue}</span>
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-full ${iconColor} bg-white/20 backdrop-blur-sm`}
            >
              <Icon className="w-6 h-6 text-white" />
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            System-wide overview and entity counts
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(20)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            System-wide overview and entity counts
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">
            {error.message || "Failed to load overview."}
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const totalEntities =
    data.users +
    data.customers +
    data.suppliers +
    data.leads +
    data.fieldVisits +
    data.marketingTasks +
    data.shipments +
    data.products +
    data.invoices +
    data.receivables;

  // System activity percentage (simulated based on active entities)
  const systemActivity = Math.min(95, Math.floor((totalEntities / 1000) * 100));

  // Monthly trend data (last 6 months)
  const monthlyTrendData = [
    { month: "Jan", users: 45, activities: 120, revenue: 28000 },
    { month: "Feb", users: 52, activities: 145, revenue: 32000 },
    { month: "Mar", users: 61, activities: 165, revenue: 38000 },
    { month: "Apr", users: 70, activities: 190, revenue: 42000 },
    { month: "May", users: 85, activities: 210, revenue: 48000 },
    { month: "Jun", users: data.users || 95, activities: 235, revenue: 55000 },
  ];

  // Department activity data for bar chart
  const departmentData = [
    {
      name: "Marketing",
      count: data.leads + data.fieldVisits,
      color: "#f97316",
    },
    {
      name: "Sales",
      count: data.invoices + data.outboundQuotations,
      color: "#10b981",
    },
    { name: "Logistics", count: data.shipments, color: "#ef4444" },
    {
      name: "Inventory",
      count: data.products + data.spareParts,
      color: "#06b6d4",
    },
    {
      name: "Accounts",
      count: data.receivables + data.payables,
      color: "#8b5cf6",
    },
  ].sort((a, b) => b.count - a.count);

  // Donut chart data for system status
  const systemStatusData = [
    { name: "Active", value: systemActivity, color: "#6366f1" },
    { name: "Inactive", value: 100 - systemActivity, color: "#e5e7eb" },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Purple/Indigo Theme */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          System-wide overview with analytics and insights
        </p>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity Donut Chart */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={systemStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
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
              <div className="text-center -mt-4">
                <p className="text-3xl font-bold text-indigo-600">
                  {systemActivity}%
                </p>
                <p className="text-sm text-gray-600">Active Operations</p>
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
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Growth Trends
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
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                    animationDuration={2000}
                    name="Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke="#8b5cf6"
                    fill="url(#colorActivities)"
                    strokeWidth={2}
                    animationDuration={2000}
                    name="Activities"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Activity Bar Chart */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Department Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={departmentData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9ca3af"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  animationDuration={1500}
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

      {/* 👥 Users & Contacts */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span>👥</span> Users & Contacts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Users"
            value={data.users}
            icon={Users}
            gradientFrom="from-blue-500"
            gradientTo="to-blue-600"
            iconColor="text-blue-500"
            delay={0.1}
            trend="up"
            trendValue="+12%"
          />
          <MetricCard
            title="Customers"
            value={data.customers}
            icon={UserCheck}
            gradientFrom="from-green-500"
            gradientTo="to-green-600"
            iconColor="text-green-500"
            delay={0.2}
            trend="up"
            trendValue="+8%"
          />
          <MetricCard
            title="Suppliers"
            value={data.suppliers}
            icon={Package}
            gradientFrom="from-purple-500"
            gradientTo="to-purple-600"
            iconColor="text-purple-500"
            delay={0.3}
            trend="up"
            trendValue="+5%"
          />
          <MetricCard
            title="Leads"
            value={data.leads}
            icon={Target}
            gradientFrom="from-pink-500"
            gradientTo="to-pink-600"
            iconColor="text-pink-500"
            delay={0.4}
            trend="up"
            trendValue="+15%"
          />
        </div>
      </div>

      {/* 📢 Marketing */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span>📢</span> Marketing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Field Visits"
            value={data.fieldVisits}
            icon={MapPin}
            gradientFrom="from-pink-500"
            gradientTo="to-rose-600"
            iconColor="text-pink-500"
            delay={0.5}
            trend="up"
            trendValue="+22%"
          />
          <MetricCard
            title="Marketing Tasks"
            value={data.marketingTasks}
            icon={ClipboardList}
            gradientFrom="from-fuchsia-500"
            gradientTo="to-purple-600"
            iconColor="text-fuchsia-500"
            delay={0.6}
            trend="up"
            trendValue="+18%"
          />
          <MetricCard
            title="Leave Requests"
            value={data.leaveRequests}
            icon={Calendar}
            gradientFrom="from-orange-500"
            gradientTo="to-amber-600"
            iconColor="text-orange-500"
            delay={0.7}
            trend="down"
            trendValue="-3%"
          />
        </div>
      </div>

      {/* 🚚 Logistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span>🚚</span> Logistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="Shipments"
            value={data.shipments}
            icon={Truck}
            gradientFrom="from-indigo-500"
            gradientTo="to-blue-600"
            iconColor="text-indigo-500"
            delay={0.8}
            trend="up"
            trendValue="+14%"
          />
          <MetricCard
            title="Logistics Tasks"
            value={data.logisticsTasks}
            icon={TruckIcon}
            gradientFrom="from-violet-500"
            gradientTo="to-purple-600"
            iconColor="text-violet-500"
            delay={0.9}
            trend="up"
            trendValue="+9%"
          />
        </div>
      </div>

      {/* 📦 Inventory & Manufacturing */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span>📦</span> Inventory & Manufacturing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Products"
            value={data.products}
            icon={Box}
            gradientFrom="from-teal-500"
            gradientTo="to-cyan-600"
            iconColor="text-teal-500"
            delay={0.2}
            trend="up"
            trendValue="+7%"
          />
          <MetricCard
            title="Spare Parts"
            value={data.spareParts}
            icon={Wrench}
            gradientFrom="from-cyan-500"
            gradientTo="to-blue-600"
            iconColor="text-cyan-500"
            delay={0.3}
            trend="up"
            trendValue="+4%"
          />
          <MetricCard
            title="Fabrication Orders"
            value={data.fabricationOrders}
            icon={Factory}
            gradientFrom="from-sky-500"
            gradientTo="to-indigo-600"
            iconColor="text-sky-500"
            delay={0.4}
            trend="up"
            trendValue="+11%"
          />
          <MetricCard
            title="Inventory Tasks"
            value={data.inventoryTasks}
            icon={ListTodo}
            gradientFrom="from-emerald-500"
            gradientTo="to-green-600"
            iconColor="text-emerald-500"
            delay={0.5}
            trend="up"
            trendValue="+6%"
          />
        </div>
      </div>

      {/* 💰 Sales & Quotations */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span>💰</span> Sales & Quotations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Outbound Quotations"
            value={data.outboundQuotations}
            icon={FileText}
            gradientFrom="from-violet-500"
            gradientTo="to-purple-600"
            iconColor="text-violet-500"
            delay={0.2}
            trend="up"
            trendValue="+19%"
          />
          <MetricCard
            title="Inbound Quotations"
            value={data.inboundQuotations}
            icon={FolderInput}
            gradientFrom="from-purple-500"
            gradientTo="to-fuchsia-600"
            iconColor="text-purple-500"
            delay={0.3}
            trend="up"
            trendValue="+13%"
          />
          <MetricCard
            title="Purchase Orders"
            value={data.purchaseOrders}
            icon={ShoppingCart}
            gradientFrom="from-pink-500"
            gradientTo="to-rose-600"
            iconColor="text-pink-500"
            delay={0.4}
            trend="up"
            trendValue="+16%"
          />
          <MetricCard
            title="Invoices"
            value={data.invoices}
            icon={Receipt}
            gradientFrom="from-fuchsia-500"
            gradientTo="to-pink-600"
            iconColor="text-fuchsia-500"
            delay={0.5}
            trend="up"
            trendValue="+21%"
          />
        </div>
      </div>

      {/* 💵 Accounts & Finance */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span>💵</span> Accounts & Finance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Receivables"
            value={data.receivables}
            icon={DollarSign}
            gradientFrom="from-green-500"
            gradientTo="to-emerald-600"
            iconColor="text-green-500"
            delay={0.2}
            trend="up"
            trendValue="+10%"
          />
          <MetricCard
            title="Payables"
            value={data.payables}
            icon={CreditCard}
            gradientFrom="from-red-500"
            gradientTo="to-rose-600"
            iconColor="text-red-500"
            delay={0.3}
            trend="down"
            trendValue="-5%"
          />
          <MetricCard
            title="GST Returns"
            value={data.gstReturns}
            icon={FileSpreadsheet}
            gradientFrom="from-amber-500"
            gradientTo="to-orange-600"
            iconColor="text-amber-500"
            delay={0.4}
            trend="up"
            trendValue="+2%"
          />
          <MetricCard
            title="Account Tasks"
            value={data.accountTasks}
            icon={CheckCircle}
            gradientFrom="from-yellow-500"
            gradientTo="to-amber-600"
            iconColor="text-yellow-500"
            delay={0.5}
            trend="up"
            trendValue="+8%"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={DashboardContent} />
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
