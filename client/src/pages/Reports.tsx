
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminReportsTour } from "@/components/tours/dashboardTour";

const fetchReports = async () => {
  const res = await fetch("/api/admin/reports");
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
};

const Reports: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/reports"],
    queryFn: fetchReports,
  });
  const [reportType, setReportType] = useState("system-performance");
  const [dateRange, setDateRange] = useState("30");

  const summaryCards = useMemo(() => {
    return [
      {
        title: "Sales Report",
        metrics: [
          `Total Sales: ₹${data?.sales?.total?.toLocaleString("en-IN") ?? "-"}`,
          `Invoices Due: ${data?.sales?.invoicesDue ?? "-"}`,
        ],
      },
      {
        title: "Inventory Report",
        metrics: [
          `Low Stock Items: ${data?.inventory?.lowStock ?? "-"}`,
          `Stock Value: ₹${data?.inventory?.stockValue?.toLocaleString("en-IN") ?? "-"}`,
        ],
      },
    ];
  }, [data]);

  const userActivity = useMemo(() => {
    if (Array.isArray(data?.userActivity)) {
      return data.userActivity;
    }
    return [
      { id: 1, action: "System backup completed", actor: "Automation", timestamp: new Date().toISOString() },
      { id: 2, action: "New approval assigned", actor: "Admin", timestamp: new Date().toISOString() },
    ];
  }, [data]);

  const handleExport = () => {
    const payload = JSON.stringify({ reportType, dateRange, data }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-${reportType}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-tour="admin-reports-header">Reports</h1>
          <p className="text-muted-foreground">View and export company-wide reports, KPIs, and analytics.</p>
        </div>
        <StartTourButton tourConfig={adminReportsTour} tourName="admin-reports" />
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
        <div className="flex flex-wrap gap-4">
          <select
            className="border rounded px-3 py-2"
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
            data-tour="admin-reports-selector"
          >
            <option value="system-performance">System Performance</option>
            <option value="user-activity">User Activity</option>
            <option value="module-usage">Module Usage</option>
          </select>
          <select
            className="border rounded px-3 py-2"
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            data-tour="admin-reports-date-range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load reports."}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" data-tour="admin-reports-dashboard">
              {summaryCards.map((card) => (
                <div key={card.title} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                  <h2 className="font-semibold mb-2 text-lg">{card.title}</h2>
                  {card.metrics.map((metric) => (
                    <p key={metric} className="mb-1">
                      {metric}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-4" data-tour="admin-reports-user-activity">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Recent User Activity</h3>
                <span className="text-sm text-muted-foreground">{userActivity.length} events</span>
              </div>
              <ul className="space-y-2">
                {userActivity.map((activity: any) => (
                  <li key={activity.id} className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.actor}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div className="pt-4 border-t">
          <h2 className="font-semibold mb-2 text-lg">Export</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700"
            data-tour="admin-reports-export-button"
            onClick={handleExport}
          >
            Export Current View
          </button>
        </div>
      </div>
    </main>
  );
};

export default Reports;
