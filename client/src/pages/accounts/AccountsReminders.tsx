import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, AlertTriangle, CheckCircle2, Plus, Search, Filter, Eye, Edit, Trash2, Send, Calendar, FileText, DollarSign, Users, Building } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAccountReminderSchema, type AccountReminder, type InsertAccountReminder } from "@shared/schema";

// Schemas - Use shared schemas from drizzle-zod with proper validation
const reminderFormSchema = insertAccountReminderSchema.extend({
  dueDate: z.coerce.date("Please enter a valid due date"),
  nextReminderAt: z.coerce.date("Please enter a valid next reminder date"),
  frequency: z.coerce.number().int().positive("Frequency must be a positive number"),
});

const markSentSchema = z.object({
  notes: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderFormSchema>;
type MarkSentFormData = z.infer<typeof markSentSchema>;

// Status styling
const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  stopped: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const targetTypeStyles = {
  receivable: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  payable: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  gst: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const channelStyles = {
  email: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  sms: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  whatsapp: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function AccountsReminders() {
  const { toast } = useToast();
  const [selectedReminder, setSelectedReminder] = useState<AccountReminder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isMarkSentOpen, setIsMarkSentOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<AccountReminder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  // Data fetching - Only fetch what we actually use
  const { data: reminders = [], isLoading: remindersLoading } = useQuery({
    queryKey: ["/api/account-reminders"],
  });

  // Form setup
  const createForm = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      targetType: "receivable",
      targetId: "",
      dueDate: new Date(),
      nextReminderAt: new Date(),
      channel: "email",
      status: "pending",
      template: "",
      frequency: 7,
    },
  });

  const editForm = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
  });

  const markSentForm = useForm<MarkSentFormData>({
    resolver: zodResolver(markSentSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Calculate metrics from actual data
  const remindersArray = Array.isArray(reminders) ? reminders : [];
  
  const activeReminders = remindersArray.filter((r: any) => r.status === 'pending' || r.status === 'sent').length;
  const dueToday = remindersArray.filter((r: any) => {
    const today = new Date().toDateString();
    const reminderDate = new Date(r.nextReminderAt).toDateString();
    return reminderDate === today && r.status === 'pending';
  }).length;
  
  const overdue = remindersArray.filter((r: any) => {
    const today = new Date();
    const reminderDate = new Date(r.nextReminderAt);
    return reminderDate < today && r.status === 'pending';
  }).length;
  
  // Calculate completed this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const completedThisMonth = remindersArray.filter((r: any) => {
    if (r.status !== 'sent') return false;
    if (!r.lastSentAt) return false;
    const sentDate = new Date(r.lastSentAt);
    return sentDate.getMonth() === currentMonth && sentDate.getFullYear() === currentYear;
  }).length;

  // Mutations
  const createReminderMutation = useMutation({
    mutationFn: (data: ReminderFormData) =>
      apiRequest("/api/account-reminders", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : new Date(data.dueDate).toISOString(),
          nextReminderAt: data.nextReminderAt instanceof Date ? data.nextReminderAt.toISOString() : new Date(data.nextReminderAt).toISOString(),
          frequency: data.frequency,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-reminders"] });
      toast({ title: "Success", description: "Reminder created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, ...data }: ReminderFormData & { id: string }) =>
      apiRequest(`/api/account-reminders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : new Date(data.dueDate).toISOString(),
          nextReminderAt: data.nextReminderAt instanceof Date ? data.nextReminderAt.toISOString() : new Date(data.nextReminderAt).toISOString(),
          frequency: data.frequency,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-reminders"] });
      toast({ title: "Success", description: "Reminder updated successfully" });
      setIsEditOpen(false);
      setSelectedReminder(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update reminder", variant: "destructive" });
    },
  });

  const markSentMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiRequest(`/api/account-reminders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "sent",
          lastSentAt: new Date().toISOString(),
          template: notes ? `${selectedReminder?.template || ''}\n\nNotes: ${notes}` : selectedReminder?.template,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-reminders"] });
      toast({ title: "Success", description: "Reminder marked as sent" });
      setIsMarkSentOpen(false);
      setSelectedReminder(null);
      markSentForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark reminder as sent", variant: "destructive" });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/account-reminders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-reminders"] });
      toast({ title: "Success", description: "Reminder deleted successfully" });
      setIsDeleteOpen(false);
      setReminderToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reminder", variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateSubmit = (data: ReminderFormData) => {
    createReminderMutation.mutate(data);
  };

  const handleEditSubmit = (data: ReminderFormData) => {
    if (selectedReminder) {
      updateReminderMutation.mutate({ ...data, id: selectedReminder.id });
    }
  };

  const handleEdit = (reminder: AccountReminder) => {
    setSelectedReminder(reminder);
    editForm.reset({
      targetType: reminder.targetType,
      targetId: reminder.targetId,
      dueDate: new Date(reminder.dueDate),
      nextReminderAt: new Date(reminder.nextReminderAt),
      channel: reminder.channel,
      status: reminder.status,
      template: reminder.template || "",
      frequency: reminder.frequency,
    });
    setIsEditOpen(true);
  };

  const handleView = (reminder: AccountReminder) => {
    setSelectedReminder(reminder);
    setIsViewOpen(true);
  };

  const handleMarkSent = (reminder: AccountReminder) => {
    setSelectedReminder(reminder);
    markSentForm.reset({ notes: "" });
    setIsMarkSentOpen(true);
  };

  const handleDeleteClick = (reminder: AccountReminder) => {
    setReminderToDelete(reminder);
    setIsDeleteOpen(true);
  };

  const handleMarkSentSubmit = (data: MarkSentFormData) => {
    if (selectedReminder) {
      markSentMutation.mutate({
        id: selectedReminder.id,
        notes: data.notes,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (reminderToDelete) {
      deleteReminderMutation.mutate(reminderToDelete.id);
    }
  };

  // Filtered data
  const getFilteredReminders = () => {
    let filtered = remindersArray;
    
    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "pending") {
        filtered = filtered.filter((r: any) => r.status === "pending");
      } else if (activeTab === "sent") {
        filtered = filtered.filter((r: any) => r.status === "sent");
      } else if (activeTab === "stopped") {
        filtered = filtered.filter((r: any) => r.status === "stopped");
      } else if (activeTab === "overdue") {
        const today = new Date();
        filtered = filtered.filter((r: any) => {
          const reminderDate = new Date(r.nextReminderAt);
          return reminderDate < today && r.status === 'pending';
        });
      }
    }

    // Apply filters
    return filtered.filter((reminder: AccountReminder) => {
      const matchesSearch = reminder.template?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reminder.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reminder.channel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || reminder.status === statusFilter;
      const matchesTargetType = targetTypeFilter === "all" || reminder.targetType === targetTypeFilter;
      const matchesChannel = channelFilter === "all" || reminder.channel === channelFilter;
      return matchesSearch && matchesStatus && matchesTargetType && matchesChannel;
    });
  };

  const filteredReminders = getFilteredReminders();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Payment Reminders
          </h1>
          <p className="text-muted-foreground mt-2">
            Automated due/overdue payment alerts and reminder management
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-reminder">
              <Plus className="h-4 w-4 mr-2" />
              Create Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a new payment reminder for receivables, payables, or GST obligations.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-type">
                            <SelectValue placeholder="Select reminder type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receivable">Receivable</SelectItem>
                          <SelectItem value="payable">Payable</SelectItem>
                          <SelectItem value="gst">GST</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="targetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-target-id"
                          placeholder="Enter target ID (invoice, PO, etc.)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          data-testid="input-due-date"
                          value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="nextReminderAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Reminder Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          data-testid="input-next-reminder-at"
                          value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-channel">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency (days)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="numeric"
                          data-testid="input-frequency"
                          placeholder="Enter frequency in days"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Template</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="textarea-template"
                          placeholder="Enter reminder message template..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createReminderMutation.isPending}
                    data-testid="button-submit-create"
                    className="flex-1"
                  >
                    {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-reminders">{activeReminders}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="metric-due-today">{dueToday}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="metric-overdue">{overdue}</div>
            <p className="text-xs text-muted-foreground">Urgent follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="metric-completed">{completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
          <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
            <SelectTrigger className="w-36" data-testid="select-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="receivable">Receivable</SelectItem>
              <SelectItem value="payable">Payable</SelectItem>
              <SelectItem value="gst">GST</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-32" data-testid="select-channel-filter">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">Sent</TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue">Overdue</TabsTrigger>
          <TabsTrigger value="stopped" data-testid="tab-stopped">Stopped</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reminders ({filteredReminders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredReminders.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reminders Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all" || targetTypeFilter !== "all" || channelFilter !== "all"
                      ? "No reminders match your current filters."
                      : "Create your first payment reminder to get started."}
                  </p>
                  {!searchTerm && statusFilter === "all" && targetTypeFilter === "all" && channelFilter === "all" && (
                    <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-reminder">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Reminder
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Target ID</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Next Reminder</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReminders.map((reminder: AccountReminder) => (
                        <TableRow key={reminder.id} data-testid={`row-reminder-${reminder.id}`}>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={targetTypeStyles[reminder.targetType]}
                              data-testid={`badge-type-${reminder.id}`}
                            >
                              {reminder.targetType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-target-${reminder.id}`}>
                            {reminder.targetId}
                          </TableCell>
                          <TableCell data-testid={`text-due-date-${reminder.id}`}>
                            {new Date(reminder.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell data-testid={`text-next-reminder-${reminder.id}`}>
                            {new Date(reminder.nextReminderAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={channelStyles[reminder.channel]}
                              data-testid={`badge-channel-${reminder.id}`}
                            >
                              {reminder.channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={statusStyles[reminder.status]}
                              data-testid={`badge-status-${reminder.id}`}
                            >
                              {reminder.status}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-frequency-${reminder.id}`}>
                            {reminder.frequency} days
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(reminder)}
                                data-testid={`button-view-${reminder.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(reminder)}
                                data-testid={`button-edit-${reminder.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {reminder.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkSent(reminder)}
                                  data-testid={`button-mark-sent-${reminder.id}`}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(reminder)}
                                data-testid={`button-delete-${reminder.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>
              Update the reminder settings and schedule.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-target-type">
                          <SelectValue placeholder="Select reminder type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receivable">Receivable</SelectItem>
                        <SelectItem value="payable">Payable</SelectItem>
                        <SelectItem value="gst">GST</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-target-id"
                        placeholder="Enter target ID"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-edit-due-date"
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="nextReminderAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Reminder Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-edit-next-reminder-at"
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-channel">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="stopped">Stopped</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency (days)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        data-testid="input-edit-frequency"
                        placeholder="Enter frequency in days"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Template</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-edit-template"
                        placeholder="Enter reminder message template..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={updateReminderMutation.isPending}
                  data-testid="button-submit-edit"
                  className="flex-1"
                >
                  {updateReminderMutation.isPending ? "Updating..." : "Update Reminder"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reminder Details</DialogTitle>
            <DialogDescription>
              View the complete reminder information and history.
            </DialogDescription>
          </DialogHeader>
          {selectedReminder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className={targetTypeStyles[selectedReminder.targetType]}
                      data-testid="view-type"
                    >
                      {selectedReminder.targetType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Channel</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={channelStyles[selectedReminder.channel]}
                      data-testid="view-channel"
                    >
                      {selectedReminder.channel}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Target ID</Label>
                <div className="mt-1 text-sm" data-testid="view-target-id">
                  {selectedReminder.targetId}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <div className="mt-1 text-sm" data-testid="view-due-date">
                    {new Date(selectedReminder.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Next Reminder</Label>
                  <div className="mt-1 text-sm" data-testid="view-next-reminder">
                    {new Date(selectedReminder.nextReminderAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className={statusStyles[selectedReminder.status]}
                      data-testid="view-status"
                    >
                      {selectedReminder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Frequency</Label>
                  <div className="mt-1 text-sm" data-testid="view-frequency">
                    {selectedReminder.frequency} days
                  </div>
                </div>
              </div>

              {selectedReminder.lastSentAt && (
                <div>
                  <Label className="text-sm font-medium">Last Sent</Label>
                  <div className="mt-1 text-sm" data-testid="view-last-sent">
                    {new Date(selectedReminder.lastSentAt).toLocaleString()}
                  </div>
                </div>
              )}

              {selectedReminder.template && (
                <div>
                  <Label className="text-sm font-medium">Message Template</Label>
                  <div className="mt-1 text-sm p-3 bg-muted rounded-md" data-testid="view-template">
                    {selectedReminder.template}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setIsViewOpen(false);
                    handleEdit(selectedReminder);
                  }}
                  data-testid="button-edit-from-view"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Reminder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                  data-testid="button-close-view"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark Sent Dialog */}
      <Dialog open={isMarkSentOpen} onOpenChange={setIsMarkSentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Sent</DialogTitle>
            <DialogDescription>
              Mark this reminder as sent and optionally add notes about the communication.
            </DialogDescription>
          </DialogHeader>
          <Form {...markSentForm}>
            <form onSubmit={markSentForm.handleSubmit(handleMarkSentSubmit)} className="space-y-4">
              <FormField
                control={markSentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-mark-sent-notes"
                        placeholder="Add any notes about this reminder..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={markSentMutation.isPending}
                  data-testid="button-confirm-mark-sent"
                  className="flex-1"
                >
                  {markSentMutation.isPending ? "Marking..." : "Mark as Sent"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMarkSentOpen(false)}
                  data-testid="button-cancel-mark-sent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteReminderMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteReminderMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}