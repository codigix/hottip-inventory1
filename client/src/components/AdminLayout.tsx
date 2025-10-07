import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileSearch,
  Settings,
  CheckSquare,
  Database,
  FileText,
  ListTodo,
} from "lucide-react";

const adminPages = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/audit-log", label: "Audit Log", icon: FileSearch },
  { path: "/admin/settings", label: "Master Settings", icon: Settings },
  { path: "/admin/approvals", label: "Approvals", icon: CheckSquare },
  { path: "/admin/backup", label: "Backup & Recovery", icon: Database },
  { path: "/admin/reports", label: "Reports", icon: FileText },
  { path: "/admin/tasks", label: "Task Console", icon: ListTodo },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar - Clean White Design with Purple Accents */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="font-bold text-xl text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive management system
            </p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {adminPages.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  location === item.path
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon && (
                  <item.icon
                    className={`w-5 h-5 ${
                      location === item.path ? "text-white" : "text-gray-600"
                    }`}
                  />
                )}
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Hottip Inventory System
            </div>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
