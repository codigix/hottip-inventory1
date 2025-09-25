
import { useQuery } from "@tanstack/react-query";
import React from "react";

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

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">View and export company-wide reports, KPIs, and analytics.</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load reports."}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-2 text-lg">Sales Report</h2>
              <p className="mb-1">Total Sales: <span className="font-bold">₹{data?.sales?.total?.toLocaleString("en-IN") ?? "-"}</span></p>
              <p>Invoices Due: <span className="font-bold">{data?.sales?.invoicesDue ?? "-"}</span></p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-2 text-lg">Inventory Report</h2>
              <p className="mb-1">Low Stock Items: <span className="font-bold">{data?.inventory?.lowStock ?? "-"}</span></p>
              <p>Stock Value: <span className="font-bold">₹{data?.inventory?.stockValue?.toLocaleString("en-IN") ?? "-"}</span></p>
            </div>
          </div>
        )}
        <div className="pt-8">
          <h2 className="font-semibold mb-2 text-lg">Export</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700">Export as CSV</button>
        </div>
      </div>
    </main>
  );
};

export default Reports;
