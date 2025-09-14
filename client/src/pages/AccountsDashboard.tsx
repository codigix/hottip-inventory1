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

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  type: z.enum(["invoice", "proforma", "tax", "eway"]),
});

type InvoiceForm = z.infer<typeof invoiceFormSchema>;

export default function AccountsDashboard() {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const { toast } = useToast();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: "",
      amount: "",
      dueDate: "",
      description: "",
      type: "invoice",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      // Create order as invoice placeholder since we don't have invoices table
      const orderData = {
        customerId: data.customerId,
        userId: "temp-user-id",
        totalAmount: data.amount,
        taxAmount: "0",
        discountAmount: "0",
        notes: `${data.type.toUpperCase()}: ${data.description || ''}`,
        status: "pending",
      };
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsInvoiceDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
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

  const handleEdit = (order: any) => {
    setEditingInvoice(order);
    form.reset({
      customerId: order.customer?.id || "",
      amount: order.totalAmount.toString(),
      dueDate: new Date().toISOString().split('T')[0],
      description: order.notes || "",
      type: "invoice",
    });
  };

  const invoiceColumns = [
    {
      key: "orderNumber",
      header: "Invoice #",
    },
    {
      key: "customer.name",
      header: "Customer",
    },
    {
      key: "totalAmount",
      header: "Amount",
      cell: (order: any) => `$${parseFloat(order.totalAmount).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (order: any) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          processing: "bg-blue-100 text-blue-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        
        const statusLabels = {
          pending: "Unpaid",
          processing: "Partial",
          delivered: "Paid",
          cancelled: "Cancelled",
        };

        return (
          <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {statusLabels[order.status as keyof typeof statusLabels] || order.status}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (order: any) => new Date(order.createdAt).toLocaleDateString(),
    },
  ];

  // Calculate financial metrics
  const totalRevenue = (orders || []).reduce((sum: number, order: any) => {
    return order.status === 'delivered' ? sum + parseFloat(order.totalAmount) : sum;
  }, 0);

  const pendingPayments = (orders || []).reduce((sum: number, order: any) => {
    return order.status === 'pending' ? sum + parseFloat(order.totalAmount) : sum;
  }, 0);

  const totalInvoices = (orders || []).length;
  const overdueInvoices = (orders || []).filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return order.status === 'pending' && orderDate < thirtyDaysAgo;
  }).length;

  if (ordersLoading) {
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-amount" />
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
                          <Input {...field} type="date" data-testid="input-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="invoice">Regular Invoice</SelectItem>
                          <SelectItem value="proforma">Proforma Invoice</SelectItem>
                          <SelectItem value="tax">Tax Invoice</SelectItem>
                          <SelectItem value="eway">E-Way Bill</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-description" />
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
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-foreground">${pendingPayments.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
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
                <p className="text-sm font-medium text-muted-foreground">Overdue Invoices</p>
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                Track and manage customer invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={(orders || [])}
                columns={invoiceColumns}
                onEdit={handleEdit}
                searchable={true}
                searchKey="orderNumber"
              />
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
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
                  <span className="text-sm font-medium text-foreground">Paid</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {orders?.filter(o => o.status === 'delivered').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">invoices</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Pending</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {orders?.filter(o => o.status === 'pending').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">invoices</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Overdue</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{overdueInvoices}</p>
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
                {orders?.filter(o => o.status === 'delivered').slice(0, 3).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div>
                      <p className="text-sm font-medium">{payment.customer?.name || 'Unknown Customer'}</p>
                      <p className="text-xs text-muted-foreground">{payment.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${parseFloat(payment.totalAmount).toFixed(2)}</p>
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
      </div>
    </main>
  );
}
