import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Plus, CheckCircle, XCircle, CalendarDays } from "lucide-react";

export default function InventoryAttendance() {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // Fetch attendance data (using existing attendance endpoint)
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });

  // Mock inventory staff attendance data
  const inventoryStaff = [
    {
      id: "1",
      name: "John Smith",
      department: "Inventory",
      checkIn: "09:00 AM",
      checkOut: "06:00 PM",
      status: "present",
      date: "2024-01-25",
      location: "Warehouse A"
    },
    {
      id: "2", 
      name: "Sarah Johnson",
      department: "Inventory",
      checkIn: "08:45 AM",
      checkOut: "-",
      status: "present",
      date: "2024-01-25",
      location: "Warehouse B"
    },
    {
      id: "3",
      name: "Mike Chen",
      department: "Inventory",
      checkIn: "-",
      checkOut: "-", 
      status: "leave",
      date: "2024-01-25",
      location: "-"
    }
  ];

  const leaveRequests = [
    {
      id: "1",
      employee: "Mike Chen",
      leaveType: "Sick Leave",
      startDate: "2024-01-25",
      endDate: "2024-01-26",
      days: 2,
      status: "approved",
      reason: "Medical appointment"
    },
    {
      id: "2",
      employee: "Sarah Johnson", 
      leaveType: "Annual Leave",
      startDate: "2024-01-30",
      endDate: "2024-02-02",
      days: 4,
      status: "pending",
      reason: "Family vacation"
    }
  ];

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
            <p className="font-medium">{employee.name}</p>
            <p className="text-sm text-muted-foreground">{employee.department}</p>
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
          late: { color: "outline", icon: Clock, text: "Late" }
        };
        const config = statusConfig[employee.status as keyof typeof statusConfig];
        const Icon = config.icon;
        
        return (
          <Badge variant={config.color as any} className="flex items-center space-x-1 w-fit">
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
    }
  ];

  const leaveColumns = [
    {
      key: "employee",
      header: "Employee",
    },
    {
      key: "leaveType",
      header: "Leave Type",
      cell: (leave: any) => (
        <Badge variant="outline">{leave.leaveType}</Badge>
      ),
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
          rejected: "bg-red-100 text-red-800"
        };
        return (
          <Badge className={statusColors[leave.status as keyof typeof statusColors]}>
            {leave.status.toUpperCase()}
          </Badge>
        );
      },
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Staff Attendance</h1>
          <p className="text-muted-foreground">Employee attendance and leave management for inventory staff</p>
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Smith</SelectItem>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                      <SelectItem value="mike">Mike Chen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select>
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
                    <Input id="startDate" type="date" data-testid="input-start-date" />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" data-testid="input-end-date" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" placeholder="Reason for leave..." data-testid="textarea-reason" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-leave">
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" data-testid="button-mark-attendance">
            <Clock className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
          <Button variant="outline" data-testid="button-attendance-report">
            <CalendarDays className="h-4 w-4 mr-2" />
            Attendance Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
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
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
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
                <p className="text-sm font-medium text-muted-foreground">On Leave</p>
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
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
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
                  <span>Today's Attendance - {new Date().toLocaleDateString()}</span>
                </div>
                <Button size="sm" variant="outline">
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={inventoryStaff}
                columns={attendanceColumns}
                searchable={true}
                searchKey="name"
                onEdit={() => {}}
                onView={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-management">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Leave Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={leaveRequests}
                  columns={leaveColumns}
                  searchable={true}
                  searchKey="employee"
                  onView={() => {}}
                  onEdit={() => {}}
                />
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveRequests.filter(req => req.status === 'pending').map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                      <div>
                        <p className="font-medium">{request.employee}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.leaveType} - {request.days} days
                        </p>
                        <p className="text-xs text-muted-foreground">{request.reason}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="destructive">
                          Reject
                        </Button>
                        <Button size="sm">
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {leaveRequests.filter(req => req.status === 'pending').length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending leave requests</p>
                    </div>
                  )}
                </div>
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
                  {[
                    { name: "John Smith", annual: 12, sick: 8, personal: 3 },
                    { name: "Sarah Johnson", annual: 15, sick: 10, personal: 5 },
                    { name: "Mike Chen", annual: 8, sick: 6, personal: 2 }
                  ].map((employee, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="font-medium mb-2">{employee.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Annual</p>
                          <p className="font-medium">{employee.annual}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Sick</p>
                          <p className="font-medium">{employee.sick}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Personal</p>
                          <p className="font-medium">{employee.personal}</p>
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
                <p className="text-sm">Coming soon - Schedule management features</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}