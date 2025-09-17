import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  MapPin, Clock, Users, CalendarIcon, Search, Filter,
  CheckCircle, XCircle, Camera, Navigation, Timer,
  TrendingUp, UserCheck, Building
} from "lucide-react";
import CheckInModal from "@/components/logistics/CheckInModal";
import CheckOutModal from "@/components/logistics/CheckOutModal";

// Types
interface LogisticsAttendance {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkInPhotoPath?: string;
  checkOutPhotoPath?: string;
  workDescription?: string;
  taskCount?: number;
  deliveriesCompleted?: number;
  status: 'checked_in' | 'checked_out';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AttendanceMetrics {
  totalPresent: number;
  checkedIn: number;
  checkedOut: number;
  averageWorkHours: number;
  totalDeliveries: number;
  activeTasks: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function LogisticsAttendance() {
  const { toast } = useToast();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  // Queries
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<LogisticsAttendance[]>({
    queryKey: ['/api/logistics/attendance'],
  });

  const { data: todayAttendance = [] } = useQuery<LogisticsAttendance[]>({
    queryKey: ['/api/logistics/attendance/today'],
  });

  const { data: metrics = {
    totalPresent: 0,
    checkedIn: 0,
    checkedOut: 0,
    averageWorkHours: 0,
    totalDeliveries: 0,
    activeTasks: 0
  } } = useQuery<AttendanceMetrics>({
    queryKey: ['/api/logistics/attendance/metrics'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: checkInModalOpen || checkOutModalOpen,
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: (data: { 
      userId?: string; 
      latitude: number; 
      longitude: number; 
      location?: string; 
      photoPath?: string; 
      workDescription?: string 
    }) => apiRequest('/api/logistics/attendance/check-in', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/attendance/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/attendance'] });
      toast({ title: "Successfully checked in!" });
      setCheckInModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error checking in", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (data: { 
      userId?: string; 
      latitude: number; 
      longitude: number; 
      location?: string; 
      photoPath?: string;
      workDescription?: string;
      taskCount?: number;
      deliveriesCompleted?: number;
    }) => {
      const attendanceRecord = todayAttendance.find(a => a.userId === (data.userId || selectedUserId));
      if (!attendanceRecord?.id) {
        throw new Error("No check-in record found for today");
      }
      return apiRequest(`/api/logistics/attendance/${attendanceRecord.id}/check-out`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/attendance/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/attendance'] });
      toast({ title: "Successfully checked out!" });
      setCheckOutModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error checking out", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Handlers
  const handleCheckIn = (userId: string) => {
    setSelectedUserId(userId);
    setCheckInModalOpen(true);
  };

  const handleCheckOut = (userId: string) => {
    setSelectedUserId(userId);
    setCheckOutModalOpen(true);
  };

  const handleCheckInSubmit = (data: {
    latitude: number;
    longitude: number;
    location?: string;
    photoPath?: string;
    workDescription?: string;
  }) => {
    checkInMutation.mutate({
      userId: selectedUserId,
      ...data
    });
  };

  const handleCheckOutSubmit = (data: {
    latitude: number;
    longitude: number;
    location?: string;
    photoPath?: string;
    workDescription?: string;
    taskCount?: number;
    deliveriesCompleted?: number;
  }) => {
    checkOutMutation.mutate({
      userId: selectedUserId,
      ...data
    });
  };

  // Filter attendance records
  const filteredAttendance = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6" data-testid="logistics-attendance-page">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Logistics Attendance</h1>
          <p className="text-muted-foreground" data-testid="page-description">
            GPS-enabled attendance tracking for logistics team
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="metrics-grid">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-present">{metrics.totalPresent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="metric-checked-in">{metrics.checkedIn}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="metric-checked-out">{metrics.checkedOut}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-avg-hours">{metrics.averageWorkHours.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-deliveries">{metrics.totalDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-tasks">{metrics.activeTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="filter-status">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Attendance Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Team Attendance</h2>
        
        {attendanceLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="attendance-grid">
            {filteredAttendance.map((record) => (
              <AttendanceCard
                key={record.id}
                attendance={record}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
              />
            ))}
          </div>
        )}
      </div>

      {/* GPS Check-in/out Modals */}
      <CheckInModal
        open={checkInModalOpen}
        onOpenChange={setCheckInModalOpen}
        onCheckIn={handleCheckInSubmit}
        isLoading={checkInMutation.isPending}
        userId={selectedUserId}
        userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : undefined}
      />

      <CheckOutModal
        open={checkOutModalOpen}
        onOpenChange={setCheckOutModalOpen}
        onCheckOut={handleCheckOutSubmit}
        isLoading={checkOutMutation.isPending}
        userId={selectedUserId}
        userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : undefined}
        checkInTime={selectedUserId ? 
          todayAttendance.find(a => a.userId === selectedUserId)?.checkInTime?.toString() : undefined
        }
      />
    </div>
  );
}

// Attendance Card Component
interface AttendanceCardProps {
  attendance: LogisticsAttendance;
  onCheckIn: (userId: string) => void;
  onCheckOut: (userId: string) => void;
}

function AttendanceCard({ attendance, onCheckIn, onCheckOut }: AttendanceCardProps) {
  const isCheckedIn = attendance.status === 'checked_in' && attendance.checkInTime && !attendance.checkOutTime;
  const isCheckedOut = attendance.status === 'checked_out' && attendance.checkOutTime;
  
  return (
    <Card className="relative" data-testid={`attendance-card-${attendance.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10" data-testid={`avatar-${attendance.userId}`}>
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10">
              {attendance.user ? `${attendance.user.firstName[0]}${attendance.user.lastName[0]}` : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate" data-testid={`name-${attendance.userId}`}>
              {attendance.user ? `${attendance.user.firstName} ${attendance.user.lastName}` : 'Unknown User'}
            </h3>
            <p className="text-sm text-muted-foreground truncate" data-testid={`email-${attendance.userId}`}>
              {attendance.user?.email || 'No email'}
            </p>
          </div>

          <Badge 
            variant={isCheckedIn ? "default" : isCheckedOut ? "secondary" : "outline"}
            data-testid={`status-badge-${attendance.userId}`}
          >
            {isCheckedIn ? "Checked In" : isCheckedOut ? "Checked Out" : "Not Started"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Check-in Info */}
        {attendance.checkInTime && (
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-green-600" />
              <span className="font-medium">In:</span>
              <span className="ml-1" data-testid={`checkin-time-${attendance.userId}`}>
                {format(new Date(attendance.checkInTime), 'HH:mm')}
              </span>
            </div>
            
            {attendance.checkInLocation && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                <span className="truncate" data-testid={`checkin-location-${attendance.userId}`}>
                  {attendance.checkInLocation}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Check-out Info */}
        {attendance.checkOutTime && (
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-red-600" />
              <span className="font-medium">Out:</span>
              <span className="ml-1" data-testid={`checkout-time-${attendance.userId}`}>
                {format(new Date(attendance.checkOutTime), 'HH:mm')}
              </span>
            </div>
            
            {attendance.checkOutLocation && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                <span className="truncate" data-testid={`checkout-location-${attendance.userId}`}>
                  {attendance.checkOutLocation}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Work Metrics */}
        {(attendance.taskCount || attendance.deliveriesCompleted) && (
          <div className="flex items-center justify-between text-sm">
            {attendance.taskCount && (
              <span data-testid={`task-count-${attendance.userId}`}>
                Tasks: {attendance.taskCount}
              </span>
            )}
            {attendance.deliveriesCompleted && (
              <span data-testid={`delivery-count-${attendance.userId}`}>
                Deliveries: {attendance.deliveriesCompleted}
              </span>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!attendance.checkInTime ? (
            <Button 
              onClick={() => onCheckIn(attendance.userId)}
              className="flex-1"
              size="sm"
              data-testid={`button-checkin-${attendance.userId}`}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Check In
            </Button>
          ) : !attendance.checkOutTime ? (
            <Button 
              onClick={() => onCheckOut(attendance.userId)}
              variant="outline"
              className="flex-1"
              size="sm"
              data-testid={`button-checkout-${attendance.userId}`}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          ) : (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">
              Day completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}