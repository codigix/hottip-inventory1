import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import type { MarketingAttendance, User } from "@shared/schema";

interface AttendanceWithUser extends MarketingAttendance {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AttendanceCalendarProps {
  attendanceData: AttendanceWithUser[];
  users: User[];
  selectedUserId?: string;
  onUserSelect?: (userId: string | undefined) => void;
  onDateSelect?: (date: Date) => void;
  isManager?: boolean;
}

interface DayAttendance {
  date: Date;
  attendance: AttendanceWithUser[];
  presentCount: number;
  absentCount: number;
  lateCount: number;
  onLeaveCount: number;
}

const statusColors = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-orange-100 text-orange-800 border-orange-200',
  half_day: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  holiday: 'bg-blue-100 text-blue-800 border-blue-200'
};

const statusIcons = {
  present: <CheckCircle className="h-3 w-3" />,
  absent: <XCircle className="h-3 w-3" />,
  late: <Clock className="h-3 w-3" />,
  half_day: <AlertCircle className="h-3 w-3" />,
  holiday: <CalendarIcon className="h-3 w-3" />
};

export default function AttendanceCalendar({
  attendanceData,
  users,
  selectedUserId,
  onUserSelect,
  onDateSelect,
  isManager = false
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'team' | 'individual'>('team');

  // Filter attendance data based on selected user
  const filteredAttendance = useMemo(() => {
    if (!selectedUserId) return attendanceData;
    return attendanceData.filter(record => record.userId === selectedUserId);
  }, [attendanceData, selectedUserId]);

  // Group attendance data by date
  const attendanceByDate = useMemo(() => {
    const grouped: Record<string, AttendanceWithUser[]> = {};
    
    filteredAttendance.forEach(record => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });
    
    return grouped;
  }, [filteredAttendance]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start, end });
    
    // Add padding days for proper calendar layout
    const startDay = getDay(start); // 0 = Sunday, 1 = Monday, etc.
    const paddingDays = Array(startDay).fill(null);
    
    return [...paddingDays, ...monthDays];
  }, [currentMonth]);

  // Get attendance summary for a specific date
  const getDayAttendance = (date: Date): DayAttendance => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAttendance = attendanceByDate[dateKey] || [];
    
    const summary = dayAttendance.reduce(
      (acc, record) => {
        switch (record.attendanceStatus) {
          case 'present':
            acc.presentCount++;
            break;
          case 'absent':
            acc.absentCount++;
            break;
          case 'late':
            acc.lateCount++;
            break;
          default:
            break;
        }
        if (record.isOnLeave) {
          acc.onLeaveCount++;
        }
        return acc;
      },
      { presentCount: 0, absentCount: 0, lateCount: 0, onLeaveCount: 0 }
    );
    
    return {
      date,
      attendance: dayAttendance,
      ...summary
    };
  };

  // Get the primary status for a day (used for coloring)
  const getDayPrimaryStatus = (dayData: DayAttendance): string => {
    if (dayData.onLeaveCount > 0) return 'holiday';
    if (dayData.absentCount > 0) return 'absent';
    if (dayData.lateCount > 0) return 'late';
    if (dayData.presentCount > 0) return 'present';
    return 'absent';
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Get selected user details
  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;

  // Get user initials
  const getUserInitials = (user: User) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth} data-testid="button-prev-month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg font-semibold" data-testid="current-month">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={goToNextMonth} data-testid="button-next-month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'team' | 'individual')}>
                <SelectTrigger className="w-32" data-testid="select-view-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team View</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>

              {/* User Selection (for individual view) */}
              {viewMode === 'individual' && isManager && (
                <Select value={selectedUserId || 'all'} onValueChange={(value) => onUserSelect?.(value === 'all' ? undefined : value)}>
                  <SelectTrigger className="w-48" data-testid="select-user">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Team Members</SelectItem>
                    {users.filter(user => user.id && user.id.trim() !== '').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {selectedUser && (
            <div className="flex items-center space-x-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{getUserInitials(selectedUser)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                Viewing attendance for {selectedUser.firstName} {selectedUser.lastName}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24 p-1"></div>;
                }

                const dayData = getDayAttendance(day);
                const primaryStatus = getDayPrimaryStatus(dayData);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <TooltipProvider key={format(day, 'yyyy-MM-dd')}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-24 p-1 border rounded-lg cursor-pointer transition-colors ${
                            isCurrentMonth
                              ? 'border-border hover:bg-muted/50'
                              : 'border-muted bg-muted/20'
                          } ${
                            isCurrentDay
                              ? 'ring-2 ring-primary'
                              : ''
                          }`}
                          onClick={() => onDateSelect?.(day)}
                          data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                        >
                          {/* Date Number */}
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-medium ${
                                isCurrentMonth
                                  ? isCurrentDay
                                    ? 'text-primary font-bold'
                                    : 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {format(day, 'd')}
                            </span>
                            
                            {/* Status Indicator */}
                            {dayData.attendance.length > 0 && (
                              <div className={`text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                                statusColors[primaryStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                              }`}>
                                {statusIcons[primaryStatus as keyof typeof statusIcons]}
                              </div>
                            )}
                          </div>

                          {/* Attendance Summary */}
                          {dayData.attendance.length > 0 && (
                            <div className="space-y-1">
                              {viewMode === 'team' ? (
                                // Team view - show counts
                                <div className="space-y-0.5 text-xs">
                                  {dayData.presentCount > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-green-600">Present</span>
                                      <span className="font-medium">{dayData.presentCount}</span>
                                    </div>
                                  )}
                                  {dayData.absentCount > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-red-600">Absent</span>
                                      <span className="font-medium">{dayData.absentCount}</span>
                                    </div>
                                  )}
                                  {dayData.lateCount > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-orange-600">Late</span>
                                      <span className="font-medium">{dayData.lateCount}</span>
                                    </div>
                                  )}
                                  {dayData.onLeaveCount > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-blue-600">Leave</span>
                                      <span className="font-medium">{dayData.onLeaveCount}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Individual view - show specific times
                                <div className="space-y-0.5 text-xs">
                                  {dayData.attendance.map((record, idx) => (
                                    <div key={idx} className="truncate">
                                      {record.checkInTime && (
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-2 w-2" />
                                          <span>{format(new Date(record.checkInTime), 'HH:mm')}</span>
                                        </div>
                                      )}
                                      {record.isOnLeave && (
                                        <Badge variant="outline" className="text-xs">
                                          {record.leaveType?.toUpperCase() || 'LEAVE'}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-2">
                          <p className="font-medium">{format(day, 'EEEE, MMMM d, yyyy')}</p>
                          {dayData.attendance.length > 0 ? (
                            <div className="space-y-1 text-xs">
                              {dayData.attendance.map((record, idx) => (
                                <div key={idx} className="border-b border-muted last:border-0 pb-1 last:pb-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {record.user?.firstName} {record.user?.lastName}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${
                                      statusColors[record.attendanceStatus as keyof typeof statusColors]
                                    }`}>
                                      {record.attendanceStatus.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </div>
                                  {record.checkInTime && (
                                    <p>Check-in: {format(new Date(record.checkInTime), 'HH:mm')}</p>
                                  )}
                                  {record.checkOutTime && (
                                    <p>Check-out: {format(new Date(record.checkOutTime), 'HH:mm')}</p>
                                  )}
                                  {record.isOnLeave && (
                                    <p className="text-blue-600">
                                      On {record.leaveType?.replace('_', ' ')} leave
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No attendance records</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(statusColors).map(([status, colorClass]) => (
              <div key={status} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full border ${colorClass}`}>
                  {statusIcons[status as keyof typeof statusIcons]}
                </div>
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}