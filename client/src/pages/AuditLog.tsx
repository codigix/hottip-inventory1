
import { useQuery } from "@tanstack/react-query";

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-4">Audit Log</h1>
      <p className="mb-6 text-muted-foreground">View all system activity, changes, and user actions for compliance and traceability.</p>
      <div className="bg-white rounded shadow p-4">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load audit log."}</div>
        ) : (
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
              {Array.isArray(data) && data.length > 0 ? (
                data.map((log, idx) => (
                  <tr key={log.id || idx} className="border-b last:border-0">
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
        )}
      </div>
    </div>
  );
};

export default AuditLog;
