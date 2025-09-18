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
import { CreditCard, TrendingDown, AlertTriangle, Clock, Plus, Search, Filter, ExternalLink, Edit, Trash2, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAccountsPayableSchema } from "@shared/schema";
import type { AccountsPayable, InsertAccountsPayable } from "@shared/schema";
import { z } from "zod";

// Schemas
const payableFormSchema = insertAccountsPayableSchema.extend({
  amountDue: z.string().min(1, "Amount due is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type PayableFormData = z.infer<typeof payableFormSchema>;

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Payment amount is required"),
  date: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

// Status styling
const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  partial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AccountsPayables() {
  const { toast } = useToast();
  const [selectedPayable, setSelectedPayable] = useState<AccountsPayable | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data fetching
  const { data: payables = [], isLoading: payablesLoading } = useQuery({
    queryKey: ["/api/accounts-payables"],
  }) as { data: AccountsPayable[], isLoading: boolean };

  const { data: overduePayables = [] } = useQuery({
    queryKey: ["/api/accounts-payables/overdue"],
  }) as { data: AccountsPayable[] };

  const { data: totalPayables } = useQuery({
    queryKey: ["/api/accounts/payables-total"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: inboundQuotations = [] } = useQuery({
    queryKey: ["/api/quotations/inbound"],
  });

  // Form setup
  const createForm = useForm<PayableFormData>({
    resolver: zodResolver(payableFormSchema),
    defaultValues: {
      supplierId: "",
      poId: "",
      inboundQuotationId: "",
      amountDue: "",
      dueDate: "",
      notes: "",
    },
  });

  const editForm = useForm<PayableFormData>({
    resolver: zodResolver(payableFormSchema),
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Mutations
  const createPayableMutation = useMutation({
    mutationFn: (data: PayableFormData) =>
      apiRequest("/api/accounts-payables", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          amountDue: parseFloat(data.amountDue),
          dueDate: new Date(data.dueDate).toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/payables-total"] });
      toast({ title: "Success", description: "Payable created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create payable", variant: "destructive" });
    },
  });

  const updatePayableMutation = useMutation({
    mutationFn: ({ id, ...data }: PayableFormData & { id: string }) =>
      apiRequest(`/api/accounts-payables/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          amountDue: parseFloat(data.amountDue),
          dueDate: new Date(data.dueDate).toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/payables-total"] });
      toast({ title: "Success", description: "Payable updated successfully" });
      setIsEditOpen(false);
      setSelectedPayable(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update payable", variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, ...data }: PaymentFormData & { id: string }) =>
      apiRequest(`/api/accounts-payables/${id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          date: new Date(data.date).toISOString(),
          notes: data.notes,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/payables-total"] });
      toast({ title: "Success", description: "Payment recorded successfully" });
      setIsPaymentOpen(false);
      setSelectedPayable(null);
      paymentForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
    },
  });

  const deletePayableMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/accounts-payables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payables/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/payables-total"] });
      toast({ title: "Success", description: "Payable deleted successfully" });
      setIsDeleteOpen(false);
      setSelectedPayable(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete payable", variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateSubmit = (data: PayableFormData) => {
    createPayableMutation.mutate(data);
  };

  const handleEditSubmit = (data: PayableFormData) => {
    if (selectedPayable) {
      updatePayableMutation.mutate({ ...data, id: selectedPayable.id });
    }
  };

  const handlePaymentSubmit = (data: PaymentFormData) => {
    if (selectedPayable) {
      recordPaymentMutation.mutate({ ...data, id: selectedPayable.id });
    }
  };

  const handleEdit = (payable: AccountsPayable) => {
    setSelectedPayable(payable);
    editForm.reset({
      supplierId: payable.supplierId,
      poId: payable.poId || "",
      inboundQuotationId: payable.inboundQuotationId || "",
      amountDue: payable.amountDue.toString(),
      dueDate: payable.dueDate.split('T')[0],
      notes: payable.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleRecordPayment = (payable: AccountsPayable) => {
    const remainingAmount = parseFloat(payable.amountDue) - parseFloat(payable.amountPaid);
    setSelectedPayable(payable);
    paymentForm.reset({
      amount: remainingAmount.toString(),
      date: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setIsPaymentOpen(true);
  };

  const handleDeleteClick = (payable: AccountsPayable) => {
    setSelectedPayable(payable);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedPayable) {
      deletePayableMutation.mutate(selectedPayable.id);
    }
  };

  // Filtered data
  const filteredPayables = payables.filter((payable: AccountsPayable) => {
    const supplierName = suppliers.find((s: any) => s.id === payable.supplierId)?.name || "Unknown Supplier";
    const poNumber = purchaseOrders.find((po: any) => po.id === payable.poId)?.number || "";
    const quotationNumber = inboundQuotations.find((q: any) => q.id === payable.inboundQuotationId)?.number || "";
    
    const matchesSearch = supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payable.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalAmount = totalPayables?.total || 0;
  const overdueAmount = overduePayables.reduce((sum: number, p: AccountsPayable) => sum + (parseFloat(p.amountDue) - parseFloat(p.amountPaid)), 0);
  const avgPaymentDays = 42; // TODO: Calculate from actual data
  const paymentRate = payables.length > 0 ? 
    ((payables.filter((p: AccountsPayable) => p.status === 'paid').length / payables.length) * 100) : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Accounts Payables
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage vendor payments linked to POs/quotations
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-payable">
              <Plus className="h-4 w-4 mr-2" />
              Add Payable
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Payable</DialogTitle>
              <DialogDescription>
                Create a new accounts payable entry for vendor payments.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier: any) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="poId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Order (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-po">
                            <SelectValue placeholder="Select PO" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No PO</SelectItem>
                          {purchaseOrders.map((po: any) => (
                            <SelectItem key={po.id} value={po.id}>
                              {po.number} - ₹{po.total}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="inboundQuotationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inbound Quotation (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quotation">
                            <SelectValue placeholder="Select quotation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Quotation</SelectItem>
                          {inboundQuotations.map((quotation: any) => (
                            <SelectItem key={quotation.id} value={quotation.id}>
                              {quotation.number} - ₹{quotation.total}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="amountDue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Due</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-amount-due"
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
                          type="date"
                          data-testid="input-due-date"
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
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPayableMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createPayableMutation.isPending ? "Creating..." : "Create"}
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
            <CardTitle className="text-sm font-light">Total Payables</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-payables">
              ₹{totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {payables.length} active payables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="metric-overdue-amount">
              ₹{overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overduePayables.length} overdue payables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Avg. Payment Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-avg-days">
              {avgPaymentDays}
            </div>
            <p className="text-xs text-muted-foreground">Target: 45 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Payment Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="metric-payment-rate">
              {paymentRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">On-time payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payables Management</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers, POs, or quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payablesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>PO/Quotation</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all" 
                          ? "No payables match your filters" 
                          : "No payables found. Create your first one!"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayables.map((payable: AccountsPayable) => {
                    const supplier = suppliers.find((s: any) => s.id === payable.supplierId);
                    const po = purchaseOrders.find((po: any) => po.id === payable.poId);
                    const quotation = inboundQuotations.find((q: any) => q.id === payable.inboundQuotationId);
                    const remainingAmount = parseFloat(payable.amountDue) - parseFloat(payable.amountPaid);
                    
                    return (
                      <TableRow key={payable.id} data-testid={`row-payable-${payable.id}`}>
                        <TableCell className="font-light">
                          <Link href={`/sales/suppliers/${payable.supplierId}`} className="hover:underline flex items-center">
                            {supplier?.name || "Unknown Supplier"}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          {po ? (
                            <Link href={`/sales/purchase-orders/${payable.poId}`} className="hover:underline flex items-center">
                              PO: {po.number}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          ) : quotation ? (
                            <Link href={`/sales/quotations/inbound/${payable.inboundQuotationId}`} className="hover:underline flex items-center">
                              QT: {quotation.number}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">No PO/Quotation</span>
                          )}
                        </TableCell>
                        <TableCell>₹{parseFloat(payable.amountDue).toLocaleString()}</TableCell>
                        <TableCell>₹{parseFloat(payable.amountPaid).toLocaleString()}</TableCell>
                        <TableCell>
                          {new Date(payable.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusStyles[payable.status as keyof typeof statusStyles]}>
                            {payable.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {remainingAmount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordPayment(payable)}
                                data-testid={`button-payment-${payable.id}`}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(payable)}
                              data-testid={`button-edit-${payable.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(payable)}
                              data-testid={`button-delete-${payable.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payable</DialogTitle>
            <DialogDescription>
              Update the accounts payable information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="amountDue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Due</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                        type="date"
                      />
                    </FormControl>
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
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePayableMutation.isPending}
                >
                  {updatePayableMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment against this accounts payable entry.
            </DialogDescription>
          </DialogHeader>
          {selectedPayable && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Supplier:</strong> {suppliers.find((s: any) => s.id === selectedPayable.supplierId)?.name || "Unknown"}
              </p>
              <p className="text-sm">
                <strong>Amount Due:</strong> ₹{parseFloat(selectedPayable.amountDue).toLocaleString()}
              </p>
              <p className="text-sm">
                <strong>Already Paid:</strong> ₹{parseFloat(selectedPayable.amountPaid).toLocaleString()}
              </p>
              <p className="text-sm">
                <strong>Remaining:</strong> ₹{(parseFloat(selectedPayable.amountDue) - parseFloat(selectedPayable.amountPaid)).toLocaleString()}
              </p>
            </div>
          )}
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-payment-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        data-testid="input-payment-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Payment notes"
                        data-testid="input-payment-notes"
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
                  onClick={() => setIsPaymentOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  data-testid="button-record-payment"
                >
                  {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
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
            <AlertDialogTitle>Delete Payable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payable? This action cannot be undone.
              {selectedPayable && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Supplier:</strong> {suppliers.find((s: any) => s.id === selectedPayable.supplierId)?.name || "Unknown"}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong> ₹{parseFloat(selectedPayable.amountDue).toLocaleString()}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletePayableMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePayableMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}