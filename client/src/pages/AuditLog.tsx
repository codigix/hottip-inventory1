
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StartTourButton } from "@/components/StartTourButton";
import { adminAuditLogTour } from "@/components/tours/dashboardTour";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Filter, RefreshCcw } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

const fetchAuditLog = async (): Promise<AuditLogEntry[]> => {
  const res = await fetch("/api/admin/audit-log");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch audit log");
  }
  return res.json();
};

const AuditLog: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/admin/audit-log"],
    queryFn: fetchAuditLog,
  });
  
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("30");

  const logs = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.user).filter(Boolean)));
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action).filter(Boolean)));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesUser = userFilter === "all" || log.user === userFilter;
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesDate = (() => {
        if (dateFilter === "all") return true;
        const timestamp = new Date(log.timestamp || 0).getTime();
        if (!timestamp) return true;
        const days = Number(dateFilter);
        const diffInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        return diffInDays <= days;
      })();
      return matchesUser && matchesAction && matchesDate;
    });
  }, [logs, userFilter, actionFilter, dateFilter]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      cell: (item) => item.timestamp ? format(new Date(item.timestamp), "MMM d, yyyy HH:mm:ss") : "-",
    },
    {
      key: "user",
      header: "User",
      sortable: true,
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wider">
          {item.action}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      sortable: true,
      cell: (item) => <span className="text-slate-500 break-words max-w-md block">{item.details || "-"}</span>,
    },
  ];

  const handleExport = () => {
    if (!filteredLogs.length) return;
    const header = "Timestamp,User,Action,Details";
    const rows = filteredLogs.map((log) => {
      const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : "";
      const user = log.user || "";
      const action = log.action || "";
      const details = (log.details || "").replace(/"/g, '""');
      return `${timestamp},${user},${action},"${details}"`;
    });
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 tracking-tight" data-tour="admin-audit-log-header">
            Audit Log
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Track and monitor all system activities and user actions for compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-white"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={!filteredLogs.length || isLoading}
            className="bg-white"
            data-tour="admin-audit-log-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <StartTourButton tourConfig={adminAuditLogTour} tourName="admin-audit-log" />
        </div>
      </div>

      <div className="border-slate-200 shadow-sm overflow-hidden">
        <div className=" border-b border-slate-100 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 min-w-[150px]">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filter by User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            data={filteredLogs}
            columns={columns}
            isLoading={isLoading}
            searchable={true}
            searchPlaceholder="Search audit details, actions or users..."
            defaultPageSize={10}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
