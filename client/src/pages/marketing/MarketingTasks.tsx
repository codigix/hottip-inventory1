import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Grid3X3, 
  Table as TableIcon,
  SlidersHorizontal,
  Download,
  Upload,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  X,
  CalendarDays,
  User as UserIcon
} from "lucide-react";
import { format, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isPast } from "date-fns";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import TaskMetrics from "@/components/marketing/TaskMetrics";
import TaskForm from "@/components/marketing/TaskForm";
import TaskTable from "@/components/marketing/TaskTable";
import TaskBoard from "@/components/marketing/TaskBoard";
import TaskCard from "@/components/marketing/TaskCard";

import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  assignedByUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

type ViewMode = 'table' | 'board' | 'cards';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'overdue' | 'custom';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'urgent';

interface TaskFilters {
  search: string;
  status: StatusFilter;
  priority: PriorityFilter;
  assignee: string; // user id or 'all' or 'unassigned'
  dateFilter: DateFilter;
  dateFrom?: Date;
  dateTo?: Date;
}

export default function MarketingTasks() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskWithDetails | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dateFilter: 'all'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/marketing-tasks']
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads']
  });

  // Mutations
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest(`/api/marketing-tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks/metrics'] });
      toast({ title: "Task deleted successfully!" });
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting task", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter logic
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assignedToUser?.firstName.toLowerCase().includes(searchLower) ||
        task.assignedToUser?.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Assignee filter
    if (filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned') {
        filtered = filtered.filter(task => !task.assignedTo);
      } else {
        filtered = filtered.filter(task => task.assignedTo === filters.assignee);
      }
    }

    // Date filter
    const now = new Date();
    switch (filters.dateFilter) {
      case 'today':
        filtered = filtered.filter(task => 
          task.dueDate && isToday(new Date(task.dueDate))
        );
        break;
      case 'week':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        filtered = filtered.filter(task => 
          task.dueDate && 
          isAfter(new Date(task.dueDate), weekStart) && 
          isBefore(new Date(task.dueDate), weekEnd)
        );
        break;
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = filtered.filter(task => 
          task.dueDate && 
          isAfter(new Date(task.dueDate), monthStart) && 
          isBefore(new Date(task.dueDate), monthEnd)
        );
        break;
      case 'overdue':
        filtered = filtered.filter(task => 
          task.dueDate && 
          isPast(new Date(task.dueDate)) && 
          task.status !== 'completed'
        );
        break;
      case 'custom':
        if (filters.dateFrom && filters.dateTo) {
          filtered = filtered.filter(task => 
            task.dueDate && 
            isAfter(new Date(task.dueDate), filters.dateFrom!) && 
            isBefore(new Date(task.dueDate), filters.dateTo!)
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
      pending: filteredTasks.filter(t => t.status === 'pending').length,
      inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      overdue: filteredTasks.filter(t => 
        t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'completed'
      ).length,
      dueToday: filteredTasks.filter(t => 
        t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'completed'
      ).length
    };
  }, [filteredTasks]);

  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const handleViewTaskDetails = (task: TaskWithDetails) => {
    setSelectedTaskDetails(task);
  };

  const handleCreateTaskWithStatus = (status?: string) => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dateFilter: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.assignee !== 'all') count++;
    if (filters.dateFilter !== 'all') count++;
    return count;
  };

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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] })}
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
          <p className="text-muted-foreground">
            Manage and track marketing team tasks and assignments
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] })}
            disabled={tasksLoading}
            data-testid="refresh-tasks"
          >
            <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </Button>
          
          <Button 
            onClick={() => handleCreateTaskWithStatus()}
            className="flex items-center space-x-2"
            data-testid="create-task-main"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <TaskMetrics />

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" 
              onClick={() => setFilters(f => ({ ...f, status: 'all', dateFilter: 'all' }))}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setFilters(f => ({ ...f, status: 'pending' }))}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setFilters(f => ({ ...f, status: 'in_progress' }))}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-in-progress">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setFilters(f => ({ ...f, status: 'completed' }))}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setFilters(f => ({ ...f, dateFilter: 'overdue' }))}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600" data-testid="stat-overdue">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setFilters(f => ({ ...f, dateFilter: 'today' }))}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600" data-testid="stat-due-today">{stats.dueToday}</div>
              <div className="text-sm text-muted-foreground">Due Today</div>
            </div>
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
                  data-testid="search-tasks"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
                data-testid="toggle-filters"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  data-testid="reset-filters"
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-2"
                  data-testid="view-table"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                  className="h-8 px-2"
                  data-testid="view-board"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 px-2"
                  data-testid="view-cards"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-light mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(value: StatusFilter) => setFilters(f => ({ ...f, status: value }))}>
                    <SelectTrigger data-testid="filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-light mb-2 block">Priority</label>
                  <Select value={filters.priority} onValueChange={(value: PriorityFilter) => setFilters(f => ({ ...f, priority: value }))}>
                    <SelectTrigger data-testid="filter-priority">
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
                </div>

                <div>
                  <label className="text-sm font-light mb-2 block">Assignee</label>
                  <Select value={filters.assignee} onValueChange={(value) => setFilters(f => ({ ...f, assignee: value }))}>
                    <SelectTrigger data-testid="filter-assignee">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.filter(user => user.id && user.id.trim() !== "").map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-light mb-2 block">Due Date</label>
                  <Select value={filters.dateFilter} onValueChange={(value: DateFilter) => setFilters(f => ({ ...f, dateFilter: value }))}>
                    <SelectTrigger data-testid="filter-date">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filters.dateFilter === 'custom' && (
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-48">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters(f => ({ ...f, dateFrom: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <span className="text-muted-foreground">to</span>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-48">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters(f => ({ ...f, dateTo: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Task Views */}
      <div className="space-y-6">
        {viewMode === 'table' && (
          <TaskTable
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onViewDetails={handleViewTaskDetails}
            loading={tasksLoading}
          />
        )}

        {viewMode === 'board' && (
          <TaskBoard
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onCreateTask={handleCreateTaskWithStatus}
            loading={tasksLoading}
          />
        )}

        {viewMode === 'cards' && (
          <div className="space-y-6">
            {tasksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-light mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    {getActiveFiltersCount() > 0 
                      ? "Try adjusting your filters to see more tasks"
                      : "Get started by creating your first task"
                    }
                  </p>
                  <Button onClick={() => handleCreateTaskWithStatus()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    showAssignee
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={(open) => {
          setShowTaskForm(open);
          if (!open) setEditingTask(null);
        }}
        taskId={editingTask?.id}
        defaultValues={editingTask ? {
          title: editingTask.title,
          description: editingTask.description || '',
          type: editingTask.type,
          assignedTo: editingTask.assignedTo,
          priority: editingTask.priority,
          dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : undefined,
          estimatedHours: editingTask.estimatedHours?.toString() || '',
          leadId: editingTask.leadId || '',
          fieldVisitId: editingTask.fieldVisitId || '',
          tags: editingTask.tags || [],
          isRecurring: editingTask.isRecurring || false,
          recurringFrequency: editingTask.recurringFrequency as any
        } : undefined}
      />

      {/* Task Details Dialog */}
      <Dialog 
        open={!!selectedTaskDetails} 
        onOpenChange={(open) => !open && setSelectedTaskDetails(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Task Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTaskDetails && (
            <div className="space-y-4">
              <TaskCard
                task={selectedTaskDetails}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                showAssignee
                compact={false}
              />
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-light text-muted-foreground">Created:</span>
                  <p>{format(new Date(selectedTaskDetails.createdAt), "PPP 'at' p")}</p>
                </div>
                
                <div>
                  <span className="font-light text-muted-foreground">Last Updated:</span>
                  <p>{format(new Date(selectedTaskDetails.updatedAt), "PPP 'at' p")}</p>
                </div>
                
                {selectedTaskDetails.assignedByUser && (
                  <div>
                    <span className="font-light text-muted-foreground">Assigned By:</span>
                    <p>{selectedTaskDetails.assignedByUser.firstName} {selectedTaskDetails.assignedByUser.lastName}</p>
                  </div>
                )}
                
                {selectedTaskDetails.estimatedHours && (
                  <div>
                    <span className="font-light text-muted-foreground">Estimated Time:</span>
                    <p>{selectedTaskDetails.estimatedHours} hours</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!taskToDelete} 
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}