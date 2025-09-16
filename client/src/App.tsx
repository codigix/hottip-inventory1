import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import InventoryLayout from "@/pages/inventory/InventoryLayout";
import SalesLayout from "@/pages/sales/SalesLayout";
import AccountsLayout from "@/pages/accounts/AccountsLayout";
import MarketingLayout from "@/pages/marketing/MarketingLayout";
import LogisticsDashboard from "@/pages/LogisticsDashboard";
import EmployeesDashboard from "@/pages/EmployeesDashboard";
import NotFound from "@/pages/not-found";

function AppRouter() {
  // Show main app directly without authentication
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/inventory" component={InventoryLayout} />
        <Route path="/inventory/*" component={InventoryLayout} />
        <Route path="/sales" component={SalesLayout} />
        <Route path="/sales/*" component={SalesLayout} />
        <Route path="/accounts" component={AccountsLayout} />
        <Route path="/accounts/*" component={AccountsLayout} />
        <Route path="/marketing" component={MarketingLayout} />
        <Route path="/marketing/*" component={MarketingLayout} />
        <Route path="/logistics" component={LogisticsDashboard} />
        <Route path="/employees" component={EmployeesDashboard} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
