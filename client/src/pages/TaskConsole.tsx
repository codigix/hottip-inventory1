
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminTasksTour } from "@/components/tours/dashboardTour";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ClipboardList, 
  Activity,
  Calendar,
  User,
  Building2,
  RefreshCcw
} from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  updatedAt: string | null;
  department: string;
  assignedTo: string;
}

interface TaskLog {
  id: string;
  user: string;
  action: string;
  details: string | null;
  timestamp: string;
}

const fetchTasks = async () => {
  const res = await fetch("/api/admin/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

const TaskConsole: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/admin/tasks"],
    queryFn: fetchTasks,
  });

  const tasks = useMemo(() => (Array.isArray(data?.tasks) ? data.tasks : []), [data]);
  const logs = useMemo(() => (Array.isArray(data?.logs) ? data.logs : []), [data]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t: Task) => t.status.toLowerCase().includes("pending") || t.status.toLowerCase().includes("open")).length,
      inProgress: tasks.filter((t: Task) => t.status.toLowerCase().includes("progress") || t.status.toLowerCase().includes("active")).length,
      completed: tasks.filter((t: Task) => t.status.toLowerCase().includes("complete") || t.status.toLowerCase().includes("done")).length,
    };
  }, [tasks]);

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Task",
      sortable: true,
      cell: (task) => (
        <div className="flex flex-col">
          <span className=" text-slate-900">{task.title}</span>
          <span className="text-xs text-slate-500 line-clamp-1">{task.description || "No description"}</span>
        </div>
      ),
    },
    {
      key: "department",
      header: "Dept",
      sortable: true,
      cell: (task) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-slate-400" />
          <span className="text-xs">{task.department}</span>
        </div>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      sortable: true,
      cell: (task) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-slate-400" />
          <span className="text-xs">{task.assignedTo || "Unassigned"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (task) => {
        const status = task.status.toLowerCase();
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        if (status.includes("complete") || status.includes("done")) variant = "default";
        if (status.includes("progress") || status.includes("active")) variant = "secondary";
        if (status.includes("pending") || status.includes("open")) variant = "outline";
        
        return (
          <Badge variant={variant} className="capitalize text-[10px] h-5 px-1.5 font-normal">
            {task.status}
          </Badge>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      cell: (task) => {
        const priority = task.priority.toLowerCase();
        let color = "text-slate-500";
        if (priority === "high" || priority === "urgent") color = "text-red-500";
        if (priority === "medium") color = "text-amber-500";
        if (priority === "low") color = "text-blue-500";
        
        return (
          <span className={`capitalize text-[10px] font-bold ${color}`}>
            {task.priority}
          </span>
        );
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      cell: (task) => (
        <div className="flex items-center gap-1 text-slate-500 text-[10px]">
          <Calendar className="h-3 w-3" />
          <span>{task.dueDate ? format(new Date(task.dueDate), "dd MMM yy") : "No date"}</span>
        </div>
      ),
    },
  ];

  const logColumns: Column<TaskLog>[] = [
    {
      key: "timestamp",
      header: "Time",
      sortable: true,
      cell: (log) => <span className="text-[10px] text-slate-500">{format(new Date(log.timestamp), "HH:mm:ss dd/MM")}</span>,
    },
    {
      key: "user",
      header: "User",
      sortable: true,
      cell: (log) => <span className="text-[10px] ">{log.user}</span>,
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      cell: (log) => (
        <Badge variant="outline" className="font-mono text-[9px] h-4 px-1 leading-none uppercase">
          {log.action}
        </Badge>
      ),
    },
    {
      key: "details",
      header: "Details",
      cell: (log) => <span className="text-slate-500 text-[10px] line-clamp-1">{log.details}</span>,
    },
  ];

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-lg font-semibold">Failed to load tasks</h2>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 tracking-tight flex items-center gap-2" data-tour="admin-tasks-header">
            <ClipboardList className="h-6 w-6 text-primary" />
            Task Console
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Monitor and manage cross-departmental tasks and operational workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-white"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <StartTourButton tourConfig={adminTasksTour} tourName="admin-tasks" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="admin-tasks-stats">
        <div className="border-slate-200 shadow-sm bg-white border  p-2">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm  text-slate-500">Total Tasks</div>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-xl  text-slate-900">{stats.total}</div>
          </div>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm  text-slate-500">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm  text-slate-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm  text-slate-500">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full" data-tour="admin-tasks-tabs">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4 bg-white border border-slate-200 p-1">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-white">Active Tasks</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-white">Activity Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="mt-0">
          <div className="border-slate-200 shadow-sm overflow-hidden">
            <div className="p-0">
              <DataTable 
                data={tasks} 
                columns={columns} 
                isLoading={isLoading}
                searchPlaceholder="Search tasks by title, department or assignee..."
                defaultPageSize={10}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-0">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <DataTable 
                data={logs} 
                columns={logColumns} 
                isLoading={isLoading}
                searchPlaceholder="Search activity logs..."
                defaultPageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskConsole;
