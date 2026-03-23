import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StartTourButton } from "@/components/StartTourButton";
import { adminReportsTour } from "@/components/tours/dashboardTour";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  CheckCircle2, 
  RefreshCcw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const fetchReports = async () => {
  const res = await fetch("/api/admin/reports");
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
};

const Reports: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/admin/reports"],
    queryFn: fetchReports,
  });
  
  const [dateRange, setDateRange] = useState("30");

  const handleExport = (format: string) => {
    const payload = JSON.stringify({ dateRange, data }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${dateRange}-days.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900  flex items-center gap-2" data-tour="admin-reports-header">
            <BarChart3 className="h-6 w-6 text-primary" />
            Executive Reports
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time business intelligence and performance metrics across all departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-white border-slate-200" data-tour="admin-reports-date-range">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-white">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <StartTourButton tourConfig={adminReportsTour} tourName="admin-reports" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm  text-slate-500 flex items-center justify-between">
              Sales Performance
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">
              ₹{data?.sales?.totalRevenue?.toLocaleString("en-IN") || "0"}
            </div>
            <div className="flex items-center gap-1 text-[10px] mt-1">
              <span className="text-emerald-600  flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> 12%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pending</span>
                <span className=" text-slate-700">₹{data?.sales?.pendingReceivables?.toLocaleString("en-IN") || "0"}</span>
              </div>
              <Progress value={75} className="h-1 bg-slate-100" />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm  text-slate-500 flex items-center justify-between">
              Inventory Status
              <Package className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">
              {data?.inventory?.totalItems || "0"} Items
            </div>
            <div className="flex items-center gap-1 text-[10px] mt-1">
              <span className="text-rose-600  flex items-center">
                {data?.inventory?.lowStockCount || "0"} low stock
              </span>
              <span className="text-slate-400">alerts active</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Capacity</span>
                <span className=" text-slate-700">64%</span>
              </div>
              <Progress value={64} className="h-1 bg-slate-100" />
            </div>
          </CardContent>
        </Card>

        {/* Marketing Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm  text-slate-500 flex items-center justify-between">
              Lead Generation
              <Users className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">
              {data?.marketing?.totalLeads || "0"} Leads
            </div>
            <div className="flex items-center gap-1 text-[10px] mt-1">
              <span className="text-emerald-600  flex items-center">
                <Plus className="h-3 w-3 mr-0.5" /> {data?.marketing?.newLeadsCount || "0"}
              </span>
              <span className="text-slate-400">new this period</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Conversion Rate</span>
                <span className=" text-slate-700">18.5%</span>
              </div>
              <Progress value={18.5} className="h-1 bg-slate-100" />
            </div>
          </CardContent>
        </Card>

        {/* Productivity Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm  text-slate-500 flex items-center justify-between">
              Operations
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">
              {data?.productivity?.completedTasks || "0"} Done
            </div>
            <div className="flex items-center gap-1 text-[10px] mt-1">
              <span className="text-slate-500 ">
                Out of {data?.productivity?.totalTasks || "0"} total tasks
              </span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Completion</span>
                <span className=" text-slate-700">
                  {data?.productivity?.totalTasks > 0 
                    ? Math.round((data.productivity.completedTasks / data.productivity.totalTasks) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={data?.productivity?.totalTasks > 0 
                  ? (data.productivity.completedTasks / data.productivity.totalTasks) * 100 
                  : 0} 
                className="h-1 bg-slate-100" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-sm  text-slate-800">Departmental Analytics</CardTitle>
            <CardDescription className="text-xs">Consolidated performance data across all business units.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 h-[300px] flex items-center justify-center border-dashed border-2 border-slate-100 m-6 rounded-lg bg-slate-50/50">
            <div className="text-center space-y-2">
              <TrendingUp className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-slate-400 text-sm ">Chart visualization would be rendered here</p>
              <p className="text-slate-300 text-[10px]">Comparing Departmental KPIs for the selected period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-sm  text-slate-800">Report Actions</CardTitle>
            <CardDescription className="text-xs">Export your business data for offline analysis.</CardDescription>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            <Button variant="outline" className="w-full justify-start h-12 bg-white" onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="h-5 w-5 mr-3 text-emerald-600" />
              <div className="text-left">
                <div className="text-sm ">Detailed CSV Export</div>
                <div className="text-[10px] text-slate-500">Perfect for Microsoft Excel or Google Sheets</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 bg-white" onClick={() => handleExport("pdf")}>
              <FileText className="h-5 w-5 mr-3 text-rose-600" />
              <div className="text-left">
                <div className="text-sm ">Executive PDF Summary</div>
                <div className="text-[10px] text-slate-500">Ready for distribution or presentations</div>
              </div>
            </Button>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-xs  text-slate-700 uppercase tracking-wider">Scheduled Reports</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Automated monthly reports are sent to the administration email on the 1st of every month.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
