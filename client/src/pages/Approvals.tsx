
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
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

const Approvals: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/approvals"],
    queryFn: fetchApprovals,
  });
  const mutation = useMutation({
    mutationFn: approveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/admin/approvals"] }),
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Approvals Console</h1>
          <p className="text-muted-foreground">Manage and approve quotations, purchase orders, leave requests, and payments.</p>
        </div>
        <StartTourButton tourConfig={adminApprovalsTour} tourName="admin-approvals" />
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load approvals."}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Requestor</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((req: any) => (
                  <tr key={req.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{req.type}</td>
                    <td className="py-2 px-3">{req.requestor}</td>
                    <td className="py-2 px-3">{req.status}</td>
                    <td className="py-2 px-3">
                      {req.status === "Pending" && (
                        <button
                          className="bg-green-600 text-white px-2 py-1 rounded-lg shadow-sm"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate(req.id)}
                          data-tour="admin-approvals-approve-button"
                        >
                          {mutation.isPending ? "Approving..." : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No approval requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};

export default Approvals;
