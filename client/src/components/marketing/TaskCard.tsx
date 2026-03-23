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
  visit_client: "bg-blue-100 text-blue-800",
  follow_up: "bg-[#dcfce7] text-[#166534]",
  demo: "bg-purple-100 text-purple-800",
  presentation: "bg-orange-100 text-orange-800",
  proposal: "bg-red-100 text-red-800",
  phone_call: "bg-[#dcfce7] text-[#166534]",
  email_campaign: "bg-pink-100 text-pink-800",
  market_research: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800"
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
  completed: "bg-[#dcfce7] text-[#166534]",
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
      apiRequest(`/api/marketing-tasks/${task.id}/status`, { 
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
    mutationFn: () => apiRequest(`/api/marketing-tasks/${task.id}/complete`, { method: 'POST' }),
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
    return "text-gray-500";
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
      className={`transition-all duration-200 hover:shadow-md border border-slate-200 relative ${
        draggable ? 'cursor-move' : ''
      }`}
      data-testid={`task-card-${task.id}`}
    >
      <CardHeader className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded flex-shrink-0 ${taskTypeColors[task.type] || taskTypeColors.other}`}>
            <TaskIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between">
              <h3 
                className="text-xs  text-slate-900 leading-snug cursor-pointer hover:text-primary pr-6"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid={`task-title-${task.id}`}
              >
                {task.title}
              </h3>
              
              <div className="absolute right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400">
                      <MoreVertical className="h-4 w-4" />
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
                        <DropdownMenuItem className="lowercase"
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

            <Badge 
              variant="secondary" 
              className={`text-[10px]  p-1 lowercase ${statusColors[task.status]}`}
              data-testid={`task-status-${task.id}`}
            >
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <div className="p-2">
        <Progress value={getProgressPercentage()} className="h-1 bg-slate-100 [&>div]:bg-[#7c3aed]" />
      </div>

      <CardContent className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {showAssignee && task.assignedToUser && (
              <div className="flex items-center gap-2">
                {/* <Avatar className="h-6 w-6 border border-slate-200">
                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold uppercase">
                    {task.assignedToUser.firstName[0]}{task.assignedToUser.lastName[0]}
                  </AvatarFallback>
                </Avatar> */}
                <span 
                  className="text-xs  text-slate-500 truncate"
                  data-testid={`task-assignee-${task.id}`}
                >
                  {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.lead && (
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 px-2 py-0 h-6 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                Lead
              </Badge>
            )}
            
            {!task.lead && task.fieldVisit && (
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 px-2 py-0 h-6 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Visit
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}