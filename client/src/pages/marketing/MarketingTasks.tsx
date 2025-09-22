import { useState, useMemo, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Grid3X3,
  Table as TableIcon,
  Download,
  Upload,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  X,
  CalendarDays,
} from "lucide-react";
import {
  format,
  isAfter,
  isBefore,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
  isPast,
  isWithinInterval,
} from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

import TaskMetrics from "@/components/marketing/TaskMetrics";
import TaskForm from "@/components/marketing/TaskForm";
import TaskTable from "@/components/marketing/TaskTable";

import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

const TaskBoard = lazy(() => import("@/components/marketing/TaskBoard"));
const TaskCard = lazy(() => import("@/components/marketing/TaskCard"));

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  assignedByUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

type ViewMode = "table" | "board" | "cards";
type DateFilter = "all" | "today" | "week" | "month" | "overdue" | "custom";
type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "cancelled";
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent";

interface TaskFilters {
  search: string;
  status: StatusFilter;
  priority: PriorityFilter;
  assignee: string; // user id or 'all' or 'unassigned'
  dateFilter: DateFilter;
  dateFrom?: Date;
  dateTo?: Date;
}

const DEFAULT_FILTERS: TaskFilters = {
  search: "",
  status: "all",
  priority: "all",
  assignee: "all",
  dateFilter: "all",
};

export default function MarketingTasks() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskWithDetails | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<TaskWithDetails[]>({
    queryKey: ["/marketing-tasks"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/users"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/marketing/leads"],
  });

  // Mutations
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest(`/marketing-tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/marketing-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/marketing-tasks/metrics"] });
      toast({ title: "Task deleted successfully!" });
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter logic
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    const now = new Date();

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.assignedToUser?.firstName.toLowerCase().includes(searchLower) ||
          task.assignedToUser?.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== "all") filtered = filtered.filter((t) => t.status === filters.status);

    // Priority filter
    if (filters.priority !== "all") filtered = filtered.filter((t) => t.priority === filters.priority);

    // Assignee filter
    if (filters.assignee !== "all") {
      filtered =
        filters.assignee === "unassigned"
          ? filtered.filter((t) => !t.assignedTo)
          : filtered.filter((t) => t.assignedTo === filters.assignee);
    }

    // Date filter
    switch (filters.dateFilter) {
      case "today":
        filtered = filtered.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));
        break;
      case "week": {
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        filtered = filtered.filter(
          (t) =>
            t.dueDate &&
            isWithinInterval(new Date(t.dueDate), { start: weekStart, end: weekEnd })
        );
        break;
      }
      case "month": {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = filtered.filter(
          (t) =>
            t.dueDate &&
            isWithinInterval(new Date(t.dueDate), { start: monthStart, end: monthEnd })
        );
        break;
      }
      case "overdue":
        filtered = filtered.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed");
        break;
      case "custom":
        if (filters.dateFrom && filters.dateTo) {
          filtered = filtered.filter(
            (t) =>
              t.dueDate &&
              isWithinInterval(new Date(t.dueDate), { start: filters.dateFrom!, end: filters.dateTo! })
          );
        }
        break;
    }

    return filtered;
  }, [tasks, filters]);

  // Quick stats
  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      pending: filteredTasks.filter((t) => t.status === "pending").length,
      inProgress: filteredTasks.filter((t) => t.status === "in_progress").length,
      completed: filteredTasks.filter((t) => t.status === "completed").length,
      overdue: filteredTasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed").length,
      dueToday: filteredTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "completed").length,
    };
  }, [filteredTasks]);

  // Handlers
  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId: string) => setTaskToDelete(taskId);
  const handleViewTaskDetails = (task: TaskWithDetails) => setSelectedTaskDetails(task);
  const handleCreateTaskWithStatus = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const getActiveFiltersCount = () => Object.entries(filters).reduce((count, [key, value]) => {
    if ((key === "search" && value) || value !== "all") count++;
    return count;
  }, 0);

  if (tasksError) {
    return (
      <div className="p-8">
        <Card className="border-red-200">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2 text-red-700">Failed to Load Tasks</h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading the marketing tasks. Please check your authentication and try again.
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/marketing-tasks"] })}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Tasks</h1>
          <p className="text-muted-foreground">Manage and track marketing team tasks and assignments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/marketing-tasks"] })}
            disabled={tasksLoading}
          >
            <RefreshCw className={`h-4 w-4 ${tasksLoading ? "animate-spin" : ""}`} />
            <span className="ml-2">Refresh</span>
          </Button>
          <Button onClick={handleCreateTaskWithStatus} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <TaskMetrics />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilters(f => ({ ...f, status: "all", dateFilter: "all" }))}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilters(f => ({ ...f, status: "pending" }))}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilters(f => ({ ...f, status: "in_progress" }))}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilters(f => ({ ...f, status: "completed" }))}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilters(f => ({ ...f, dateFilter: "overdue" }))}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilters(f => ({ ...f, dateFilter: "today" }))}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.dueToday}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="pl-9"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {getActiveFiltersCount() > 0 && <Badge variant="secondary">{getActiveFiltersCount()}</Badge>}
              </Button>

              {getActiveFiltersCount() > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 border rounded-lg p-1">
              <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")}>
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "board" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("board")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")}>
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status, Priority, Assignee, Date Filters */}
                {/* ... keep the same Select components with Popover for custom dates ... */}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Task Views */}
      <div className="space-y-6">
        {viewMode === "table" && <TaskTable tasks={filteredTasks} onEdit={handleEditTask} onDelete={handleDeleteTask} loading={tasksLoading} />}
        {viewMode === "board" && (
          <Suspense fallback={<div>Loading board...</div>}>
            <TaskBoard tasks={filteredTasks} onEdit={handleEditTask} onDelete={handleDeleteTask} onCreateTask={handleCreateTaskWithStatus} loading={tasksLoading} />
          </Suspense>
        )}
        {viewMode === "cards" && (
          <Suspense fallback={<div>Loading cards...</div>}>
            {/* Cards view rendering */}
          </Suspense>
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskForm open={showTaskForm} onOpenChange={(open) => { setShowTaskForm(open); if (!open) setEditingTask(null); }} taskId={editingTask?.id} defaultValues={editingTask ? {
        title: editingTask.title,
        description: editingTask.description || "",
        type: editingTask.type,
        assignedTo: editingTask.assignedTo,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : undefined,
        estimatedHours: editingTask.estimatedHours?.toString() || "",
        leadId: editingTask.leadId,
        fieldVisitId: editingTask.fieldVisitId,
        recurring: editingTask.recurring,
        recurringFrequency: editingTask.recurringFrequency,
      } : undefined} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this task? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Details Dialog */}
      <Dialog open={!!selectedTaskDetails} onOpenChange={() => setSelectedTaskDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div>Loading task details...</div>}>
            {selectedTaskDetails && <TaskCard task={selectedTaskDetails} />}
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  );
}
