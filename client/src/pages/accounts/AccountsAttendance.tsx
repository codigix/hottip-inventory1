import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, Users, CheckCircle2, AlertTriangle, Play, Pause, Square, CalendarDays,
  Plus, Search, Filter, Eye, Edit, Trash2, User, MapPin, Timer, 
  Download, FileText, BarChart3, TrendingUp, TrendingDown, Activity,
  ClockIcon, UserCheck, UserX, Coffee, Zap, FileDown, Calendar as CalendarIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAttendanceSchema, type Attendance, type InsertAttendance } from "@shared/schema";
import { format, isEqual, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

// Schemas - Use shared schemas from drizzle-zod with proper validation
const attendanceFormSchema = insertAttendanceSchema.extend({
  date: z.coerce.date("Please enter a valid date"),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
}).refine((data) => {
  if (data.checkIn && data.checkOut) {
    return data.checkIn <= data.checkOut;
  }
  return true;
}, {
  message: "Check-out time must be after check-in time",
  path: ["checkOut"],
});

const clockInSchema = z.object({
  location: z.string().optional(),
  notes: z.string().optional(),
});

const clockOutSchema = z.object({
  notes: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceFormSchema>;
type ClockInFormData = z.infer<typeof clockInSchema>;
type ClockOutFormData = z.infer<typeof clockOutSchema>;

// Date range presets
const dateRangePresets = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
];

// Status styling
const statusStyles = {
  present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  late: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "half-day": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "on-leave": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function AccountsAttendance() {
  const { toast } = useToast();
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isClockInOpen, setIsClockInOpen] = useState(false);
  const [isClockOutOpen, setIsClockOutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Data fetching - Real-time data from APIs
  const { data: attendanceRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["api/account-attendance"],
  });

  const { data: todayAttendance = [], isLoading: todayLoading } = useQuery({
    queryKey: ["api/account-attendance", "today"],
  });

  const { data: attendanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["api/account-attendance", "metrics"],
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ["api/account-attendance", "summary"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["api/users"],
  });

  // Form setup
  const createForm = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      userId: "",
      date: new Date(),
      status: "present",
      location: "Office",
      notes: "",
    },
  });

  const editForm = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
  });

  const clockInForm = useForm<ClockInFormData>({
    resolver: zodResolver(clockInSchema),
    defaultValues: {
      location: "Office",
      notes: "",
    },
  });

  const clockOutForm = useForm<ClockOutFormData>({
    resolver: zodResolver(clockOutSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Calculate metrics from real data
  const recordsArray = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  const todayArray = Array.isArray(todayAttendance) ? todayAttendance : [];
  const metrics = attendanceMetrics || {};
  
  const teamSize = metrics.teamSize || 0;
  const presentToday = metrics.presentToday || 0;
  const attendanceRate = metrics.attendanceRate || 0;
  const avgHours = metrics.avgHours || 0;
  const lateArrivalsThisWeek = metrics.lateArrivalsThisWeek || 0;

  // Note: Removed global hasCheckedIn/hasCheckedOut logic that was affecting all users
  // Backend validation now handles user-specific clock-in/out business logic

  // Date range calculation helper
  const calculateDateRange = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "this_week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "last_week":
        const lastWeek = subDays(now, 7);
        return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subDays(startOfMonth(now), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  // Mutations
  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceFormData) => {
      const response = await apiRequest("api/account-attendance", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          date: data.date.toISOString(),
          checkIn: data.checkIn ? data.checkIn.toISOString() : null,
          checkOut: data.checkOut ? data.checkOut.toISOString() : null,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "metrics"] });
      toast({ title: "Success", description: "Attendance record created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create attendance record", variant: "destructive" });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, ...data }: AttendanceFormData & { id: string }) => {
      const response = await apiRequest(`api/account-attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          date: data.date.toISOString(),
          checkIn: data.checkIn ? data.checkIn.toISOString() : null,
          checkOut: data.checkOut ? data.checkOut.toISOString() : null,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "metrics"] });
      toast({ title: "Success", description: "Attendance record updated successfully" });
      setIsEditOpen(false);
      setSelectedAttendance(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update attendance record", variant: "destructive" });
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: ClockInFormData) => {
      const response = await apiRequest("api/account-attendance/clock-in", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "metrics"] });
      toast({ title: "Success", description: "Clocked in successfully" });
      setIsClockInOpen(false);
      clockInForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to clock in", 
        variant: "destructive" 
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: ClockOutFormData) => {
      const response = await apiRequest("api/account-attendance/clock-out", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "metrics"] });
      toast({ title: "Success", description: "Clocked out successfully" });
      setIsClockOutOpen(false);
      clockOutForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to clock out", 
        variant: "destructive" 
      });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`api/account-attendance/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["api/account-attendance", "metrics"] });
      toast({ title: "Success", description: "Attendance record deleted successfully" });
      setIsDeleteOpen(false);
      setAttendanceToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete attendance record", variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateSubmit = (data: AttendanceFormData) => {
    createAttendanceMutation.mutate(data);
  };

  const handleEditSubmit = (data: AttendanceFormData) => {
    if (selectedAttendance) {
      updateAttendanceMutation.mutate({ ...data, id: selectedAttendance.id });
    }
  };

  const handleClockInSubmit = (data: ClockInFormData) => {
    clockInMutation.mutate(data);
  };

  const handleClockOutSubmit = (data: ClockOutFormData) => {
    clockOutMutation.mutate(data);
  };

  const handleEdit = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    editForm.reset({
      userId: attendance.userId,
      date: new Date(attendance.date),
      checkIn: attendance.checkIn ? new Date(attendance.checkIn) : undefined,
      checkOut: attendance.checkOut ? new Date(attendance.checkOut) : undefined,
      location: attendance.location || "",
      status: attendance.status || "present",
      notes: attendance.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleView = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setIsViewOpen(true);
  };

  const handleDelete = (attendance: Attendance) => {
    setAttendanceToDelete(attendance);
    setIsDeleteOpen(true);
  };

  // Filter attendance records
  const filteredRecords = recordsArray.filter((record: any) => {
    const matchesSearch = !searchTerm || 
      record.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    
    // Date filtering
    const recordDate = new Date(record.date);
    const { start, end } = calculateDateRange(dateFilter);
    const matchesDate = recordDate >= start && recordDate <= end;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Tab filtering
  const getTabRecords = (tab: string) => {
    switch (tab) {
      case "present":
        return filteredRecords.filter((r: any) => r.status === "present");
      case "absent":
        return filteredRecords.filter((r: any) => r.status === "absent");
      case "late":
        return filteredRecords.filter((r: any) => r.status === "late");
      case "on-leave":
        return filteredRecords.filter((r: any) => r.status === "on-leave");
      default:
        return filteredRecords;
    }
  };

  const tabRecords = getTabRecords(activeTab);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Accounts Attendance
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage team attendance records
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isClockInOpen} onOpenChange={setIsClockInOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                disabled={clockInMutation.isPending}
                data-testid="button-clock-in"
              >
                <Play className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Clock In</DialogTitle>
                <DialogDescription>
                  Record your arrival time for today's work session.
                </DialogDescription>
              </DialogHeader>
              <Form {...clockInForm}>
                <form onSubmit={clockInForm.handleSubmit(handleClockInSubmit)} className="space-y-4">
                  <FormField
                    control={clockInForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Office" data-testid="input-clock-in-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clockInForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Any additional notes..." data-testid="textarea-clock-in-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsClockInOpen(false)} data-testid="button-cancel-clock-in">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={clockInMutation.isPending} data-testid="button-submit-clock-in">
                      {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isClockOutOpen} onOpenChange={setIsClockOutOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={clockOutMutation.isPending}
                data-testid="button-clock-out"
              >
                <Square className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Clock Out</DialogTitle>
                <DialogDescription>
                  Record your departure time and end today's work session.
                </DialogDescription>
              </DialogHeader>
              <Form {...clockOutForm}>
                <form onSubmit={clockOutForm.handleSubmit(handleClockOutSubmit)} className="space-y-4">
                  <FormField
                    control={clockOutForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="End of day summary..." data-testid="textarea-clock-out-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsClockOutOpen(false)} data-testid="button-cancel-clock-out">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={clockOutMutation.isPending} data-testid="button-submit-clock-out">
                      {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-attendance">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Attendance Record</DialogTitle>
                <DialogDescription>
                  Create a new attendance record for team members.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-employee">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                  data-testid="button-select-date"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="half-day">Half Day</SelectItem>
                              <SelectItem value="on-leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Office" data-testid="input-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="checkIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check In Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""} 
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              data-testid="input-check-in" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="checkOut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check Out Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""} 
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              data-testid="input-check-out" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional notes..." data-testid="textarea-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAttendanceMutation.isPending} data-testid="button-submit">
                      {createAttendanceMutation.isPending ? "Creating..." : "Create Record"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="metric-team-size">{teamSize}</div>
            )}
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Present Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600" data-testid="metric-present-today">{presentToday}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {teamSize > 0 ? `${Math.round(attendanceRate)}% attendance` : "0% attendance"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Avg. Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="metric-avg-hours">{avgHours}</div>
            )}
            <p className="text-xs text-muted-foreground">Hours per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Late Arrivals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600" data-testid="metric-late-arrivals">{lateArrivalsThisWeek}</div>
            )}
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees or locations..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="half-day">Half Day</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-date-filter">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">
                All ({filteredRecords.length})
              </TabsTrigger>
              <TabsTrigger value="present" data-testid="tab-present">
                Present ({filteredRecords.filter((r: any) => r.status === "present").length})
              </TabsTrigger>
              <TabsTrigger value="absent" data-testid="tab-absent">
                Absent ({filteredRecords.filter((r: any) => r.status === "absent").length})
              </TabsTrigger>
              <TabsTrigger value="late" data-testid="tab-late">
                Late ({filteredRecords.filter((r: any) => r.status === "late").length})
              </TabsTrigger>
              <TabsTrigger value="on-leave" data-testid="tab-on-leave">
                On Leave ({filteredRecords.filter((r: any) => r.status === "on-leave").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {recordsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : tabRecords.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all" 
                      ? "No attendance records found for the selected criteria."
                      : `No ${activeTab} records found for the selected criteria.`
                    }
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead data-testid="header-employee">Employee</TableHead>
                        <TableHead data-testid="header-date">Date</TableHead>
                        <TableHead data-testid="header-check-in">Check In</TableHead>
                        <TableHead data-testid="header-check-out">Check Out</TableHead>
                        <TableHead data-testid="header-hours">Hours</TableHead>
                        <TableHead data-testid="header-location">Location</TableHead>
                        <TableHead data-testid="header-status">Status</TableHead>
                        <TableHead className="text-right" data-testid="header-actions">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabRecords.map((record: any) => (
                        <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span className="font-light">
                                {record.user?.firstName} {record.user?.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-date-${record.id}`}>
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell data-testid={`text-check-in-${record.id}`}>
                            {record.checkIn ? format(new Date(record.checkIn), "hh:mm a") : "-"}
                          </TableCell>
                          <TableCell data-testid={`text-check-out-${record.id}`}>
                            {record.checkOut ? format(new Date(record.checkOut), "hh:mm a") : "-"}
                          </TableCell>
                          <TableCell data-testid={`text-hours-${record.id}`}>
                            {record.checkIn && record.checkOut ? (
                              Math.round(((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)) * 10) / 10 + "h"
                            ) : "-"}
                          </TableCell>
                          <TableCell data-testid={`text-location-${record.id}`}>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{record.location || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`badge-status-${record.id}`}>
                            <Badge 
                              className={statusStyles[record.status as keyof typeof statusStyles] || statusStyles.present}
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(record)}
                                data-testid={`button-view-${record.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                                data-testid={`button-edit-${record.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record)}
                                data-testid={`button-delete-${record.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance record details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-employee">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                              data-testid="button-edit-select-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="half-day">Half Day</SelectItem>
                          <SelectItem value="on-leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Office" data-testid="input-edit-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check In Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""} 
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          data-testid="input-edit-check-in" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="checkOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check Out Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""} 
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          data-testid="input-edit-check-out" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional notes..." data-testid="textarea-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAttendanceMutation.isPending} data-testid="button-submit-edit">
                  {updateAttendanceMutation.isPending ? "Updating..." : "Update Record"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
            <DialogDescription>
              View the complete attendance record information.
            </DialogDescription>
          </DialogHeader>
          {selectedAttendance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Employee</Label>
                  <p className="font-light" data-testid="view-employee">
                    {(selectedAttendance as any).user?.firstName} {(selectedAttendance as any).user?.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="font-light" data-testid="view-date">
                    {format(new Date(selectedAttendance.date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Check In</Label>
                  <p className="font-light" data-testid="view-check-in">
                    {selectedAttendance.checkIn ? format(new Date(selectedAttendance.checkIn), "hh:mm a") : "Not recorded"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Check Out</Label>
                  <p className="font-light" data-testid="view-check-out">
                    {selectedAttendance.checkOut ? format(new Date(selectedAttendance.checkOut), "hh:mm a") : "Not recorded"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge 
                      className={statusStyles[selectedAttendance.status as keyof typeof statusStyles] || statusStyles.present}
                      data-testid="view-status"
                    >
                      {selectedAttendance.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <p className="font-light" data-testid="view-location">
                    {selectedAttendance.location || "Not specified"}
                  </p>
                </div>
              </div>

              {selectedAttendance.checkIn && selectedAttendance.checkOut && (
                <div>
                  <Label className="text-sm text-muted-foreground">Total Hours</Label>
                  <p className="font-light text-lg" data-testid="view-total-hours">
                    {Math.round(((new Date(selectedAttendance.checkOut).getTime() - new Date(selectedAttendance.checkIn).getTime()) / (1000 * 60 * 60)) * 10) / 10} hours
                  </p>
                </div>
              )}

              {selectedAttendance.notes && (
                <div>
                  <Label className="text-sm text-muted-foreground">Notes</Label>
                  <p className="mt-1" data-testid="view-notes">{selectedAttendance.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)} data-testid="button-close-view">
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewOpen(false);
                  handleEdit(selectedAttendance);
                }} data-testid="button-edit-from-view">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (attendanceToDelete) {
                  deleteAttendanceMutation.mutate(attendanceToDelete.id);
                }
              }}
              disabled={deleteAttendanceMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteAttendanceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}