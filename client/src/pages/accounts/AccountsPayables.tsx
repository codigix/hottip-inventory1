import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  DialogDescription,
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
  CreditCard,
  TrendingDown,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Trash2,
  DollarSign,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAccountsPayableSchema } from "@shared/schema";
import type { AccountsPayable, InsertAccountsPayable } from "@shared/schema";
import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schemas
const payableFormSchema = insertAccountsPayableSchema.extend({
  poId: z.string().optional(),
  inboundQuotationId: z.string().optional(),
  amountDue: z.string().min(1, "Amount due is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

const isValidUUID = (val: string): boolean => {
  if (!val || !val.trim()) return true;
  return uuidRegex.test(val);
};

type PayableFormData = z.infer<typeof payableFormSchema>;

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

type PaymentFormData = z.infer<typeof paymentFormSchema>;

// Status styling
const statusStyles = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  partial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AccountsPayables() {
  const { toast } = useToast();
  const [selectedPayable, setSelectedPayable] =
    useState<AccountsPayable | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data fetching
  const { data: payables = [], isLoading: payablesLoading } = useQuery({
    queryKey: ["/accounts-payables"],
  }) as { data: AccountsPayable[]; isLoading: boolean };

  const { data: overduePayables = [] } = useQuery({
    queryKey: ["/accounts-payables/overdue"],
  }) as { data: AccountsPayable[] };

  const { data: totalPayables } = useQuery({
    queryKey: ["/accounts/payables-total"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/suppliers"],
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["/purchase-orders"],
  });

  const { data: inboundQuotations = [] } = useQuery({
    queryKey: ["/inbound-quotations"],
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
      date: new Date().toISOString().split("T")[0],
      paymentMode: "bank_transfer",
      notes: "",
    },
  });

  // Mutations
  const createPayableMutation = useMutation({
    mutationFn: (data: PayableFormData) => {
      const poIdTrimmed = data.poId?.trim() || "";
      const quotationIdTrimmed = data.inboundQuotationId?.trim() || "";

      if (!isValidUUID(poIdTrimmed)) {
        throw new Error("PO ID must be a valid UUID or empty");
      }
      if (!isValidUUID(quotationIdTrimmed)) {
        throw new Error("Quotation ID must be a valid UUID or empty");
      }

      const payload: any = {
        supplierId: data.supplierId,
        amountDue: parseFloat(data.amountDue),
        dueDate: new Date(data.dueDate).toISOString(),
        notes: data.notes,
        poId: poIdTrimmed,
        inboundQuotationId: quotationIdTrimmed,
      };
      return apiRequest("/accounts-payables", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-payables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-payables/overdue"],
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts/payables-total"] });
      toast({ title: "Success", description: "Payable created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create payable";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updatePayableMutation = useMutation({
    mutationFn: ({ id, ...data }: PayableFormData & { id: string }) => {
      const poIdTrimmed = data.poId?.trim() || "";
      const quotationIdTrimmed = data.inboundQuotationId?.trim() || "";

      if (!isValidUUID(poIdTrimmed)) {
        throw new Error("PO ID must be a valid UUID or empty");
      }
      if (!isValidUUID(quotationIdTrimmed)) {
        throw new Error("Quotation ID must be a valid UUID or empty");
      }

      const payload: any = {
        supplierId: data.supplierId,
        amountDue: parseFloat(data.amountDue),
        dueDate: new Date(data.dueDate).toISOString(),
        notes: data.notes,
        poId: poIdTrimmed,
        inboundQuotationId: quotationIdTrimmed,
      };
      return apiRequest(`/accounts-payables/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-payables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-payables/overdue"],
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts/payables-total"] });
      toast({ title: "Success", description: "Payable updated successfully" });
      setIsEditOpen(false);
      setSelectedPayable(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update payable";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, ...data }: PaymentFormData & { id: string }) => {
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

      return apiRequest(`/accounts-payables/${id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentDate: date,
          paymentMode,
          paymentDetails,
          notes,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-payables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-payables/overdue"],
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts/payables-total"] });
      toast({ title: "Success", description: "Payment recorded successfully" });
      setIsPaymentOpen(false);
      setSelectedPayable(null);
      paymentForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const deletePayableMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/accounts-payables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/accounts-payables"] });
      queryClient.invalidateQueries({
        queryKey: ["/accounts-payables/overdue"],
      });
      queryClient.invalidateQueries({ queryKey: ["/accounts/payables-total"] });
      toast({ title: "Success", description: "Payable deleted successfully" });
      setIsDeleteOpen(false);
      setSelectedPayable(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete payable",
        variant: "destructive",
      });
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
      poId: payable.poId ? String(payable.poId) : "",
      inboundQuotationId: payable.inboundQuotationId ? String(payable.inboundQuotationId) : "",
      amountDue: payable.amountDue.toString(),
      dueDate: payable.dueDate.split("T")[0],
      notes: payable.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleRecordPayment = (payable: AccountsPayable) => {
    const remainingAmount =
      parseFloat(payable.amountDue) - parseFloat(payable.amountPaid);
    setSelectedPayable(payable);
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
    const supplierName =
      suppliers.find((s: any) => s.id === payable.supplierId)?.name ||
      "Unknown Supplier";
    const poNumber =
      purchaseOrders.find((po: any) => po.id === payable.poId)?.number || "";
    const quotationNumber =
      inboundQuotations.find((q: any) => q.id === payable.inboundQuotationId)
        ?.number || "";

    const matchesSearch =
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payable.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalAmount = totalPayables?.total || 0;
  const overdueAmount = overduePayables.reduce(
    (sum: number, p: AccountsPayable) =>
      sum + (parseFloat(p.amountDue) - parseFloat(p.amountPaid)),
    0
  );
  const avgPaymentDays = 42; // TODO: Calculate from actual data
  const paymentRate =
    payables.length > 0
      ? (payables.filter((p: AccountsPayable) => p.status === "paid").length /
          payables.length) *
        100
      : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between" data-tour="accounts-payables-header">
        <div>
          <h1
            className="text-3xl font-bold text-foreground"
            data-testid="page-title"
          >
            Accounts Payables
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage vendor payments linked to POs/quotations
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-payable" data-tour="accounts-add-payable-button">
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
              <form
                onSubmit={createForm.handleSubmit(handleCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter PO ID or leave empty"
                          data-testid="input-po-id"
                        />
                      </FormControl>
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
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter Quotation ID or leave empty"
                          data-testid="input-quotation-id"
                        />
                      </FormControl>
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
            <div
              className="text-2xl font-bold"
              data-testid="metric-total-payables"
            >
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
            <div
              className="text-2xl font-bold text-red-600"
              data-testid="metric-overdue-amount"
            >
              ₹{overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overduePayables.length} overdue payables
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
            <p className="text-xs text-muted-foreground">Target: 45 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Payment Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-blue-600"
              data-testid="metric-payment-rate"
            >
              {paymentRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">On-time payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader data-tour="accounts-payables-filters">
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
            <Table data-tour="accounts-payables-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>PO/Quotation</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead data-tour="accounts-payables-actions">Actions</TableHead>
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
                  filteredPayables.map((payable: any) => {
                    const supplier = payable.supplier || suppliers.find(
                      (s: any) => s.id === payable.supplierId
                    );
                    const user = payable.user;
                    const displayName = supplier?.name || (user ? `${user.firstName} ${user.lastName}` : "Unknown Supplier");

                    const po = payable.purchaseOrder || purchaseOrders.find(
                      (po: any) => po.id === payable.poId
                    );
                    const quotation = payable.inboundQuotation || inboundQuotations.find(
                      (q: any) => q.id === payable.inboundQuotationId
                    );
                    const remainingAmount =
                      parseFloat(payable.amountDue) -
                      parseFloat(payable.amountPaid);

                    return (
                      <TableRow
                        key={payable.id}
                        data-testid={`row-payable-${payable.id}`}
                      >
                        <TableCell className="font-light">
                          <Link
                            href={`/sales/suppliers/${payable.supplierId}`}
                            className="hover:underline flex items-center"
                          >
                            {displayName}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          {po ? (
                            <Link
                              href={`/sales/purchase-orders/${payable.poId}`}
                              className="hover:underline flex items-center"
                            >
                              PO: {po.poNumber || po.number}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          ) : quotation ? (
                            <Link
                              href={`/sales/quotations/inbound/${payable.inboundQuotationId}`}
                              className="hover:underline flex items-center"
                            >
                              QT: {quotation.quotationNumber || quotation.number}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              No PO/Quotation
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          ₹{parseFloat(payable.amountDue).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₹{parseFloat(payable.amountPaid).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(payable.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusStyles[
                                payable.status as keyof typeof statusStyles
                              ]
                            }
                          >
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
                                data-tour="accounts-process-payment-button"
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
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
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
        <DialogContent className="max-w-5xl h-[90vh] max-h-[95vh] p-0 border-none shadow-2xl bg-slate-50 flex flex-col overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Process outbound payment to vendor
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary px-6 py-6 text-white sticky top-0 z-20 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none mb-1">
                    Record Payment
                  </h2>
                  <p className="opacity-70 text-xs font-medium uppercase tracking-widest">Outbound Vendor Payment</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/10 px-6 py-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner inline-block">
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em] mb-0.5">Outstanding Balance</p>
                  <p className="text-2xl font-black tabular-nums">
                    ₹{selectedPayable ? (
                      parseFloat(selectedPayable.amountDue) -
                      parseFloat(selectedPayable.amountPaid)
                    ).toLocaleString() : "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
            <Form {...paymentForm}>
              <form
                id="payment-form"
                onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column: Vendor & Summary */}
                  <div className="md:col-span-1 space-y-8">
                    <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-primary" /> Payment Summary
                      </h3>
                      
                      {selectedPayable && (
                        <div className="space-y-6 relative z-10">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Supplier</Label>
                            <p className="font-bold text-slate-800 text-lg leading-tight">
                              {suppliers.find((s: any) => s.id === selectedPayable.supplierId)?.name || "Unknown Vendor"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Payable</Label>
                              <p className="font-bold text-slate-700">₹{parseFloat(selectedPayable.amountDue).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1 text-right">
                              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Already Paid</Label>
                              <p className="font-bold text-emerald-600">₹{parseFloat(selectedPayable.amountPaid).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-50">
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">PO Ref</span>
                                <Badge variant="secondary" className="bg-white text-slate-700 border-slate-100">
                                  {selectedPayable.poId || "Manual Entry"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Due Date</span>
                                <span className="text-xs font-black text-slate-700">
                                  {new Date(selectedPayable.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-primary" /> Payment Method
                      </h3>
                      <FormField
                        control={paymentForm.control}
                        name="paymentMode"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100 h-12 rounded-xl font-bold">
                                  <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="bank_transfer" className="font-bold">Bank Transfer</SelectItem>
                                <SelectItem value="upi" className="font-bold">UPI / QR</SelectItem>
                                <SelectItem value="cheque" className="font-bold">Cheque</SelectItem>
                                <SelectItem value="cash" className="font-bold">Cash</SelectItem>
                                <SelectItem value="credit_card" className="font-bold">Credit Card</SelectItem>
                                <SelectItem value="debit_card" className="font-bold">Debit Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px] font-bold" />
                          </FormItem>
                        )}
                      />
                    </section>
                  </div>

                  {/* Middle & Right Column: Payment Form */}
                  <div className="md:col-span-2 space-y-8">
                    <section className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 pointer-events-none" />
                       
                       <div className="flex items-center mb-8 border-b border-slate-50 pb-6 relative z-10">
                        <div className="bg-primary/5 p-4 rounded-2xl mr-5 shadow-inner">
                          <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Payment Details</h3>
                          <p className="text-sm text-slate-400 font-medium">Enter amount and transaction metadata</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 relative z-10">
                        <FormField
                          control={paymentForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Payment Amount</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black group-focus-within:scale-110 transition-transform">₹</span>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="pl-9 h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-black text-xl rounded-2xl"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={paymentForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Payment Date</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="date" 
                                  className="h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-bold text-lg rounded-2xl"
                                />
                              </FormControl>
                              <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-8 space-y-6 relative z-10">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                          <div className="h-px bg-slate-100 flex-1" />
                          Transaction Metadata
                          <div className="h-px bg-slate-100 flex-1" />
                        </h4>

                        <div className="space-y-4">
                          {paymentForm.watch("paymentMode") === "bank_transfer" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                              <FormField
                                control={paymentForm.control}
                                name="bankName"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Receiving Bank</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g. HDFC Bank Main" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={paymentForm.control}
                                name="transactionId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">TXN ID</FormLabel>
                                    <FormControl><Input {...field} placeholder="TXN123..." className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={paymentForm.control}
                                name="referenceNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Ref #</FormLabel>
                                    <FormControl><Input {...field} placeholder="REF123..." className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {paymentForm.watch("paymentMode") === "upi" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                              <FormField
                                control={paymentForm.control}
                                name="upiId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Vendor UPI ID</FormLabel>
                                    <FormControl><Input {...field} placeholder="vendor@upi" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={paymentForm.control}
                                name="transactionId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Transaction Ref</FormLabel>
                                    <FormControl><Input {...field} placeholder="TXN123..." className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {paymentForm.watch("paymentMode") === "cheque" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                              <FormField
                                control={paymentForm.control}
                                name="chequeNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Cheque Number</FormLabel>
                                    <FormControl><Input {...field} placeholder="000123" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={paymentForm.control}
                                name="chequeDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Cheque Date</FormLabel>
                                    <FormControl><Input {...field} type="date" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={paymentForm.control}
                                name="bankName"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Issuing Bank</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g. HDFC Bank" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {paymentForm.watch("paymentMode") === "cash" && (
                            <div className="animate-in slide-in-from-bottom-2 duration-300">
                              <FormField
                                control={paymentForm.control}
                                name="receivedBy"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Recipient Name</FormLabel>
                                    <FormControl><Input {...field} placeholder="Who received the cash?" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {(paymentForm.watch("paymentMode") === "credit_card" || paymentForm.watch("paymentMode") === "debit_card") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                              <FormField
                                control={paymentForm.control}
                                name="cardLast4"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Last 4 Digits</FormLabel>
                                    <FormControl><Input {...field} placeholder="4242" maxLength={4} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={paymentForm.control}
                                name="transactionId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Auth Code</FormLabel>
                                    <FormControl><Input {...field} placeholder="AUTH123" className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          <FormField
                            control={paymentForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem className="pt-4 border-t border-slate-50">
                                <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Internal Remarks</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Add any additional details about this payment..." 
                                    className="min-h-[100px] bg-slate-50 border-slate-100 rounded-2xl p-4 font-medium focus:bg-white transition-all shadow-inner"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </form>
            </Form>
          </div>

          <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-30 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] mt-auto">
            <div className="flex items-center text-slate-400 text-xs font-bold italic">
              <Clock className="mr-2 h-4 w-4" />
              Last updated: {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsPaymentOpen(false)}
                className="px-8 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50"
              >
                DISCARD
              </Button>
              <Button
                form="payment-form"
                type="submit"
                disabled={recordPaymentMutation.isPending}
                className="px-10 h-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {recordPaymentMutation.isPending ? "PROCESSING..." : "CONFIRM PAYMENT"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payable? This action cannot
              be undone.
              {selectedPayable && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Supplier:</strong>{" "}
                    {suppliers.find(
                      (s: any) => s.id === selectedPayable.supplierId
                    )?.name || "Unknown"}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong> ₹
                    {parseFloat(selectedPayable.amountDue).toLocaleString()}
                  </p>
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
