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
  Calendar,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartTourButton } from "@/components/StartTourButton";
import { marketingFlowTour } from "@/components/tours/dashboardTour";
import { useTourNavigation } from "@/hooks/useTourNavigation";
import { useAuth } from "@/contexts/AuthContext";

// Import marketing pages
import MarketingDashboard from "@/pages/MarketingDashboard";
import Leads from "./Leads";
import LeadDetails from "./LeadDetails";
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
    description: 'Overview and marketing metrics',
    tourConfig: null,
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    path: '/marketing/leads',
    description: 'Lead management and status workflow',
    tourConfig: null,
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: MapPin,
    path: '/marketing/deals',
    description: 'Scheduling and geo-tracking',
    tourConfig: null,
  },
  {
    id: 'tasks',
    label: 'Marketing Tasks',
    icon: ClipboardList,
    path: '/marketing/tasks',
    description: 'Employee task assignment',
    tourConfig: null,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/marketing/reports',
    description: 'Conversion rates and analytics',
    tourConfig: null,
  },
  {
    id: 'attendance',
    label: 'Marketing Attendance',
    icon: Clock,
    path: '/marketing/attendance',
    description: 'Team attendance and leave tracking',
    tourConfig: null,
  }
];

export default function MarketingLayout() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const allSidebarItems = [
    ...sidebarItems,
    ...(user?.role === 'admin' ? [{
      id: 'admin',
      label: 'Admin Portal',
      icon: ShieldCheck,
      path: '/admin',
      description: 'System-wide administration',
      tourConfig: null,
    }] : [])
  ];

  const { navigationHandler } = useTourNavigation(allSidebarItems);
  
  const tourConfigWithNavigation = {
    ...marketingFlowTour,
    steps: marketingFlowTour.steps.map((step) => {
      if (step.navigation) {
        // For the flow tour, navigation is already embedded in the tour config
        return step;
      }
      return step;
    }),
  };
  
  const getActiveSidebarItem = () => {
    if (location === '/marketing') return 'dashboard';
    if (location.includes('/leads')) return 'leads';
    if (location.includes('/deals')) return 'deals';
    if (location.includes('/tasks')) return 'tasks';
    if (location.includes('/reports')) return 'reports';
    if (location.includes('/attendance')) return 'attendance';
    return 'dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-2">
        {/* <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1 className="text-xl  text-foreground" data-tour="marketing-header">Marketing Dashboard</h1>
            <StartTourButton tourConfig={tourConfigWithNavigation} tourName="marketing-flow-tour" navigationHandler={navigationHandler} />
          </div>
          <p className="text-sm text-gray-500">
            Comprehensive marketing management system
          </p>
        </div> */}

        <div className="space-y-2">
          {allSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = getActiveSidebarItem() === item.id;
            
            return (
              <Link
                key={item.id}
                href={item.path}
                data-testid={`sidebar-${item.id}`}
              >
                <div
                  className={`p-2 rounded transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                  data-tour={`marketing-${item.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="text-xs">{item.label}</div>
                      <div className={`text-xs ${
                        isActive ? 'text-primary-foreground/80' : 'text-gray-500'
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
                <span className="text-xs text-gray-500">Active Leads</span>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-light">127</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Deals Today</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-light">8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Conversion Rate</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-light">24%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Pending Tasks</span>
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
          <Route path="/marketing/leads/:id">
            <LeadDetails />
          </Route>
          <Route path="/marketing/deals">
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
            <div className="p-4">
              <Card>
                <CardContent className="">
                  <h2 className="text-lg  mb-2">Page Not Found</h2>
                  <p className="text-gray-500">
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