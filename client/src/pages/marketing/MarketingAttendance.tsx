import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
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
  Pause,
  Play
} from "lucide-react";
import { format } from "date-fns";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Custom components
import AttendanceCard from "@/components/marketing/AttendanceCard";
import CheckInModal from "@/components/marketing/CheckInModal";
import CheckOutModal from "@/components/marketing/CheckOutModal";
import LeaveRequestForm from "@/components/marketing/LeaveRequestForm";
import AttendanceCalendar from "@/components/marketing/AttendanceCalendar";

import type { MarketingAttendance, User } from "@shared/schema";

interface AttendanceWithUser extends MarketingAttendance {
  user?: User;
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
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency' | 'training' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  totalDays?: number;
}

type ViewMode = 'dashboard' | 'team' | 'calendar' | 'reports';
type StatusFilter = 'all' | 'present' | 'absent' | 'late' | 'on_leave';

export default function MarketingAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // UI states
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  // Modal states
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [leaveRequestModalOpen, setLeaveRequestModalOpen] = useState(false);
  const [selectedAttendanceUser, setSelectedAttendanceUser] = useState<string | undefined>(undefined);

  // -----------------------------
  // Data Fetching
  // -----------------------------
  const { data: rawTodayAttendance, isLoading: attendanceLoading, error: attendanceError } = useQuery<any>({
    queryKey: ['/api/marketing-attendance/today'],
    meta: { errorMessage: "Failed to load today's attendance" }
  });

  const todayAttendance: AttendanceWithUser[] = Array.isArray(rawTodayAttendance) ? rawTodayAttendance : [];

  const { data: rawAllAttendance } = useQuery<any>({
    queryKey: ['/api/marketing-attendance'],
    meta: { errorMessage: "Failed to load attendance records" }
  });

  const allAttendance: AttendanceWithUser[] = Array.isArray(rawAllAttendance) ? rawAllAttendance : [];

  const { data: metricsData } = useQuery<AttendanceMetrics>({
    queryKey: ['/api/marketing-attendance/metrics'],
    meta: { errorMessage: "Failed to load attendance metrics" }
  });

  const { data: usersData } = useQuery<User[]>({
    queryKey: ['/api/users'],
    meta: { errorMessage: "Failed to load users" }
  });

  const users: User[] = Array.isArray(usersData) ? usersData : [];

  const leaveBalance: LeaveBalance = {
    totalLeave: 30,
    usedLeave: 12,
    remainingLeave: 18,
    sickLeave: 8,
    vacationLeave: 15,
    personalLeave: 7
  };

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['/api/marketing-attendance/today']);
      queryClient.invalidateQueries(['/api/marketing-attendance/metrics']);
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // -----------------------------
  // Mutations
  // -----------------------------
  const checkInMutation = useMutation({
    mutationFn: (data: { userId?: string; latitude: number; longitude: number; location?: string; workDescription?: string }) =>
      apiRequest('/api/marketing-attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/marketing-attendance/today']);
      queryClient.invalidateQueries(['/api/marketing-attendance/metrics']);
      toast({ title: "Successfully checked in!" });
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (data: { userId?: string; latitude: number; longitude: number; location?: string; workDescription?: string; visitCount?: number; tasksCompleted?: number; outcome?: string; nextAction?: string }) =>
      apiRequest('/api/marketing-attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/marketing-attendance/today']);
      queryClient.invalidateQueries(['/api/marketing-attendance/metrics']);
      toast({ title: "Successfully checked out!" });
    }
  });

  const leaveRequestMutation = useMutation({
    mutationFn: (leaveRequest: LeaveRequest) =>
      apiRequest('/api/marketing-attendance/leave-request', { method: 'POST', body: JSON.stringify(leaveRequest) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/marketing-attendance']);
      queryClient.invalidateQueries(['/api/marketing-attendance/metrics']);
      toast({ title: "Leave request submitted successfully!" });
      setLeaveRequestModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error submitting leave request", description: error.message, variant: "destructive" });
    }
  });

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleCheckIn = (userId: string) => {
    setSelectedAttendanceUser(userId);
    setCheckInModalOpen(true);
  };

  const handleCheckOut = (userId: string) => {
    setSelectedAttendanceUser(userId);
    setCheckOutModalOpen(true);
  };

  const handleCheckInSubmit = async (data: { latitude: number; longitude: number; location?: string; workDescription?: string }) => {
    try {
      const result = await checkInMutation.mutateAsync({ userId: selectedAttendanceUser, ...data });
      return { attendanceId: result.id, success: true };
    } catch (error: any) {
      return { attendanceId: '', success: false, error: error.message || 'Check-in failed' };
    }
  };

  const handleCheckOutSubmit = async (data: { latitude: number; longitude: number; location?: string; workDescription?: string; visitCount?: number; tasksCompleted?: number; outcome?: string; nextAction?: string }) => {
    try {
      const result = await checkOutMutation.mutateAsync({ userId: selectedAttendanceUser, ...data });
      return { attendanceId: result.id, success: true };
    } catch (error: any) {
      return { attendanceId: '', success: false, error: error.message || 'Check-out failed' };
    }
  };

  const handleLeaveRequestSubmit = (leaveRequest: LeaveRequest) => leaveRequestMutation.mutate(leaveRequest);

  // -----------------------------
  // Filtered & Computed
  // -----------------------------
  const filteredAttendance = useMemo(() => {
    return todayAttendance.filter(record => {
      const matchesSearch = !searchTerm ||
        record.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'present' && record.attendanceStatus === 'present') ||
        (statusFilter === 'absent' && record.attendanceStatus === 'absent') ||
        (statusFilter === 'late' && record.attendanceStatus === 'late') ||
        (statusFilter === 'on_leave' && record.isOnLeave);

      return matchesSearch && matchesStatus;
    });
  }, [todayAttendance, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    return todayAttendance.reduce((acc, record) => {
      if (record.isOnLeave) acc.on_leave++;
      else acc[record.attendanceStatus] = (acc[record.attendanceStatus] || 0) + 1;
      return acc;
    }, { present: 0, absent: 0, late: 0, on_leave: 0 } as Record<string, number>);
  }, [todayAttendance]);

  const displayMetrics: AttendanceMetrics = metricsData || {
    totalEmployees: users.length,
    presentToday: statusCounts.present,
    absentToday: statusCounts.absent,
    lateToday: statusCounts.late,
    onLeaveToday: statusCounts.on_leave,
    averageWorkHours: 8.5,
    attendanceRate: users.length > 0 ? (statusCounts.present / users.length) * 100 : 0,
    monthlyStats: { totalDays: 22, presentDays: 18, absentDays: 2, leaveDays: 2 }
  };

  const selectedUser = selectedAttendanceUser ? users.find(u => u.id === selectedAttendanceUser) : undefined;

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
          <h1 className="text-3xl font-bold">Marketing Attendance</h1>
          <p className="text-muted-foreground">
            Track team attendance with live location and leave management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/marketing-attendance/today'] });
              queryClient.invalidateQueries({ queryKey: ['/api/marketing-attendance/metrics'] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setLeaveRequestModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-2" />Team Status</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-2" />Calendar View</TabsTrigger>
          <TabsTrigger value="reports"><TrendingUp className="h-4 w-4 mr-2" />Reports</TabsTrigger>
        </TabsList>

        {/* TabsContent can include Dashboard, Team, Calendar, Reports */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Dashboard metrics cards, quick actions, and today's activity */}
          {/* ...you can reuse the code from previous snippet here */}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {checkInModalOpen && selectedAttendanceUser && (
        <CheckInModal
          open={checkInModalOpen}
          onOpenChange={setCheckInModalOpen}
          userId={selectedAttendanceUser}
          onSubmit={handleCheckInSubmit}
        />
      )}
      {checkOutModalOpen && selectedAttendanceUser && (
        <CheckOutModal
          open={checkOutModalOpen}
          onOpenChange={setCheckOutModalOpen}
          userId={selectedAttendanceUser}
          onSubmit={handleCheckOutSubmit}
        />
      )}
      {leaveRequestModalOpen && (
        <LeaveRequestForm
          open={leaveRequestModalOpen}
          onOpenChange={setLeaveRequestModalOpen}
          onSubmit={handleLeaveRequestSubmit}
          leaveBalance={leaveBalance}
        />
      )}
    </div>
  );
}
