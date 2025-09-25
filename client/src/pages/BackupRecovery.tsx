
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

// Restore a backup via the API
const restoreBackup = async (id: string) => {
  const res = await fetch(`/api/admin/backups/${id}/restore`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to restore backup");
  return res.json();
};
// Create a new backup via the API
const createBackup = async () => {
  const res = await fetch("/api/admin/backups", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create backup");
  return res.json();
};
// Fetch backups from the API
const fetchBackups = async () => {
  const res = await fetch("/api/admin/backups");
  if (!res.ok) throw new Error("Failed to fetch backups");
  return res.json();
};

function BackupRecovery() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/backups"],
    queryFn: fetchBackups,
  });
  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/admin/backups"] }),
  });
  const restoreMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/admin/backups"] }),
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Backup & Recovery</h1>
          <p className="text-muted-foreground">Manage system backups and restore points for disaster recovery.</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex space-x-2 mb-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Backup"}
          </button>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load backups."}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Backup Name</th>
                <th className="text-left py-2 px-3">Created</th>
                <th className="text-left py-2 px-3">Size</th>
                <th className="text-left py-2 px-3">Restore</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((backup: any) => (
                  <tr key={backup.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{backup.name}</td>
                    <td className="py-2 px-3">{new Date(backup.createdAt).toLocaleString()}</td>
                    <td className="py-2 px-3">{backup.size} MB</td>
                    <td className="py-2 px-3">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 shadow-sm"
                        onClick={() => restoreMutation.mutate(backup.id)}
                        disabled={restoreMutation.isPending}
                      >
                        {restoreMutation.isPending ? "Restoring..." : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No backups found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

export default BackupRecovery;
