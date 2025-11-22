import { useState } from "react";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Receipt, Eye, Download, Send, Trash2 } from "lucide-react";
import {
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  type InsertInvoice,
  type Customer,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface InvoiceItem {
  id: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  amount: number;
}

type InvoiceItemTextField = "description" | "hsnSac" | "unit";
type InvoiceItemNumberField =
  | "quantity"
  | "unitPrice"
  | "cgstRate"
  | "sgstRate"
  | "igstRate"
  | "amount";

const generateLineItemId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

const createEmptyLineItem = (): InvoiceItem => ({
  id: generateLineItemId(),
  description: "",
  hsnSac: "",
  quantity: 1,
  unitPrice: 0,
  unit: "",
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
  amount: 0,
});

const safeParseNumber = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const recalculateItemAmount = (item: InvoiceItem): number => {
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  const baseAmount = quantity * unitPrice;
  const cgst = baseAmount * ((item.cgstRate ?? 0) / 100);
  const sgst = baseAmount * ((item.sgstRate ?? 0) / 100);
  const igst = baseAmount * ((item.igstRate ?? 0) / 100);
  return parseFloat((baseAmount + cgst + sgst + igst).toFixed(2));
};

export default function InvoiceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<string | null>(null);

  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    createEmptyLineItem(),
  ]);
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
      packingFee: 0,
      shippingFee: 0,
      otherCharges: 0,
      totalAmount: 0,
      balanceAmount: 0,
      invoiceNumber: "",
      customerId: "",
      userId: "b34e3723-ba42-402d-b454-88cf96340573", // Default user ID
      billingAddress: "",
      shippingAddress: "",
      billingGstNumber: "",
      placeOfSupply: "",
      paymentTerms: "NET 30",
      deliveryTerms: "",
      transporterName: "",
      ewayBillNumber: "",
      amountInWords: "",
      notes: "",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: z.infer<typeof insertInvoiceSchema>) => {
      const invoice = await apiRequest("POST", "/invoices", payload);
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      setLineItems([createEmptyLineItem()]);
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

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return await apiRequest("PATCH", `/invoices/${invoiceId}/status`, {
        status: "sent",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/invoices"] });
      toast({
        title: "Success",
        description: "Invoice sent successfully",
      });
      setIsSendDialogOpen(false);
      setInvoiceToSend(null);
    },
    onError: (error: any) => {
      console.error("Send invoice error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertInvoiceSchema>) => {
    const sanitizedLineItems = lineItems
      .filter((item) => item.description.trim().length > 0)
      .map((item) => ({
        description: item.description,
        hsnSac: item.hsnSac || "",
        quantity: Number(item.quantity) || 0,
        unit: item.unit || "pcs",
        unitPrice: Number(item.unitPrice) || 0,
        cgstRate: Number(item.cgstRate) || 0,
        sgstRate: Number(item.sgstRate) || 0,
        igstRate: Number(item.igstRate) || 0,
        amount: Number(item.amount) || 0,
      }));

    createInvoiceMutation.mutate({
      ...data,
      lineItems: sanitizedLineItems,
    });
  };

  const addLineItem = () => {
    setLineItems((previousItems) => [...previousItems, createEmptyLineItem()]);
  };

  const handleItemChange = (
    itemId: string,
    field: InvoiceItemTextField,
    value: string
  ) => {
    setLineItems((previousItems) =>
      previousItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleItemNumberChange = (
    itemId: string,
    field: InvoiceItemNumberField,
    value: string
  ) => {
    const parsedValue = safeParseNumber(value);

    setLineItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const updatedItem: InvoiceItem = {
          ...item,
          [field]: parsedValue,
        };

        // Keep amount in sync with quantity, price, and taxes
        if (field !== "amount") {
          updatedItem.amount = recalculateItemAmount(updatedItem);
        }

        return updatedItem;
      })
    );
  };

  const removeLineItem = (itemId: string) => {
    setLineItems((previousItems) =>
      previousItems.length > 1
        ? previousItems.filter((item) => item.id !== itemId)
        : previousItems
    );
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch invoice");
      setSelectedInvoice(data.invoice);
      setIsViewOpen(true);
    } catch (err) {
      console.error("View Invoice Error:", err);
      toast({
        title: "Error",
        description: "Unable to view invoice details.",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = (invoiceId: string) => {
    setInvoiceToSend(invoiceId);
    setIsSendDialogOpen(true);
  };

  const confirmSendInvoice = () => {
    if (invoiceToSend) {
      sendInvoiceMutation.mutate(invoiceToSend);
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
            onClick={() => handleViewInvoice(invoice.id)}
            data-testid={`button-view-invoice-${invoice.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadInvoice(invoice.id)}
            data-testid={`button-download-invoice-${invoice.id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendInvoice(invoice.id)}
            data-testid={`button-send-invoice-${invoice.id}`}
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
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerTrigger asChild>
            <Button data-testid="button-new-invoice">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sticky top-0 bg-background border-b z-10">
              <DrawerTitle>Create New Invoice</DrawerTitle>
              <DrawerDescription>
                Enter the invoice details below.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
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
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id}
                                >
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="billingAddress"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Billing Address</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Client billing address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Delivery location"
                              {...field}
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
                      name="billingGstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client GSTIN</FormLabel>
                          <FormControl>
                            <Input placeholder="29ABCDE1234F1Z5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="placeOfSupply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Place of Supply</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Bengaluru, Karnataka"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input placeholder="NET 30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Terms</FormLabel>
                          <FormControl>
                            <Input placeholder="FOB" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transporter</FormLabel>
                          <FormControl>
                            <Input placeholder="Logistics partner" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ewayBillNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-way Bill No.</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amountInWords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount in Words</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={2}
                              placeholder="Rupees One Lakh Only"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="packingFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Packing Charges</FormLabel>
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
                      name="shippingFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Charges</FormLabel>
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
                      name="otherCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Charges</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Enter delivery instructions or other remarks"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Line Items</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLineItem}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">
                              Description
                            </TableHead>
                            <TableHead>HSN/SAC</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>CGST %</TableHead>
                            <TableHead>SGST %</TableHead>
                            <TableHead>IGST %</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="w-[60px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={10}
                                className="text-center text-sm"
                              >
                                No items added yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            lineItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Input
                                    value={item.description}
                                    placeholder="Item description"
                                    onChange={(event) =>
                                      handleItemChange(
                                        item.id,
                                        "description",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.hsnSac ?? ""}
                                    placeholder="HSN/SAC"
                                    onChange={(event) =>
                                      handleItemChange(
                                        item.id,
                                        "hsnSac",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                    onChange={(event) =>
                                      handleItemNumberChange(
                                        item.id,
                                        "quantity",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={item.unit ?? ""}
                                    placeholder="pcs"
                                    onChange={(event) =>
                                      handleItemChange(
                                        item.id,
                                        "unit",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(event) =>
                                      handleItemNumberChange(
                                        item.id,
                                        "unitPrice",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.cgstRate ?? 0}
                                    onChange={(event) =>
                                      handleItemNumberChange(
                                        item.id,
                                        "cgstRate",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.sgstRate ?? 0}
                                    onChange={(event) =>
                                      handleItemNumberChange(
                                        item.id,
                                        "sgstRate",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.igstRate ?? 0}
                                    onChange={(event) =>
                                      handleItemNumberChange(
                                        item.id,
                                        "igstRate",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.amount}
                                    onChange={(event) =>
                                      handleItemNumberChange(
                                        item.id,
                                        "amount",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLineItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setLineItems([]);
                      }}
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
            </div>
          </DrawerContent>
        </Drawer>
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
          {/* ✅ View Invoice Drawer */}
          <Drawer open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DrawerContent className="p-6 max-h-[90vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle className="text-2xl text-center font-bold">
                  TAX INVOICE
                </DrawerTitle>
                <DrawerDescription className="text-center">
                  View full invoice details
                </DrawerDescription>
              </DrawerHeader>

              {selectedInvoice ? (
                <div className="space-y-4 text-sm max-w-5xl mx-auto">
                  {/* Company Details */}
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-bold text-center">
                      HOTTIP INDIA POLYMERS
                    </h2>
                    <p className="text-center text-xs mt-1">
                      GAT NO.209, OFFICE NO-406, SWARAJ CAPITAL, BORHADEWADI,
                      <br />
                      MOSHI CHIKHALI ROAD, PUNE-412105
                    </p>
                    <div className="flex justify-between mt-2 text-xs">
                      <div>
                        <strong>GSTIN:</strong> 27AQYPM1029M1Z6
                      </div>
                      <div>
                        <strong>State:</strong> Maharashtra, Code: 27
                      </div>
                      <div>
                        <strong>Email:</strong> saleshottipindia@gmail.com
                      </div>
                    </div>
                  </div>

                  {/* Invoice & Customer Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border p-3 rounded">
                      <h4 className="font-semibold mb-2 text-blue-700">
                        Bill To
                      </h4>
                      <p className="font-semibold">
                        {selectedInvoice.customer}
                      </p>
                      {selectedInvoice.billingAddress && (
                        <p className="text-xs mt-1">
                          {selectedInvoice.billingAddress}
                        </p>
                      )}
                      {selectedInvoice.clientGSTIN && (
                        <p className="text-xs mt-1">
                          <strong>GSTIN:</strong> {selectedInvoice.clientGSTIN}
                        </p>
                      )}
                      {selectedInvoice.placeOfSupply && (
                        <p className="text-xs mt-1">
                          <strong>Place of Supply:</strong>{" "}
                          {selectedInvoice.placeOfSupply}
                        </p>
                      )}
                    </div>
                    <div className="border p-3 rounded">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Invoice No:</strong>
                          <p className="font-semibold text-blue-600">
                            {selectedInvoice.invoiceNumber}
                          </p>
                        </div>
                        <div>
                          <strong>Invoice Date:</strong>
                          <p>{selectedInvoice.invoiceDate}</p>
                        </div>
                        <div>
                          <strong>Due Date:</strong>
                          <p>{selectedInvoice.dueDate}</p>
                        </div>
                        <div>
                          <strong>Payment Terms:</strong>
                          <p>{selectedInvoice.paymentTerms || "NET 30"}</p>
                        </div>
                        {selectedInvoice.ewayBillNumber && (
                          <div className="col-span-2">
                            <strong>E-Way Bill:</strong>
                            <p>{selectedInvoice.ewayBillNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="border rounded">
                    <h4 className="font-semibold p-3 bg-gray-50 border-b">
                      Description of Goods
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-bold">Sr.</TableHead>
                          <TableHead className="font-bold">
                            Description
                          </TableHead>
                          <TableHead className="font-bold text-center">
                            HSN/SAC
                          </TableHead>
                          <TableHead className="font-bold text-center">
                            Qty
                          </TableHead>
                          <TableHead className="font-bold text-center">
                            Unit
                          </TableHead>
                          <TableHead className="font-bold text-right">
                            Rate (₹)
                          </TableHead>
                          <TableHead className="font-bold text-right">
                            Amount (₹)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.lineItems?.map(
                          (item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {idx + 1}
                              </TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-center">
                                {item.hsn_sac || item.hsnSac || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.unit || "pcs"}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(item.unitPrice).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {(
                                  Number(item.quantity) * Number(item.unitPrice)
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Tax Summary and Total */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border p-3 rounded">
                      <h4 className="font-semibold mb-2">Bank Details</h4>
                      <div className="text-xs space-y-1">
                        <p>
                          <strong>Bank:</strong> ICICI BANK
                        </p>
                        <p>
                          <strong>A/c No:</strong> 738305000994
                        </p>
                        <p>
                          <strong>Branch & IFSC:</strong> MOSHI & ICIC0007383
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>
                          ₹
                          {Number(
                            selectedInvoice.subtotalAmount
                          ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {Number(selectedInvoice.discountAmount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span className="text-red-600">
                            -₹
                            {Number(
                              selectedInvoice.discountAmount
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      {Number(selectedInvoice.cgstAmount) > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>CGST ({selectedInvoice.cgstRate}%):</span>
                            <span>
                              ₹
                              {Number(
                                selectedInvoice.cgstAmount
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>SGST ({selectedInvoice.sgstRate}%):</span>
                            <span>
                              ₹
                              {Number(
                                selectedInvoice.sgstAmount
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </>
                      )}
                      {Number(selectedInvoice.igstAmount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>IGST ({selectedInvoice.igstRate}%):</span>
                          <span>
                            ₹
                            {Number(selectedInvoice.igstAmount).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>
                      )}
                      {Number(selectedInvoice.packingCharges) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Packing Charges:</span>
                          <span>
                            ₹
                            {Number(
                              selectedInvoice.packingCharges
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      {Number(selectedInvoice.shippingCharges) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping Charges:</span>
                          <span>
                            ₹
                            {Number(
                              selectedInvoice.shippingCharges
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="border-t-2 pt-2 flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-green-700">
                          ₹
                          {Number(selectedInvoice.totalAmount).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      {selectedInvoice.amountInWords && (
                        <div className="text-xs mt-2 p-2 bg-gray-50 rounded">
                          <strong>Amount in Words:</strong>{" "}
                          {selectedInvoice.amountInWords}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Declaration & Notes */}
                  <div className="border-t pt-3 text-xs space-y-2">
                    <div>
                      <strong>Declaration:</strong>
                      <p>
                        We declare that this invoice shows the actual price of
                        the goods described and that all particulars are true
                        and correct.
                      </p>
                    </div>
                    {selectedInvoice.additionalNotes && (
                      <div>
                        <strong>Notes:</strong>
                        <p>{selectedInvoice.additionalNotes}</p>
                      </div>
                    )}
                    <div className="text-right pt-4">
                      <p className="font-semibold">For HOTTIP INDIA POLYMERS</p>
                      <div className="mt-12 mb-2">
                        <p>Authorised Signatory</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    This is a Computer Generated Invoice
                  </p>
                </div>
              ) : (
                <p>Loading...</p>
              )}
            </DrawerContent>
          </Drawer>

          {/* ✅ Send Invoice Confirmation Dialog */}
          <AlertDialog
            open={isSendDialogOpen}
            onOpenChange={setIsSendDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Invoice to Client</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to send this invoice to the client? The
                  invoice status will be updated to "Sent".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmSendInvoice}
                  disabled={sendInvoiceMutation.isPending}
                >
                  {sendInvoiceMutation.isPending
                    ? "Sending..."
                    : "Send Invoice"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
