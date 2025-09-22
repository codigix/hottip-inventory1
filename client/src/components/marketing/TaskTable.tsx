import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Filter,
  Edit,
  CheckCircle,
  Play,
  Trash2,
  Calendar,
  User as UserIcon,
  Clock,
  AlertTriangle,
  Eye,
  Copy
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  assignedByUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

interface TaskTableProps {
  tasks: TaskWithDetails[];
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  onViewDetails?: (task: TaskWithDetails) => void;
  loading?: boolean;
}

type SortField = 'title' | 'priority' | 'status' | 'dueDate' | 'assignedTo' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };

const taskTypeLabels = {
  visit_client: 'Client Visit',
  follow_up: 'Follow Up',
  demo: 'Product Demo',
  presentation: 'Presentation',
  proposal: 'Proposal',
  phone_call: 'Phone Call',
  email_campaign: 'Email Campaign',
  market_research: 'Market Research',
  other: 'Other'
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
};

export default function TaskTable({ 
  tasks, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  loading = false 
}: TaskTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      apiRequest(`/marketing-tasks/${taskId}/status`, { 
        method: 'PUT', 
        body: JSON.stringify({ status }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/marketing-tasks/metrics'] });
      toast({ title: "Task status updated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating task status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => 
      apiRequest(`/${taskId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/marketing-tasks/metrics'] });
      toast({ title: "Task completed successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error completing task", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Sorting logic
  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'status':
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
      case 'assignedTo':
        const nameA = a.assignedToUser ? `${a.assignedToUser.firstName} ${a.assignedToUser.lastName}` : '';
        const nameB = b.assignedToUser ? `${b.assignedToUser.firstName} ${b.assignedToUser.lastName}` : '';
        comparison = nameA.localeCompare(nameB);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelection = new Set(selectedTasks);
    if (checked) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleStatusChange = (taskId: string, status: string) => {
    if (status === 'completed') {
      completeTaskMutation.mutate(taskId);
    } else {
      updateStatusMutation.mutate({ taskId, status });
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 60;
      case 'pending':
        return 0;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const isOverdue = isPast(date);
    const isDueToday = isToday(date);
    const isDueTomorrow = isTomorrow(date);

    let color = "text-muted-foreground";
    let text = format(date, "MMM d");
    let icon = null;

    if (isOverdue) {
      color = "text-red-600 dark:text-red-400";
      text = "Overdue";
      icon = <AlertTriangle className="h-3 w-3" />;
    } else if (isDueToday) {
      color = "text-orange-600 dark:text-orange-400";
      text = "Today";
    } else if (isDueTomorrow) {
      color = "text-yellow-600 dark:text-yellow-400";
      text = "Tomorrow";
    }

    return { color, text, icon, isOverdue };
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 p-0 font-light hover:bg-transparent"
      onClick={() => handleSort(field)}
      data-testid={`sort-${field}`}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  if (loading) {
    return (
      <div className="border">
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="w-32 h-4 bg-muted rounded"></div>
                <div className="w-20 h-4 bg-muted rounded"></div>
                <div className="w-24 h-4 bg-muted rounded"></div>
                <div className="w-28 h-4 bg-muted rounded"></div>
                <div className="w-20 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-light">
            {selectedTasks.size} task(s) selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              selectedTasks.forEach(taskId => {
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status === 'pending') {
                  handleStatusChange(taskId, 'in_progress');
                }
              });
            }}
            data-testid="bulk-start"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              selectedTasks.forEach(taskId => {
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status === 'in_progress') {
                  handleStatusChange(taskId, 'completed');
                }
              });
            }}
            data-testid="bulk-complete"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTasks(new Set())}
            data-testid="bulk-clear"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Tasks Table */}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="select-all-tasks"
                />
              </TableHead>
              <TableHead>
                <SortableHeader field="title">Task</SortableHeader>
              </TableHead>
              <TableHead className="w-32">
                <SortableHeader field="status">Status</SortableHeader>
              </TableHead>
              <TableHead className="w-28">
                <SortableHeader field="priority">Priority</SortableHeader>
              </TableHead>
              <TableHead className="w-40">
                <SortableHeader field="assignedTo">Assignee</SortableHeader>
              </TableHead>
              <TableHead className="w-32">
                <SortableHeader field="dueDate">Due Date</SortableHeader>
              </TableHead>
              <TableHead className="w-24">Progress</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => {
              const dueDateInfo = getDueDateInfo(task.dueDate);
              const progress = getProgressPercentage(task.status);
              
              return (
                <TableRow 
                  key={task.id}
                  className={`${selectedTasks.has(task.id) ? 'bg-muted/50' : ''} ${
                    dueDateInfo?.isOverdue && task.status !== 'completed' ? 'border-l-2 border-l-red-500' : ''
                  }`}
                  data-testid={`task-row-${task.id}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                      data-testid={`select-task-${task.id}`}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div 
                        className="font-light text-sm cursor-pointer hover:text-primary line-clamp-1"
                        onClick={() => onViewDetails?.(task)}
                        data-testid={`task-title-${task.id}`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {taskTypeLabels[task.type]}
                      </div>
                      {task.estimatedHours && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimatedHours}h
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={statusColors[task.status]}
                      data-testid={`task-status-${task.id}`}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={priorityColors[task.priority]}
                      data-testid={`task-priority-${task.id}`}
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {task.assignedToUser ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assignedToUser.firstName[0]}{task.assignedToUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span 
                          className="text-sm truncate"
                          data-testid={`task-assignee-${task.id}`}
                        >
                          {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {dueDateInfo ? (
                      <div className={`flex items-center space-x-1 text-sm ${dueDateInfo.color}`}>
                        <Calendar className="h-3 w-3" />
                        <span data-testid={`task-due-date-${task.id}`}>
                          {dueDateInfo.text}
                        </span>
                        {dueDateInfo.icon}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No due date</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1 w-16" />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        {onViewDetails && (
                          <DropdownMenuItem 
                            onClick={() => onViewDetails(task)}
                            data-testid={`task-view-${task.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        
                        {onEdit && (
                          <DropdownMenuItem 
                            onClick={() => onEdit(task)}
                            data-testid={`task-edit-${task.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {task.status === 'pending' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                            data-testid={`task-start-${task.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Task
                          </DropdownMenuItem>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(task.id, 'completed')}
                            data-testid={`task-complete-${task.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Task
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => {
                            navigator.clipboard.writeText(task.id);
                            toast({ title: "Task ID copied to clipboard" });
                          }}
                          data-testid={`task-copy-${task.id}`}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Task ID
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(task.id)}
                            className="text-red-600 dark:text-red-400"
                            data-testid={`task-delete-${task.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No tasks found</div>
            <div className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or create a new task
            </div>
          </div>
        )}
      </div>
    </div>
  );
}