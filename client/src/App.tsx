import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TourProvider } from "@/contexts/TourContext";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import InventoryLayout from "@/pages/inventory/InventoryLayout";
import SalesLayout from "@/pages/sales/SalesLayout";
import AccountsLayout from "@/pages/accounts/AccountsLayout";
import MarketingLayout from "@/pages/marketing/MarketingLayout";
import LogisticsLayout from "@/pages/logistics/LogisticsLayout";
import LogisticsDashboard from "@/pages/LogisticsDashboard";
import EmployeesDashboard from "@/pages/EmployeesDashboard";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  // Public routes
  // if (location === "/login") return <Login />;
  // if (location === "/register") return <Register />;

  // If not authenticated, redirect to login
  // if (!isAuthenticated) {
  //   setTimeout(() => setLocation("/login"), 0);
  //   return null;
  // }

  // Authenticated routes
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/*" component={AdminDashboard} />
        <Route path="/inventory" component={InventoryLayout} />
        <Route path="/inventory/*" component={InventoryLayout} />
        <Route path="/sales" component={SalesLayout} />
        <Route path="/sales/*" component={SalesLayout} />
        <Route path="/accounts" component={AccountsLayout} />
        <Route path="/accounts/*" component={AccountsLayout} />
        <Route path="/marketing" component={MarketingLayout} />
        <Route path="/marketing/*" component={MarketingLayout} />
        <Route path="/logistics" component={LogisticsLayout} />
        <Route path="/logistics/*" component={LogisticsLayout} />
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
        <TourProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </TourProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
