import { useState } from "react";
import { useLocation, Link, Switch, Route } from "wouter";
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Calculator, 
  Landmark, 
  Bell, 
  ClipboardList, 
  FileText, 
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import accounts pages (will create these next)
import AccountsDashboard from "../AccountsDashboard";
import AccountsReceivables from "./AccountsReceivables";
import AccountsPayables from "./AccountsPayables";
import TaxGst from "./TaxGst";
import BankManagement from "./BankManagement";
import AccountsReminders from "./AccountsReminders";
import AccountsTasks from "./AccountsTasks";
import AccountsReports from "./AccountsReports";
import AccountsAttendance from "./AccountsAttendance";

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/accounts',
    description: 'Accounts overview and financial metrics'
  },
  {
    id: 'receivables',
    label: 'Receivables',
    icon: DollarSign,
    path: '/accounts/receivables',
    description: 'Client payments linked to invoices'
  },
  {
    id: 'payables',
    label: 'Payables',
    icon: CreditCard,
    path: '/accounts/payables',
    description: 'Vendor payments linked to POs/quotations'
  },
  {
    id: 'tax-gst',
    label: 'Tax & GST',
    icon: Calculator,
    path: '/accounts/tax-gst',
    description: 'Tax tracking and GST reconciliation'
  },
  {
    id: 'bank-management',
    label: 'Bank Management',
    icon: Landmark,
    path: '/accounts/bank-management',
    description: 'Bank account details and transactions'
  },
  {
    id: 'reminders',
    label: 'Reminders',
    icon: Bell,
    path: '/accounts/reminders',
    description: 'Automated due/overdue payment alerts'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ClipboardList,
    path: '/accounts/tasks',
    description: 'Assign tasks to accounts staff'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/accounts/reports',
    description: 'Daily collections, receivables, payables, GST exports'
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Clock,
    path: '/accounts/attendance',
    description: 'Accounts team attendance tracking'
  }
];

export default function AccountsLayout() {
  const [location] = useLocation();
  
  const getActiveSidebarItem = () => {
    if (location === '/accounts') return 'dashboard';
    if (location.includes('/receivables')) return 'receivables';
    if (location.includes('/payables')) return 'payables';
    if (location.includes('/tax-gst')) return 'tax-gst';
    if (location.includes('/bank-management')) return 'bank-management';
    if (location.includes('/reminders')) return 'reminders';
    if (location.includes('/tasks')) return 'tasks';
    if (location.includes('/reports')) return 'reports';
    if (location.includes('/attendance')) return 'attendance';
    return 'dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accounts Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive financial management system
          </p>
        </div>

        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = getActiveSidebarItem() === item.id;
            
            return (
              <Link
                key={item.id}
                href={item.path}
                data-testid={`sidebar-${item.id}`}
              >
                <div
                  className={`p-4 rounded-[0.3rem] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="text-[0.875rem]">{item.label}</div>
                      <div className={`text-xs ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {/* {item.description} */}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats Card */}
        <div className="mt-8">
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-light flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Financial Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overdue Receivables</span>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-light">₹8.5L</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending Payables</span>
                <span className="text-xs font-light">₹12.3L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">GST Filed</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-light">Current</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Reminders</span>
                <span className="text-xs font-light">15</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Switch>
          <Route path="/accounts">
            <AccountsDashboard />
          </Route>
          <Route path="/accounts/receivables">
            <AccountsReceivables />
          </Route>
          <Route path="/accounts/payables">
            <AccountsPayables />
          </Route>
          <Route path="/accounts/tax-gst">
            <TaxGst />
          </Route>
          <Route path="/accounts/bank-management">
            <BankManagement />
          </Route>
          <Route path="/accounts/reminders">
            <AccountsReminders />
          </Route>
          <Route path="/accounts/tasks">
            <AccountsTasks />
          </Route>
          <Route path="/accounts/reports">
            <AccountsReports />
          </Route>
          <Route path="/accounts/attendance">
            <AccountsAttendance />
          </Route>
          <Route>
            <div className="p-8">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground">
                    The requested accounts page could not be found.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Route>
        </Switch>
      </div>
    </div>
  );
}