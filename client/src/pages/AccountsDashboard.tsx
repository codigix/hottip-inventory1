import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Plus,
  Calculator,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Import shared schema for consistency
import { insertInvoiceSchema } from "@shared/schema";

// Extend shared schema for UI validation
const invoiceFormSchema = insertInvoiceSchema.omit({
  id: true,
  invoiceNumber: true, // Server generates
  userId: true, // Server determines from auth
  paidAmount: true,
  balanceAmount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customerId: z.string().min(1, "Customer is required"),
  subtotalAmount: z.string().min(1, "Subtotal amount is required"),
});

type InvoiceForm = z.infer<typeof invoiceFormSchema>;

export default function AccountsDashboard() {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const { toast } = useToast();

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: "",
      subtotalAmount: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "draft",
      cgstAmount: "0",
      sgstAmount: "0",
      igstAmount: "0",
      discountAmount: "0",
      notes: "",
      paymentTerms: "30 days",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      // Generate invoice number
      const invoiceCount = (invoices || []).length;
      const invoiceNumber = `INV${String(invoiceCount + 1).padStart(6, '0')}`;
      
      // Calculate total amount - let server handle invoice number generation
      const subtotal = parseFloat(data.subtotalAmount);
      const cgst = parseFloat(data.cgstAmount || '0');
      const sgst = parseFloat(data.sgstAmount || '0');
      const igst = parseFloat(data.igstAmount || '0');
      const discount = parseFloat(data.discountAmount || '0');
      const totalAmount = (subtotal + cgst + sgst + igst - discount).toString();
      
      const invoiceData = {
        customerId: data.customerId,
        // userId will be determined server-side from authentication
        status: data.status,
        invoiceDate: new Date(),
        dueDate: data.dueDate,
        subtotalAmount: data.subtotalAmount,
        cgstAmount: data.cgstAmount || '0',
        sgstAmount: data.sgstAmount || '0',
        igstAmount: data.igstAmount || '0',
        discountAmount: data.discountAmount || '0',
        totalAmount: totalAmount,
        paidAmount: '0',
        balanceAmount: totalAmount,
        paymentTerms: data.paymentTerms || '30 days',
        notes: data.notes,
      };
      return await apiRequest("POST", "/api/invoices", invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsInvoiceDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceForm) => {
    createInvoiceMutation.mutate(data);
  };

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    form.reset({
      customerId: invoice.customer?.id || "",
      subtotalAmount: invoice.subtotalAmount.toString(),
      dueDate: new Date(invoice.dueDate),
      status: invoice.status,
      cgstAmount: invoice.cgstAmount?.toString() || '0',
      sgstAmount: invoice.sgstAmount?.toString() || '0',
      igstAmount: invoice.igstAmount?.toString() || '0',
      discountAmount: invoice.discountAmount?.toString() || '0',
      notes: invoice.notes || "",
      paymentTerms: invoice.paymentTerms || "30 days",
    });
  };

  const invoiceColumns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
    },
    {
      key: "customer.name",
      header: "Customer",
      cell: (invoice: any) => invoice.customer?.name || 'Unknown Customer',
    },
    {
      key: "totalAmount",
      header: "Amount",
      cell: (invoice: any) => `₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}`,
    },
    {
      key: "balanceAmount",
      header: "Balance",
      cell: (invoice: any) => `₹${parseFloat(invoice.balanceAmount).toLocaleString('en-IN')}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (invoice: any) => {
        const statusColors = {
          draft: "bg-gray-100 text-gray-800",
          sent: "bg-blue-100 text-blue-800",
          paid: "bg-green-100 text-green-800",
          overdue: "bg-red-100 text-red-800",
          cancelled: "bg-red-100 text-red-800",
        };

        return (
          <Badge className={statusColors[invoice.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {invoice.status?.toUpperCase() || 'DRAFT'}
          </Badge>
        );
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (invoice: any) => new Date(invoice.dueDate).toLocaleDateString(),
    },
  ];

  // Calculate financial metrics
  const totalRevenue = (invoices || []).reduce((sum: number, invoice: any) => {
    return invoice.status === 'paid' ? sum + parseFloat(invoice.totalAmount) : sum;
  }, 0);

  const pendingPayments = (invoices || []).reduce((sum: number, invoice: any) => {
    return invoice.status !== 'paid' && invoice.status !== 'cancelled' ? sum + parseFloat(invoice.balanceAmount) : sum;
  }, 0);

  const totalInvoices = (invoices || []).length;
  const overdueInvoices = (invoices || []).filter((invoice: any) => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return (invoice.status === 'sent' || invoice.status === 'draft') && dueDate < today;
  }).length;

  if (invoicesLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Accounts Dashboard</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and financial reports</p>
        </div>
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsInvoiceDialogOpen(true)} data-testid="button-create-invoice">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Generate a new invoice for your customer
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(customers || []).map((customer: any) => (
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal Amount (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="10000.00" data-testid="input-subtotal-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-due-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="30 days" data-testid="input-payment-terms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cgstAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CGST (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="900.00" data-testid="input-cgst" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sgstAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SGST (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="900.00" data-testid="input-sgst" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="igstAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IGST (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="1800.00" data-testid="input-igst" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-discount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional invoice notes..." data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsInvoiceDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createInvoiceMutation.isPending}
                    data-testid="button-create"
                  >
                    Create Invoice
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-foreground">₹{pendingPayments.toLocaleString('en-IN')}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Requires follow-up
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold text-foreground">{totalInvoices}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  This month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Overdue Invoices</p>
                <p className="text-2xl font-bold text-foreground">{overdueInvoices}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoices Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                Track and manage customer invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={(invoices || [])}
                columns={invoiceColumns}
                onEdit={handleEdit}
                searchable={true}
                searchKey="invoiceNumber"
              />
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary & Quick Actions */}
        
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => setIsInvoiceDialogOpen(true)}
                data-testid="button-quick-invoice"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Record payment")}
                data-testid="button-record-payment"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Generate report")}
                data-testid="button-financial-report"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Financial Report
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Tally integration")}
                data-testid="button-tally-sync"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Sync with Tally
              </Button>
            </CardContent>
          </Card>
          </div>

          {/* Payment Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Paid</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">
                    {invoices?.filter(i => i.status === 'paid').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">invoices</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Pending</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">
                    {invoices?.filter(i => i.status === 'sent' || i.status === 'draft').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">invoices</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Overdue</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">{overdueInvoices}</p>
                  <p className="text-xs text-muted-foreground">invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices?.filter(i => i.status === 'paid').slice(0, 3).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-sm">
                    <div>
                      <p className="text-sm font-light">{payment.customer?.name || 'Unknown Customer'}</p>
                      <p className="text-xs text-muted-foreground">{payment.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-light">₹{parseFloat(payment.totalAmount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">No recent payments</p>
                )}
              </div>
            </CardContent>
          </Card>
        
      </div>
    </main>
  );
}
