import { useState, useMemo } from "react";
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      apiRequest(`/api/marketing-tasks/${taskId}/status`, { 
        method: 'PUT', 
        body: JSON.stringify({ status }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks/metrics'] });
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
      apiRequest(`/api/marketing-tasks/${taskId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks/metrics'] });
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

    let color = "text-gray-500";
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

  const columns = useMemo<Column<TaskWithDetails>[]>(() => [
    {
      key: "select",
      header: (
        <Checkbox
          checked={selectedTasks.size === tasks.length && tasks.length > 0}
          onCheckedChange={handleSelectAll}
          data-testid="select-all-tasks"
        />
      ),
      cell: (task) => (
        <Checkbox
          checked={selectedTasks.has(task.id)}
          onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
          data-testid={`select-task-${task.id}`}
        />
      ),
    },
    {
      key: "title",
      header: "Task",
      cell: (task) => (
        <div className="space-y-1">
          <div 
            className="font-light text-xs cursor-pointer hover:text-primary line-clamp-1"
            onClick={() => onViewDetails?.(task)}
          >
            {task.title}
          </div>
          <div className="flex  space-x-2 text-[10px] text-muted-foreground   font-light">
            <span className="bg-muted px-1 rounded">{taskTypeLabels[task.taskType as keyof typeof taskTypeLabels] || task.taskType}</span>
            {task.lead && (
              <div className="flex">
                <span className="mx-1">•</span>
                <span className="hover:text-primary cursor-pointer truncate">
                  {task.lead.companyName || `${task.lead.firstName} ${task.lead.lastName}`}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (task) => (
        <Badge 
          variant="outline" 
          className={`${statusColors[task.status as keyof typeof statusColors]} border-none capitalize font-light text-[10px] p-1`}
        >
          {task.status.replace('_', ' ')}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (task) => (
        <Badge 
          variant="outline" 
          className={`${priorityColors[task.priority as keyof typeof priorityColors]} border-none capitalize font-light text-[10px] p-1`}
        >
          {task.priority}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "assignedTo",
      header: "Assignee",
      cell: (task) => task.assignedToUser ? (
        <div className="flex items-center space-x-2">
          
          <span className="text-xs font-light">{task.assignedToUser.firstName} {task.assignedToUser.lastName}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic font-light">Unassigned</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (task) => {
        const info = getDueDateInfo(task.dueDate);
        if (!info) return <span className="text-xs text-muted-foreground font-light">-</span>;
        return (
          <div className={`flex items-center space-x-1 text-xs font-light ${info.color}`}>
            {info.icon}
            <span>{info.text}</span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "progress",
      header: "Progress",
      cell: (task) => (
        <div className="w-full max-w-[80px] space-y-1">
          <div className="flex justify-between text-[10px] font-light text-muted-foreground">
            <span>{getProgressPercentage(task.status)}%</span>
          </div>
          <Progress value={getProgressPercentage(task.status)} className="h-1" />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (task) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`task-actions-${task.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-light">Task Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewDetails?.(task)} className="text-xs">
                <Eye className="h-4 w-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(task)} className="text-xs">
                <Edit className="h-4 w-4 mr-2" /> Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {task.status === 'pending' && (
                <DropdownMenuItem 
                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                  className="text-xs text-blue-600"
                >
                  <Play className="h-4 w-4 mr-2" /> Start Task
                </DropdownMenuItem>
              )}
              
              {task.status !== 'completed' && (
                <DropdownMenuItem 
                  onClick={() => handleStatusChange(task.id, 'completed')}
                  className="text-xs text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Mark Completed
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  navigator.clipboard.writeText(task.id);
                  toast({ title: "Task ID copied to clipboard" });
                }}
                className="text-xs"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(task.id)}
                className="text-xs text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }
  ], [selectedTasks, tasks, onViewDetails, onEdit, onDelete]);

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
      <DataTable
        data={tasks}
        columns={columns}
        isLoading={loading}
        searchable={false}
      />
    </div>
  );
}
