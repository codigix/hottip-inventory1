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
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Users, CheckCircle2, Clock, AlertTriangle, Play, Plus, Search, Filter, Eye, Edit, Trash2, User, CalendarDays, Flag, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAccountTaskSchema, type AccountTask, type InsertAccountTask } from "@shared/schema";

// Schemas - Use shared schemas from drizzle-zod with proper validation
const taskFormSchema = insertAccountTaskSchema.extend({
  dueDate: z.coerce.date().optional(),
});

const completeTaskSchema = z.object({
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;
type CompleteTaskFormData = z.infer<typeof completeTaskSchema>;

// Status styling
const statusStyles = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const priorityStyles = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const typeStyles = {
  reconcile: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  send_reminder: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  file_gst: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AccountsTasks() {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<AccountTask | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<AccountTask | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  // Data fetching - Only fetch what we actually use
  const { data: accountTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/account-tasks"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Form setup
  const createForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "reconcile",
      assignedTo: "",
      assignedBy: "",
      status: "open",
      priority: "medium",
      relatedType: "",
      relatedId: "",
      notes: "",
    },
  });

  const editForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
  });

  const completeForm = useForm<CompleteTaskFormData>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Calculate metrics from actual data
  const tasksArray = Array.isArray(accountTasks) ? accountTasks : [];
  
  const totalTasks = tasksArray.length;
  const openTasks = tasksArray.filter((t: any) => t.status === 'open').length;
  const inProgressTasks = tasksArray.filter((t: any) => t.status === 'in_progress').length;
  const completedTasks = tasksArray.filter((t: any) => t.status === 'done').length;
  
  // Calculate overdue tasks
  const overdueTasks = tasksArray.filter((t: any) => {
    if (!t.dueDate || t.status === 'done') return false;
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return dueDate < today;
  }).length;
  
  // Calculate current month metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const tasksThisMonth = tasksArray.filter((t: any) => {
    const taskDate = new Date(t.createdAt);
    return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
  }).length;
  
  const completedThisMonth = tasksArray.filter((t: any) => {
    if (t.status !== 'done' || !t.completedDate) return false;
    const completedDate = new Date(t.completedDate);
    return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
  }).length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) =>
      apiRequest("/api/account-tasks", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-tasks"] });
      toast({ title: "Success", description: "Task created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: TaskFormData & { id: string }) =>
      apiRequest(`/api/account-tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-tasks"] });
      toast({ title: "Success", description: "Task updated successfully" });
      setIsEditOpen(false);
      setSelectedTask(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiRequest(`/api/account-tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "done",
          completedDate: new Date().toISOString(),
          notes: notes ? `${selectedTask?.notes || ''}\n\nCompletion Notes: ${notes}` : selectedTask?.notes,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-tasks"] });
      toast({ title: "Success", description: "Task marked as completed" });
      setIsCompleteOpen(false);
      setSelectedTask(null);
      completeForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete task", variant: "destructive" });
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/account-tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "in_progress",
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-tasks"] });
      toast({ title: "Success", description: "Task started successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/account-tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-tasks"] });
      toast({ title: "Success", description: "Task deleted successfully" });
      setIsDeleteOpen(false);
      setTaskToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleEditSubmit = (data: TaskFormData) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ ...data, id: selectedTask.id });
    }
  };

  const handleEdit = (task: AccountTask) => {
    setSelectedTask(task);
    editForm.reset({
      title: task.title,
      description: task.description || "",
      type: task.type,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      relatedType: task.relatedType || "",
      relatedId: task.relatedId || "",
      notes: task.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleView = (task: AccountTask) => {
    setSelectedTask(task);
    setIsViewOpen(true);
  };

  const handleCompleteTask = (task: AccountTask) => {
    setSelectedTask(task);
    completeForm.reset({ notes: "" });
    setIsCompleteOpen(true);
  };

  const handleStartTask = (task: AccountTask) => {
    startTaskMutation.mutate(task.id);
  };

  const handleDeleteClick = (task: AccountTask) => {
    setTaskToDelete(task);
    setIsDeleteOpen(true);
  };

  const handleCompleteSubmit = (data: CompleteTaskFormData) => {
    if (selectedTask) {
      completeTaskMutation.mutate({
        id: selectedTask.id,
        notes: data.notes,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  // Filtered data
  const getFilteredTasks = () => {
    let filtered = tasksArray;
    
    // Apply active tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((task: any) => task.status === activeTab);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((task: any) => {
        const assigneeName = task.assignee?.firstName && task.assignee?.lastName 
          ? `${task.assignee.firstName} ${task.assignee.lastName}`
          : 'Unknown User';
        
        return (
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assigneeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Apply additional filters
    if (statusFilter !== "all") {
      filtered = filtered.filter((task: any) => task.status === statusFilter);
    }
    
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task: any) => task.priority === priorityFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter((task: any) => task.type === typeFilter);
    }
    
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((task: any) => task.assignedTo === assigneeFilter);
    }
    
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const isTaskOverdue = (task: any) => {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Accounts Tasks
          </h1>
          <p className="text-muted-foreground mt-2">
            Assign and manage tasks for accounts staff
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a new task to an accounts staff member.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter task title"
                            data-testid="input-task-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-task-type">
                              <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="reconcile">Account Reconciliation</SelectItem>
                            <SelectItem value="send_reminder">Send Reminder</SelectItem>
                            <SelectItem value="file_gst">File GST Return</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter task description"
                          rows={3}
                          data-testid="input-task-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assignee">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.department || 'General'})
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
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
                  <FormField
                    control={createForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="relatedType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Entity Type</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., invoice, customer, gst_return"
                            data-testid="input-related-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="relatedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Entity ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="UUID of related entity"
                            data-testid="input-related-id"
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
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional notes or instructions"
                          rows={2}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-tasks">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {tasksThisMonth} created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="metric-in-progress">
              {inProgressTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {openTasks} open tasks pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="metric-completed">
              {completedTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="metric-overdue">
              {overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Management</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks or assignees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                  data-testid="input-search"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32" data-testid="select-priority-filter">
                    <Flag className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40" data-testid="select-type-filter">
                    <FileText className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="reconcile">Reconciliation</SelectItem>
                    <SelectItem value="send_reminder">Send Reminder</SelectItem>
                    <SelectItem value="file_gst">File GST</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-40" data-testid="select-assignee-filter">
                    <User className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" data-testid="tab-all">
                All Tasks ({totalTasks})
              </TabsTrigger>
              <TabsTrigger value="open" data-testid="tab-open">
                Open ({openTasks})
              </TabsTrigger>
              <TabsTrigger value="in_progress" data-testid="tab-in-progress">
                In Progress ({inProgressTasks})
              </TabsTrigger>
              <TabsTrigger value="done" data-testid="tab-completed">
                Completed ({completedTasks})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {tasksLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all" || assigneeFilter !== "all"
                              ? "No tasks match your filters"
                              : "No tasks found. Create your first task!"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task: any) => {
                        const assigneeName = task.assignee?.firstName && task.assignee?.lastName
                          ? `${task.assignee.firstName} ${task.assignee.lastName}`
                          : 'Unknown User';
                        const isOverdue = isTaskOverdue(task);
                        
                        return (
                          <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col space-y-1">
                                <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                                  {task.title}
                                  {isOverdue && (
                                    <AlertTriangle className="inline h-4 w-4 ml-1 text-red-500" />
                                  )}
                                </span>
                                {task.description && (
                                  <span className="text-xs text-muted-foreground truncate max-w-xs">
                                    {task.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={typeStyles[task.type as keyof typeof typeStyles]}
                                data-testid={`badge-type-${task.id}`}
                              >
                                {task.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-assignee-${task.id}`}>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{assigneeName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={priorityStyles[task.priority as keyof typeof priorityStyles]}
                                data-testid={`badge-priority-${task.id}`}
                              >
                                {task.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-due-date-${task.id}`}>
                              {task.dueDate ? (
                                <div className="flex items-center space-x-2">
                                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                  <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={statusStyles[task.status as keyof typeof statusStyles]}
                                data-testid={`badge-status-${task.id}`}
                              >
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(task)}
                                  data-testid={`button-view-${task.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(task)}
                                  data-testid={`button-edit-${task.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {task.status === 'open' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartTask(task)}
                                    data-testid={`button-start-${task.id}`}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                {(task.status === 'in_progress' || task.status === 'open') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCompleteTask(task)}
                                    data-testid={`button-complete-${task.id}`}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(task)}
                                  data-testid={`button-delete-${task.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details and assignment.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter task title"
                          data-testid="input-edit-task-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-task-type">
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="reconcile">Account Reconciliation</SelectItem>
                          <SelectItem value="send_reminder">Send Reminder</SelectItem>
                          <SelectItem value="file_gst">File GST Return</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter task description"
                        rows={3}
                        data-testid="input-edit-task-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={editForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-assignee">
                            <SelectValue placeholder="Select assignee" />
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-priority">
                            <SelectValue placeholder="Select priority" />
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
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          data-testid="input-edit-due-date"
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
                      <Textarea
                        {...field}
                        placeholder="Any additional notes"
                        rows={2}
                        data-testid="input-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTaskMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View complete task information and history.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm" data-testid="view-task-title">{selectedTask.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge className={typeStyles[selectedTask.type as keyof typeof typeStyles]}>
                    {selectedTask.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              {selectedTask.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm" data-testid="view-task-description">{selectedTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={statusStyles[selectedTask.status as keyof typeof statusStyles]}>
                    {selectedTask.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={priorityStyles[selectedTask.priority as keyof typeof priorityStyles]}>
                    {selectedTask.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm" data-testid="view-due-date">
                    {selectedTask.dueDate 
                      ? new Date(selectedTask.dueDate).toLocaleDateString()
                      : 'No due date set'
                    }
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm" data-testid="view-created-date">
                    {new Date(selectedTask.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedTask.completedDate && (
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <p className="text-sm" data-testid="view-completed-date">
                      {new Date(selectedTask.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedTask.relatedType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Related Entity Type</Label>
                    <p className="text-sm" data-testid="view-related-type">{selectedTask.relatedType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Related Entity ID</Label>
                    <p className="text-sm font-mono text-xs" data-testid="view-related-id">{selectedTask.relatedId}</p>
                  </div>
                </div>
              )}
              {selectedTask.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm whitespace-pre-wrap" data-testid="view-task-notes">{selectedTask.notes}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setIsViewOpen(false)} data-testid="button-close-view">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Task Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark this task as completed and add completion notes.
            </DialogDescription>
          </DialogHeader>
          <Form {...completeForm}>
            <form onSubmit={completeForm.handleSubmit(handleCompleteSubmit)} className="space-y-4">
              <FormField
                control={completeForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any completion notes or outcomes..."
                        rows={4}
                        data-testid="input-completion-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCompleteOpen(false)}
                  data-testid="button-cancel-complete"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={completeTaskMutation.isPending}
                  data-testid="button-submit-complete"
                >
                  {completeTaskMutation.isPending ? "Completing..." : "Mark Complete"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}