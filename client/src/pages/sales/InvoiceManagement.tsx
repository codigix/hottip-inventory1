// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/ui/data-table";
// import { Plus, Receipt, Eye, Download, Send } from "lucide-react";

// export default function InvoiceManagement() {
//   const { data: invoices, isLoading } = useQuery({
//     queryKey: ["/invoices"],
//   });

//   const columns = [
//     {
//       key: 'invoiceNumber',
//       header: 'Invoice #',
//       cell: (invoice: any) => (
//         <div className="font-light">{invoice.invoiceNumber}</div>
//       ),
//     },
//     {
//       key: 'customer',
//       header: 'Client',
//       cell: (invoice: any) => (
//         <div>
//           <div className="font-light">{invoice.customer?.name || 'N/A'}</div>
//           <div className="text-xs text-muted-foreground">{invoice.customer?.gstNumber || ''}</div>
//         </div>
//       ),
//     },
//     {
//       key: 'invoiceDate',
//       header: 'Date',
//       cell: (invoice: any) => new Date(invoice.invoiceDate).toLocaleDateString(),
//     },
//     {
//       key: 'totalAmount',
//       header: 'Total Amount',
//       cell: (invoice: any) => `₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}`,
//     },
//     {
//       key: 'balanceAmount',
//       header: 'Balance',
//       cell: (invoice: any) => `₹${parseFloat(invoice.balanceAmount).toLocaleString('en-IN')}`,
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       cell: (invoice: any) => {
//         const statusColors = {
//           draft: 'bg-gray-100 text-gray-800',
//           sent: 'bg-blue-100 text-blue-800',
//           paid: 'bg-green-100 text-green-800',
//           overdue: 'bg-red-100 text-red-800',
//           cancelled: 'bg-gray-100 text-gray-800'
//         };
//         return (
//           <Badge className={statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft}>
//             {invoice.status?.toUpperCase() || 'DRAFT'}
//           </Badge>
//         );
//       },
//     },
//     {
//       key: 'actions',
//       header: 'Actions',
//       cell: (invoice: any) => (
//         <div className="flex items-center space-x-2">
//           <Button size="sm" variant="ghost" data-testid={`button-view-invoice-${invoice.id}`}>
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Button size="sm" variant="ghost" data-testid={`button-download-invoice-${invoice.id}`}>
//             <Download className="h-4 w-4" />
//           </Button>
//           <Button size="sm" variant="ghost" data-testid={`button-send-invoice-${invoice.id}`}>
//             <Send className="h-4 w-4" />
//           </Button>
//         </div>
//       ),
//     }
//   ];

//   return (
//     <div className="p-8">
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight" data-testid="text-invoice-management-title">
//             Invoice Management
//           </h1>
//           <p className="text-muted-foreground">
//             GST invoices with tax breakdowns and PDF downloads
//           </p>
//         </div>
//         <Button data-testid="button-new-invoice">
//           <Plus className="h-4 w-4 mr-2" />
//           New Invoice
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2">
//             <Receipt className="h-5 w-5" />
//             <span>All Invoices</span>
//           </CardTitle>
//           <CardDescription>
//             GST compliant invoices with CGST, SGST, IGST breakdowns
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <DataTable
//             data={(invoices || [])}
//             columns={columns}
//             searchable={true}
//             searchKey="invoiceNumber"
//           />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }



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
import { Plus, Receipt, Eye, Download, Send } from "lucide-react";
import {
  insertInvoiceSchema,
  type InsertInvoice,
  type Customer,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function InvoiceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
            data-testid={`button-view-invoice-${invoice.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-download-invoice-${invoice.id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
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
