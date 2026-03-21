import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
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
  LayoutGrid,
  ClipboardList,
  History,
  FileText,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryAttendance() {
  const { toast } = useToast();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [attendanceAction, setAttendanceAction] = useState<"check_in" | "check_out">("check_in");
  const [location, setLocation] = useState("");
  const [leaveType, setLeaveType] = useState("");

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => apiRequest("GET", "/api/users"),
  });

  // Fetch attendance data
  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
  } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: async () => apiRequest("GET", "/api/attendance"),
  });

  // Fetch leave requests data
  const {
    data: leaveRequestsResponse,
    isLoading: leaveRequestsLoading,
  } = useQuery({
    queryKey: ["/api/inventory/attendance-with-leave"],
    queryFn: async () => apiRequest("GET", "/api/inventory/attendance-with-leave"),
  });

  const rawAttendanceData = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];
  const rawLeaveRequestsData = Array.isArray(leaveRequestsResponse?.data) ? leaveRequestsResponse.data : [];

  // Transform attendance data
  const inventoryStaff = rawAttendanceData.map((record: any) => {
    const user = employees.find((emp: any) => emp.id === record.userId);
    return {
      ...record,
      name: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
      department: user?.department || "Inventory",
    };
  });

  // Transform leave requests data
  const leaveRequests = rawLeaveRequestsData.map((request: any) => {
    const user = employees.find((emp: any) => emp.id === request.userId);
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    return {
      ...request,
      employee: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
      days: days,
    };
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/attendance", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Attendance recorded successfully" });
      setIsCheckInDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record attendance", variant: "destructive" });
    },
  });

  const leaveRequestMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/inventory/leave-request", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Leave request submitted successfully" });
      setIsLeaveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/attendance-with-leave"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to submit leave request", variant: "destructive" });
    },
  });

  const handleAttendanceAction = () => {
    if (!selectedEmployee || !location) {
      toast({ title: "Error", description: "Please select employee and location", variant: "destructive" });
      return;
    }
    const payload = {
      userId: selectedEmployee,
      action: attendanceAction,
      location,
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      department: "Inventory",
    };
    attendanceMutation.mutate(payload);
  };

  const handleSubmitLeave = () => {
    const start = (document.getElementById("startDate") as HTMLInputElement)?.value;
    const end = (document.getElementById("endDate") as HTMLInputElement)?.value;
    const reason = (document.getElementById("reason") as HTMLTextAreaElement)?.value || "";

    if (!selectedEmployee || !leaveType || !start || !end || !reason.trim()) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const employee = employees.find((emp: any) => emp.id === selectedEmployee);
    leaveRequestMutation.mutate({
      employeeName: employee?.username,
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
    });
  };

  const attendanceColumns = [
    {
      key: "name",
      header: "Employee Details",
      cell: (record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{record.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{record.department}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Work Status",
      cell: (record: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal",
            record.status === 'present' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            record.status === 'absent' && "bg-red-50 text-red-700 border-red-200",
            record.status === 'leave' && "bg-blue-50 text-blue-700 border-blue-200",
            record.status === 'late' && "bg-amber-50 text-amber-700 border-amber-200"
          )}
        >
          {record.status || 'Present'}
        </Badge>
      ),
    },
    {
      key: "checkIn",
      header: "Check-In / Out",
      cell: (record: any) => (
        <div className="flex flex-col text-xs">
          <span className="text-slate-700 font-medium">In: {record.checkIn || '--:--'}</span>
          <span className="text-slate-400">Out: {record.checkOut || '--:--'}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Work Station",
      cell: (record: any) => (
        <span className="text-slate-600 text-sm">{record.location || 'Warehouse A'}</span>
      )
    },
    {
      key: "date",
      header: "Date",
      cell: (record: any) => (
        <span className="text-slate-500 text-xs">{new Date(record.date).toLocaleDateString()}</span>
      ),
    },
  ];

  const leaveColumns = [
    {
      key: "employee",
      header: "Staff Member",
      cell: (leave: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{leave.employee}</span>
          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{leave.reason}</span>
        </div>
      )
    },
    {
      key: "leaveType",
      header: "Type",
      cell: (leave: any) => <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none capitalize">{leave.leaveType}</Badge>,
    },
    {
      key: "startDate",
      header: "Period",
      cell: (leave: any) => (
        <div className="flex flex-col text-[10px]">
          <span className="text-slate-700 font-medium">{new Date(leave.startDate).toLocaleDateString()}</span>
          <span className="text-slate-400">to {new Date(leave.endDate).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "days",
      header: "Duration",
      cell: (leave: any) => <span className="font-semibold text-slate-700">{leave.days} Days</span>
    },
    {
      key: "status",
      header: "QC Status",
      cell: (leave: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal",
            leave.status === 'approved' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            leave.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
            leave.status === 'rejected' && "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {leave.status}
        </Badge>
      ),
    },
  ];

  const metrics = [
    { label: "Total Staff", value: employees.length, icon: User, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Present Today", value: inventoryStaff.filter((s: any) => s.status === 'present').length || 10, icon: CheckCircle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "On Leave", value: leaveRequests.filter((l: any) => l.status === 'approved').length || 1, icon: Calendar, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Late Check-in", value: "2", icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-6 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Staff Attendance & Leave</h1>
          <p className="text-xs text-slate-500">Manage workforce presence and time-off workflows.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm">
                <Plus className="h-4 w-4 mr-2 text-slate-400" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Submit Leave Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Staff Member</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Start Date</Label>
                    <Input id="startDate" type="date" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">End Date</Label>
                    <Input id="endDate" type="date" className="border-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Reason / Notes</Label>
                  <Textarea id="reason" placeholder="Briefly explain the reason..." className="border-slate-200" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setIsLeaveDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button onClick={handleSubmitLeave} className="bg-primary hover:bg-primary text-white px-8">Submit Request</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary text-white shadow-sm">
                <Clock className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Attendance Marking</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Action</Label>
                    <Select value={attendanceAction} onValueChange={setAttendanceAction as any}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check_in">Check In</SelectItem>
                        <SelectItem value="check_out">Check Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Staff Member</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select work station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                      <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                      <SelectItem value="office">Main Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Current Timestamp</p>
                  <p className="text-lg font-mono font-medium text-slate-900">{new Date().toLocaleTimeString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setIsCheckInDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button onClick={handleAttendanceAction} className="bg-primary hover:bg-primary text-white px-8">Confirm {attendanceAction === 'check_in' ? 'Check-in' : 'Check-out'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-2 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", metric.bg)}>
                <metric.icon className={cn("h-5 w-5", metric.color)} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="daily" className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-lg w-fit border border-slate-200">
          <TabsTrigger value="daily" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <History className="h-4 w-4 mr-2 text-slate-400" />
            Daily Log
          </TabsTrigger>
          <TabsTrigger value="leave" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
            Leave Registry
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <FileText className="h-4 w-4 mr-2 text-slate-400" />
            Report Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                Attendance Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={inventoryStaff}
                columns={attendanceColumns}
                loading={attendanceLoading}
                searchPlaceholder="Filter staff..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Leave Management Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={leaveRequests}
                columns={leaveColumns}
                loading={leaveRequestsLoading}
                searchPlaceholder="Search requests..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <Card className="border-none shadow-sm bg-white min-h-[400px] flex flex-col items-center justify-center">
            <div className="text-center space-y-3 p-12">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-medium">Generate Monthly Report</p>
                <p className="text-slate-500 text-sm max-w-[240px]">Export a detailed CSV of all staff attendance and leave history for this month.</p>
              </div>
              <Button variant="outline" className="mt-4 border-slate-200 text-slate-600 hover:bg-slate-50">
                <CalendarDays className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
