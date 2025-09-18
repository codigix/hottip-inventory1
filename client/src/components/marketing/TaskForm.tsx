import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  Target, 
  FileText, 
  Tag, 
  AlertCircle,
  Users,
  MapPin,
  Phone,
  Mail,
  Presentation,
  Search,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { MarketingTask, User, Lead, FieldVisit } from "@shared/schema";

const taskFormSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  type: z.enum(['visit_client', 'follow_up', 'demo', 'presentation', 'proposal', 'phone_call', 'email_campaign', 'market_research', 'other']),
  assignedTo: z.string().min(1, "Assignee is required"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.date().optional(),
  estimatedHours: z.string().optional(),
  leadId: z.string().optional(),
  fieldVisitId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly']).optional()
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskWithDetails extends MarketingTask {
  assignedToUser?: User;
  lead?: Lead;
  fieldVisit?: FieldVisit;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
  defaultValues?: Partial<TaskFormData>;
  leadId?: string;
  fieldVisitId?: string;
}

const taskTypes = {
  visit_client: { 
    label: 'Client Visit', 
    icon: Users, 
    color: 'bg-blue-100 text-blue-800',
    description: 'Schedule or conduct client meetings'
  },
  follow_up: { 
    label: 'Follow Up', 
    icon: Phone, 
    color: 'bg-green-100 text-green-800',
    description: 'Follow up on leads or existing clients'
  },
  demo: { 
    label: 'Product Demo', 
    icon: Presentation, 
    color: 'bg-purple-100 text-purple-800',
    description: 'Conduct product demonstrations'
  },
  presentation: { 
    label: 'Presentation', 
    icon: FileText, 
    color: 'bg-orange-100 text-orange-800',
    description: 'Prepare or deliver presentations'
  },
  proposal: { 
    label: 'Proposal', 
    icon: Target, 
    color: 'bg-red-100 text-red-800',
    description: 'Create and submit proposals'
  },
  phone_call: { 
    label: 'Phone Call', 
    icon: Phone, 
    color: 'bg-cyan-100 text-cyan-800',
    description: 'Make important phone calls'
  },
  email_campaign: { 
    label: 'Email Campaign', 
    icon: Mail, 
    color: 'bg-pink-100 text-pink-800',
    description: 'Plan and execute email campaigns'
  },
  market_research: { 
    label: 'Market Research', 
    icon: Search, 
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Conduct market analysis and research'
  },
  other: { 
    label: 'Other', 
    icon: Tag, 
    color: 'bg-gray-100 text-gray-800',
    description: 'Custom task type'
  }
};

export default function TaskForm({ 
  open, 
  onOpenChange, 
  taskId, 
  defaultValues, 
  leadId,
  fieldVisitId 
}: TaskFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: open
  });

  // Fetch leads for linking
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: open
  });

  // Fetch field visits for linking
  const { data: fieldVisits = [] } = useQuery<FieldVisit[]>({
    queryKey: ['/api/field-visits'],
    enabled: open
  });

  // Fetch existing task data if editing
  const { data: existingTask } = useQuery<TaskWithDetails>({
    queryKey: ['/api/marketing-tasks', taskId],
    enabled: !!taskId && open
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      type: "follow_up",
      priority: "medium",
      isRecurring: false,
      tags: [],
      leadId: leadId || "",
      fieldVisitId: fieldVisitId || "",
      ...defaultValues
    }
  });

  useEffect(() => {
    if (existingTask) {
      form.reset({
        title: existingTask.title,
        description: existingTask.description || "",
        type: existingTask.type,
        assignedTo: existingTask.assignedTo,
        priority: existingTask.priority,
        dueDate: existingTask.dueDate ? new Date(existingTask.dueDate) : undefined,
        estimatedHours: existingTask.estimatedHours?.toString() || "",
        leadId: existingTask.leadId || "",
        fieldVisitId: existingTask.fieldVisitId || "",
        tags: existingTask.tags || [],
        isRecurring: existingTask.isRecurring || false,
        recurringFrequency: existingTask.recurringFrequency as any
      });
    }
  }, [existingTask, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/marketing-tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks/metrics'] });
      toast({ title: "Task created successfully!" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating task", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/marketing-tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-tasks/metrics'] });
      toast({ title: "Task updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating task", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: TaskFormData) => {
    const submitData = {
      ...data,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
      tags: data.tags || [],
      leadId: data.leadId && data.leadId !== 'none' ? data.leadId : undefined,
      fieldVisitId: data.fieldVisitId && data.fieldVisitId !== 'none' ? data.fieldVisitId : undefined,
      recurringFrequency: data.isRecurring ? data.recurringFrequency : undefined
    };

    if (taskId) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleAddTag = () => {
    if (tagInput.trim() && !form.getValues("tags")?.includes(tagInput.trim())) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  // Get assignee workload info
  const getAssigneeWorkload = (userId: string) => {
    // This would ideally come from a metrics API
    return {
      currentTasks: Math.floor(Math.random() * 15) + 1,
      capacity: 20,
      utilizationRate: Math.floor(Math.random() * 100)
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{taskId ? 'Edit Task' : 'Create New Task'}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
                <TabsTrigger value="assignment" data-testid="tab-assignment">Assignment</TabsTrigger>
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="advanced" data-testid="tab-advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter task title..." 
                            {...field} 
                            data-testid="input-title" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(taskTypes).map(([key, type]) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center space-x-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the task details..."
                          className="min-h-[100px]" 
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-gray-400"></Badge>
                                <span>Low Priority</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-yellow-500"></Badge>
                                <span>Medium Priority</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-red-500"></Badge>
                                <span>High Priority</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center space-x-2">
                                <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full"></Badge>
                                <span>Urgent</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Estimated Hours</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.5" 
                            placeholder="2.5" 
                            {...field}
                            data-testid="input-estimated-hours"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span>Assign To *</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-assignee">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.filter(user => user.id && user.id.trim() !== "").map((user) => {
                            const workload = getAssigneeWorkload(user.id);
                            return (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span>{user.firstName} {user.lastName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {workload.currentTasks}/{workload.capacity} tasks
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={workload.utilizationRate > 80 ? "destructive" : 
                                           workload.utilizationRate > 60 ? "default" : "secondary"}
                                    className="ml-2"
                                  >
                                    {workload.utilizationRate}%
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due Date</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                              data-testid="button-due-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a due date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Lead</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead">
                              <SelectValue placeholder="Select lead (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Lead Selected</SelectItem>
                            {leads.filter(lead => lead.id && lead.id.trim() !== "").map((lead) => (
                              <SelectItem key={lead.id} value={lead.id}>
                                {lead.firstName} {lead.lastName} 
                                {lead.companyName && ` - ${lead.companyName}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fieldVisitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Field Visit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-field-visit">
                              <SelectValue placeholder="Select visit (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Visit Selected</SelectItem>
                            {fieldVisits.filter(visit => visit.id && visit.id.trim() !== "").map((visit) => (
                              <SelectItem key={visit.id} value={visit.id}>
                                {visit.visitNumber} - {format(new Date(visit.plannedDate), "PPP")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                  </FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      data-testid="input-tag"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddTag}
                      data-testid="button-add-tag"
                    >
                      Add
                    </Button>
                  </div>
                  {form.watch("tags") && form.watch("tags")!.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("tags")!.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {tag}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Recurring Task</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Make this a recurring task</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Task will be automatically created at specified intervals
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-recurring"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("isRecurring") && (
                      <FormField
                        control={form.control}
                        name="recurringFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-frequency">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Task Type Information */}
                {form.watch("type") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Task Type Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const selectedType = taskTypes[form.watch("type") as keyof typeof taskTypes];
                        const Icon = selectedType?.icon;
                        return (
                          <div className="flex items-start space-x-3">
                            {Icon && (
                              <div className={`p-2 rounded-lg ${selectedType.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-light">{selectedType?.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {selectedType?.description}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? "Saving..." : taskId ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}