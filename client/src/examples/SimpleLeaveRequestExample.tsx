import { useState } from "react";
import { Button } from "@/components/ui/button";
import LeaveRequestForm from "@/components/marketing/LeaveRequestForm";

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
}

interface LeaveBalance {
  totalLeave: number;
  usedLeave: number;
  remainingLeave: number;
  sickLeave: number;
  vacationLeave: number;
  personalLeave: number;
}

export default function SimpleLeaveRequestExample() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user data - replace with actual user data from your auth context
  const user = {
    id: "user-123",
    name: "John Doe",
  };

  // Mock leave balance - replace with actual data from your API
  const leaveBalance: LeaveBalance = {
    totalLeave: 25,
    usedLeave: 8,
    remainingLeave: 17,
    sickLeave: 10,
    vacationLeave: 15,
    personalLeave: 5,
  };

  const handleSubmitLeaveRequest = async (leaveRequest: LeaveRequest) => {
    try {
      setIsLoading(true);

      // Example API call - replace with your actual endpoint
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // if using JWT
        },
        body: JSON.stringify({
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate.toISOString().split("T")[0], // YYYY-MM-DD format
          endDate: leaveRequest.endDate.toISOString().split("T")[0],
          reason: leaveRequest.reason,
          totalDays: leaveRequest.totalDays,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit leave request");
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Success! Close the form
      setIsFormOpen(false);
      alert("Leave request submitted successfully!");
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Leave Request Example</h1>

      <Button onClick={() => setIsFormOpen(true)}>
        Open Leave Request Form
      </Button>

      <LeaveRequestForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitLeaveRequest}
        leaveBalance={leaveBalance}
        isLoading={isLoading}
        userId={user.id}
        userName={user.name}
      />
    </div>
  );
}

// Alternative example for inventory leave requests
export function InventoryLeaveRequestExample() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const user = {
    id: "user-123",
    name: "Jane Smith",
  };

  const leaveBalance: LeaveBalance = {
    totalLeave: 25,
    usedLeave: 8,
    remainingLeave: 17,
    sickLeave: 10,
    vacationLeave: 15,
    personalLeave: 5,
  };

  const handleSubmitLeaveRequest = async (leaveRequest: LeaveRequest) => {
    try {
      setIsLoading(true);

      // Inventory API expects a different format
      const response = await fetch("/api/inventory/leave-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          employeeName: user.name, // Inventory API uses employeeName instead of userId
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate.toISOString().split("T")[0],
          endDate: leaveRequest.endDate.toISOString().split("T")[0],
          reason: leaveRequest.reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit leave request");
      }

      const data = await response.json();
      console.log("API Response:", data);

      setIsFormOpen(false);
      alert("Leave request submitted successfully!");
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Inventory Leave Request Example
      </h1>

      <Button onClick={() => setIsFormOpen(true)}>
        Open Leave Request Form
      </Button>

      <LeaveRequestForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitLeaveRequest}
        leaveBalance={leaveBalance}
        isLoading={isLoading}
        userId={user.id}
        userName={user.name}
      />
    </div>
  );
}
