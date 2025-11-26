
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StartTourButton } from "@/components/StartTourButton";
import { adminAuditLogTour } from "@/components/tours/dashboardTour";

const fetchAuditLog = async () => {
  const res = await fetch("/api/admin/audit-log");
  if (!res.ok) throw new Error("Failed to fetch audit log");
  return res.json();
};

const AuditLog: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/audit-log"],
    queryFn: fetchAuditLog,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("30");

  const logs = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = normalizedSearch
        ? [log.user, log.action, log.details]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
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
      return matchesSearch && matchesUser && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, userFilter, actionFilter, dateFilter]);

  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.user).filter(Boolean)));
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action).filter(Boolean)));
  }, [logs]);

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
    link.download = "audit-log.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-4" data-tour="admin-audit-log-header">Audit Log</h1>
          <p className="text-muted-foreground">View all system activity, changes, and user actions for compliance and traceability.</p>
        </div>
        <StartTourButton tourConfig={adminAuditLogTour} tourName="admin-audit-log" />
      </div>
      <div className="bg-white rounded shadow p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            className="flex-1 min-w-[220px] border rounded px-3 py-2"
            placeholder="Search user, action, or details"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            data-tour="admin-audit-log-search"
          />
          <div className="flex flex-wrap gap-3" data-tour="admin-audit-log-filters">
            <select
              className="border rounded px-3 py-2"
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded shadow-sm"
            onClick={handleExport}
            disabled={!filteredLogs.length}
            data-tour="admin-audit-log-export"
          >
            Export CSV
          </button>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load audit log."}</div>
        ) : (
          <div className="overflow-x-auto" data-tour="admin-audit-log-table">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Timestamp</th>
                  <th className="text-left py-2 px-3">User</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id || `${log.timestamp}-${index}`} className="border-b last:border-0">
                      <td className="py-2 px-3">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                      <td className="py-2 px-3">{log.user || "-"}</td>
                      <td className="py-2 px-3">{log.action || "-"}</td>
                      <td className="py-2 px-3">{log.details || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">No audit log entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
