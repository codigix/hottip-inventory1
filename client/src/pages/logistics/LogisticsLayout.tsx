import { useState } from "react";
import { useLocation, Link, Switch, Route } from "wouter";
import { 
  Truck, 
  Package, 
  MapPin, 
  FileText, 
  BarChart3,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartTourButton } from "@/components/StartTourButton";
import { logisticsFlowTour } from "@/components/tours/dashboardTour";
import { useTourNavigation } from "@/hooks/useTourNavigation";

// Import logistics pages
import LogisticsDashboard from "@/pages/LogisticsDashboard";
import ShipmentOrders from "./ShipmentOrders";
import ShipmentPlanning from "./ShipmentPlanning";
import LogisticsReports from "./Reports";
import ShipmentTracking from "./VendorTracking";
import DeliveryChallans from "./DeliveryChallans";

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/logistics',
    description: 'Overview and logistics metrics',
    tourConfig: null,
  },
  {
    id: 'shipment-orders',
    label: 'Shipment Orders',
    icon: Truck,
    path: '/logistics/shipment-orders',
    description: 'Customer shipment orders',
    tourConfig: null,
  },
  {
    id: 'shipment-planning',
    label: 'Shipment Planning',
    icon: Calendar,
    path: '/logistics/shipment-planning',
    description: 'Optimize and schedule routes',
    tourConfig: null,
  },
  {
    id: 'vendor-tracking',
    label: 'Shipment Tracking',
    icon: MapPin,
    path: '/logistics/shipment-tracking',
    description: 'Monitor vendor imports and customer deliveries',
    tourConfig: null,
  },
  {
    id: 'delivery-challans',
    label: 'Delivery Challans',
    icon: FileText,
    path: '/logistics/delivery-challans',
    description: 'View and download delivery challans',
    tourConfig: null,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/logistics/reports',
    description: 'Delivery analytics and performance',
    tourConfig: null,
  }
];

export default function LogisticsLayout() {
  const [location] = useLocation();
  const { navigationHandler } = useTourNavigation(sidebarItems);
  
  const tourConfigWithNavigation = {
    ...logisticsFlowTour,
    steps: logisticsFlowTour.steps.map((step) => {
      if (step.navigation) {
        // For the flow tour, navigation is already embedded in the tour config
        return step;
      }
      return step;
    }),
  };
  
  const getActiveSidebarItem = () => {
    if (location === '/logistics') return 'dashboard';
    if (location.includes('/shipment-orders')) return 'shipment-orders';
    if (location.includes('/shipment-planning')) return 'shipment-planning';
    if (location.includes('/shipment-tracking')) return 'vendor-tracking';
    if (location.includes('/delivery-challans')) return 'delivery-challans';
    if (location.includes('/reports')) return 'reports';
    return 'dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-2">
        {/* <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1 className="text-xl  text-foreground" data-tour="logistics-header">Logistics Dashboard</h1>
            <StartTourButton tourConfig={tourConfigWithNavigation} tourName="logistics-flow-tour" navigationHandler={navigationHandler} />
          </div>
          <p className="text-sm text-gray-500">
            Comprehensive logistics and shipment management system
          </p>
        </div> */}

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
                  className={`p-3 rounded-lg transition-all duration-200 cursor-pointer mb-1 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  data-tour={`logistics-${item.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="text-xs ">{item.label}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats Card */}
        <div className="mt-8 px-1">
          <Card className="bg-slate-50/50 border-slate-100 shadow-none">
            <CardHeader className="pb-3 px-3 pt-3">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                Logistics Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Active Shipments</span>
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-bold text-slate-900">45</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Deliveries Today</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-bold text-slate-900">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">On-Time Rate</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">92%</span>
                </div>
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
          <Route path="/logistics/shipment-orders">
            <ShipmentOrders />
          </Route>
          <Route path="/logistics/shipment-planning">
            <ShipmentPlanning />
          </Route>
          <Route path="/logistics/shipment-tracking">
            <ShipmentTracking />
          </Route>
          <Route path="/logistics/delivery-challans">
            <DeliveryChallans />
          </Route>
          <Route path="/logistics/reports">
            <LogisticsReports />
          </Route>
          <Route>
            <div className="p-4">
              <Card>
                <CardContent className="">
                  <h2 className="text-lg  mb-2">Page Not Found</h2>
                  <p className="text-gray-500">
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