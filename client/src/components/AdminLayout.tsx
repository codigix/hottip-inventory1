import React from "react";
import { Link, useLocation } from "wouter";
import { GlobalNavbar } from "./GlobalNavbar";

const adminPages = [
  { section: "Main" },
  { path: "/admin", label: "Dashboard" },
  { section: "Admin Tools" },
  { path: "/admin/audit-log", label: "Audit Log" },
  { path: "/admin/settings", label: "Master Settings" },
  { path: "/admin/approvals", label: "Approvals" },
  { path: "/admin/backup", label: "Backup & Recovery" },
  { path: "/admin/reports", label: "Reports" },
  { path: "/admin/tasks", label: "Task Console" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-lg">
          <div className="p-6 font-bold text-xl border-b border-gray-800 tracking-wide">Admin</div>
          <nav className="flex-1 p-4 space-y-2">
            {adminPages.map((item, idx) =>
              item.section ? (
                <div key={item.section + idx} className="mt-6 mb-2 text-xs uppercase tracking-wider text-gray-400 font-semibold px-2">
                  {item.section}
                </div>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 rounded transition-colors duration-150 font-medium hover:bg-gray-800 ${location === item.path ? "bg-gray-800 text-blue-400" : "text-white"}`}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
