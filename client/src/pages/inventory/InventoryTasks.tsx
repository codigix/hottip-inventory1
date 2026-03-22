import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ClipboardList,
  Plus,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  History,
  FileText,
  AlertCircle,
  Hammer,
  ShieldCheck,
  Package,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryTasks() {
  const { toast } = useToast();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isUpdateTaskDialogOpen, setIsUpdateTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [timeSpent, setTimeSpent] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const { data: tasksResponse, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/inventory-tasks"],
    queryFn: async () => apiRequest("GET", "/api/inventory-tasks"),
  });

  const { data: employeesResponse = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => apiRequest("GET", "/api/users"),
  });

  const tasks = Array.isArray(tasksResponse?.data) ? tasksResponse.data : [];
  const employees = Array.isArray(employeesResponse?.data) ? employeesResponse.data : employeesResponse;

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/inventory-tasks", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Task created successfully" });
      setIsTaskDialogOpen(false);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-tasks"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("PUT", `/api/inventory-tasks/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Task updated successfully" });
      setIsUpdateTaskDialogOpen(false);
      resetUpdateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-tasks"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task", variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskAssignedTo("");
    setNewTaskPriority(""); setNewTaskCategory(""); setNewTaskDueDate("");
  };

  const resetUpdateForm = () => {
    setSelectedTask(null); setTaskStatus(""); setTaskNotes(""); setTimeSpent("");
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      assignedTo: newTaskAssignedTo,
      priority: newTaskPriority || "medium",
      category: newTaskCategory || "stock_count",
      dueDate: newTaskDueDate || new Date().toISOString(),
    });
  };

  const handleUpdateTask = () => {
    if (!selectedTask || !taskStatus) {
      toast({ title: "Error", description: "Please select status", variant: "destructive" });
      return;
    }
    updateTaskMutation.mutate({
      id: selectedTask.id,
      status: taskStatus,
      notes: taskNotes,
      timeSpent: timeSpent ? parseInt(timeSpent) : null,
      completedAt: taskStatus === "completed" ? new Date().toISOString() : null,
    });
  };

  const openUpdateDialog = (task: any) => {
    setSelectedTask(task); setTaskStatus(task.status || "");
    setTaskNotes(task.notes || ""); setTimeSpent(task.timeSpent?.toString() || "");
    setIsUpdateTaskDialogOpen(true);
  };

  const categoryIcons: Record<string, any> = {
    stock_count: ClipboardList,
    vendor_follow_up: Package,
    fabrication_check: Wrench,
    quality_control: ShieldCheck,
    maintenance: Hammer,
  };

  const taskColumns = [
    {
      key: "title",
      header: "Task Information",
      cell: (task: any) => {
        const Icon = categoryIcons[task.category] || ClipboardList;
        return (
          <div className="flex items-center gap-3">
            {/* <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Icon className="h-4 w-4 text-slate-400" />
            </div> */}
            <div className="flex flex-col">
              <span className="text-xs text-slate-900">{task.title || "Untitled Task"}</span>
              <span className="text-xs text-slate-500 truncate max-w-[200px]">{task.description || "No description provided"}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Execution Status",
      cell: (task: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal",
            task.status === 'completed' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            task.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-200",
            task.status === 'new' && "bg-slate-100 text-slate-600 border-slate-200",
            task.status === 'cancelled' && "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {task.status?.replace('_', ' ') || 'New'}
        </Badge>
      )
    },
    {
      key: "priority",
      header: "Priority",
      cell: (task: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-medium text-xs tracking-wider border-none px-2 py-0.5",
            task.priority === 'urgent' && "bg-red-100 text-red-700",
            task.priority === 'high' && "bg-amber-100 text-amber-700",
            task.priority === 'medium' && "bg-blue-100 text-blue-700",
            task.priority === 'low' && "bg-slate-100 text-slate-700"
          )}
        >
          {task.priority || 'Medium'}
        </Badge>
      )
    },
    {
      key: "assignedTo",
      header: "Assignee",
      cell: (task: any) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
            {task.assignedTo ? task.assignedTo.charAt(0) : '?'}
          </div>
          <span className="text-sm text-slate-600">{task.assignedTo || 'Unassigned'}</span>
        </div>
      )
    },
    {
      key: "dueDate",
      header: "Timeline",
      cell: (task: any) => (
        <div className="flex flex-col text-xs">
          <span className="text-slate-700 font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          <span className="text-slate-400">Created: {new Date(task.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
      )
    }
  ];

  const metrics = [
    { label: "Active Tasks", value: tasks.filter((t: any) => t.status !== 'completed').length, icon: ClipboardList, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "In Progress", value: tasks.filter((t: any) => t.status === 'in_progress').length, icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "High Priority", value: tasks.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length, icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Completed", value: tasks.filter((t: any) => t.status === 'completed').length, icon: CheckCircle, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Inventory Operations Tasks</h1>
          <p className="text-xs text-slate-500">Coordinate and track internal logistics and warehouse maintenance activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Create New Inventory Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Task Title *</Label>
                  <Input placeholder="e.g., Quarterly Stock Reconciliation" className="border-slate-200" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Detailed Description</Label>
                  <Textarea placeholder="Explain what needs to be done..." className="border-slate-200 min-h-[100px]" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Assign To</Label>
                    <Select value={newTaskAssignedTo} onValueChange={setNewTaskAssignedTo}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.username}>{emp.firstName} {emp.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Priority Level</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Category</Label>
                    <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock_count">Stock Count</SelectItem>
                        <SelectItem value="vendor_follow_up">Vendor Follow-up</SelectItem>
                        <SelectItem value="fabrication_check">Fabrication Check</SelectItem>
                        <SelectItem value="quality_control">Quality Control</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Due Date</Label>
                    <Input type="datetime-local" className="border-slate-200" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setIsTaskDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button onClick={handleCreateTask} className="bg-primary hover:bg-primary text-white px-8">Confirm Task</Button>
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

      <Tabs defaultValue="all" className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-lg w-fit border border-slate-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
            Task Registry
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <History className="h-4 w-4 mr-2 text-slate-400" />
            Active Queue
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <CheckCircle className="h-4 w-4 mr-2 text-slate-400" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                All Operational Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={tasks}
                columns={taskColumns}
                loading={tasksLoading}
                searchPlaceholder="Filter tasks..."
                onEdit={openUpdateDialog}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <Card className="">
            <CardContent className="p-0">
              <DataTable
                data={tasks.filter((t: any) => t.status !== 'completed')}
                columns={taskColumns}
                loading={tasksLoading}
                searchPlaceholder="Filter active tasks..."
                onEdit={openUpdateDialog}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <Card className="">
            <CardContent className="p-0">
              <DataTable
                data={tasks.filter((t: any) => t.status === 'completed')}
                columns={taskColumns}
                loading={tasksLoading}
                searchPlaceholder="Search history..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isUpdateTaskDialogOpen} onOpenChange={setIsUpdateTaskDialogOpen}>
        <DialogContent className="border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Task Status Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedTask && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-900">{selectedTask.title}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedTask.description}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-700">Current Progress</Label>
              <Select value={taskStatus} onValueChange={setTaskStatus}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New / Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Time Invested (Hrs)</Label>
                <Input type="number" className="border-slate-200" value={timeSpent} onChange={e => setTimeSpent(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Completion Notes</Label>
              <Textarea placeholder="Any findings or issues encountered..." className="border-slate-200 min-h-[80px]" value={taskNotes} onChange={e => setTaskNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsUpdateTaskDialogOpen(false)} className="text-slate-600">Cancel</Button>
              <Button onClick={handleUpdateTask} className="bg-primary hover:bg-primary text-white px-8">Save Progress</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
