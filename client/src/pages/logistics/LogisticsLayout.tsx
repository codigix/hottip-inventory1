import { useState } from "react";
import { useLocation, Link, Switch, Route } from "wouter";
import { 
  Truck, 
  Package, 
  MapPin, 
  ClipboardList, 
  FileText, 
  Clock,
  BarChart3,
  Route as RouteIcon,
  Activity,
  Calendar,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import logistics pages
import LogisticsDashboard from "@/pages/LogisticsDashboard";
import Shipments from "./Shipments";
import LogisticsReports from "./Reports";
import LogisticsTasks from "./Tasks";
import LogisticsAttendance from "./Attendance";

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/logistics',
    description: 'Overview and logistics metrics'
  },
  {
    id: 'shipments',
    label: 'Shipments',
    icon: Package,
    path: '/logistics/shipments',
    description: 'Shipment management and tracking'
  },
  {
    id: 'status-workflow',
    label: 'Status Workflow',
    icon: RouteIcon,
    path: '/logistics/status-workflow',
    description: 'Status updates and POD management'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/logistics/reports',
    description: 'Delivery analytics and performance'
  },
  {
    id: 'tasks',
    label: 'Logistics Tasks',
    icon: ClipboardList,
    path: '/logistics/tasks',
    description: 'Employee task assignment'
  },
  {
    id: 'attendance',
    label: 'Logistics Attendance',
    icon: Clock,
    path: '/logistics/attendance',
    description: 'Team attendance and GPS tracking'
  }
];

export default function LogisticsLayout() {
  const [location] = useLocation();
  
  const getActiveSidebarItem = () => {
    if (location === '/logistics') return 'dashboard';
    if (location.includes('/shipments')) return 'shipments';
    if (location.includes('/status-workflow')) return 'status-workflow';
    if (location.includes('/reports')) return 'reports';
    if (location.includes('/tasks')) return 'tasks';
    if (location.includes('/attendance')) return 'attendance';
    return 'dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Logistics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive logistics and shipment management system
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
                  className={`p-4 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {item.description}
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
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Logistics Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Shipments</span>
                <div className="flex items-center space-x-1">
                  <Package className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium">45</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Deliveries Today</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-medium">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">On-Time Rate</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-medium">92%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending Tasks</span>
                <span className="text-xs font-medium">8</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Switch>
          <Route path="/logistics">
            <LogisticsDashboard />
          </Route>
          <Route path="/logistics/shipments">
            <Shipments />
          </Route>
          <Route path="/logistics/status-workflow">
            <div className="p-8">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-2">Status Workflow</h2>
                  <p className="text-muted-foreground">
                    Status workflow management functionality will be implemented in upcoming tasks.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Route>
          <Route path="/logistics/reports">
            <LogisticsReports />
          </Route>
          <Route path="/logistics/tasks">
            <LogisticsTasks />
          </Route>
          <Route path="/logistics/attendance">
            <LogisticsAttendance />
          </Route>
          <Route>
            <div className="p-8">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground">
                    The requested logistics page could not be found.
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