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
  ShoppingCart,
  UserPlus,
  ShieldAlert
} from "lucide-react";
import { StartTourButton } from "@/components/StartTourButton";
import { useAuth } from "@/contexts/AuthContext";
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
import QuotationsPage from "./QuotationsPage";
import QuotationFormPage from "./QuotationFormPage";
import PurchaseOrders from "./PurchaseOrders";
import SalesOrders from "./SalesOrders";
import InvoiceManagement from "./InvoiceManagement";
import CreateInvoice from "./CreateInvoice";
import InvoiceDetails from "./InvoiceDetails";
import ClientManagement from "./ClientManagement";
import VendorManagement from "./VendorManagement";
import SalesReports from "./SalesReports";
import SalesDashboard from "./SalesDashboard";
import LeadReceived from "./LeadReceived";

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
    id: 'leads',
    label: 'Lead Received',
    icon: UserPlus,
    path: '/sales/leads',
    description: 'Lead management workflow',
    tourConfig: null,
  },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: FileText,
    path: '/sales/quotations',
    description: 'Sent & Received quotations',
    tourConfig: comprehensiveOutboundQuotationsTour,
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
  const { user } = useAuth();
  
  const allSidebarItems = [
    ...sidebarItems,
    ...(user?.role === 'admin' ? [{
      id: 'admin',
      label: 'Admin Portal',
      icon: ShieldAlert,
      path: '/admin',
      description: 'System-wide administration'
    }] : [])
  ];

  const { navigationHandler } = useTourNavigation(allSidebarItems);
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
    if (location.includes('/leads')) return 'leads';
    if (location.includes('/quotations')) return 'quotations';
    if (location.includes('/outbound-quotations')) return 'quotations';
    if (location.includes('/inbound-quotations')) return 'quotations';
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
      <div className="w-64 bg-card border-r border-border p-2">
        {/* <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1 className="text-xl  text-slate-800" data-tour="sales-header">Sales Dashboard</h1>
            <StartTourButton tourConfig={tourConfigWithNavigation} tourName="sales-flow-tour" navigationHandler={navigationHandler} />
          </div>
          <p className="text-xs text-slate-500">
            Lead received, quotation and invoice management
          </p>
        </div> */}

        <div className="space-y-2 grid gap-1.5">
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
                  className={`p-2 rounded transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white '
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  data-tour={`sales-${item.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <div className="text-xs ">{item.label}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Separator className="my-6 bg-slate-200" />

        {/* Quick Actions */}
        <div className="space-y-2 p-2">
          <h3 className="text-xs mb-2 text-slate-400 ">
            Quick Actions
          </h3>
          <Link href="/sales/outbound-quotations/new">
            <Button size="sm" className="w-full justify-start bg-primary hover:bg-primary text-white border-none" data-testid="button-new-quotation">
              <Plus className="h-4 w-4 mr-2 " />
              New Quotation
            </Button>
          </Link>
          <Link href="/sales/invoices/new">
            <Button size="sm" className="w-full mt-2 justify-start bg-primary hover:bg-primary text-white border-none" data-testid="button-new-invoice-quick">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
          <Button size="sm" variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100" data-testid="button-search-all">
            <Search className="h-4 w-4 mr-2" />
            Search All
          </Button>
          <Button size="sm" variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100" data-testid="button-filter-pending">
            <Filter className="h-4 w-4 mr-2" />
            Pending Items
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/sales" component={SalesDashboard} />
          <Route path="/sales/leads" component={LeadReceived} />
          <Route path="/sales/quotations" component={QuotationsPage} />
          <Route path="/sales/outbound-quotations" component={QuotationsPage} />
          <Route path="/sales/outbound-quotations/new" component={QuotationFormPage} />
          <Route path="/sales/outbound-quotations/edit/:id" component={QuotationFormPage} />
          <Route path="/sales/inbound-quotations" component={QuotationsPage} />
          <Route path="/sales/purchase-orders" component={PurchaseOrders} />
          <Route path="/sales/orders" component={SalesOrders} />
          <Route path="/sales/invoices" component={InvoiceManagement} />
          <Route path="/sales/invoices/new" component={CreateInvoice} />
          <Route path="/sales/invoices/:id" component={InvoiceDetails} />
          <Route path="/sales/clients" component={ClientManagement} />
          <Route path="/sales/vendors" component={VendorManagement} />
          <Route path="/sales/reports" component={SalesReports} />
          <Route>
            <div className="p-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg  mb-2">Page Not Found</h2>
                  <p className="text-gray-500">
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
