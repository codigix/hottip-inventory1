import { useState } from "react";
import { useLocation, Link, Switch, Route } from "wouter";
import { 
  Package, 
  TrendingUp, 
  ClipboardList, 
  FileText, 
  Truck,
  AlertTriangle,
  BarChart3,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartTourButton } from "@/components/StartTourButton";
import {
  inventoryTour,
  inventoryStockManagementTour,
  inventoryVendorManagementTour,
  inventoryReportsTour
} from "@/components/tours/dashboardTour";
import { useTourNavigation } from "@/hooks/useTourNavigation";

// Import inventory pages (will create these next)
import StockManagement from "./StockManagement";
import VendorManagement from "./VendorManagement";
import InventoryReports from "./InventoryReports";
import InventoryDashboard from "../InventoryDashboard";
import MaterialRequests from "./MaterialRequests";
import MaterialRequestDetail from "./MaterialRequestDetail";
import VendorQuotations from "./VendorQuotations";
import VendorPO from "./VendorPO";

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/inventory',
    description: 'Inventory overview and key metrics',
    tourConfig: null,
  },
  {
    id: 'material-requests',
    label: 'Material Requests',
    icon: ClipboardList,
    path: '/inventory/material-requests',
    description: 'Manage material and stock requests',
    tourConfig: null,
  },
  {
    id: 'vendor-quotations',
    label: 'Vendor Quotations',
    icon: FileText,
    path: '/inventory/vendor-quotations',
    description: 'Manage quotations from vendors',
    tourConfig: null,
  },
  {
    id: 'vendor-po',
    label: 'Vendor PO',
    icon: Truck,
    path: '/inventory/vendor-po',
    description: 'Manage purchase orders to vendors',
    tourConfig: null,
  },
  {
    id: 'stock-management',
    label: 'Stock Management',
    icon: Package,
    path: '/inventory/stock',
    description: 'Stock in/out, balances, low-stock alerts',
    tourConfig: inventoryStockManagementTour,
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: Building2,
    path: '/inventory/vendors',
    description: 'Vendor CRUD with communication history',
    tourConfig: inventoryVendorManagementTour,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/inventory/reports',
    description: 'Stock reports, vendor history, forecasts',
    tourConfig: inventoryReportsTour,
  }
];

export default function InventoryLayout() {
  const [location] = useLocation();
  const { navigationHandler } = useTourNavigation(sidebarItems);
  
  const tourConfigWithNavigation = {
    ...inventoryTour,
    steps: inventoryTour.steps.map((step) => {
      if (step.navigation) {
        // For the inventory tour, navigation is already embedded in the tour config
        return step;
      }
      return step;
    }),
  };
  
  const getActiveSidebarItem = () => {
    if (location === '/inventory') return 'dashboard';
    if (location.includes('/material-requests')) return 'material-requests';
    if (location.includes('/vendor-quotations')) return 'vendor-quotations';
    if (location.includes('/vendor-po')) return 'vendor-po';
    if (location.includes('/stock')) return 'stock-management';
    if (location.includes('/vendors')) return 'vendors';
    if (location.includes('/reports')) return 'reports';
    return 'dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground" data-tour="inventory-header">Inventory Dashboard</h1>
            <StartTourButton tourConfig={tourConfigWithNavigation} tourName="inventory-module" navigationHandler={navigationHandler} />
          </div>
          <p className="text-sm text-muted-foreground">
            Comprehensive inventory management system
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
                  data-tour={`inventory-${item.id}`}
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
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Low Stock Items</span>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-light">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending Tasks</span>
                <span className="text-xs font-light">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Vendors</span>
                <span className="text-xs font-light">24</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Switch>
          <Route path="/inventory">
            <InventoryDashboard />
          </Route>
          <Route path="/inventory/material-requests">
            <MaterialRequests />
          </Route>
          <Route path="/inventory/material-requests/:id">
            <MaterialRequestDetail />
          </Route>
          <Route path="/inventory/vendor-quotations">
            <VendorQuotations />
          </Route>
          <Route path="/inventory/vendor-po">
            <VendorPO />
          </Route>
          <Route path="/inventory/stock">
            <StockManagement />
          </Route>
          <Route path="/inventory/vendors">
            <VendorManagement />
          </Route>
          <Route path="/inventory/reports">
            <InventoryReports />
          </Route>
          <Route>
            <div className="p-8">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground">
                    The requested inventory page could not be found.
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