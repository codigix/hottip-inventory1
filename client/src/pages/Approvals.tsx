
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminApprovalsTour } from "@/components/tours/dashboardTour";

const fetchApprovals = async () => {
  const res = await fetch("/api/admin/approvals");
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
};

const approveRequest = async (id: string) => {
  const res = await fetch(`/api/admin/approvals/${id}/approve`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to approve request");
  return res.json();
};

const rejectRequest = async (id: string) => {
  const res = await fetch(`/api/admin/approvals/${id}/reject`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reject request");
  return res.json();
};

const Approvals: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/approvals"],
    queryFn: fetchApprovals,
  });
  const mutation = useMutation({
    mutationFn: approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/approvals"] });
    },
  });
  const rejectMutation = useMutation({
    mutationFn: rejectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/approvals"] });
    },
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const requests = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req: any) => {
      const matchesStatus = statusFilter === "All" || req.status === statusFilter;
      const matchesType = typeFilter === "All" || req.type === typeFilter;
      const matchesPriority = priorityFilter === "All" || req.priority === priorityFilter;
      return matchesStatus && matchesType && matchesPriority;
    });
  }, [requests, statusFilter, typeFilter, priorityFilter]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(requests.map((req: any) => req.status).filter(Boolean)));
  }, [requests]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(requests.map((req: any) => req.type).filter(Boolean)));
  }, [requests]);

  const uniquePriorities = useMemo(() => {
    return Array.from(new Set(requests.map((req: any) => req.priority).filter(Boolean)));
  }, [requests]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selected) => selected !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.length) return;
    await Promise.all(selectedIds.map((id) => approveRequest(id)));
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["/admin/approvals"] });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-tour="admin-approvals-header">Approvals Console</h1>
          <p className="text-muted-foreground">Manage and approve quotations, purchase orders, leave requests, and payments.</p>
        </div>
        <StartTourButton tourConfig={adminApprovalsTour} tourName="admin-approvals" />
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex flex-wrap gap-4" data-tour="admin-approvals-filters">
          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="All">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="All">All Priorities</option>
            {uniquePriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{filteredRequests.length} request(s) match the current filters.</p>
          <div className="flex items-center gap-3" data-tour="admin-approvals-bulk-actions">
            <button
              className="border px-3 py-2 rounded"
              onClick={() => setSelectedIds([])}
              disabled={!selectedIds.length}
            >
              Clear Selection
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded shadow-sm"
              onClick={handleBulkApprove}
              disabled={!selectedIds.length || mutation.isPending}
            >
              {mutation.isPending ? "Processing..." : "Approve Selected"}
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load approvals."}</div>
        ) : (
          <div className="overflow-x-auto" data-tour="admin-approvals-pending-list">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 w-12">Select</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Requestor</th>
                  <th className="text-left py-2 px-3">Priority</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req: any) => (
                    <tr key={req.id} className="border-b last:border-0">
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={() => toggleSelection(req.id)}
                        />
                      </td>
                      <td className="py-2 px-3">{req.type}</td>
                      <td className="py-2 px-3">{req.requestor}</td>
                      <td className="py-2 px-3">{req.priority || "-"}</td>
                      <td className="py-2 px-3">{req.status}</td>
                      <td className="py-2 px-3 flex flex-wrap gap-2">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded shadow-sm"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate(req.id)}
                          data-tour="admin-approvals-approve-button"
                        >
                          {mutation.isPending ? "Approving..." : "Approve"}
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded shadow-sm"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(req.id)}
                          data-tour="admin-approvals-reject-button"
                        >
                          {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No approval requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default Approvals;
