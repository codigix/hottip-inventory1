
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminBackupTour } from "@/components/tours/dashboardTour";

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
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [retentionDays, setRetentionDays] = useState("30");
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const backups = Array.isArray(data) ? data : [];

  const handleDownload = (id: string) => {
    window.open(`/api/admin/backups/${id}/download`, "_blank");
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-tour="admin-backup-header">Backup & Recovery</h1>
          <p className="text-muted-foreground">Manage system backups and restore points for disaster recovery.</p>
        </div>
        <StartTourButton tourConfig={adminBackupTour} tourName="admin-backup" />
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-tour="admin-backup-create-button"
          >
            {createMutation.isPending ? "Creating..." : "Create Backup"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tour="admin-backup-schedule">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Frequency</p>
            <select
              className="border rounded px-3 py-2 w-full"
              value={scheduleFrequency}
              onChange={(event) => setScheduleFrequency(event.target.value)}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Retention</p>
            <select
              className="border rounded px-3 py-2 w-full"
              value={retentionDays}
              onChange={(event) => setRetentionDays(event.target.value)}
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-sm text-muted-foreground mb-1">Auto Backups</p>
            <button
              className={`px-3 py-2 rounded border ${autoBackupEnabled ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
              onClick={() => setAutoBackupEnabled((prev) => !prev)}
            >
              {autoBackupEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load backups."}</div>
        ) : (
          <div className="overflow-x-auto" data-tour="admin-backup-history">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Backup Name</th>
                  <th className="text-left py-2 px-3">Created</th>
                  <th className="text-left py-2 px-3">Size</th>
                  <th className="text-left py-2 px-3">Restore</th>
                  <th className="text-left py-2 px-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {backups.length > 0 ? (
                  backups.map((backup: any) => (
                    <tr key={backup.id} className="border-b last:border-0">
                      <td className="py-2 px-3">{backup.name}</td>
                      <td className="py-2 px-3">{new Date(backup.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-3">{backup.size} MB</td>
                      <td className="py-2 px-3">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 shadow-sm"
                          onClick={() => restoreMutation.mutate(backup.id)}
                          disabled={restoreMutation.isPending}
                          data-tour="admin-backup-restore-button"
                        >
                          {restoreMutation.isPending ? "Restoring..." : "Restore"}
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          className="border px-3 py-1 rounded"
                          onClick={() => handleDownload(backup.id)}
                          data-tour="admin-backup-download"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No backups found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default BackupRecovery;
