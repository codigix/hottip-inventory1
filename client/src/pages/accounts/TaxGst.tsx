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
import { useToast } from "@/hooks/use-toast";
import { Calculator, FileText, CheckCircle2, AlertTriangle, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertGstReturnSchema, type GstReturn, type InsertGstReturn } from "@shared/schema";

// Schemas - Use shared schemas from drizzle-zod
const gstReturnFormSchema = insertGstReturnSchema.extend({
  periodStart: z.string().min(1, "Period start date is required"),
  periodEnd: z.string().min(1, "Period end date is required"),
  outputTax: z.string().min(1, "Output tax is required"),
  inputTax: z.string().min(1, "Input tax is required"),
  liability: z.string().min(1, "Liability is required"),
});

type GstReturnFormData = z.infer<typeof gstReturnFormSchema>;

// Status styling
const statusStyles = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  filed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  reconciled: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const frequencyLabels = {
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export default function TaxGst() {
  const { toast } = useToast();
  const [selectedReturn, setSelectedReturn] = useState<GstReturn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<GstReturn | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");

  // Data fetching
  const { data: gstReturns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ["/api/gst-returns"],
  });

  const { data: overdueReturns = [] } = useQuery({
    queryKey: ["/api/gst-returns/status/overdue"],
  });

  const { data: draftReturns = [] } = useQuery({
    queryKey: ["/api/gst-returns/status/draft"],
  });

  // Form setup
  const createForm = useForm<GstReturnFormData>({
    resolver: zodResolver(gstReturnFormSchema),
    defaultValues: {
      periodStart: "",
      periodEnd: "",
      frequency: "quarterly",
      outputTax: "",
      inputTax: "",
      liability: "",
      status: "draft",
      notes: "",
    },
  });

  const editForm = useForm<GstReturnFormData>({
    resolver: zodResolver(gstReturnFormSchema),
  });

  // Calculate real-time metrics
  const gstReturnsArray = Array.isArray(gstReturns) ? gstReturns : [];
  const totalOutputTax = gstReturnsArray.reduce((sum: number, r: any) => sum + parseFloat(r.outputTax || 0), 0);
  const totalInputTax = gstReturnsArray.reduce((sum: number, r: any) => sum + parseFloat(r.inputTax || 0), 0);
  const netLiability = totalOutputTax - totalInputTax;
  const filledReturns = gstReturnsArray.filter((r: any) => r.status === 'filed' || r.status === 'paid' || r.status === 'reconciled');
  const isAllCurrent = draftReturns.length === 0 && overdueReturns.length === 0;

  // Mutations
  const createReturnMutation = useMutation({
    mutationFn: (data: GstReturnFormData) =>
      apiRequest("/api/gst-returns", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          periodStart: new Date(data.periodStart).toISOString(),
          periodEnd: new Date(data.periodEnd).toISOString(),
          outputTax: parseFloat(data.outputTax),
          inputTax: parseFloat(data.inputTax),
          liability: parseFloat(data.liability),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/overdue"] });
      toast({ title: "Success", description: "GST return created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create GST return", variant: "destructive" });
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: ({ id, ...data }: GstReturnFormData & { id: string }) =>
      apiRequest(`/api/gst-returns/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          periodStart: new Date(data.periodStart).toISOString(),
          periodEnd: new Date(data.periodEnd).toISOString(),
          outputTax: parseFloat(data.outputTax),
          inputTax: parseFloat(data.inputTax),
          liability: parseFloat(data.liability),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/overdue"] });
      toast({ title: "Success", description: "GST return updated successfully" });
      setIsEditOpen(false);
      setSelectedReturn(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update GST return", variant: "destructive" });
    },
  });

  const deleteReturnMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/gst-returns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/overdue"] });
      toast({ title: "Success", description: "GST return deleted successfully" });
      setIsDeleteOpen(false);
      setReturnToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete GST return", variant: "destructive" });
    },
  });

  const markAsFiledMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/gst-returns/${id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          status: "filed",
          filedAt: new Date().toISOString()
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gst-returns/status/overdue"] });
      toast({ title: "Success", description: "GST return marked as filed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark as filed", variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateSubmit = (data: GstReturnFormData) => {
    createReturnMutation.mutate(data);
  };

  const handleEditSubmit = (data: GstReturnFormData) => {
    if (selectedReturn) {
      updateReturnMutation.mutate({ ...data, id: selectedReturn.id });
    }
  };

  const handleEdit = (gstReturn: GstReturn) => {
    setSelectedReturn(gstReturn);
    editForm.reset({
      periodStart: gstReturn.periodStart.split('T')[0],
      periodEnd: gstReturn.periodEnd.split('T')[0],
      frequency: gstReturn.frequency,
      outputTax: gstReturn.outputTax.toString(),
      inputTax: gstReturn.inputTax.toString(),
      liability: gstReturn.liability.toString(),
      status: gstReturn.status,
      notes: gstReturn.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleView = (gstReturn: GstReturn) => {
    setSelectedReturn(gstReturn);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (gstReturn: GstReturn) => {
    setReturnToDelete(gstReturn);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (returnToDelete) {
      deleteReturnMutation.mutate(returnToDelete.id);
    }
  };

  const handleMarkAsFiled = (gstReturn: GstReturn) => {
    markAsFiledMutation.mutate(gstReturn.id);
  };

  // Filtered data
  const filteredReturns = gstReturnsArray.filter((gstReturn: GstReturn) => {
    const periodText = `${gstReturn.periodStart} to ${gstReturn.periodEnd}`;
    const matchesSearch = periodText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gstReturn.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || gstReturn.status === statusFilter;
    const matchesFrequency = frequencyFilter === "all" || gstReturn.frequency === frequencyFilter;
    return matchesSearch && matchesStatus && matchesFrequency;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Tax & GST Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Tax tracking and GST reconciliation
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-gst-return">
              <Plus className="h-4 w-4 mr-2" />
              Create GST Return
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New GST Return</DialogTitle>
              <DialogDescription>
                Create a new GST return for tax compliance and reporting.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="periodStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period Start</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            data-testid="input-period-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="periodEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period End</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            data-testid="input-period-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="frequency"
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
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="outputTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Output Tax (₹)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-output-tax"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="inputTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Input Tax (₹)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-input-tax"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="liability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Liability (₹)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-liability"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional notes"
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReturnMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createReturnMutation.isPending ? "Creating..." : "Create"}
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
            <CardTitle className="text-sm font-light">GST Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-gst-collected">
              ₹{(totalOutputTax / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">Output tax total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">GST Paid</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-gst-paid">
              ₹{(totalInputTax / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">Input tax credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Filing Status</CardTitle>
            {isAllCurrent ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isAllCurrent ? 'text-green-600' : 'text-orange-600'}`} data-testid="text-filing-status">
              {isAllCurrent ? 'Current' : 'Pending'}
            </div>
            <p className="text-xs text-muted-foreground">
              {filledReturns.length} of {gstReturnsArray.length} filed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Net Liability</CardTitle>
            {netLiability > 0 ? (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netLiability > 0 ? 'text-orange-600' : 'text-green-600'}`} data-testid="text-net-liability">
              ₹{Math.abs(netLiability / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">
              {netLiability > 0 ? 'Amount due' : 'Excess credit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>GST Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search returns by period or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-returns"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-frequency-filter">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {returnsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Output Tax</TableHead>
                    <TableHead>Input Tax</TableHead>
                    <TableHead>Net Liability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Calculator className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No GST returns found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((gstReturn: GstReturn) => (
                      <TableRow key={gstReturn.id} data-testid={`row-gst-return-${gstReturn.id}`}>
                        <TableCell className="font-light">
                          <div>
                            <div className="font-semibold">
                              {new Date(gstReturn.periodStart).toLocaleDateString()} - {new Date(gstReturn.periodEnd).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-frequency-${gstReturn.id}`}>
                            {frequencyLabels[gstReturn.frequency as keyof typeof frequencyLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-output-tax-${gstReturn.id}`}>
                          ₹{parseFloat(gstReturn.outputTax).toLocaleString()}
                        </TableCell>
                        <TableCell data-testid={`text-input-tax-${gstReturn.id}`}>
                          ₹{parseFloat(gstReturn.inputTax).toLocaleString()}
                        </TableCell>
                        <TableCell data-testid={`text-liability-${gstReturn.id}`}>
                          ₹{parseFloat(gstReturn.liability).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={statusStyles[gstReturn.status as keyof typeof statusStyles]}
                            data-testid={`badge-status-${gstReturn.id}`}
                          >
                            {gstReturn.status.charAt(0).toUpperCase() + gstReturn.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-filed-date-${gstReturn.id}`}>
                          {gstReturn.filedAt ? new Date(gstReturn.filedAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(gstReturn)}
                              data-testid={`button-view-${gstReturn.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(gstReturn)}
                              data-testid={`button-edit-${gstReturn.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {gstReturn.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsFiled(gstReturn)}
                                disabled={markAsFiledMutation.isPending}
                                data-testid={`button-mark-filed-${gstReturn.id}`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(gstReturn)}
                              data-testid={`button-delete-${gstReturn.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit GST Return</DialogTitle>
            <DialogDescription>
              Update the GST return information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="periodStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Start</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-edit-period-start"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="periodEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period End</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-edit-period-end"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="outputTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Output Tax (₹)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-edit-output-tax"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="inputTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input Tax (₹)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-edit-input-tax"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="liability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Liability (₹)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-edit-liability"
                      />
                    </FormControl>
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="filed">Filed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="reconciled">Reconciled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional notes"
                        data-testid="input-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateReturnMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateReturnMutation.isPending ? "Updating..." : "Update"}
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
            <DialogTitle>GST Return Details</DialogTitle>
            <DialogDescription>
              View detailed information about this GST return.
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Period Start</Label>
                  <p className="text-sm font-light" data-testid="view-period-start">
                    {new Date(selectedReturn.periodStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Period End</Label>
                  <p className="text-sm font-light" data-testid="view-period-end">
                    {new Date(selectedReturn.periodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <Label>Frequency</Label>
                <p className="text-sm font-light" data-testid="view-frequency">
                  {frequencyLabels[selectedReturn.frequency as keyof typeof frequencyLabels]}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Output Tax</Label>
                  <p className="text-sm font-light" data-testid="view-output-tax">
                    ₹{parseFloat(selectedReturn.outputTax).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Input Tax</Label>
                  <p className="text-sm font-light" data-testid="view-input-tax">
                    ₹{parseFloat(selectedReturn.inputTax).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <Label>Net Liability</Label>
                <p className="text-sm font-light" data-testid="view-liability">
                  ₹{parseFloat(selectedReturn.liability).toLocaleString()}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge 
                  className={statusStyles[selectedReturn.status as keyof typeof statusStyles]}
                  data-testid="view-status"
                >
                  {selectedReturn.status.charAt(0).toUpperCase() + selectedReturn.status.slice(1)}
                </Badge>
              </div>
              {selectedReturn.filedAt && (
                <div>
                  <Label>Filed Date</Label>
                  <p className="text-sm font-light" data-testid="view-filed-date">
                    {new Date(selectedReturn.filedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedReturn.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground" data-testid="view-notes">
                    {selectedReturn.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GST Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this GST return? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteReturnMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteReturnMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}