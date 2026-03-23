import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  LayoutGrid,
  FileSearch,
  Settings,
  CheckSquare,
  Database,
  FileText,
  ListTodo,
  Package,
  TrendingUp,
  DollarSign,
  Target,
  Truck,
  Users,
} from "lucide-react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminModulesFlowTour } from "@/components/tours/dashboardTour";
import { useTourNavigation } from "@/hooks/useTourNavigation";
import { useTourStatus } from "@/contexts/TourContext";

const adminPages = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "Core" },
  { path: "/admin/summary", label: "All Dept Summary", icon: LayoutGrid, group: "Core" },
  { path: "/admin/audit-log", label: "Audit Log", icon: FileSearch, group: "Core" },
  { path: "/admin/settings", label: "Master Settings", icon: Settings, group: "Core" },
  { path: "/admin/approvals", label: "Approvals", icon: CheckSquare, group: "Core" },
  { path: "/admin/backup", label: "Backup & Recovery", icon: Database, group: "Core" },
  { path: "/admin/reports", label: "Reports", icon: FileText, group: "Core" },
  { path: "/admin/tasks", label: "Task Console", icon: ListTodo, group: "Core" },
  
  { path: "/admin/inventory", label: "Inventory", icon: Package, group: "Departments" },
  { path: "/admin/sales", label: "Sales", icon: TrendingUp, group: "Departments" },
  { path: "/admin/accounts", label: "Accounts", icon: DollarSign, group: "Departments" },
  { path: "/admin/marketing", label: "Marketing", icon: Target, group: "Departments" },
  { path: "/admin/logistics", label: "Logistics", icon: Truck, group: "Departments" },
  { path: "/admin/employees", label: "Employees", icon: Users, group: "Departments" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const { navigationHandler } = useTourNavigation(adminPages);
  const { getPendingNavigationTour, clearPendingNavigationTour } = useTourStatus();

  // Handle pending navigation tours
  useEffect(() => {
    const pendingTour = getPendingNavigationTour();
    if (pendingTour && location === pendingTour.path) {
      // Small delay to ensure the page has loaded
      setTimeout(() => {
        clearPendingNavigationTour();
        // Start the pending tour if it exists
        if (pendingTour.config) {
          // This would be handled by the StartTourButton when it's rendered
        }
      }, 500);
    }
  }, [location, getPendingNavigationTour, clearPendingNavigationTour]);

  const tourConfigWithNavigation = {
    ...adminModulesFlowTour,
    steps: adminModulesFlowTour.steps.map((step, index) => {
      if (step.navigation) {
        // Enhanced navigation with proper timing and delays
        return {
          ...step,
          when: {
            show: () => {
              // Add delay before navigation to allow user to read the step
              setTimeout(() => {
                navigationHandler(step.navigation);
              }, 2000); // 2 second delay for better user experience
            },
          },
        };
      }
      return {
        ...step,
        when: {
          show: () => {
            // Add small delay for smooth transitions between steps
            return new Promise((resolve) => {
              setTimeout(resolve, 300);
            });
          },
        },
      };
    }),
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar - Clean White Design with Purple Accents */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col ">
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className=" text-xl text-gray-900" data-tour="admin-header">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Comprehensive management system
                </p>
              </div>
              <StartTourButton tourConfig={tourConfigWithNavigation} tourName="admin-flow-tour" navigationHandler={navigationHandler} />
            </div>
          </div>
          <div className="flex-1" data-tour="admin-navigation-menu">
            <nav className="p-2 space-y-4" data-tour="navigation-menu">
              {["Core", "Departments"].map((group) => (
                <div key={group} className="space-y-1">
                  <h3 className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {group}
                  </h3>
                  {adminPages
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 p-2 rounded transition-all duration-200  ${
                          location === item.path
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-tour={`nav-${item.path
                          .replace("/admin/", "")
                          .replace("/admin", "dashboard")}`}
                      >
                        {item.icon && (
                          <item.icon
                            className={`w-3 h-3 ${
                              location === item.path
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          />
                        )}
                        <span className="text-xs">{item.label}</span>
                      </Link>
                    ))}
                </div>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Hottip Inventory System
            </div>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
