import { useState, useEffect } from "react";
import { Calendar, Clock, FileText, User, AlertCircle, CheckCircle, Send } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LeaveRequest {
  id?: string;
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency' | 'training' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
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

interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (leaveRequest: LeaveRequest) => void;
  existingRequest?: LeaveRequest | null;
  leaveBalance?: LeaveBalance;
  isLoading?: boolean;
  userId?: string;
  userName?: string;
}

const leaveTypes = [
  { value: 'sick', label: 'Sick Leave', description: 'Medical illness or health issues', color: 'bg-red-100 text-red-800' },
  { value: 'vacation', label: 'Vacation Leave', description: 'Planned time off for rest and recreation', color: 'bg-blue-100 text-blue-800' },
  { value: 'personal', label: 'Personal Leave', description: 'Personal matters or family obligations', color: 'bg-purple-100 text-purple-800' },
  { value: 'emergency', label: 'Emergency Leave', description: 'Unexpected urgent situations', color: 'bg-orange-100 text-orange-800' },
  { value: 'training', label: 'Training Leave', description: 'Professional development or training', color: 'bg-green-100 text-green-800' },
  { value: 'other', label: 'Other', description: 'Other types of leave', color: 'bg-gray-100 text-gray-800' }
];

export default function LeaveRequestForm({
  open,
  onOpenChange,
  onSubmit,
  existingRequest,
  leaveBalance,
  isLoading = false,
  userId,
  userName
}: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or when editing existing request
  useEffect(() => {
    if (open) {
      if (existingRequest) {
        setLeaveType(existingRequest.leaveType);
        setStartDate(new Date(existingRequest.startDate));
        setEndDate(new Date(existingRequest.endDate));
        setReason(existingRequest.reason);
      } else {
        setLeaveType('');
        setStartDate(undefined);
        setEndDate(undefined);
        setReason('');
      }
      setErrors({});
    }
  }, [open, existingRequest]);

  // Calculate total days for leave request
  const getTotalDays = (): number => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(endDate, startDate) + 1; // +1 to include both start and end dates
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!leaveType) {
      newErrors.leaveType = 'Please select a leave type';
    }

    if (!startDate) {
      newErrors.startDate = 'Please select a start date';
    }

    if (!endDate) {
      newErrors.endDate = 'Please select an end date';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for leave';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Please provide a more detailed reason (minimum 10 characters)';
    }

    // Check if user has sufficient leave balance
    if (leaveBalance && startDate && endDate) {
      const requestedDays = getTotalDays();
      if (requestedDays > leaveBalance.remainingLeave) {
        newErrors.balance = `Insufficient leave balance. You have ${leaveBalance.remainingLeave} days remaining.`;
      }
    }

    // Check if start date is in the past (except for sick leave)
    if (startDate && leaveType !== 'sick' && leaveType !== 'emergency') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past for this leave type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;

    const leaveRequest: LeaveRequest = {
      id: existingRequest?.id,
      leaveType: leaveType as LeaveRequest['leaveType'],
      startDate: startDate!,
      endDate: endDate!,
      reason: reason.trim(),
      totalDays: getTotalDays()
    };

    onSubmit(leaveRequest);
  };

  // Get selected leave type details
  const selectedLeaveType = leaveTypes.find(type => type.value === leaveType);

  // Get leave balance for specific type
  const getLeaveTypeBalance = (type: string): number => {
    if (!leaveBalance) return 0;
    switch (type) {
      case 'sick':
        return leaveBalance.sickLeave || 0;
      case 'vacation':
        return leaveBalance.vacationLeave || 0;
      case 'personal':
        return leaveBalance.personalLeave || 0;
      default:
        return leaveBalance.remainingLeave || 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>{existingRequest ? 'Edit Leave Request' : 'Request Leave'}</span>
          </DialogTitle>
          <DialogDescription>
            {userName ? `Submit leave request for ${userName}` : 'Submit your leave request for approval'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Leave Balance Overview */}
          {leaveBalance && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Leave Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-muted-foreground">Total Leave</p>
                    <p className="font-bold text-green-600" data-testid="total-leave-balance">
                      {leaveBalance.totalLeave} days
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-muted-foreground">Used</p>
                    <p className="font-bold text-blue-600" data-testid="used-leave-balance">
                      {leaveBalance.usedLeave} days
                    </p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-bold text-orange-600" data-testid="remaining-leave-balance">
                      {leaveBalance.remainingLeave} days
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-muted-foreground">This Request</p>
                    <p className="font-bold text-purple-600" data-testid="request-days">
                      {getTotalDays()} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave Type Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Leave Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger data-testid="select-leave-type">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${type.color}`}>
                            {type.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leaveType && (
                  <p className="text-sm text-red-600 mt-1" data-testid="error-leave-type">
                    {errors.leaveType}
                  </p>
                )}
              </div>

              {selectedLeaveType && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={`text-xs ${selectedLeaveType.color}`}>
                      {selectedLeaveType.label}
                    </Badge>
                    {leaveBalance && (
                      <span className="text-xs text-muted-foreground">
                        Available: {getLeaveTypeBalance(leaveType)} days
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedLeaveType.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Leave Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm font-light">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                        data-testid="button-start-date"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-red-600 mt-1" data-testid="error-start-date">
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end-date" className="text-sm font-light">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                        data-testid="button-end-date"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-red-600 mt-1" data-testid="error-end-date">
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration Summary */}
              {startDate && endDate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light">Total Duration:</span>
                    <Badge variant="secondary" data-testid="total-duration">
                      {getTotalDays()} {getTotalDays() === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {format(startDate, "MMM dd")} to {format(endDate, "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reason for Leave */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Reason for Leave</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for your leave request..."
                className="resize-none"
                rows={4}
                data-testid="textarea-reason"
              />
              <div className="flex justify-between items-center mt-2">
                {errors.reason && (
                  <p className="text-sm text-red-600" data-testid="error-reason">
                    {errors.reason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {reason.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {errors.balance && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription data-testid="error-balance">
                {errors.balance}
              </AlertDescription>
            </Alert>
          )}

          {/* Request Summary */}
          {leaveType && startDate && endDate && reason && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Request Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leave Type:</span>
                  <Badge className={selectedLeaveType?.color}>
                    {selectedLeaveType?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-light">{getTotalDays()} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-light">
                    {format(startDate, "MMM dd")} - {format(endDate, "MMM dd, yyyy")}
                  </span>
                </div>
                {leaveBalance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className={`font-light ${
                      leaveBalance.remainingLeave - getTotalDays() < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {leaveBalance.remainingLeave - getTotalDays()} days
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || Object.keys(errors).length > 0}
              className="flex-1"
              data-testid="button-submit"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {existingRequest ? 'Update Request' : 'Submit Request'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}