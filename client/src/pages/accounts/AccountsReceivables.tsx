import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  ExternalLink,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  insertAccountsReceivableSchema,
  type AccountsReceivable,
  type InsertAccountsReceivable,
} from "@shared/schema";

// Schemas - Use shared schemas from drizzle-zod
const receivableFormSchema = insertAccountsReceivableSchema.extend({
  amountDue: z.string().min(1, "Amount due is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Payment amount is required"),
  date: z.string().min(1, "Payment date is required"),
  paymentMode: z.enum(["bank_transfer", "upi", "cheque", "cash", "credit_card", "debit_card"]),
  bankName: z.string().optional(),
  transactionId: z.string().optional(),
  referenceNumber: z.string().optional(),
  upiId: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  cardLast4: z.string().optional(),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
});

type ReceivableFormData = z.infer<typeof receivableFormSchema>;
type PaymentFormData = z.infer<typeof paymentFormSchema>;

// Status styling
const statusStyles = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  partial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AccountsReceivables() {
  const { toast } = useToast();
  const [selectedReceivable, setSelectedReceivable] =
    useState<AccountsReceivable | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [receivableToDelete, setReceivableToDelete] =
    useState<AccountsReceivable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data fetching
  const { data: receivables = [], isLoading: receivablesLoading } = useQuery({
    queryKey: ["/accounts-receivables"],
  });

  const { data: overdueReceivables = [] } = useQuery({
    queryKey: ["/accounts-receivables/overdue"],
  });

  const { data: totalReceivables } = useQuery({
    queryKey: ["/accounts/receivables-total"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/customers"],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/invoices"],
  });

  // Form setup
  const createForm = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableFormSchema),
    defaultValues: {
      invoiceId: "none",
      customerId: "",
      amountDue: "",
      dueDate: "",
      notes: "",
    },
  });

  const editForm = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableFormSchema),
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paymentMode: "bank_transfer",
      notes: "",
    },
  });

  // Mutations
  const createReceivableMutation = useMutation({
    mutationFn: (data: ReceivableFormData) => {
      const payload: any = {
        customerId: data.customerId,
        amountDue: parseFloat(data.amountDue),
        dueDate: new Date(data.dueDate).toISOString(),
        notes: data.notes,
      };
      if (data.invoiceId && data.invoiceId !== "none")
        payload.invoiceId = data.invoiceId;
      return apiRequest("/accounts-receivables", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-receivables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-receivables/overdue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/accounts/receivables-total"],
      });
      toast({
        title: "Success",
        description: "Receivable created successfully",
      });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create receivable",
        variant: "destructive",
      });
    },
  });

  const updateReceivableMutation = useMutation({
    mutationFn: ({ id, ...data }: ReceivableFormData & { id: string }) => {
      const payload: any = {
        customerId: data.customerId,
        amountDue: parseFloat(data.amountDue),
        dueDate: new Date(data.dueDate).toISOString(),
        notes: data.notes,
      };
      if (data.invoiceId && data.invoiceId !== "none")
        payload.invoiceId = data.invoiceId;
      return apiRequest(`/accounts-receivables/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-receivables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-receivables/overdue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/accounts/receivables-total"],
      });
      toast({
        title: "Success",
        description: "Receivable updated successfully",
      });
      setIsEditOpen(false);
      setSelectedReceivable(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update receivable",
        variant: "destructive",
      });
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/accounts-receivables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-receivables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-receivables/overdue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/accounts/receivables-total"],
      });
      toast({
        title: "Success",
        description: "Receivable deleted successfully",
      });
      setIsDeleteOpen(false);
      setReceivableToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete receivable",
        variant: "destructive",
      });
    },
  });

  // Payment record mutation
  const recordPaymentMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: PaymentFormData & {
      id: string;
    }) => {
      const { 
        amount, 
        date, 
        paymentMode, 
        notes,
        bankName,
        transactionId,
        referenceNumber,
        upiId,
        chequeNumber,
        chequeDate,
        cardLast4,
        receivedBy
      } = data;

      // Extract details based on mode
      const paymentDetails: any = {};
      if (paymentMode === "bank_transfer") {
        paymentDetails.bankName = bankName;
        paymentDetails.transactionId = transactionId;
        paymentDetails.referenceNumber = referenceNumber;
      } else if (paymentMode === "upi") {
        paymentDetails.upiId = upiId;
        paymentDetails.transactionId = transactionId;
      } else if (paymentMode === "cheque") {
        paymentDetails.chequeNumber = chequeNumber;
        paymentDetails.chequeDate = chequeDate;
        paymentDetails.bankName = bankName;
      } else if (paymentMode === "credit_card" || paymentMode === "debit_card") {
        paymentDetails.cardLast4 = cardLast4;
        paymentDetails.transactionId = transactionId;
      } else if (paymentMode === "cash") {
        paymentDetails.receivedBy = receivedBy;
      }

      return apiRequest(`/accounts-receivables/${id}/payment`, {
        method: "POST",
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          paymentDate: date,
          paymentMode,
          paymentDetails,
          notes 
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-receivables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-receivables/overdue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/accounts/receivables-total"],
      });
      toast({ title: "Success", description: "Payment recorded successfully" });
      setIsPaymentOpen(false);
      setSelectedReceivable(null);
      paymentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateSubmit = (data: ReceivableFormData) => {
    createReceivableMutation.mutate(data);
  };

  const handleEditSubmit = (data: ReceivableFormData) => {
    if (selectedReceivable) {
      updateReceivableMutation.mutate({ ...data, id: selectedReceivable.id });
    }
  };

  const handleEdit = (receivable: AccountsReceivable) => {
    setSelectedReceivable(receivable);
    editForm.reset({
      invoiceId: receivable.invoiceId || "none",
      customerId: receivable.customerId,
      amountDue: receivable.amountDue.toString(),
      dueDate: receivable.dueDate.split("T")[0],
      notes: receivable.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleRecordPayment = (receivable: AccountsReceivable) => {
    setSelectedReceivable(receivable);
    const remainingAmount =
      parseFloat(receivable.amountDue) - parseFloat(receivable.amountPaid);
    paymentForm.reset({
      amount: remainingAmount.toString(),
      date: new Date().toISOString().split("T")[0],
      paymentMode: "bank_transfer",
      bankName: "",
      transactionId: "",
      referenceNumber: "",
      upiId: "",
      chequeNumber: "",
      chequeDate: "",
      cardLast4: "",
      receivedBy: "",
      notes: "",
    });
    setIsPaymentOpen(true);
  };

  const handleDeleteClick = (receivable: AccountsReceivable) => {
    setReceivableToDelete(receivable);
    setIsDeleteOpen(true);
  };

  const handlePaymentSubmit = (data: PaymentFormData) => {
    if (selectedReceivable) {
      recordPaymentMutation.mutate({
        ...data,
        id: selectedReceivable.id,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (receivableToDelete) {
      deleteReceivableMutation.mutate(receivableToDelete.id);
    }
  };

  // Filtered data with robust fallbacks
  const filteredReceivables = (receivables as AccountsReceivable[]).filter(
    (receivable: AccountsReceivable & { customer?: any; invoice?: any }) => {
      const customerName = receivable.customer?.name || "Unknown Customer";
      const invoiceNumber =
        receivable.invoice?.invoiceNumber ||
        (receivable.invoiceId ? receivable.invoiceId : "No Invoice");
      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || receivable.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  // Calculate metrics
  const totalAmount = totalReceivables?.total || 0;
  const overdueAmount = overdueReceivables.reduce(
    (sum: number, r: any) => sum + parseFloat(r.amountDue - r.amountPaid),
    0
  );
  const avgPaymentDays = 28; // TODO: Calculate from actual data
  const collectionRate =
    receivables.length > 0
      ? (receivables.filter((r: any) => r.status === "paid").length /
          receivables.length) *
        100
      : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between" data-tour="accounts-receivables-header">
        <div>
          <h1
            className="text-3xl font-bold text-foreground"
            data-testid="page-title"
          >
            Accounts Receivables
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage client payments linked to invoices
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-receivable" data-tour="accounts-add-receivable-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Receivable
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Receivable</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
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
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-invoice">
                            <SelectValue placeholder="Select invoice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Invoice</SelectItem>
                          {invoices.map((invoice: any) => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              {invoice.number} - ₹{invoice.total}
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
                    disabled={createReceivableMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createReceivableMutation.isPending
                      ? "Creating..."
                      : "Create"}
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
            <CardTitle className="text-sm font-light">
              Total Receivables
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="metric-total-receivables"
            >
              ₹{totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {receivables.length} active receivables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-orange-600"
              data-testid="metric-overdue-amount"
            >
              ₹{overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueReceivables.length} overdue receivables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">
              Avg. Payment Days
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-avg-days">
              {avgPaymentDays}
            </div>
            <p className="text-xs text-muted-foreground">Target: 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">
              Collection Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-green-600"
              data-testid="metric-collection-rate"
            >
              {collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Payment completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader data-tour="accounts-receivables-filters">
          <div className="flex items-center justify-between">
            <CardTitle>Receivables Management</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers or invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-32"
                  data-testid="select-status-filter"
                >
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
          {receivablesLoading ? (
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
            <Table data-tour="accounts-receivables-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead data-tour="accounts-receivables-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all"
                          ? "No receivables match your filters"
                          : "No receivables found. Create your first one!"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceivables.map((receivable) => {
                    const customerName =
                      receivable.customer?.name || "Unknown Customer";
                    const invoiceNumber =
                      receivable.invoice?.number ||
                      receivable.invoiceId ||
                      "Unknown Invoice";
                    const remainingAmount =
                      parseFloat(receivable.amountDue) -
                      parseFloat(receivable.amountPaid);
                    const canRecordPayment =
                      remainingAmount > 0 && receivable.status !== "paid";

                    return (
                      <TableRow
                        key={receivable.id}
                        data-testid={`row-receivable-${receivable.id}`}
                      >
                        <TableCell className="font-light">
                          <Link
                            href={`/sales/clients/${receivable.customerId}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                            data-testid={`link-customer-${receivable.id}`}
                          >
                            <span>{customerName}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/sales/invoices/${receivable.invoiceId}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                            data-testid={`link-invoice-${receivable.id}`}
                          >
                            <span>{invoiceNumber}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell
                          data-testid={`text-amount-due-${receivable.id}`}
                        >
                          ₹{parseFloat(receivable.amountDue).toLocaleString()}
                        </TableCell>
                        <TableCell
                          data-testid={`text-amount-paid-${receivable.id}`}
                        >
                          ₹{parseFloat(receivable.amountPaid).toLocaleString()}
                        </TableCell>
                        <TableCell
                          data-testid={`text-due-date-${receivable.id}`}
                        >
                          {new Date(receivable.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusStyles[
                                receivable.status as keyof typeof statusStyles
                              ]
                            }
                            data-testid={`badge-status-${receivable.id}`}
                          >
                            {receivable.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {canRecordPayment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordPayment(receivable)}
                                data-testid={`button-record-payment-${receivable.id}`}
                                title="Record Payment"
                                data-tour="accounts-record-payment-button"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(receivable)}
                              data-testid={`button-edit-${receivable.id}`}
                              title="Edit Receivable"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(receivable)}
                              data-testid={`button-delete-${receivable.id}`}
                              title="Delete Receivable"
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
            <DialogTitle>Edit Receivable</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
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
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Invoice</SelectItem>
                        {invoices.map((invoice: any) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.number} - ₹{invoice.total}
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
                      <Input {...field} type="date" />
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
                      <Textarea {...field} placeholder="Additional notes" />
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
                  disabled={updateReceivableMutation.isPending}
                >
                  {updateReceivableMutation.isPending
                    ? "Updating..."
                    : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Record Payment</DialogTitle>
          </DialogHeader>

          {selectedReceivable && (
            <div className="mb-8 p-6 bg-muted/30 rounded-2xl border border-border/40">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Customer:</span>
                  <span className="font-bold text-foreground truncate max-w-[180px]">
                    {selectedReceivable.customer?.name || "Unknown Customer"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Amount Due:</span>
                  <span className="font-bold text-foreground">
                    ₹{parseFloat(selectedReceivable.amountDue).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Paid So Far:</span>
                  <span className="font-bold text-foreground text-muted-foreground/60">
                    ₹{parseFloat(selectedReceivable.amountPaid).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/60">
                  <span className="text-foreground font-black uppercase text-xs tracking-widest">Remaining:</span>
                  <span className="font-black text-primary text-xl">
                    ₹{(
                      parseFloat(selectedReceivable.amountDue) -
                      parseFloat(selectedReceivable.amountPaid)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Form {...paymentForm}>
            <form
              onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground/80">Amount *</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold group-focus-within:text-primary transition-colors">₹</span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8 font-bold border-muted-foreground/20 focus:border-primary transition-all shadow-none h-12 rounded-xl bg-muted/10"
                            data-testid="input-payment-amount"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground/80">Date *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date" 
                          className="border-muted-foreground/20 focus:border-primary transition-all shadow-none h-12 rounded-xl bg-muted/10 font-bold"
                          data-testid="input-payment-date" 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={paymentForm.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground/80">Payment Mode *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-muted-foreground/20 focus:border-primary transition-all shadow-none h-12 rounded-xl bg-muted/10 font-bold" data-testid="select-payment-mode">
                          <SelectValue placeholder="Select Mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="bank_transfer" className="rounded-xl py-3 font-medium">Bank Transfer</SelectItem>
                        <SelectItem value="upi" className="rounded-xl py-3 font-medium">UPI</SelectItem>
                        <SelectItem value="cheque" className="rounded-xl py-3 font-medium">Cheque</SelectItem>
                        <SelectItem value="cash" className="rounded-xl py-3 font-medium">Cash</SelectItem>
                        <SelectItem value="credit_card" className="rounded-xl py-3 font-medium">Credit Card</SelectItem>
                        <SelectItem value="debit_card" className="rounded-xl py-3 font-medium">Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {paymentForm.watch("paymentMode") === "bank_transfer" && (
                  <div className="grid grid-cols-1 gap-5 p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                    <FormField
                      control={paymentForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Bank Name</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. HDFC Bank" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="transactionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">TXN ID</FormLabel>
                            <FormControl><Input {...field} placeholder="TXN123..." className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Ref #</FormLabel>
                            <FormControl><Input {...field} placeholder="REF123..." className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Other conditional fields similarly styled ... */}
                {paymentForm.watch("paymentMode") === "upi" && (
                  <div className="grid grid-cols-1 gap-5 p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                    <FormField
                      control={paymentForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">UPI ID</FormLabel>
                          <FormControl><Input {...field} placeholder="username@upi" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="transactionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Transaction ID</FormLabel>
                          <FormControl><Input {...field} placeholder="TXN123..." className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {paymentForm.watch("paymentMode") === "cheque" && (
                  <div className="grid grid-cols-1 gap-5 p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="chequeNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Cheque #</FormLabel>
                            <FormControl><Input {...field} placeholder="000123" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="chequeDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Date</FormLabel>
                            <FormControl><Input {...field} type="date" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Bank Name</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. ICICI Bank" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {paymentForm.watch("paymentMode") === "cash" && (
                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                    <FormField
                      control={paymentForm.control}
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Received By</FormLabel>
                          <FormControl><Input {...field} placeholder="Employee name" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {(paymentForm.watch("paymentMode") === "credit_card" || paymentForm.watch("paymentMode") === "debit_card") && (
                  <div className="grid grid-cols-1 gap-5 p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="cardLast4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">Card Last 4</FormLabel>
                            <FormControl><Input {...field} maxLength={4} placeholder="1234" className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="transactionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary/70 tracking-wider">TXN ID</FormLabel>
                            <FormControl><Input {...field} placeholder="TXN123..." className="h-10 text-sm font-semibold rounded-lg bg-white border-primary/10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground/80">Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional payment details..."
                        className="min-h-[100px] border-muted-foreground/20 focus:border-primary transition-all shadow-none resize-none rounded-xl text-sm bg-muted/10 font-medium"
                        data-testid="input-payment-notes"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 font-bold text-muted-foreground hover:bg-muted/50 rounded-2xl h-14 uppercase tracking-widest text-xs"
                  onClick={() => setIsPaymentOpen(false)}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-[0_10px_20px_-10px_rgba(var(--primary),0.5)] h-14 uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={recordPaymentMutation.isPending}
                >
                  {recordPaymentMutation.isPending ? "PROCESSING..." : "CONFIRM PAYMENT"}
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
            <AlertDialogTitle>Delete Receivable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receivable? This action
              cannot be undone.
              {receivableToDelete && (
                <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                  <div className="space-y-1">
                    <div>
                      <strong>Customer:</strong>{" "}
                      {receivableToDelete.customer?.name || "Unknown Customer"}
                    </div>
                    <div>
                      <strong>Invoice:</strong>{" "}
                      {receivableToDelete.invoice?.number || "Unknown Invoice"}
                    </div>
                    <div>
                      <strong>Amount:</strong> ₹
                      {parseFloat(
                        receivableToDelete.amountDue
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteReceivableMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteReceivableMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
