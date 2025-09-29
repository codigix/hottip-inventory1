import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Clock,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Timer,
  TrendingUp,
  Plus,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
} from "lucide-react";
import { format } from "date-fns";

import { useToast } from "@/hooks/use-toast";
import { marketingAttendance, leaveRequests } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Import our custom components
import AttendanceCard from "@/components/marketing/AttendanceCard";
import CheckInModal from "@/components/marketing/CheckInModal";
import CheckOutModal from "@/components/marketing/CheckOutModal";
import LeaveRequestForm from "@/components/marketing/LeaveRequestForm";
import AttendanceCalendar from "@/components/marketing/AttendanceCalendar";

// Local types to avoid coupling to server schema typings in the client
// Only include fields actually used by this page
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
};

interface MarketingAttendance {
  id: string;
  userId: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceStatus?: "present" | "absent" | "late";
  isOnLeave?: boolean;
}

interface AttendanceWithUser extends MarketingAttendance {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AttendanceMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  averageWorkHours: number;
  attendanceRate: number;
  monthlyStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
  };
}

interface LeaveBalance {
  totalLeave: number;
  usedLeave: number;
  remainingLeave: number;
  sickLeave: number;
  vacationLeave: number;
  personalLeave: number;
}

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

type ViewMode = "dashboard" | "team" | "calendar" | "reports";
type StatusFilter = "all" | "present" | "absent" | "late" | "on_leave";

export default function MarketingAttendance() {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined
  );

  // Modal states
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [leaveRequestModalOpen, setLeaveRequestModalOpen] = useState(false);
  const [selectedAttendanceUser, setSelectedAttendanceUser] = useState<
    string | undefined
  >(undefined);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API Queries
  const {
    data: todayAttendance = [],
    isLoading: attendanceLoading,
    error: attendanceError,
  } = useQuery({
    queryKey: ["marketing-attendance", "today"],
    queryFn: marketingAttendance.getToday,
  });

  const { data: allAttendance = [] } = useQuery({
    queryKey: ["marketing-attendance", "all"],
    queryFn: marketingAttendance.getAll,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["marketing-attendance", "metrics"],
    queryFn: marketingAttendance.getMetrics,
  });

  const { data: leaveRequestsData = [], error: leaveRequestsError } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: leaveRequests.getAll,
    retry: 1, // Only retry once for leave requests
    retryOnMount: false, // Don't retry on component mount
  });

  // Mock users for now - in a real app, this would come from an API
  const users: User[] = [
    {
      id: "dev-admin-user",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "admin",
    },
    {
      id: "dev-employee-1",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      role: "employee",
    },
    {
      id: "dev-employee-2",
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob@example.com",
      role: "employee",
    },
  ];

  // Calculate leave balance from leave requests
  const leaveBalance: LeaveBalance = useMemo(() => {
    const totalLeave = 30; // This would come from user profile in a real app

    // Debug logging
    console.log(
      "leaveRequestsData:",
      leaveRequestsData,
      "Type:",
      typeof leaveRequestsData,
      "IsArray:",
      Array.isArray(leaveRequestsData)
    );
    if (leaveRequestsError) {
      console.log("leaveRequestsError:", leaveRequestsError);
    }

    // Ensure leaveRequestsData is always an array
    const safeLeaveRequestsData = Array.isArray(leaveRequestsData)
      ? leaveRequestsData
      : [];
    const usedLeave = safeLeaveRequestsData
      .filter((req) => req.status === "approved" && req.totalDays)
      .reduce((sum, req) => sum + (req.totalDays || 0), 0);

    return {
      totalLeave,
      usedLeave,
      remainingLeave: totalLeave - usedLeave,
      sickLeave: 8,
      vacationLeave: 15,
      personalLeave: 7,
    };
  }, [leaveRequestsData]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: marketingAttendance.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-attendance"] });
      toast({ title: "Successfully checked in!" });
    },
    onError: (error: any) => {
      console.error("Check-in mutation error:", error);
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: marketingAttendance.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-attendance"] });
      toast({ title: "Successfully checked out!" });
    },
    onError: (error: any) => {
      console.error("Check-out mutation error:", error);
      toast({
        title: "Check-out failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave request submission mutation
  const leaveRequestMutation = useMutation({
    mutationFn: (data: Omit<LeaveRequest, "id" | "status">) =>
      leaveRequests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({ title: "Leave request submitted successfully!" });
      setLeaveRequestModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting leave request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter attendance based on search and status
  const filteredAttendance = useMemo(() => {
    return todayAttendance.filter((record) => {
      const matchesSearch =
        !searchTerm ||
        record.user?.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        record.user?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "present" && record.attendanceStatus === "present") ||
        (statusFilter === "absent" && record.attendanceStatus === "absent") ||
        (statusFilter === "late" && record.attendanceStatus === "late") ||
        (statusFilter === "on_leave" && record.isOnLeave);

      return matchesSearch && matchesStatus;
    });
  }, [todayAttendance, searchTerm, statusFilter]);

  // Handle check-in
  const handleCheckIn = (userId: string) => {
    setSelectedAttendanceUser(userId);
    setCheckInModalOpen(true);
  };

  // Handle check-out
  const handleCheckOut = (userId: string) => {
    setSelectedAttendanceUser(userId);
    setCheckOutModalOpen(true);
  };

  // Handle GPS check-in submission - FIXED: Return Promise for new modal interface
  const handleCheckInSubmit = async (data: {
    latitude: number;
    longitude: number;
    location?: string;
    workDescription?: string;
  }): Promise<{ attendanceId: string; success: boolean; error?: string }> => {
    try {
      const result = await checkInMutation.mutateAsync({
        userId: selectedAttendanceUser,
        ...data,
      });

      return {
        attendanceId: result.id,
        success: true,
      };
    } catch (error: any) {
      return {
        attendanceId: "",
        success: false,
        error: error.message || "Check-in failed",
      };
    }
  };

  // Handle GPS check-out submission - FIXED: Return Promise for new modal interface
  const handleCheckOutSubmit = async (data: {
    latitude: number;
    longitude: number;
    location?: string;
    workDescription?: string;
    visitCount?: number;
    tasksCompleted?: number;
    outcome?: string;
    nextAction?: string;
  }): Promise<{ attendanceId: string; success: boolean; error?: string }> => {
    try {
      const result = await checkOutMutation.mutateAsync({
        userId: selectedAttendanceUser,
        ...data,
      });

      return {
        attendanceId: result.id,
        success: true,
      };
    } catch (error: any) {
      return {
        attendanceId: "",
        success: false,
        error: error.message || "Check-out failed",
      };
    }
  };

  // Handle leave request submission
  const handleLeaveRequestSubmit = (leaveRequest: LeaveRequest) => {
    leaveRequestMutation.mutate(leaveRequest);
  };

  // Get attendance status counts
  const statusCounts = useMemo(() => {
    const counts = todayAttendance.reduce(
      (acc, record) => {
        if (record.isOnLeave) {
          acc.on_leave++;
        } else {
          acc[record.attendanceStatus] =
            (acc[record.attendanceStatus] || 0) + 1;
        }
        return acc;
      },
      { present: 0, absent: 0, late: 0, on_leave: 0 } as Record<string, number>
    );

    return counts;
  }, [todayAttendance]);

  // Default metrics if loading
  const displayMetrics: AttendanceMetrics = metrics || {
    totalEmployees: users.length,
    presentToday: statusCounts.present,
    absentToday: statusCounts.absent,
    lateToday: statusCounts.late,
    onLeaveToday: statusCounts.on_leave,
    averageWorkHours: 8.5,
    attendanceRate:
      users.length > 0 ? (statusCounts.present / users.length) * 100 : 0,
    monthlyStats: {
      totalDays: 22,
      presentDays: 18,
      absentDays: 2,
      leaveDays: 2,
    },
  };

  const selectedUser = selectedAttendanceUser
    ? users.find((u) => u.id === selectedAttendanceUser)
    : null;

  if (attendanceError) {
    return (
      <div className="p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load attendance data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">
            Marketing Attendance
          </h1>
          <p className="text-muted-foreground">
            Track team attendance with live location and leave management
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ["marketing-attendance"],
              });
              queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
              toast({ title: "Data refreshed successfully" });
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button
            onClick={() => setLeaveRequestModalOpen(true)}
            data-testid="button-request-leave"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as ViewMode)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="h-4 w-4 mr-2" />
            Team Status
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <TrendingUp className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-light">
                  Present Today
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-green-600"
                  data-testid="metric-present"
                >
                  {displayMetrics.presentToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  {users.length > 0
                    ? `${(
                        (displayMetrics.presentToday / users.length) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}{" "}
                  of team
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-light">
                  Absent Today
                </CardTitle>
                <UserX className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-red-600"
                  data-testid="metric-absent"
                >
                  {displayMetrics.absentToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  {users.length > 0
                    ? `${(
                        (displayMetrics.absentToday / users.length) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}{" "}
                  of team
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-light">
                  Late Arrivals
                </CardTitle>
                <Timer className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-orange-600"
                  data-testid="metric-late"
                >
                  {displayMetrics.lateToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  {users.length > 0
                    ? `${(
                        (displayMetrics.lateToday / users.length) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}{" "}
                  of team
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-light">On Leave</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-blue-600"
                  data-testid="metric-leave"
                >
                  {displayMetrics.onLeaveToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  {users.length > 0
                    ? `${(
                        (displayMetrics.onLeaveToday / users.length) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}{" "}
                  of team
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-16 flex-col space-y-2"
                  onClick={() => setCheckInModalOpen(true)}
                  data-testid="quick-checkin"
                >
                  <Play className="h-5 w-5" />
                  <span>Check In</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 flex-col space-y-2"
                  onClick={() => setCheckOutModalOpen(true)}
                  data-testid="quick-checkout"
                >
                  <Pause className="h-5 w-5" />
                  <span>Check Out</span>
                </Button>

                <Button
                  variant="secondary"
                  className="h-16 flex-col space-y-2"
                  onClick={() => setLeaveRequestModalOpen(true)}
                  data-testid="quick-leave-request"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Request Leave</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : todayAttendance.length > 0 ? (
                <div className="space-y-3">
                  {todayAttendance.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {record.user?.firstName?.[0]}
                          {record.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-light">
                            {record.user?.firstName} {record.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.checkInTime
                              ? `Checked in at ${format(
                                  new Date(record.checkInTime),
                                  "HH:mm"
                                )}`
                              : "Not checked in"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          record.attendanceStatus === "present"
                            ? "default"
                            : record.attendanceStatus === "late"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {record.isOnLeave
                          ? "On Leave"
                          : (record.attendanceStatus ?? "UNKNOWN")
                              .replace("_", " ")
                              .toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No attendance records for today
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Status Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                data-testid="search-team"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-48" data-testid="filter-status">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Grid */}
          {attendanceLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAttendance.map((record) => (
                <AttendanceCard
                  key={record.id}
                  attendance={record}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  isManager={true}
                />
              ))}
            </div>
          )}

          {filteredAttendance.length === 0 && !attendanceLoading && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No team members found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <AttendanceCalendar
            attendanceData={allAttendance}
            users={users}
            selectedUserId={selectedUserId}
            onUserSelect={setSelectedUserId}
            isManager={true}
          />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Working Days</span>
                    <span className="font-light">
                      {displayMetrics?.monthlyStats?.totalDays ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Present</span>
                    <span className="font-light text-green-600">
                      {displayMetrics?.monthlyStats?.presentDays ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Absent</span>
                    <span className="font-light text-red-600">
                      {displayMetrics?.monthlyStats?.absentDays ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leave Days</span>
                    <span className="font-light text-blue-600">
                      {displayMetrics?.monthlyStats?.leaveDays ?? 0}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-light">Attendance Rate</span>
                    <span className="font-bold text-green-600">
                      {(
                        ((displayMetrics?.monthlyStats?.presentDays ?? 0) /
                          (displayMetrics?.monthlyStats?.totalDays ?? 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leave Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Leave</span>
                    <span className="font-light">
                      {leaveBalance.totalLeave} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Used Leave</span>
                    <span className="font-light text-orange-600">
                      {leaveBalance.usedLeave} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Leave</span>
                    <span className="font-light text-green-600">
                      {leaveBalance.remainingLeave} days
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sick Leave</span>
                      <span>{leaveBalance.sickLeave} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Vacation Leave</span>
                      <span>{leaveBalance.vacationLeave} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Personal Leave</span>
                      <span>{leaveBalance.personalLeave} days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" data-testid="export-monthly">
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Report
                </Button>
                <Button variant="outline" data-testid="export-team">
                  <Download className="h-4 w-4 mr-2" />
                  Team Summary
                </Button>
                <Button variant="outline" data-testid="export-attendance">
                  <Download className="h-4 w-4 mr-2" />
                  Attendance Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CheckInModal
        open={checkInModalOpen}
        onOpenChange={setCheckInModalOpen}
        onCheckIn={handleCheckInSubmit}
        isLoading={checkInMutation.isPending}
        userId={selectedAttendanceUser}
        userName={
          selectedUser
            ? `${selectedUser.firstName} ${selectedUser.lastName}`
            : undefined
        }
      />

      <CheckOutModal
        open={checkOutModalOpen}
        onOpenChange={setCheckOutModalOpen}
        onCheckOut={handleCheckOutSubmit}
        isLoading={checkOutMutation.isPending}
        userId={selectedAttendanceUser}
        userName={
          selectedUser
            ? `${selectedUser.firstName} ${selectedUser.lastName}`
            : undefined
        }
        checkInTime={
          selectedAttendanceUser
            ? todayAttendance
                .find((a) => a.userId === selectedAttendanceUser)
                ?.checkInTime?.toString()
            : undefined
        }
      />

      <LeaveRequestForm
        open={leaveRequestModalOpen}
        onOpenChange={setLeaveRequestModalOpen}
        onSubmit={handleLeaveRequestSubmit}
        leaveBalance={leaveBalance}
        isLoading={leaveRequestMutation.isPending}
      />
    </div>
  );
}
