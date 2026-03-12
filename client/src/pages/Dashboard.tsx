import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const deptLower = (user.department || "").toLowerCase().trim();
      
      const routeMap: Record<string, string> = {
        admin: "/admin",
        administration: "/admin",
        accounts: "/accounts",
        sales: "/sales",
        marketing: "/marketing",
        logistics: "/logistics",
        inventory: "/inventory",
        employees: "/employees",
      };

      const dashboard = routeMap[deptLower] || "/admin";
      setLocation(dashboard);
    }
  }, [isAuthenticated, user, setLocation]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground animate-pulse">Redirecting to your dashboard...</div>
    </div>
  );
}
