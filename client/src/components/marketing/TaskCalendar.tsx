import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Target,
  ArrowRight,
  Calendar as CalendarIcon,
  CircleDot,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  isTomorrow,
  isAfter,
  startOfToday
} from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  assignedByUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

interface TaskCalendarProps {
  tasks: TaskWithDetails[];
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  onViewDetails?: (task: TaskWithDetails) => void;
  loading?: boolean;
}

const priorityConfig = {
  low: { color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  medium: { color: "bg-yellow-500", light: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  high: { color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  urgent: { color: "bg-red-500", light: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const statusIcons = {
  pending: <Clock className="h-3 w-3 text-orange-500" />,
  in_progress: <Clock className="h-3 w-3 text-blue-500" />,
  completed: <CheckCircle className="h-3 w-3 text-green-500" />,
  cancelled: <AlertTriangle className="h-3 w-3 text-red-500" />,
};

export default function TaskCalendar({
  tasks,
  onEdit,
  onDelete,
  onViewDetails,
  loading = false,
}: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, TaskWithDetails[]> = {};

    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    return grouped;
  }, [tasks]);

  // Today and Upcoming filters
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.dueDate && isAfter(new Date(t.dueDate), today) && !isToday(new Date(t.dueDate)))
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [tasks]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    const paddingDays = Array(startDay).fill(null);
    return [...paddingDays, ...monthDays];
  }, [currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Small Calendar (Left - 7 columns) */}
      <div className="lg:col-span-7 space-y-4">
        <Card className="border shadow-xl overflow-hidden bg-background">
          <CardHeader className="py-4 border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-xl font-bold tracking-tight min-w-[150px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goToNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 h-8 px-4 font-semibold text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-all rounded-full"
                  onClick={goToToday}
                >
                  Go to Today
                </Button>
              </div>
              
              <div className="hidden sm:flex items-center gap-3">
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30">
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-muted/50">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="bg-muted/10 min-h-[100px]" />;

                const dateKey = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dateKey}
                    className={`bg-background min-h-[100px] p-2 relative group transition-all duration-300 ${
                      !isCurrentMonth ? "bg-muted/5 opacity-40" : "hover:bg-primary/5"
                    } ${isCurrentDay ? "ring-inset ring-2 ring-primary/20 bg-primary/5" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-black h-7 w-7 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isCurrentDay ? "bg-primary text-primary-foreground scale-110" : isCurrentMonth ? "text-foreground group-hover:bg-muted" : "text-muted-foreground"
                      }`}>
                        {format(day, "d")}
                      </span>
                    </div>

                    <ScrollArea className="h-[60px] w-full">
                      <div className="space-y-1 pr-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <TooltipProvider key={task.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`text-[9px] p-1.5 rounded-lg border shadow-sm truncate cursor-pointer font-bold transition-all hover:translate-x-0.5 ${
                                    priorityConfig[task.priority as keyof typeof priorityConfig]?.light || "bg-muted"
                                  } ${priorityConfig[task.priority as keyof typeof priorityConfig]?.border || ""}`}
                                  onClick={() => onViewDetails?.(task)}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityConfig[task.priority as keyof typeof priorityConfig]?.color}`} />
                                    <span className="truncate tracking-tight">{task.title}</span>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="p-2 w-48 shadow-2xl">
                                <p className="font-bold text-xs">{task.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{task.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {dayTasks.length > 2 && (
                          <p className="text-[9px] text-center font-black text-primary/60 uppercase">+ {dayTasks.length - 2} more</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Big Sidebar Cards (Right - 5 columns) */}
      <div className="lg:col-span-5 space-y-8">
        {/* Today's Tasks */}
        <Card className="border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-inner">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tight uppercase">Today's Agenda</CardTitle>
                  <CardDescription className="text-xs font-bold text-primary/60">{format(new Date(), "MMMM dd, yyyy")}</CardDescription>
                </div>
              </div>
              <Badge className="h-7 px-3 text-[11px] font-black rounded-xl bg-primary shadow-lg shadow-primary/30">
                {todayTasks.length} {todayTasks.length === 1 ? 'Task' : 'Tasks'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 px-4">
            <ScrollArea className="h-[320px] pr-3">
              <div className="space-y-4">
                {todayTasks.length > 0 ? (
                  todayTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="group relative flex items-center p-3.5 rounded-2xl border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                      onClick={() => onViewDetails?.(task)}
                    >
                      <div className={`mr-4 h-1 w-8 rounded-full ${priorityConfig[task.priority as keyof typeof priorityConfig]?.color} group-hover:w-10 transition-all`} />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black truncate text-foreground group-hover:text-primary transition-colors">{task.title}</p>
                          <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 ${priorityConfig[task.priority as keyof typeof priorityConfig]?.text} ${priorityConfig[task.priority as keyof typeof priorityConfig]?.light}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80">
                            {statusIcons[task.status as keyof typeof statusIcons]}
                            <span className="uppercase tracking-wider">{task.status.replace('_', ' ')}</span>
                          </div>
                          {task.estimatedHours && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80">
                              <Target className="h-3 w-3" />
                              <span>{task.estimatedHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 p-2 bg-muted/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="p-4 bg-muted rounded-full animate-pulse">
                      <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Active Tasks</p>
                      <p className="text-xs text-muted-foreground/60 font-bold">You're all set for today!</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border shadow-xl bg-muted/10 backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-muted rounded-2xl text-muted-foreground shadow-inner">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tight uppercase">Upcoming Schedule</CardTitle>
                  <CardDescription className="text-xs font-bold text-muted-foreground/60">Next 7 days</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="h-7 px-3 text-[11px] font-black rounded-xl">
                {upcomingTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 px-4">
            <ScrollArea className="h-[320px] pr-3">
              <div className="space-y-2">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task, idx) => {
                    const taskDate = new Date(task.dueDate!);
                    const prevTask = upcomingTasks[idx - 1];
                    const showDateHeader = !prevTask || !isSameDay(new Date(prevTask.dueDate!), taskDate);

                    return (
                      <div key={task.id} className="space-y-2">
                        {showDateHeader && (
                          <div className="flex items-center gap-3 py-3 sticky top-0 bg-transparent backdrop-blur-md z-10">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                              {isTomorrow(taskDate) ? 'Tomorrow' : format(taskDate, "EEEE, MMM dd")}
                            </span>
                            <div className="flex-1 h-px bg-primary/10" />
                          </div>
                        )}
                        <div 
                          className="group flex items-center justify-between p-3 rounded-2xl bg-background border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => onViewDetails?.(task)}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-3 h-3 rounded-md shrink-0 ring-4 ring-offset-2 ring-offset-background ${priorityConfig[task.priority as keyof typeof priorityConfig]?.color}`} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-black leading-tight truncate group-hover:text-primary transition-colors">{task.title}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 tracking-wider">{task.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1.5">
                            <CircleDot className="h-2.5 w-2.5 opacity-60" />
                            {format(taskDate, "HH:mm")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <CalendarIcon className="h-10 w-10 mb-3 text-muted-foreground" />
                    <p className="text-xs font-black uppercase tracking-widest">Clear Calendar</p>
                    <p className="text-xs font-bold">No upcoming tasks found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
