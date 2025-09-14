import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import InventoryDashboard from "@/pages/InventoryDashboard";
import SalesDashboard from "@/pages/SalesDashboard";
import AccountsDashboard from "@/pages/AccountsDashboard";
import LogisticsDashboard from "@/pages/LogisticsDashboard";
import EmployeesDashboard from "@/pages/EmployeesDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/inventory" component={InventoryDashboard} />
        <Route path="/sales" component={SalesDashboard} />
        <Route path="/accounts" component={AccountsDashboard} />
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
