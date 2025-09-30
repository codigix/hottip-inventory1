import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, User } from "lucide-react";
import { format } from "date-fns";
import LeaveRequestForm from "./LeaveRequestForm";
import { useAuth } from "@/contexts/AuthContext";

interface LeaveRequest {
  id?: string;
  leaveType:
    | "sick"
    | "vacation"
    | "personal"
    | "emergency"
    | "training"
    | "other";
  startDate: Date;
  endDate: Date;
  reason: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  totalDays?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LeaveBalance {
  totalLeave: number;
  usedLeave: number;
  remainingLeave: number;
  sickLeave: number;
  vacationLeave: number;
  personalLeave: number;
}

export default function LeaveRequestManager() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null
  );

  // Mock leave balance - in a real app, you'd fetch this from your API
  useEffect(() => {
    setLeaveBalance({
      totalLeave: 25,
      usedLeave: 8,
      remainingLeave: 17,
      sickLeave: 10,
      vacationLeave: 15,
      personalLeave: 5,
    });
  }, []);

  // Fetch leave requests on component mount
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/leave-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leave requests");
      }

      const data = await response.json();
      setLeaveRequests(data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLeaveRequest = async (leaveRequest: LeaveRequest) => {
    try {
      setIsLoading(true);

      // Prepare the request data according to the API schema
      const requestData = {
        leaveType: leaveRequest.leaveType,
        startDate: leaveRequest.startDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
        endDate: leaveRequest.endDate.toISOString().split("T")[0],
        reason: leaveRequest.reason,
        totalDays: leaveRequest.totalDays,
      };

      let response;

      if (editingRequest?.id) {
        // Update existing request
        response = await fetch(`/api/leave-requests/${editingRequest.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });
      } else {
        // Create new request
        response = await fetch("/api/leave-requests", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit leave request");
      }

      const data = await response.json();
      console.log("Leave request submitted successfully:", data);

      // Refresh the leave requests list
      await fetchLeaveRequests();

      // Close the form and reset editing state
      setIsFormOpen(false);
      setEditingRequest(null);

      // Show success message (you can replace this with a toast notification)
      alert(
        editingRequest
          ? "Leave request updated successfully!"
          : "Leave request submitted successfully!"
      );
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setEditingRequest(request);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this leave request?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/leave-requests/${requestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete leave request");
      }

      // Refresh the leave requests list
      await fetchLeaveRequests();
      alert("Leave request deleted successfully!");
    } catch (error) {
      console.error("Error deleting leave request:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "sick":
        return "bg-red-100 text-red-800";
      case "vacation":
        return "bg-blue-100 text-blue-800";
      case "personal":
        return "bg-purple-100 text-purple-800";
      case "emergency":
        return "bg-orange-100 text-orange-800";
      case "training":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">
            Manage your leave requests and view your leave balance
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRequest(null);
            setIsFormOpen(true);
          }}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Leave Request
        </Button>
      </div>

      {/* Leave Balance Card */}
      {leaveBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Leave Balance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Leave</p>
                <p className="text-xl font-bold text-green-600">
                  {leaveBalance.totalLeave} days
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-xl font-bold text-blue-600">
                  {leaveBalance.usedLeave} days
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-orange-600">
                  {leaveBalance.remainingLeave} days
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Sick Leave</p>
                <p className="text-xl font-bold text-purple-600">
                  {leaveBalance.sickLeave} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading leave requests...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No leave requests found</p>
              <p className="text-sm text-muted-foreground">
                Click "New Leave Request" to submit your first request
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType.charAt(0).toUpperCase() +
                            request.leaveType.slice(1)}
                        </Badge>
                        <Badge
                          className={getStatusColor(
                            request.status || "pending"
                          )}
                        >
                          {request.status || "pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(request.startDate),
                              "MMM dd, yyyy"
                            )}{" "}
                            -{" "}
                            {format(new Date(request.endDate), "MMM dd, yyyy")}
                          </span>
                        </span>
                        <span>{request.totalDays} days</span>
                      </div>
                      {request.reason && (
                        <p className="text-sm">{request.reason}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRequest(request)}
                            disabled={isLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id!)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitLeaveRequest}
        existingRequest={editingRequest}
        leaveBalance={leaveBalance}
        isLoading={isLoading}
        userId={user?.id}
        userName={user?.username}
      />
    </div>
  );
}
