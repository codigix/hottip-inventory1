import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreVertical, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskCard from "./TaskCard";
import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  assignedByUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

interface TaskBoardProps {
  tasks: TaskWithDetails[];
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  onCreateTask?: (status?: string) => void;
  loading?: boolean;
}

interface BoardColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  maxTasks?: number;
}

const boardColumns: BoardColumn[] = [
  {
    id: 'pending',
    title: 'Pending',
    status: 'pending',
    color: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    icon: Clock,
    description: 'Tasks waiting to be started',
    maxTasks: 50
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    status: 'in_progress',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700',
    icon: Users,
    description: 'Currently active tasks',
    maxTasks: 20
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'completed',
    color: 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700',
    icon: CheckCircle,
    description: 'Successfully finished tasks'
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    status: 'cancelled',
    color: 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700',
    icon: AlertCircle,
    description: 'Tasks that were cancelled or abandoned'
  }
];

export default function TaskBoard({ 
  tasks, 
  onEdit, 
  onDelete, 
  onCreateTask,
  loading = false 
}: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      apiRequest(`api/marketing-tasks/${taskId}/status`, { 
        method: 'PUT', 
        body: JSON.stringify({ status }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['api/marketing-tasks/metrics'] });
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
      apiRequest(`api/marketing-tasks/${taskId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['api/marketing-tasks/metrics'] });
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

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, TaskWithDetails[]>);

  // Handle drag and drop
  const handleDragStart = (task: TaskWithDetails) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    if (newStatus === 'completed') {
      completeTaskMutation.mutate(draggedTask.id);
    } else {
      updateStatusMutation.mutate({ taskId: draggedTask.id, status: newStatus });
    }
    
    setDraggedTask(null);
  };

  const getColumnStats = (status: string) => {
    const columnTasks = tasksByStatus[status] || [];
    const overdue = columnTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;
    
    return {
      total: columnTasks.length,
      overdue,
      highPriority: columnTasks.filter(task => 
        task.priority === 'high' || task.priority === 'urgent'
      ).length
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {boardColumns.map((column) => (
          <Card key={column.id} className={`min-h-[600px] ${column.color}`}>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Board</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop tasks between columns to update their status
          </p>
        </div>
        <Button 
          onClick={() => onCreateTask?.()}
          className="flex items-center space-x-2"
          data-testid="create-task-board"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {boardColumns.map((column) => {
          const Icon = column.icon;
          const columnTasks = tasksByStatus[column.status] || [];
          const stats = getColumnStats(column.status);
          const isMaxed = column.maxTasks && stats.total >= column.maxTasks;
          
          return (
            <Card 
              key={column.id}
              className={`min-h-[600px] transition-all duration-200 ${column.color} ${
                dragOverColumn === column.status ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
              data-testid={`column-${column.status}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <CardTitle className="text-sm font-light">
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary" data-testid={`column-count-${column.status}`}>
                      {stats.total}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onCreateTask?.(column.status)}
                        data-testid={`create-task-${column.status}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task Here
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {column.description}
                </p>
                
                {/* Column Stats */}
                <div className="flex items-center space-x-3 text-xs">
                  {stats.highPriority > 0 && (
                    <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>{stats.highPriority} high priority</span>
                    </div>
                  )}
                  
                  {stats.overdue > 0 && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <Clock className="h-3 w-3" />
                      <span>{stats.overdue} overdue</span>
                    </div>
                  )}
                  
                  {isMaxed && (
                    <Badge variant="destructive" className="text-xs">
                      At capacity
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className="cursor-move transition-transform hover:scale-105"
                        data-testid={`draggable-task-${task.id}`}
                      >
                        <TaskCard
                          task={task}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          compact
                          showAssignee
                          draggable
                        />
                      </div>
                    ))}
                    
                    {/* Empty State */}
                    {columnTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Icon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No {column.title.toLowerCase()} tasks
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCreateTask?.(column.status)}
                          className="mt-2 text-xs"
                          data-testid={`empty-create-${column.status}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Task
                        </Button>
                      </div>
                    )}
                    
                    {/* Drop Zone Indicator */}
                    {dragOverColumn === column.status && draggedTask && (
                      <div className="border-2 border-dashed border-primary rounded-lg p-4 bg-primary/5 text-center">
                        <p className="text-sm text-primary font-light">
                          Drop to move task to {column.title}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Board Footer with Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {boardColumns.map((column) => {
          const stats = getColumnStats(column.status);
          return (
            <div key={column.id} className="bg-muted/30 rounded-lg p-3">
              <div className="text-2xl font-bold" data-testid={`stat-total-${column.status}`}>
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">
                {column.title}
              </div>
              {stats.overdue > 0 && column.status !== 'completed' && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {stats.overdue} overdue
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}