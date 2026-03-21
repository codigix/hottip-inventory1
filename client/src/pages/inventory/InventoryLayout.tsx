import { useState } from "react";
import { useLocation, Link, Switch, Route } from "wouter";
import { 
  Package, 
  TrendingUp, 
  ClipboardList, 
  FileText, 
  Truck,
  AlertTriangle,
  BarChart3,
  Building2,
  Settings,
  ShieldCheck,
  History,
  LayoutDashboard,
  Hammer
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import inventory pages
import StockManagement from "./StockManagement";
import VendorManagement from "./VendorManagement";
import InventoryReports from "./InventoryReports";
import InventoryDashboard from "../InventoryDashboard";
import MaterialRequests from "./MaterialRequests";
import MaterialRequestDetail from "./MaterialRequestDetail";
import VendorQuotations from "./VendorQuotations";
import VendorPO from "./VendorPO";
import SparePartsFabrication from "./SparePartsFabrication";
import BatchBarcode from "./BatchBarcode";
import InventoryAttendance from "./InventoryAttendance";
import InventoryTasks from "./InventoryTasks";

const sidebarItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/inventory' },
  { id: 'stock', label: 'Stock Balance', icon: Package, path: '/inventory/stock' },
  { id: 'material-requests', label: 'Material Req.', icon: ClipboardList, path: '/inventory/material-requests' },
  { id: 'vendor-quotations', label: 'Quotations', icon: FileText, path: '/inventory/vendor-quotations' },
  { id: 'vendor-po', label: 'Purchase Orders', icon: Truck, path: '/inventory/vendor-po' },
  { id: 'vendors', label: 'Vendor Directory', icon: Building2, path: '/inventory/vendors' },
  { id: 'spare-parts', label: 'Spare Parts', icon: Hammer, path: '/inventory/spare-parts' },
  { id: 'batch-barcode', label: 'Batch/Barcode', icon: ShieldCheck, path: '/inventory/batch-barcode' },
  { id: 'attendance', label: 'Staff Attendance', icon: History, path: '/inventory/attendance' },
  { id: 'tasks', label: 'Ops Tasks', icon: Settings, path: '/inventory/tasks' },
  { id: 'reports', label: 'Analytics', icon: BarChart3, path: '/inventory/reports' },
];

export default function InventoryLayout() {
  const [location] = useLocation();
  
  const getActiveSidebarItem = () => {
    if (location === '/inventory') return 'dashboard';
    const match = sidebarItems.find(item => item.path !== '/inventory' && location.includes(item.path));
    return match ? match.id : 'dashboard';
  };

  const activeId = getActiveSidebarItem();

  return (
    <div className="flex min-h-screen bg-slate-50/30">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-primary rounded">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Inventory</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">Logistics Pro</span>
          </div>
        </div>

        <nav className="grid overflow-y-auto gap-2 p-4 space-y-1 custom-scrollbar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            
            return (
              <Link key={item.id} href={item.path}>
                <div className={cn(
                  "flex items-center gap-3 p-2 rounded text-xs  transition-all cursor-pointer group",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-slate-200" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Card className="border-none bg-slate-50 shadow-none">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">System Health</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Pending RFQs</span>
                <span className="text-xs font-bold text-slate-900">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Low Stock</span>
                <span className="text-xs font-bold text-amber-600">12</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1  h-screen">
        <Switch>
          <Route path="/inventory"><InventoryDashboard /></Route>
          <Route path="/inventory/stock"><StockManagement /></Route>
          <Route path="/inventory/material-requests"><MaterialRequests /></Route>
          <Route path="/inventory/material-requests/:id"><MaterialRequestDetail /></Route>
          <Route path="/inventory/vendor-quotations"><VendorQuotations /></Route>
          <Route path="/inventory/vendor-po"><VendorPO /></Route>
          <Route path="/inventory/vendors"><VendorManagement /></Route>
          <Route path="/inventory/spare-parts"><SparePartsFabrication /></Route>
          <Route path="/inventory/batch-barcode"><BatchBarcode /></Route>
          <Route path="/inventory/attendance"><InventoryAttendance /></Route>
          <Route path="/inventory/tasks"><InventoryTasks /></Route>
          <Route path="/inventory/reports"><InventoryReports /></Route>
          <Route>
            <div className="p-12 text-center h-full flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Section Not Found</h2>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">The requested inventory module page is either under maintenance or does not exist.</p>
              </div>
              <Link href="/inventory">
                <Button variant="outline" className="border-slate-200">Return to Dashboard</Button>
              </Link>
            </div>
          </Route>
        </Switch>
      </div>
    </div>
  );
}
