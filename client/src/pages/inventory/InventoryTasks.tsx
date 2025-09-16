import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { ClipboardList, Plus, User, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";

export default function InventoryTasks() {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isUpdateTaskDialogOpen, setIsUpdateTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const { toast } = useToast();

  // Fetch inventory tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/inventory-tasks"],
  });

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/inventory-tasks/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setIsUpdateTaskDialogOpen(false);
      resetUpdateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const resetUpdateForm = () => {
    setSelectedTask(null);
    setTaskStatus('');
    setTaskNotes('');
    setTimeSpent('');
  };

  const handleUpdateTask = () => {
    if (!selectedTask || !taskStatus) {
      toast({
        title: "Error",
        description: "Please select status",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      id: selectedTask.id,
      status: taskStatus,
      notes: taskNotes,
      timeSpent: timeSpent ? parseInt(timeSpent) : null,
      completedAt: taskStatus === 'completed' ? new Date().toISOString() : null,
    };

    updateTaskMutation.mutate(updateData);
  };

  const openUpdateDialog = (task: any) => {
    setSelectedTask(task);
    setTaskStatus(task.status);
    setTaskNotes(task.notes || '');
    setTimeSpent(task.timeSpent?.toString() || '');
    setIsUpdateTaskDialogOpen(true);
  };

  // Use real API data or empty array as fallback
  const inventoryTasks = Array.isArray(tasks) ? tasks : [];

  const taskColumns = [
    {
      key: "title",
      header: "Task",
      cell: (task: any) => (
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      cell: (task: any) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <span>{task.assignedTo}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (task: any) => {
        const statusConfig = {
          new: { color: "outline", icon: AlertTriangle },
          in_progress: { color: "default", icon: Clock },
          completed: { color: "default", icon: CheckCircle },
          cancelled: { color: "destructive", icon: AlertTriangle }
        };
        const config = statusConfig[task.status as keyof typeof statusConfig];
        const Icon = config.icon;
        
        return (
          <Badge variant={config.color as any} className="flex items-center space-x-1 w-fit">
            <Icon className="h-3 w-3" />
            <span className="capitalize">{task.status.replace('_', ' ')}</span>
          </Badge>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      cell: (task: any) => {
        const priorityColors = {
          low: "bg-gray-100 text-gray-800",
          medium: "bg-blue-100 text-blue-800", 
          high: "bg-orange-100 text-orange-800",
          urgent: "bg-red-100 text-red-800"
        };
        return (
          <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
            {task.priority.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (task: any) => new Date(task.dueDate).toLocaleDateString(),
    },
    {
      key: "category",
      header: "Category",
      cell: (task: any) => (
        <Badge variant="outline" className="capitalize">
          {task.category.replace('_', ' ')}
        </Badge>
      ),
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Tasks</h1>
          <p className="text-muted-foreground">Assign and track inventory tasks to employees</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Inventory Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskTitle">Task Title *</Label>
                  <Input id="taskTitle" placeholder="Stock Count - Warehouse A" data-testid="input-task-title" />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea id="taskDescription" placeholder="Detailed task description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignedTo">Assign To</Label>
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority..." />
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
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
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
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="datetime-local" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-save-task">
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isUpdateTaskDialogOpen} onOpenChange={setIsUpdateTaskDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Task Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTask && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="font-medium">{selectedTask.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={taskStatus} onValueChange={setTaskStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeSpent">Time Spent (hours)</Label>
                  <Input 
                    id="timeSpent" 
                    type="number" 
                    placeholder="Hours worked on this task" 
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                    data-testid="input-time-spent"
                  />
                </div>
                <div>
                  <Label htmlFor="taskNotes">Progress Notes</Label>
                  <Textarea 
                    id="taskNotes" 
                    placeholder="Add notes about progress, issues, or completion details..." 
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    data-testid="textarea-task-notes"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUpdateTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateTask}
                    disabled={updateTaskMutation.isPending}
                    data-testid="button-update-task"
                  >
                    {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" data-testid="button-task-reports">
            <Calendar className="h-4 w-4 mr-2" />
            Task Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">18</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground">7</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">8</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all-tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="urgent">Urgent</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="all-tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5" />
                <span>All Inventory Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={inventoryTasks}
                columns={taskColumns}
                searchable={true}
                searchKey="title"
                onEdit={(task) => openUpdateDialog(task)}
                onView={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-tasks">
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryTasks.filter(task => task.assignedTo === "John Smith").map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge>{task.priority.toUpperCase()}</Badge>
                      <Button size="sm">
                        Update Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent">
          <Card>
            <CardHeader>
              <CardTitle>Urgent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryTasks.filter(task => task.priority === "urgent").map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-900">{task.title}</p>
                        <p className="text-sm text-red-600">Assigned to: {task.assignedTo}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">URGENT</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No overdue tasks at the moment</p>
                <p className="text-sm">Great job keeping up with deadlines!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}