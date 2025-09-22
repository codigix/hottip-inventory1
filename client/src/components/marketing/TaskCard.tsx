import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Clock, 
  User as UserIcon, 
  Calendar, 
  Tag, 
  CheckCircle, 
  Play, 
  Pause, 
  MoreVertical,
  Edit,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  Presentation,
  Search,
  TrendingUp,
  FileText,
  Target,
  AlertTriangle,
  Timer,
  Building
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  assignedByUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

interface TaskCardProps {
  task: TaskWithDetails;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  compact?: boolean;
  showAssignee?: boolean;
  draggable?: boolean;
}

const taskTypeIcons = {
  visit_client: Users,
  follow_up: Phone,
  demo: Presentation,
  presentation: FileText,
  proposal: Target,
  phone_call: Phone,
  email_campaign: Mail,
  market_research: Search,
  other: Tag
};

const taskTypeColors = {
  visit_client: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  follow_up: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  demo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  presentation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  proposal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  phone_call: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  email_campaign: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  market_research: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200"
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  compact = false,
  showAssignee = true,
  draggable = false 
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => 
      apiRequest(`/marketing-tasks/${task.id}/status`, { 
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
    mutationFn: () => apiRequest(`/${task.id}/complete`, { method: 'POST' }),
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

  const TaskIcon = taskTypeIcons[task.type] || Tag;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));

  const handleStatusChange = (status: string) => {
    if (status === 'completed') {
      completeTaskMutation.mutate();
    } else {
      updateStatusMutation.mutate({ status });
    }
  };

  const getProgressPercentage = () => {
    switch (task.status) {
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

  const getDueDateColor = () => {
    if (isOverdue) return "text-red-600 dark:text-red-400";
    if (isDueToday) return "text-orange-600 dark:text-orange-400";
    if (isDueTomorrow) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const getDueDateText = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    
    if (isOverdue) return "Overdue";
    if (isDueToday) return "Due today";
    if (isDueTomorrow) return "Due tomorrow";
    return format(date, "MMM d, yyyy");
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        draggable ? 'cursor-move' : ''
      } ${isOverdue ? 'border-l-4 border-l-red-500' : ''} ${
        task.priority === 'urgent' ? 'border-l-4 border-l-red-400' : ''
      }`}
      data-testid={`task-card-${task.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between space-x-2">
          <div className="flex items-start space-x-2 flex-1">
            <div className={`p-1.5 rounded-lg ${taskTypeColors[task.type]}`}>
              <TaskIcon className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-sm leading-tight truncate cursor-pointer hover:text-primary"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid={`task-title-${task.id}`}
              >
                {task.title}
              </h3>
              {!compact && task.description && (
                <p 
                  className={`text-xs text-muted-foreground mt-1 ${
                    isExpanded ? '' : 'line-clamp-2'
                  }`}
                  data-testid={`task-description-${task.id}`}
                >
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${priorityColors[task.priority]}`}
              data-testid={`task-priority-${task.id}`}
            >
              {task.priority}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.status === 'pending' && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('in_progress')}
                    data-testid={`task-start-${task.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Task
                  </DropdownMenuItem>
                )}
                
                {task.status === 'in_progress' && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('completed')}
                      data-testid={`task-complete-${task.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Task
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('pending')}
                      data-testid={`task-pause-${task.id}`}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Task
                    </DropdownMenuItem>
                  </>
                )}
                
                {(task.status === 'pending' || task.status === 'in_progress') && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('cancelled')}
                    data-testid={`task-cancel-${task.id}`}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cancel Task
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={() => onEdit(task)}
                    data-testid={`task-edit-${task.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 dark:text-red-400"
                    data-testid={`task-delete-${task.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <Badge 
                variant="secondary" 
                className={statusColors[task.status]}
                data-testid={`task-status-${task.id}`}
              >
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-muted-foreground">
                {getProgressPercentage()}%
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-1" />
          </div>

          {/* Task Info */}
          <div className="space-y-2">
            {/* Assignee & Due Date */}
            <div className="flex items-center justify-between text-xs">
              {showAssignee && task.assignedToUser && (
                <div className="flex items-center space-x-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {task.assignedToUser.firstName[0]}{task.assignedToUser.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="text-muted-foreground truncate max-w-[80px]"
                    data-testid={`task-assignee-${task.id}`}
                  >
                    {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                  </span>
                </div>
              )}

              {task.dueDate && (
                <div className={`flex items-center space-x-1 ${getDueDateColor()}`}>
                  <Calendar className="h-3 w-3" />
                  <span data-testid={`task-due-date-${task.id}`}>
                    {getDueDateText()}
                  </span>
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                </div>
              )}
            </div>

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                <span data-testid={`task-estimated-hours-${task.id}`}>
                  {task.estimatedHours}h estimated
                </span>
              </div>
            )}

            {/* Related entities */}
            <div className="flex items-center space-x-2 text-xs">
              {task.lead && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      <UserIcon className="h-2.5 w-2.5 mr-1" />
                      Lead
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.lead.firstName} {task.lead.lastName}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {task.fieldVisit && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      <MapPin className="h-2.5 w-2.5 mr-1" />
                      Visit
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.fieldVisit.visitNumber}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, compact ? 2 : 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-[9px] px-1 py-0"
                    data-testid={`task-tag-${task.id}-${index}`}
                  >
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > (compact ? 2 : 3) && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    +{task.tags.length - (compact ? 2 : 3)}
                  </Badge>
                )}
              </div>
            )}

            {/* Recurring indicator */}
            {task.isRecurring && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-3 w-3" />
                <span>Recurring {task.recurringFrequency}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}