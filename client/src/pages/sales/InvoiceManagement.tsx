import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Receipt, Eye, Download, Send, Edit } from "lucide-react";
import {
  insertInvoiceSchema,
  type InsertInvoice,
  type Customer,
  type Invoice,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function InvoiceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/invoices"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  const form = useForm<z.infer<typeof insertInvoiceSchema>>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      status: "draft",
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotalAmount: 0,
      cgstRate: 9,
      cgstAmount: 0,
      sgstRate: 9,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      balanceAmount: 0,
      invoiceNumber: "",
      customerId: "",
      userId: "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Default user ID
    },
  });

  // Watch form values for automatic calculations
  const watchedSubtotal = form.watch("subtotalAmount");
  const watchedDiscount = form.watch("discountAmount");
  const watchedCgstRate = form.watch("cgstRate");
  const watchedSgstRate = form.watch("sgstRate");
  const watchedIgstRate = form.watch("igstRate");

  // Auto-calculate GST amounts and total when values change
  useEffect(() => {
    const subtotal = watchedSubtotal || 0;
    const discount = watchedDiscount || 0;
    const taxableAmount = subtotal - discount;

    const cgstAmount = (taxableAmount * (watchedCgstRate || 0)) / 100;
    const sgstAmount = (taxableAmount * (watchedSgstRate || 0)) / 100;
    const igstAmount = (taxableAmount * (watchedIgstRate || 0)) / 100;

    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

    form.setValue("cgstAmount", parseFloat(cgstAmount.toFixed(2)));
    form.setValue("sgstAmount", parseFloat(sgstAmount.toFixed(2)));
    form.setValue("igstAmount", parseFloat(igstAmount.toFixed(2)));
    form.setValue("totalAmount", parseFloat(totalAmount.toFixed(2)));
    form.setValue("balanceAmount", parseFloat(totalAmount.toFixed(2)));
  }, [
    watchedSubtotal,
    watchedDiscount,
    watchedCgstRate,
    watchedSgstRate,
    watchedIgstRate,
    form,
  ]);

  const createInvoiceMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertInvoiceSchema>) =>
      apiRequest("POST", "/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Invoice creation error:", error);
      const issues = error?.data?.errors ?? error?.errors;
      if (Array.isArray(issues)) {
        issues.forEach((e: { path?: string[]; message: string }) => {
          const fieldName = e.path?.[0] as keyof InsertInvoice;
          if (fieldName) {
            form.setError(fieldName, { type: "server", message: e.message });
          }
        });
      }
      toast({
        title: "Validation Error",
        description:
          error?.message || "Please fix the highlighted fields and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertInvoiceSchema>) => {
    createInvoiceMutation.mutate(data);
  };

  // Handler for View action
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  // Handler for Edit action
  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
    // Reset form with invoice data
    const resetData = {
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotalAmount: parseFloat(invoice.subtotalAmount?.toString() || "0"),
      cgstRate: parseFloat(invoice.cgstRate?.toString() || "0"),
      cgstAmount: parseFloat(invoice.cgstAmount?.toString() || "0"),
      sgstRate: parseFloat(invoice.sgstRate?.toString() || "0"),
      sgstAmount: parseFloat(invoice.sgstAmount?.toString() || "0"),
      igstRate: parseFloat(invoice.igstRate?.toString() || "0"),
      igstAmount: parseFloat(invoice.igstAmount?.toString() || "0"),
      discountAmount: parseFloat(invoice.discountAmount?.toString() || "0"),
      totalAmount: parseFloat(invoice.totalAmount?.toString() || "0"),
      balanceAmount: parseFloat(invoice.balanceAmount?.toString() || "0"),
      customerId: invoice.customerId || "",
      userId: invoice.userId || "79c36f2b-237a-4ba6-a4b3-a12fc8a18446",
      status: invoice.status || "draft",
    };
    form.reset(resetData);
  };

  // Handler for Send action (updates status to 'sent')
  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      await apiRequest("PUT", `/invoices/${invoice.id}`, {
        status: "sent",
      });

      toast({
        title: "Success",
        description: "Invoice sent successfully",
      });

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ["/invoices"] });
    } catch (error: any) {
      console.error("Failed to send invoice:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  // Handler for Download PDF action
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/invoices/${invoice.id}/pdf`,
        undefined,
        { responseType: "blob" }
      );

      // Create a temporary anchor element to trigger the download
      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice PDF",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      cell: (invoice: any) => (
        <div className="font-light">{invoice.invoiceNumber}</div>
      ),
    },
    {
      key: "customer",
      header: "Client",
      cell: (invoice: any) => (
        <div>
          <div className="font-light">{invoice.customer?.name || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            {invoice.customer?.gstNumber || ""}
          </div>
        </div>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      cell: (invoice: any) =>
        new Date(invoice.invoiceDate).toLocaleDateString(),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      cell: (invoice: any) =>
        `₹${parseFloat(invoice.totalAmount).toLocaleString("en-IN")}`,
    },
    {
      key: "balanceAmount",
      header: "Balance",
      cell: (invoice: any) =>
        `₹${parseFloat(invoice.balanceAmount).toLocaleString("en-IN")}`,
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
          cancelled: "bg-gray-100 text-gray-800",
        };
        return (
          <Badge
            className={
              statusColors[invoice.status as keyof typeof statusColors] ||
              statusColors.draft
            }
          >
            {invoice.status?.toUpperCase() || "DRAFT"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (invoice: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewInvoice(invoice)}
            data-testid={`button-view-invoice-${invoice.id}`}
            title="View Invoice"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditInvoice(invoice)}
            data-testid={`button-edit-invoice-${invoice.id}`}
            title="Edit Invoice"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadPDF(invoice)}
            data-testid={`button-download-invoice-${invoice.id}`}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendInvoice(invoice)}
            data-testid={`button-send-invoice-${invoice.id}`}
            title="Send Invoice"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            data-testid="text-invoice-management-title"
          >
            Invoice Management
          </h1>
          <p className="text-muted-foreground">
            GST invoices with tax breakdowns and PDF downloads
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-invoice">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Enter the invoice details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-2025-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
                          />
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
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
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
                    name="subtotalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="cgstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CGST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cgstAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CGST Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sgstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SGST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
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
                        <FormLabel>SGST Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
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
                    name="igstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IGST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
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
                        <FormLabel>IGST Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
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
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="balanceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balance Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvoiceMutation.isPending}
                  >
                    Create Invoice
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Invoice Details - {selectedInvoice?.invoiceNumber}
              </DialogTitle>
              <DialogDescription>
                View invoice information and GST breakdown
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Invoice Information
                    </h3>
                    <p>
                      <strong>Invoice Number:</strong>{" "}
                      {selectedInvoice.invoiceNumber}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        selectedInvoice.invoiceDate
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {selectedInvoice.dueDate
                        ? new Date(selectedInvoice.dueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <Badge
                        className={
                          selectedInvoice.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : selectedInvoice.status === "sent"
                            ? "bg-blue-100 text-blue-800"
                            : selectedInvoice.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {selectedInvoice.status?.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Customer Information
                    </h3>
                    <p>
                      <strong>Customer:</strong>{" "}
                      {selectedInvoice.customer?.name || "N/A"}
                    </p>
                    <p>
                      <strong>GST Number:</strong>{" "}
                      {selectedInvoice.customer?.gstNumber || "N/A"}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {selectedInvoice.customer?.address || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedInvoice.customer?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Amount Breakdown</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>
                          ₹
                          {parseFloat(
                            selectedInvoice.subtotalAmount?.toString() || "0"
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {parseFloat(
                        selectedInvoice.discountAmount?.toString() || "0"
                      ) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>
                            -₹
                            {parseFloat(
                              selectedInvoice.discountAmount?.toString() || "0"
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Taxable Amount:</span>
                          <span>
                            ₹
                            {(
                              parseFloat(
                                selectedInvoice.subtotalAmount?.toString() ||
                                  "0"
                              ) -
                              parseFloat(
                                selectedInvoice.discountAmount?.toString() ||
                                  "0"
                              )
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {parseFloat(
                        selectedInvoice.cgstAmount?.toString() || "0"
                      ) > 0 && (
                        <div className="flex justify-between">
                          <span>CGST ({selectedInvoice.cgstRate}%):</span>
                          <span>
                            ₹
                            {parseFloat(
                              selectedInvoice.cgstAmount?.toString() || "0"
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      {parseFloat(
                        selectedInvoice.sgstAmount?.toString() || "0"
                      ) > 0 && (
                        <div className="flex justify-between">
                          <span>SGST ({selectedInvoice.sgstRate}%):</span>
                          <span>
                            ₹
                            {parseFloat(
                              selectedInvoice.sgstAmount?.toString() || "0"
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      {parseFloat(
                        selectedInvoice.igstAmount?.toString() || "0"
                      ) > 0 && (
                        <div className="flex justify-between">
                          <span>IGST ({selectedInvoice.igstRate}%):</span>
                          <span>
                            ₹
                            {parseFloat(
                              selectedInvoice.igstAmount?.toString() || "0"
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Amount:</span>
                          <span>
                            ₹
                            {parseFloat(
                              selectedInvoice.totalAmount?.toString() || "0"
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Balance Amount:</span>
                          <span>
                            ₹
                            {parseFloat(
                              selectedInvoice.balanceAmount?.toString() || "0"
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Edit Invoice - {selectedInvoice?.invoiceNumber}
              </DialogTitle>
              <DialogDescription>
                Update the invoice details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  // Update invoice logic here
                  apiRequest("PUT", `/invoices/${selectedInvoice?.id}`, data)
                    .then(() => {
                      queryClient.invalidateQueries({
                        queryKey: ["/invoices"],
                      });
                      toast({
                        title: "Success",
                        description: "Invoice updated successfully",
                      });
                      setIsEditDialogOpen(false);
                    })
                    .catch((error: any) => {
                      toast({
                        title: "Error",
                        description:
                          error?.data?.error || "Failed to update invoice",
                        variant: "destructive",
                      });
                    });
                })}
                className="space-y-4"
              >
                {/* Same form fields as create dialog */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-2025-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
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
                </div>
                {/* Include all the GST fields as in the create dialog */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="cgstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CGST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cgstAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CGST Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sgstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SGST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
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
                        <FormLabel>SGST Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
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
                    name="igstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IGST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
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
                        <FormLabel>IGST Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
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
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="balanceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balance Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Invoice</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>All Invoices</span>
          </CardTitle>
          <CardDescription>
            GST compliant invoices with CGST, SGST, IGST breakdowns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={invoices || []}
            columns={columns}
            searchable={true}
            searchKey="invoiceNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}
