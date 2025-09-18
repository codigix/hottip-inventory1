import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  MapPin,
  Calendar,
  Target,
  Award,
  UserCheck,
  UserX,
} from "lucide-react";

const userFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  department: z.string().min(1, "Department is required"),
  role: z.enum(["admin", "manager", "employee"]),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  assignedTo: z.string().min(1, "Assignee is required"),
  assignedBy: z.string().default("temp-user-id"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
});

type UserForm = z.infer<typeof userFormSchema>;
type TaskForm = z.infer<typeof taskFormSchema>;

export default function EmployeesDashboard() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const userForm = useForm<UserForm>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      department: "",
      role: "employee",
    },
  });

  const taskForm = useForm<TaskForm>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      assignedBy: "temp-user-id",
      priority: "medium",
      dueDate: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      userForm.reset();
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskForm) => {
      return await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsTaskDialogOpen(false);
      taskForm.reset();
      toast({
        title: "Success",
        description: "Task assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskForm> }) => {
      return await apiRequest("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      taskForm.reset();
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const onUserSubmit = (data: UserForm) => {
    createUserMutation.mutate(data);
  };

  const onTaskSubmit = (data: TaskForm) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      username: user.username,
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department || "",
      role: user.role,
    });
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    taskForm.reset({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignee?.id || "",
      assignedBy: task.assigner?.id || "temp-user-id",
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
    });
  };

  const userColumns = [
    {
      key: "firstName",
      header: "Name",
      cell: (user: any) => `${user.firstName} ${user.lastName}`,
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "department",
      header: "Department",
      cell: (user: any) => user.department || "Unassigned",
    },
    {
      key: "role",
      header: "Role",
      cell: (user: any) => (
        <Badge variant="secondary">
          {user.role}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (user: any) => (
        <Badge variant={user.isActive ? "default" : "destructive"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const taskColumns = [
    {
      key: "title",
      header: "Task",
    },
    {
      key: "assignee.firstName",
      header: "Assigned To",
      cell: (task: any) => task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned",
    },
    {
      key: "priority",
      header: "Priority",
      cell: (task: any) => {
        const priorityColors = {
          low: "bg-green-100 text-green-800",
          medium: "bg-yellow-100 text-yellow-800",
          high: "bg-orange-100 text-orange-800",
          urgent: "bg-red-100 text-red-800",
        };
        
        return (
          <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
            {task.priority}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (task: any) => {
        const statusColors = {
          new: "bg-blue-100 text-blue-800",
          in_progress: "bg-yellow-100 text-yellow-800",
          completed: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        
        const statusLabels = {
          new: "New",
          in_progress: "In Progress",
          completed: "Completed",
          cancelled: "Cancelled",
        };

        return (
          <Badge className={statusColors[task.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {statusLabels[task.status as keyof typeof statusLabels] || task.status}
          </Badge>
        );
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (task: any) => task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date",
    },
  ];

  // Calculate employee metrics
  const totalEmployees = (users || []).length;
  const activeEmployees = (users || []).filter((u: any) => u.isActive).length;
  const departmentCounts = (users || []).reduce((acc: any, user: any) => {
    const dept = user.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const totalTasks = (tasks || []).length;
  const completedTasks = (tasks || []).filter((t: any) => t.status === 'completed').length;
  const pendingTasks = (tasks || []).filter((t: any) => t.status === 'new' || t.status === 'in_progress').length;

  if (usersLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Employee Management</h1>
          <p className="text-muted-foreground">Manage staff, attendance, tasks, and performance</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isTaskDialogOpen || !!editingTask} onOpenChange={(open) => {
            if (!open) {
              setIsTaskDialogOpen(false);
              setEditingTask(null);
              taskForm.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(true)} data-testid="button-assign-task">
                <Target className="h-4 w-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Assign New Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Update task details" : "Assign a new task to an employee"}
                </DialogDescription>
              </DialogHeader>
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                  <FormField
                    control={taskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-task-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-task-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={taskForm.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign To</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-assignee">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(users || []).map((user: any) => (
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
                      control={taskForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={taskForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsTaskDialogOpen(false);
                        setEditingTask(null);
                        taskForm.reset();
                      }}
                      data-testid="button-cancel-task"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                      data-testid="button-save-task"
                    >
                      {editingTask ? "Update" : "Assign"} Task
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsUserDialogOpen(true)} data-testid="button-add-employee">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Enter the details for the new employee
                </DialogDescription>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Inventory">Inventory</SelectItem>
                              <SelectItem value="Accounts">Accounts</SelectItem>
                              <SelectItem value="Logistics">Logistics</SelectItem>
                              <SelectItem value="HR">HR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUserDialogOpen(false)}
                      data-testid="button-cancel-user"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending}
                      data-testid="button-save-user"
                    >
                      Add Employee
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Employee Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold text-foreground">{activeEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold text-foreground">{pendingTasks}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={(users || [])}
                columns={userColumns}
                onEdit={handleEditUser}
                searchable={true}
                searchKey="firstName"
              />
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Track and manage employee tasks and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={(tasks || [])}
                columns={taskColumns}
                onEdit={handleEditTask}
                searchable={true}
                searchKey="title"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => setIsUserDialogOpen(true)}
                data-testid="button-quick-add-employee"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => setIsTaskDialogOpen(true)}
                data-testid="button-quick-assign-task"
              >
                <Target className="h-4 w-4 mr-2" />
                Assign Task
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Record attendance")}
                data-testid="button-record-attendance"
              >
                <Clock className="h-4 w-4 mr-2" />
                Record Attendance
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Performance review")}
                data-testid="button-performance-review"
              >
                <Award className="h-4 w-4 mr-2" />
                Performance Review
              </Button>
            </CardContent>
          </Card>

          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(departmentCounts).map(([dept, count]: [string, any]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-light text-foreground">{dept}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Task Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">New</span>
                </div>
                <Badge variant="secondary">{tasks?.filter((t: any) => t.status === 'new').length || 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">In Progress</span>
                </div>
                <Badge variant="secondary">{tasks?.filter((t: any) => t.status === 'in_progress').length || 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Completed</span>
                </div>
                <Badge variant="secondary">{completedTasks}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
