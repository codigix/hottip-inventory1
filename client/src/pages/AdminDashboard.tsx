import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch, Route } from "wouter";
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-6 text-muted-foreground">System-wide overview and entity counts.</p>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600">{error.message || "Failed to load overview."}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.users}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Leads</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.leads}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Products</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.products}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Suppliers</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.suppliers}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Customers</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.customers}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Marketing Tasks</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.marketingTasks}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Logistics Tasks</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.logisticsTasks}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data.invoices}</CardContent>
          </Card>
        </div>
      )}
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
