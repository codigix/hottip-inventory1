import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, AlertCircle, TrendingUp, Users, Calendar, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TaskMetricsData {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todaysDue: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByType: Record<string, number>;
  topPerformers: Array<{
    user: { id: string; firstName: string; lastName: string };
    completedTasks: number;
  }>;
}

export default function TaskMetrics() {
  const { data: metrics, isLoading } = useQuery<TaskMetricsData>({
    queryKey: ['/marketing-tasks/metrics']
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Tasks",
      value: metrics.totalTasks,
      icon: Target,
      change: "+12% from last month",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Pending Tasks",
      value: metrics.pendingTasks,
      icon: Clock,
      change: `${metrics.overdueTasks} overdue`,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "In Progress",
      value: metrics.inProgressTasks,
      icon: Zap,
      change: `${metrics.todaysDue} due today`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950"
    },
    {
      title: "Completed",
      value: metrics?.completedTasks ?? 0,
      icon: CheckCircle,
      change: metrics?.completionRate != null
        ? `${metrics.completionRate.toFixed(1)}% completion rate`
        : "No data",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-light text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`metric-${metric.title.toLowerCase().replace(' ', '-')}`}>
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Priority Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full"></Badge>
                <span className="text-sm">High Priority</span>
              </div>
              <span className="text-sm font-light" data-testid="metric-high-priority">
                {metrics?.tasksByPriority?.high ?? 0}
              </span>
            </div>
            <Progress
              value={
                metrics?.tasksByPriority?.high && metrics?.totalTasks
                  ? (metrics.tasksByPriority.high / metrics.totalTasks) * 100
                  : 0
              }
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="w-2 h-2 p-0 rounded-full bg-yellow-500"></Badge>
                <span className="text-sm">Medium Priority</span>
              </div>
              <span className="text-sm font-light" data-testid="metric-medium-priority">
                {metrics?.tasksByPriority?.medium ?? 0}
              </span>
            </div>
            <Progress
              value={
                metrics?.tasksByPriority?.medium && metrics?.totalTasks
                  ? (metrics.tasksByPriority.medium / metrics.totalTasks) * 100
                  : 0
              }
              className="h-2"
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full"></Badge>
                <span className="text-sm">Low Priority</span>
              </div>
              <span className="text-sm font-light" data-testid="metric-low-priority">
                {metrics?.tasksByPriority?.low ?? 0}
              </span>
            </div>
            <Progress
              value={
                metrics?.tasksByPriority?.low && metrics?.totalTasks
                  ? (metrics.tasksByPriority.low / metrics.totalTasks) * 100
                  : 0
              }
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Top Performers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(metrics?.topPerformers ?? []).slice(0, 3).map((performer, index) => (
              <div key={performer.user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${index === 0 ? "bg-yellow-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                          "bg-orange-600 text-white"
                      }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-light">
                    {performer.user.firstName} {performer.user.lastName}
                  </span>
                </div>
                <Badge variant="secondary" data-testid={`performer-${index}-tasks`}>
                  {performer.completedTasks ?? 0} tasks
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>This Week Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-light" data-testid="completion-rate">
                  {metrics?.completionRate != null ? metrics.completionRate.toFixed(1) : 0}%
                </span>
              </div>
              <Progress value={metrics?.completionRate} className="h-2" />
            </div>

            <div className="flex justify-between items-center py-1 border-t">
              <span className="text-sm text-muted-foreground">Avg. Completion</span>
              <span className="text-sm font-light" data-testid="avg-completion-time">
               {metrics?.averageCompletionTime != null ? metrics.averageCompletionTime.toFixed(1) : 0}h
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">Due Today</span>
              <Badge
                variant={metrics.todaysDue > 0 ? "default" : "secondary"}
                data-testid="tasks-due-today"
              >
                {metrics.todaysDue}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <Badge
                variant={metrics.overdueTasks > 0 ? "destructive" : "secondary"}
                data-testid="overdue-tasks"
              >
                {metrics.overdueTasks}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}