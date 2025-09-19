import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, RefreshCw, Search, Filter, X,
  Grid3X3, Table as TableIcon, Calendar, Users, CalendarDays, TrendingUp, AlertTriangle
} from "lucide-react";
import { format, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isPast } from "date-fns";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  assignee: string;
  dateFilter: DateFilter;
  dateFrom?: Date;
  dateTo?: Date;
}

export default function MarketingTasks() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskWithDetails | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dateFilter: 'all'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/marketing-tasks'],
    queryFn: () => apiRequest('/api/marketing-tasks')
  });

  // Fetch users for assignee filter
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });

  // Delete mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest(`/api/marketing-tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] });
      toast({ title: "Task deleted successfully!" });
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    }
  });

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assignedToUser?.firstName.toLowerCase().includes(searchLower) ||
        task.assignedToUser?.lastName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') filtered = filtered.filter(task => task.status === filters.status);
    if (filters.priority !== 'all') filtered = filtered.filter(task => task.priority === filters.priority);

    if (filters.assignee !== 'all') {
      filtered = filters.assignee === 'unassigned'
        ? filtered.filter(task => !task.assignedTo)
        : filtered.filter(task => task.assignedTo === filters.assignee);
    }

    const now = new Date();
    switch (filters.dateFilter) {
      case 'today':
        filtered = filtered.filter(task => task.dueDate && isToday(new Date(task.dueDate)));
        break;
      case 'week':
        filtered = filtered.filter(task => task.dueDate && isAfter(new Date(task.dueDate), startOfWeek(now)) && isBefore(new Date(task.dueDate), endOfWeek(now)));
        break;
      case 'month':
        filtered = filtered.filter(task => task.dueDate && isAfter(new Date(task.dueDate), startOfMonth(now)) && isBefore(new Date(task.dueDate), endOfMonth(now)));
        break;
      case 'overdue':
        filtered = filtered.filter(task => task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed');
        break;
      case 'custom':
        if (filters.dateFrom && filters.dateTo) {
          filtered = filtered.filter(task => task.dueDate && isAfter(new Date(task.dueDate), filters.dateFrom!) && isBefore(new Date(task.dueDate), filters.dateTo!));
        }
        break;
    }

    return filtered;
  }, [tasks, filters]);

  const stats = useMemo(() => ({
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    overdue: filteredTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'completed').length,
    dueToday: filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'completed').length
  }), [filteredTasks]);

  const handleEditTask = (task: TaskWithDetails) => { setEditingTask(task); setShowTaskForm(true); };
  const handleDeleteTask = (taskId: string) => { setTaskToDelete(taskId); };
  const handleViewTaskDetails = (task: TaskWithDetails) => { setSelectedTaskDetails(task); };
  const handleCreateTaskWithStatus = () => { setEditingTask(null); setShowTaskForm(true); };
  const resetFilters = () => setFilters({ search: '', status: 'all', priority: 'all', assignee: 'all', dateFilter: 'all' });
  const getActiveFiltersCount = () => Object.values(filters).filter(v => v && v !== 'all').length;

  if (tasksError) return (
    <div className="p-8">
      <Card className="border-red-200">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2 text-red-700">Failed to Load Tasks</h2>
          <p className="text-muted-foreground mb-4">Error loading tasks. Please try again.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] })}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header, Metrics, Filters, Task Views... */}
      {/* Keep rest of the code same as your previous file */}
    </div>
  );
}
