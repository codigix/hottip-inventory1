import { useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { useTour } from "@/hooks/useTour";
import { useTourStatus } from "@/contexts/TourContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { 
  FileText, 
  FileDown, 
  Receipt, 
  Users, 
  Building2, 
  BarChart3,
  Plus,
  Search,
  Filter,
  ShoppingCart
} from "lucide-react";
import { StartTourButton } from "@/components/StartTourButton";
import {
  salesFlowTour,
  comprehensiveOutboundQuotationsTour,
  comprehensiveInboundQuotationsTour,
  salesInvoiceManagementTour,
  salesClientManagementTour,
  salesVendorManagementTour,
  salesReportsTour
} from "@/components/tours/dashboardTour";
import { useTourNavigation } from "@/hooks/useTourNavigation";

// Import individual pages (will create these next)
import OutboundQuotations from "./OutboundQuotations";
import InboundQuotations from "./InboundQuotations";
import PurchaseOrders from "./PurchaseOrders";
import SalesOrders from "./SalesOrders";
import InvoiceManagement from "./InvoiceManagement";
import ClientManagement from "./ClientManagement";
import VendorManagement from "./VendorManagement";
import SalesReports from "./SalesReports";
import SalesDashboard from "./SalesDashboard";

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/sales',
    description: 'Sales overview and metrics',
    tourConfig: null,
  },
  {
    id: 'outbound-quotations',
    label: 'Outbound Quotations',
    icon: FileText,
    path: '/sales/outbound-quotations',
    description: 'Company → Client quotations',
    tourConfig: comprehensiveOutboundQuotationsTour,
  },
  {
    id: 'inbound-quotations', 
    label: 'Inbound Quotations',
    icon: FileDown,
    path: '/sales/inbound-quotations',
    description: 'Client/Vendor → Company quotations',
    tourConfig: comprehensiveInboundQuotationsTour,
  },
  {
    id: 'purchase-orders',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    path: '/sales/purchase-orders',
    description: 'Manage purchase orders to vendors'
  },
  {
    id: 'sales-orders',
    label: 'Sales Orders',
    icon: FileText,
    path: '/sales/orders',
    description: 'Manage confirmed sales orders'
  },
  {
    id: 'invoices',
    label: 'Invoice Management',
    icon: Receipt,
    path: '/sales/invoices',
    description: 'GST invoices and billing',
    tourConfig: salesInvoiceManagementTour,
  },
  {
    id: 'clients',
    label: 'Client Database',
    icon: Users,
    path: '/sales/clients', 
    description: 'Customer management and history',
    tourConfig: salesClientManagementTour,
  },
  {
    id: 'vendors',
    label: 'Vendor Database',
    icon: Building2,
    path: '/sales/vendors',
    description: 'Supplier management and history',
    tourConfig: salesVendorManagementTour,
  },
  {
    id: 'reports',
    label: 'Sales Reports',
    icon: BarChart3,
    path: '/sales/reports',
    description: 'Analytics and export options',
    tourConfig: salesReportsTour,
  }
];

export default function SalesLayout() {
  const [location] = useLocation();
  const { navigationHandler } = useTourNavigation(sidebarItems);
  const { startTour } = useTour();
  const { getPendingNavigationTour, clearPendingNavigationTour } = useTourStatus();
  
  useEffect(() => {
    const pendingTour = getPendingNavigationTour();
    if (pendingTour && location === pendingTour.path) {
      setTimeout(() => {
        clearPendingNavigationTour();
        if (pendingTour.config) {
          startTour(pendingTour.config);
        }
      }, 300);
    }
  }, [location, getPendingNavigationTour, clearPendingNavigationTour, startTour]);

  
  const tourConfigWithNavigation = {
    ...salesFlowTour,
    steps: salesFlowTour.steps.map((step: any) => {
      if (step.navigation) {
        // For the flow tour, navigation is already embedded in the tour config
        return step;
      }
      return step;
    }),
  };
  
  const getActiveSidebarItem = () => {
    if (location === '/sales') return 'dashboard';
    if (location.includes('/outbound-quotations')) return 'outbound-quotations';
    if (location.includes('/inbound-quotations')) return 'inbound-quotations';
    if (location.includes('/purchase-orders')) return 'purchase-orders';
    if (location.includes('/orders')) return 'sales-orders';
    if (location.includes('/invoices')) return 'invoices';
    if (location.includes('/clients')) return 'clients';
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
            <h1 className="text-2xl font-bold text-foreground" data-tour="sales-header">Sales Dashboard</h1>
            <StartTourButton tourConfig={tourConfigWithNavigation} tourName="sales-flow-tour" navigationHandler={navigationHandler} />
          </div>
          <p className="text-sm text-muted-foreground">
            Comprehensive quotation and invoice management
          </p>
        </div>

        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.path}
                data-testid={`sidebar-${item.id}`}
                className={`
                  flex items-start space-x-3 p-4 rounded-[0.3rem] transition-colors cursor-pointer
                  ${getActiveSidebarItem() === item.id
                    ? 'bg-primary/10 border border-primary/20 text-primary'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div
                  data-tour={`sales-${item.id}`}
                >
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.875rem] leading-5">
                      {item.label}
                    </div>
                    {/* <div className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </div> */}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Separator className="my-6" />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h3>
          <Button size="sm" className="w-full justify-start" data-testid="button-new-quotation">
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-search-all">
            <Search className="h-4 w-4 mr-2" />
            Search All
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-filter-pending">
            <Filter className="h-4 w-4 mr-2" />
            Pending Items
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/sales" component={SalesDashboard} />
          <Route path="/sales/outbound-quotations" component={OutboundQuotations} />
          <Route path="/sales/inbound-quotations" component={InboundQuotations} />
          <Route path="/sales/purchase-orders" component={PurchaseOrders} />
          <Route path="/sales/orders" component={SalesOrders} />
          <Route path="/sales/invoices" component={InvoiceManagement} />
          <Route path="/sales/clients" component={ClientManagement} />
          <Route path="/sales/vendors" component={VendorManagement} />
          <Route path="/sales/reports" component={SalesReports} />
          <Route>
            <div className="p-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground">
                    The requested sales page could not be found.
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
