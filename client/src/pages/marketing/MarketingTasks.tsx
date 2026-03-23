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
  ClipboardList,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import TaskCalendar from "@/components/marketing/TaskCalendar";

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
type StatusFilter =
  | "all"
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";
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
  const [selectedTaskDetails, setSelectedTaskDetails] =
    useState<TaskWithDetails | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/marketing-tasks"],
    queryFn: async () => {
      return await apiRequest("/api/marketing-tasks");
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/marketing/leads"],
  });

  // Mutations
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest(`/api/marketing-tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-tasks/metrics"] });
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
    if (filters.status !== "all")
      filtered = filtered.filter((t) => t.status === filters.status);

    // Priority filter
    if (filters.priority !== "all")
      filtered = filtered.filter((t) => t.priority === filters.priority);

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
        filtered = filtered.filter(
          (t) => t.dueDate && isToday(new Date(t.dueDate))
        );
        break;
      case "week": {
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        filtered = filtered.filter(
          (t) =>
            t.dueDate &&
            isWithinInterval(new Date(t.dueDate), {
              start: weekStart,
              end: weekEnd,
            })
        );
        break;
      }
      case "month": {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = filtered.filter(
          (t) =>
            t.dueDate &&
            isWithinInterval(new Date(t.dueDate), {
              start: monthStart,
              end: monthEnd,
            })
        );
        break;
      }
      case "overdue":
        filtered = filtered.filter(
          (t) =>
            t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed"
        );
        break;
      case "custom":
        if (filters.dateFrom && filters.dateTo) {
          filtered = filtered.filter(
            (t) =>
              t.dueDate &&
              isWithinInterval(new Date(t.dueDate), {
                start: filters.dateFrom!,
                end: filters.dateTo!,
              })
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
      inProgress: filteredTasks.filter((t) => t.status === "in_progress")
        .length,
      completed: filteredTasks.filter((t) => t.status === "completed").length,
      overdue: filteredTasks.filter(
        (t) =>
          t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed"
      ).length,
      dueToday: filteredTasks.filter(
        (t) =>
          t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "completed"
      ).length,
    };
  }, [filteredTasks]);

  // Handlers
  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId: string) => setTaskToDelete(taskId);
  const handleViewTaskDetails = (task: TaskWithDetails) =>
    setSelectedTaskDetails(task);
  const handleCreateTaskWithStatus = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const getActiveFiltersCount = () =>
    Object.entries(filters).reduce((count, [key, value]) => {
      if ((key === "search" && value) || value !== "all") count++;
      return count;
    }, 0);

  if (tasksError) {
    return (
      <div className="p-4">
        <Card className="border-red-200">
          <CardContent className=" text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg  mb-2 text-red-700">
              Failed to Load Tasks
            </h2>
            <p className="text-gray-500 mb-4">
              There was an error loading the marketing tasks. Please check your
              authentication and try again.
            </p>
            <Button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/marketing-tasks"],
                })
              }
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
    <div className="space-y-4 bg-slate-50/50 min-h-screen p-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Marketing Tasks
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage and track marketing team tasks and assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["/api/marketing-tasks"] })
            }
            disabled={tasksLoading}
            className="bg-white"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${tasksLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleCreateTaskWithStatus}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <TaskMetrics />

      {/* Search and Filters */}
      <div className="border border-slate-200 shadow-sm bg-white p-4 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Tabs 
              value={viewMode} 
              onValueChange={(v) => setViewMode(v as ViewMode)}
              className="bg-slate-100/50 p-1 rounded-lg h-10"
            >
              <TabsList className="bg-transparent border-none p-0 h-auto">
                <TabsTrigger value="table" className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-8 px-3">
                  <TableIcon className="h-4 w-4 mr-2" /> Table
                </TabsTrigger>
                <TabsTrigger value="board" className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-8 px-3">
                  <Grid3X3 className="h-4 w-4 mr-2" /> Board
                </TabsTrigger>
                <TabsTrigger value="cards" className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-8 px-3">
                  <Users className="h-4 w-4 mr-2" /> Cards
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-10 bg-slate-50 border-slate-200 h-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={"bg-white h-10 px-4" + (showFilters ? " bg-slate-100 border-primary/50" : "")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px]">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10 text-slate-500 hover:text-slate-900">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium ml-1">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v as StatusFilter }))}>
                <SelectTrigger className="h-9 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium ml-1">Priority</label>
              <Select value={filters.priority} onValueChange={(v) => setFilters(f => ({ ...f, priority: v as PriorityFilter }))}>
                <SelectTrigger className="h-9 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium ml-1">Assignee</label>
              <Select value={filters.assignee} onValueChange={(v) => setFilters(f => ({ ...f, assignee: v }))}>
                <SelectTrigger className="h-9 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium ml-1">Due Date</label>
              <Select value={filters.dateFilter} onValueChange={(v) => setFilters(f => ({ ...f, dateFilter: v as DateFilter }))}>
                <SelectTrigger className="h-9 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[500px]">
        {viewMode === "table" && (
          <TaskTable
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onViewDetails={handleViewTaskDetails}
            loading={tasksLoading}
          />
        )}

        {viewMode === "board" && (
          <Suspense fallback={<div className="p-8 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-300" /></div>}>
            <TaskBoard
              tasks={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onViewDetails={handleViewTaskDetails}
            />
          </Suspense>
        )}

        {viewMode === "cards" && (
          <Suspense fallback={<div className="p-8 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-300" /></div>}>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => handleEditTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onView={() => handleViewTaskDetails(task)}
                />
              ))}
              {filteredTasks.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No tasks found matching your filters</p>
                </div>
              )}
            </div>
          </Suspense>
        )}
      </div>

      {/* Forms and Modals */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={(open) => {
          setShowTaskForm(open);
          if (!open) setEditingTask(null);
        }}
        taskId={editingTask?.id}
        defaultValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || "",
                type: editingTask.type,
                assignedTo: editingTask.assignedTo,
                priority: editingTask.priority,
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate)
                  : undefined,
                estimatedHours: editingTask.estimatedHours?.toString() || "",
                leadId: editingTask.leadId,
                fieldVisitId: editingTask.fieldVisitId,
                recurring: editingTask.recurring,
                recurringFrequency: editingTask.recurringFrequency,
              }
            : undefined
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={() => setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                taskToDelete && deleteTaskMutation.mutate(taskToDelete)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Details Dialog */}
      <Dialog
        open={!!selectedTaskDetails}
        onOpenChange={() => setSelectedTaskDetails(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="p-8 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-300" /></div>}>
            {selectedTaskDetails && (
              <TaskCard 
                task={selectedTaskDetails} 
                onEdit={() => {
                  setSelectedTaskDetails(null);
                  handleEditTask(selectedTaskDetails);
                }}
                onDelete={() => {
                  setSelectedTaskDetails(null);
                  handleDeleteTask(selectedTaskDetails.id);
                }}
              />
            )}
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  );
}
