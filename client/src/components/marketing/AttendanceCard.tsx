import { useState } from "react";
import { Clock, MapPin, User, Calendar, AlertCircle, CheckCircle, XCircle, Pause, Play } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { MarketingAttendance, User as UserType } from "@shared/schema";

interface AttendanceWithUser extends MarketingAttendance {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AttendanceCardProps {
  attendance: AttendanceWithUser;
  onCheckIn?: (userId: string) => void;
  onCheckOut?: (userId: string) => void;
  onStartBreak?: (attendanceId: string) => void;
  onEndBreak?: (attendanceId: string) => void;
  isManager?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'present':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'absent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'late':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'half_day':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'holiday':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present':
      return <CheckCircle className="h-4 w-4" />;
    case 'absent':
      return <XCircle className="h-4 w-4" />;
    case 'late':
      return <Clock className="h-4 w-4" />;
    case 'half_day':
      return <AlertCircle className="h-4 w-4" />;
    case 'holiday':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function AttendanceCard({ 
  attendance, 
  onCheckIn, 
  onCheckOut, 
  onStartBreak, 
  onEndBreak,
  isManager = false 
}: AttendanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const user = attendance.user;
  const isCheckedIn = !!attendance.checkInTime;
  const isCheckedOut = !!attendance.checkOutTime;
  const isOnBreak = !!attendance.breakStartTime && !attendance.breakEndTime;
  const canCheckOut = isCheckedIn && !isCheckedOut;
  const canStartBreak = isCheckedIn && !isCheckedOut && !isOnBreak;
  const canEndBreak = isOnBreak;

  // Calculate work duration
  const getWorkDuration = () => {
    if (!attendance.checkInTime) return "Not checked in";
    
    const startTime = new Date(attendance.checkInTime);
    const endTime = attendance.checkOutTime ? new Date(attendance.checkOutTime) : new Date();
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Calculate break duration
  const getBreakDuration = () => {
    if (!attendance.breakStartTime) return "0m";
    
    const startTime = new Date(attendance.breakStartTime);
    const endTime = attendance.breakEndTime ? new Date(attendance.breakEndTime) : new Date();
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    
    return `${minutes}m`;
  };

  const getUserInitials = () => {
    if (!user) return "NA";
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getLocationText = (latitude: string | null, longitude: string | null, location: string | null) => {
    if (location) return location;
    if (latitude && longitude) return `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
    return "No location";
  };

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-light" data-testid={`attendance-name-${user?.id}`}>
                {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
              </CardTitle>
              <p className="text-xs text-muted-foreground" data-testid={`attendance-role-${user?.id}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Employee'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              className={`text-xs border ${getStatusColor(attendance.attendanceStatus)}`}
              data-testid={`attendance-status-${user?.id}`}
            >
              {getStatusIcon(attendance.attendanceStatus)}
              <span className="ml-1 capitalize">{attendance.attendanceStatus.replace('_', ' ')}</span>
            </Badge>
            
            {attendance.isOnLeave && (
              <Badge variant="outline" className="text-xs" data-testid={`leave-badge-${user?.id}`}>
                On Leave
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Check-in</span>
            </div>
            <p className="font-light" data-testid={`checkin-time-${user?.id}`}>
              {attendance.checkInTime 
                ? format(new Date(attendance.checkInTime), 'HH:mm')
                : '--:--'
              }
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Check-out</span>
            </div>
            <p className="font-light" data-testid={`checkout-time-${user?.id}`}>
              {attendance.checkOutTime 
                ? format(new Date(attendance.checkOutTime), 'HH:mm')
                : '--:--'
              }
            </p>
          </div>
        </div>

        {/* Work Duration and Status */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-muted-foreground">Duration</p>
            <p className="font-light" data-testid={`work-duration-${user?.id}`}>{getWorkDuration()}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-muted-foreground">Break</p>
            <p className="font-light" data-testid={`break-duration-${user?.id}`}>{getBreakDuration()}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-muted-foreground">Total Hours</p>
            <p className="font-light" data-testid={`total-hours-${user?.id}`}>
              {attendance.totalHours ? `${attendance.totalHours}h` : '0h'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!isManager && (
          <div className="flex flex-wrap gap-2">
            {!isCheckedIn && (
              <Button 
                size="sm" 
                onClick={() => onCheckIn?.(user?.id || attendance.userId)}
                className="flex-1"
                data-testid={`button-checkin-${user?.id}`}
              >
                <Play className="h-3 w-3 mr-1" />
                Check In
              </Button>
            )}
            
            {canCheckOut && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCheckOut?.(user?.id || attendance.userId)}
                className="flex-1"
                data-testid={`button-checkout-${user?.id}`}
              >
                <Pause className="h-3 w-3 mr-1" />
                Check Out
              </Button>
            )}
            
            {canStartBreak && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => onStartBreak?.(attendance.id)}
                data-testid={`button-start-break-${user?.id}`}
              >
                <Pause className="h-3 w-3 mr-1" />
                Start Break
              </Button>
            )}
            
            {canEndBreak && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => onEndBreak?.(attendance.id)}
                data-testid={`button-end-break-${user?.id}`}
              >
                <Play className="h-3 w-3 mr-1" />
                End Break
              </Button>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-xs"
            data-testid={`button-toggle-details-${user?.id}`}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {isExpanded && (
            <div className="mt-3 space-y-3 text-xs">
              {/* Location Details */}
              <div className="space-y-2">
                <h4 className="font-light text-muted-foreground">Location Information</h4>
                <div className="grid grid-cols-1 gap-2">
                  {attendance.checkInLatitude && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-3 w-3 mt-0.5 text-green-500" />
                      <div>
                        <p className="font-light">Check-in Location</p>
                        <p className="text-muted-foreground" data-testid={`checkin-location-${user?.id}`}>
                          {getLocationText(
                            attendance.checkInLatitude, 
                            attendance.checkInLongitude, 
                            attendance.checkInLocation
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {attendance.checkOutLatitude && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-3 w-3 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-light">Check-out Location</p>
                        <p className="text-muted-foreground" data-testid={`checkout-location-${user?.id}`}>
                          {getLocationText(
                            attendance.checkOutLatitude, 
                            attendance.checkOutLongitude, 
                            attendance.checkOutLocation
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Description */}
              {attendance.workDescription && (
                <div>
                  <h4 className="font-light text-muted-foreground mb-1">Work Description</h4>
                  <p className="text-muted-foreground" data-testid={`work-description-${user?.id}`}>
                    {attendance.workDescription}
                  </p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <p className="text-muted-foreground">Visits</p>
                  <p className="font-light" data-testid={`visit-count-${user?.id}`}>{attendance.visitCount || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasks</p>
                  <p className="font-light" data-testid={`tasks-completed-${user?.id}`}>{attendance.tasksCompleted || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}