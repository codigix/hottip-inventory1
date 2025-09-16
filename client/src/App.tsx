import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/LoginForm";
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

function ProtectedRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show main app if authenticated
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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <ProtectedRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
