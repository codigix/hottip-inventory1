import { useState } from "react";
import { useLocation, Link, Switch, Route } from "wouter";
import { 
  Users, 
  MapPin, 
  ClipboardList, 
  FileText, 
  Clock,
  BarChart3,
  TrendingUp,
  Target,
  PhoneCall,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import marketing pages
import MarketingDashboard from "@/pages/MarketingDashboard";
import Leads from "./Leads";
import FieldVisits from "./FieldVisits";
import MarketingTasks from "./MarketingTasks";
import Reports from "./Reports";
import MarketingAttendance from "./MarketingAttendance";

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/marketing',
    description: 'Overview and marketing metrics'
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    path: '/marketing/leads',
    description: 'Lead management and status workflow'
  },
  {
    id: 'field-visits',
    label: 'Field Visits',
    icon: MapPin,
    path: '/marketing/field-visits',
    description: 'Scheduling and geo-tracking'
  },
  {
    id: 'tasks',
    label: 'Marketing Tasks',
    icon: ClipboardList,
    path: '/marketing/tasks',
    description: 'Employee task assignment'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/marketing/reports',
    description: 'Conversion rates and analytics'
  },
  {
    id: 'attendance',
    label: 'Marketing Attendance',
    icon: Clock,
    path: '/marketing/attendance',
    description: 'Team attendance and leave tracking'
  }
];

export default function MarketingLayout() {
  const [location] = useLocation();
  
  const getActiveSidebarItem = () => {
    if (location === '/marketing') return 'dashboard';
    if (location.includes('/leads')) return 'leads';
    if (location.includes('/field-visits')) return 'field-visits';
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Marketing Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive marketing management system
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
                <Target className="h-4 w-4" />
                <span>Marketing Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Leads</span>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-light">127</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Field Visits Today</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-light">8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Conversion Rate</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-light">24%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending Tasks</span>
                <span className="text-xs font-light">12</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Switch>
          <Route path="/marketing">
            <MarketingDashboard />
          </Route>
          <Route path="/marketing/leads">
            <Leads />
          </Route>
          <Route path="/marketing/field-visits">
            <FieldVisits />
          </Route>
          <Route path="/marketing/tasks">
            <MarketingTasks />
          </Route>
          <Route path="/marketing/reports">
            <Reports />
          </Route>
          <Route path="/marketing/attendance">
            <MarketingAttendance />
          </Route>
          <Route>
            <div className="p-8">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground">
                    The requested marketing page could not be found.
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