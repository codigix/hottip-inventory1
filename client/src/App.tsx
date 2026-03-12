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
import EmployeesDashboard from "@/pages/EmployeesDashboard";
import NotFound from "@/pages/not-found";
import { useEffect, ReactNode } from "react";

// Protected Route Component
function ProtectedRoute({ 
  path, 
  component: Component, 
  requiredDepartment 
}: { 
  path: string; 
  component: React.ComponentType<any>; 
  requiredDepartment?: string 
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (!isLoading && isAuthenticated && user && user.role !== "admin" && requiredDepartment) {
      const userDept = (user.department || "").toLowerCase().trim();
      if (userDept !== requiredDepartment.toLowerCase().trim() && 
          !(userDept === "administration" && requiredDepartment.toLowerCase() === "admin")) {
        // User trying to access unauthorized department, redirect to their own dashboard
        setLocation("/");
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation, requiredDepartment]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return <Route path={path} component={Component} />;
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  // Public routes
  if (location === "/login") return <Login />;
  if (location === "/register") return <Register />;

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavbar />
      <main className="max-w-full">
        <Switch>
          <Route path="/" component={Dashboard} />
          
          {/* Admin Routes */}
          <ProtectedRoute path="/admin" component={AdminDashboard} requiredDepartment="admin" />
          <ProtectedRoute path="/admin/*" component={AdminDashboard} requiredDepartment="admin" />
          
          {/* Inventory Routes */}
          <ProtectedRoute path="/inventory" component={InventoryLayout} requiredDepartment="inventory" />
          <ProtectedRoute path="/inventory/*" component={InventoryLayout} requiredDepartment="inventory" />
          
          {/* Sales Routes */}
          <ProtectedRoute path="/sales" component={SalesLayout} requiredDepartment="sales" />
          <ProtectedRoute path="/sales/*" component={SalesLayout} requiredDepartment="sales" />
          
          {/* Accounts Routes */}
          <ProtectedRoute path="/accounts" component={AccountsLayout} requiredDepartment="accounts" />
          <ProtectedRoute path="/accounts/*" component={AccountsLayout} requiredDepartment="accounts" />
          
          {/* Marketing Routes */}
          <ProtectedRoute path="/marketing" component={MarketingLayout} requiredDepartment="marketing" />
          <ProtectedRoute path="/marketing/*" component={MarketingLayout} requiredDepartment="marketing" />
          
          {/* Logistics Routes */}
          <ProtectedRoute path="/logistics" component={LogisticsLayout} requiredDepartment="logistics" />
          <ProtectedRoute path="/logistics/*" component={LogisticsLayout} requiredDepartment="logistics" />
          
          {/* Employees Routes */}
          <ProtectedRoute path="/employees" component={EmployeesDashboard} requiredDepartment="employees" />
          
          <Route component={NotFound} />
        </Switch>
      </main>
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
