import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect } from "react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  Plus,
  CheckCircle,
  XCircle,
  CalendarDays,
} from "lucide-react";

export default function InventoryAttendance() {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [attendanceAction, setAttendanceAction] = useState<
    "check_in" | "check_out"
  >("check_in");
  const [location, setLocation] = useState("");
  const { toast } = useToast();

  // Leave Request local state
  const [leaveEmployee, setLeaveEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");

  // Fetch attendance data (with leave info)
  const {
    data: attendance,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: async () => apiRequest("GET", "/api/attendance"),
  });

  // Fetch leave requests data
  const {
    data: leaveRequestsData,
    isLoading: leaveRequestsLoading,
    refetch: refetchLeaveRequests,
  } = useQuery({
    queryKey: ["/api/inventory/attendance-with-leave"],
    queryFn: async () =>
      apiRequest("GET", "/api/inventory/attendance-with-leave"),
  });
  const BASE_URL =
  import.meta.env.VITE_API_BASE_URL;
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error(err));
  }, []);
  // Check-in/check-out mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${
          attendanceAction === "check_in" ? "Check-in" : "Check-out"
        } recorded successfully`,
      });
      setIsCheckInDialogOpen(false);
      resetAttendanceForm();
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "destructive",
      });
    },
  });

  // Leave request submission
  const leaveRequestMutation = useMutation({
    mutationFn: async (data: {
      employeeName: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      return apiRequest("POST", "/api/inventory/leave-request", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });
      setIsLeaveDialogOpen(false);
      setSelectedEmployee("");
      setLeaveType("");
      // Refresh leave requests data
      queryClient.invalidateQueries({
        queryKey: ["/api/inventory/attendance-with-leave"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  // Approve leave request mutation
  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (leaveRequestId: string) => {
      return apiRequest(
        "PUT",
        `/api/inventory/leave-request/${leaveRequestId}/approve`
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });
      // Refresh leave requests data
      queryClient.invalidateQueries({
        queryKey: ["/api/inventory/attendance-with-leave"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to approve leave request",
        variant: "destructive",
      });
    },
  });

  // Reject leave request mutation
  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async (leaveRequestId: string) => {
      return apiRequest(
        "PUT",
        `/api/inventory/leave-request/${leaveRequestId}/reject`
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request rejected successfully",
      });
      // Refresh leave requests data
      queryClient.invalidateQueries({
        queryKey: ["/api/inventory/attendance-with-leave"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reject leave request",
        variant: "destructive",
      });
    },
  });

  const resetAttendanceForm = () => {
    setSelectedEmployee("");
    setLocation("");
  };

  const handleAttendanceAction = () => {
    if (!selectedEmployee || !location) {
      toast({
        title: "Error",
        description: "Please select employee and location",
        variant: "destructive",
      });
      return;
    }

    // Ensure we only send the UUID string, not an object
    const employeeId =
      typeof selectedEmployee === "string"
        ? selectedEmployee
        : selectedEmployee?.id;

    if (!employeeId) {
      toast({
        title: "Error",
        description: "Invalid employee selected",
        variant: "destructive",
      });
      return;
    }

    const attendanceData = {
      userId: employeeId, // Send UUID string
      action: attendanceAction,
      location,
      date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      timestamp: new Date().toISOString(),
      department: "Inventory",
    };

    attendanceMutation.mutate(attendanceData);
  };

  const generateAttendanceReport = () => {
    // Generate CSV report
    const reportData = inventoryStaff || [];
    const csvContent = [
      [
        "Employee",
        "Date",
        "Check In",
        "Check Out",
        "Location",
        "Hours Worked",
        "Status",
      ],
      ...reportData.map((record: any) => [
        record.name || record.employee,
        new Date(record.date).toLocaleDateString(),
        record.checkIn || "-",
        record.checkOut || "-",
        record.location || "-",
        record.hoursWorked || "-",
        record.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Attendance report downloaded successfully",
    });
  };

  // Leave Request handler
  const handleSubmitLeave = () => {
    const startDate = (document.getElementById("startDate") as HTMLInputElement)
      ?.value;
    const endDate = (document.getElementById("endDate") as HTMLInputElement)
      ?.value;
    const reason =
      (document.getElementById("reason") as HTMLTextAreaElement)?.value || "";

    if (
      !selectedEmployee ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason.trim()
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // Find the selected employee to get their username
    const employee = employees.find((emp) => emp.id === selectedEmployee);
    if (!employee) {
      toast({
        title: "Error",
        description: "Selected employee not found",
        variant: "destructive",
      });
      return;
    }

    leaveRequestMutation.mutate({
      employeeName: employee.username,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    });
  };

  // Use real API data or empty array as fallback
  const rawAttendanceData = Array.isArray(attendance?.data)
    ? attendance.data
    : [];

  // Transform attendance data to include user names
  const inventoryStaff = rawAttendanceData.map((record: any) => {
    const user = employees.find((emp) => emp.id === record.userId);
    return {
      ...record,
      name: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
      department: user?.department || "Inventory",
    };
  });

  // Debug logging
  console.log("Raw attendance data:", rawAttendanceData);
  console.log("Employees:", employees);
  console.log("Transformed inventory staff:", inventoryStaff);

  // Transform leave requests data to include user names and calculate days
  const rawLeaveRequestsData = Array.isArray(leaveRequestsData?.data)
    ? leaveRequestsData.data
    : [];

  const leaveRequests = rawLeaveRequestsData.map((request: any) => {
    const user = employees.find((emp) => emp.id === request.userId);
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

    return {
      id: request.id,
      employee: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      days: days,
      status: request.status,
      reason: request.reason,
    };
  });

  // Debug logging for leave requests
  console.log("Raw leave requests data:", rawLeaveRequestsData);
  console.log("Transformed leave requests:", leaveRequests);

  const attendanceColumns = [
    {
      key: "name",
      header: "Employee",
      cell: (employee: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-light">{employee.name}</p>
            <p className="text-sm text-muted-foreground">
              {employee.department}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (employee: any) => {
        const statusConfig = {
          present: { color: "default", icon: CheckCircle, text: "Present" },
          absent: { color: "destructive", icon: XCircle, text: "Absent" },
          leave: { color: "outline", icon: Calendar, text: "On Leave" },
          late: { color: "outline", icon: Clock, text: "Late" },
        };
        const config =
          statusConfig[employee.status as keyof typeof statusConfig];
        const Icon = config.icon;

        return (
          <Badge
            variant={config.color as any}
            className="flex items-center space-x-1 w-fit"
          >
            <Icon className="h-3 w-3" />
            <span>{config.text}</span>
          </Badge>
        );
      },
    },
    {
      key: "checkIn",
      header: "Check In",
      cell: (employee: any) => employee.checkIn || "-",
    },
    {
      key: "checkOut",
      header: "Check Out",
      cell: (employee: any) => employee.checkOut || "-",
    },
    {
      key: "location",
      header: "Location",
    },
    {
      key: "date",
      header: "Date",
      cell: (employee: any) => new Date(employee.date).toLocaleDateString(),
    },
  ];

  const leaveColumns = [
    {
      key: "employee",
      header: "Employee",
    },
    {
      key: "leaveType",
      header: "Leave Type",
      cell: (leave: any) => <Badge variant="outline">{leave.leaveType}</Badge>,
    },
    {
      key: "startDate",
      header: "From",
      cell: (leave: any) => new Date(leave.startDate).toLocaleDateString(),
    },
    {
      key: "endDate",
      header: "To",
      cell: (leave: any) => new Date(leave.endDate).toLocaleDateString(),
    },
    {
      key: "days",
      header: "Days",
    },
    {
      key: "status",
      header: "Status",
      cell: (leave: any) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={statusColors[leave.status as keyof typeof statusColors]}
          >
            {leave.status.toUpperCase()}
          </Badge>
        );
      },
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Inventory Staff Attendance
          </h1>
          <p className="text-muted-foreground">
            Employee attendance and leave management for inventory staff
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-request-leave">
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.role === "employee") // optional: only employees
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}{" "}
                            {/* combine firstName + lastName */}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for leave..."
                    data-testid="textarea-reason"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsLeaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitLeave}
                    disabled={leaveRequestMutation.isPending}
                    data-testid="button-submit-leave"
                  >
                    {leaveRequestMutation.isPending
                      ? "Submitting..."
                      : "Submit Request"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isCheckInDialogOpen}
            onOpenChange={setIsCheckInDialogOpen}
          >
            <DialogTrigger asChild>
              <Button data-testid="button-check-in">
                <Clock className="h-4 w-4 mr-2" />
                Check In/Out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Employee Check In/Out</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select
                    value={attendanceAction}
                    onValueChange={setAttendanceAction as any}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_in">Check In</SelectItem>
                      <SelectItem value="check_out">Check Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={leaveEmployee}
                    onValueChange={setLeaveEmployee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.role === "employee") // optional: only employees
                        .map((emp) => (
                          <SelectItem
                            key={emp.id}
                            value={`${emp.firstName} ${emp.lastName}`} // combine firstName + lastName
                          >
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                      <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="fabrication">
                        Fabrication Unit
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm font-light">
                    Current Time: {new Date().toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCheckInDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAttendanceAction}
                    disabled={attendanceMutation.isPending}
                    data-testid="button-record-attendance"
                  >
                    {attendanceMutation.isPending
                      ? "Recording..."
                      : `Record ${
                          attendanceAction === "check_in"
                            ? "Check In"
                            : "Check Out"
                        }`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={generateAttendanceReport}
            data-testid="button-attendance-report"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">
                  Total Staff
                </p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">
                  Present Today
                </p>
                <p className="text-2xl font-bold text-foreground">10</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">
                  On Leave
                </p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">
                  Absent
                </p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="daily-attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily-attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>
                    Today's Attendance - {new Date().toLocaleDateString()}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchAttendance()}
                  disabled={attendanceLoading}
                >
                  {attendanceLoading ? "Loading..." : "Refresh"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    Loading attendance data...
                  </div>
                </div>
              ) : (
                <DataTable
                  data={inventoryStaff}
                  columns={attendanceColumns}
                  searchable={true}
                  searchKey="name"
                  onEdit={() => {}}
                  onView={() => {}}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-management">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Leave Requests</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchLeaveRequests()}
                    disabled={leaveRequestsLoading}
                  >
                    {leaveRequestsLoading ? "Loading..." : "Refresh"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      Loading leave requests...
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={leaveRequests}
                    columns={leaveColumns}
                    searchable={true}
                    searchKey="employee"
                    onView={() => {}}
                    onEdit={() => {}}
                  />
                )}
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      Loading pending approvals...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests
                      .filter((req) => req.status === "pending")
                      .map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                        >
                          <div>
                            <p className="font-light">{request.employee}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.leaveType} - {request.days} days
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.reason}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                rejectLeaveRequestMutation.mutate(request.id)
                              }
                              disabled={rejectLeaveRequestMutation.isPending}
                            >
                              {rejectLeaveRequestMutation.isPending
                                ? "Rejecting..."
                                : "Reject"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                approveLeaveRequestMutation.mutate(request.id)
                              }
                              disabled={approveLeaveRequestMutation.isPending}
                            >
                              {approveLeaveRequestMutation.isPending
                                ? "Approving..."
                                : "Approve"}
                            </Button>
                          </div>
                        </div>
                      ))}

                    {leaveRequests.filter((req) => req.status === "pending")
                      .length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending leave requests</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Attendance Rate</span>
                    <span className="font-bold text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Working Days</span>
                    <span className="font-bold">22</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Leaves Taken</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Late Arrivals</span>
                    <span className="font-bold">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="font-light mb-2">{employee.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Annual</p>
                          <p className="font-light">{employee.annual || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Sick</p>
                          <p className="font-light">{employee.sick || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Personal</p>
                          <p className="font-light">{employee.personal || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Work Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Work schedules and shift management</p>
                <p className="text-sm">
                  Coming soon - Schedule management features
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
