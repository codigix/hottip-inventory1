import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Plus, Eye, Download, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceManagement() {
  const [, setLocation] = useLocation();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/invoices"],
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

  // Tour control functions
  useEffect(() => {
    window.tourControls = {
      openCreateInvoice: () => setLocation("/sales/invoices/new"),
      closeCreateInvoice: () => setLocation("/sales/invoices"),
      openViewInvoice: () => {
        if (invoices && invoices.length > 0) {
          handleViewInvoice(invoices[0].id);
        }
      },
      closeViewInvoice: () => setIsViewOpen(false),
      openSendDialog: () => {
        if (invoices && invoices.length > 0) {
          handleSendInvoice(invoices[0].id);
        }
      },
      closeSendDialog: () => setIsSendDialogOpen(false),
      closeAll: () => {
        setIsViewOpen(false);
        setIsSendDialogOpen(false);
      },
    };

    return () => {
      if (window.tourControls) {
        delete window.tourControls;
      }
    };
  }, [invoices, setLocation]);

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
      cell: (invoice: any, index: number) => (
        <div className="flex items-center space-x-2" data-tour={index === 0 ? "sales-invoice-actions" : undefined}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewInvoice(invoice.id)}
            data-testid={`button-view-invoice-${invoice.id}`}
            data-tour={index === 0 ? "sales-view-invoice" : undefined}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadInvoice(invoice.id)}
            data-testid={`button-download-invoice-${invoice.id}`}
            data-tour={index === 0 ? "sales-download-invoice" : undefined}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendInvoice(invoice.id)}
            data-testid={`button-send-invoice-${invoice.id}`}
            data-tour={index === 0 ? "sales-send-invoice" : undefined}
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
            data-tour="sales-invoice-header"
          >
            Invoice Management
          </h1>
          <p className="text-muted-foreground">
            GST invoices with tax breakdowns and PDF downloads
          </p>
        </div>
        <Link href="/sales/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-tour="sales-invoice-list-title">Invoices</CardTitle>
          <CardDescription data-tour="sales-invoice-list-description">
            List of all generated GST invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={invoices || []}
            loading={isLoading}
            searchPlaceholder="Search invoices..."
            data-tour="sales-invoice-table"
          />

          {/* View Invoice Modal */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-tour="sales-invoice-view-dialog">
              <DialogHeader className="sticky top-0 bg-background border-b z-10 p-4">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <DialogTitle className="text-2xl" data-tour="sales-view-invoice-title">
                      Invoice Details: {selectedInvoice?.invoiceNumber}
                    </DialogTitle>
                    <DialogDescription data-tour="sales-view-invoice-description">
                      Technical and financial details of the generated invoice.
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                      data-tour="sales-view-invoice-status"
                    >
                      {selectedInvoice?.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              {selectedInvoice ? (
                <div className="p-6 space-y-6" data-tour="sales-invoice-view-content">
                  <div className="grid grid-cols-2 gap-8 border-b pb-6">
                    <div className="space-y-4">
                      <div data-tour="sales-view-billing-from">
                        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">From</h4>
                        <p className="font-bold text-lg text-primary">HOTTIP INDIA POLYMERS</p>
                        <p className="text-sm text-gray-500 whitespace-pre-line">
                          123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra
                        </p>
                        <p className="text-sm font-medium mt-1">GSTIN: 27AABCH1234F1Z5</p>
                      </div>
                      <div data-tour="sales-view-billing-to">
                        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Bill To</h4>
                        <p className="font-bold text-lg text-primary">{selectedInvoice.customer?.name}</p>
                        <p className="text-sm text-gray-500 whitespace-pre-line">
                          {selectedInvoice.billingAddress || selectedInvoice.customer?.address}
                        </p>
                        <p className="text-sm font-medium mt-1">GSTIN: {selectedInvoice.billingGstNumber || selectedInvoice.customer?.gstNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-right">
                      <div className="bg-gray-50 p-4 rounded-lg inline-block text-left min-w-[200px]" data-tour="sales-view-invoice-info">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <span className="text-xs text-gray-500">Invoice Date:</span>
                          <span className="text-xs font-bold text-right">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">Due Date:</span>
                          <span className="text-xs font-bold text-right">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">Place of Supply:</span>
                          <span className="text-xs font-bold text-right">{selectedInvoice.placeOfSupply || "N/A"}</span>
                        </div>
                      </div>
                      <div className="pt-2" data-tour="sales-view-shipping-info">
                        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Ship To</h4>
                        <p className="text-sm text-gray-500 whitespace-pre-line">
                          {selectedInvoice.shippingAddress || selectedInvoice.billingAddress || selectedInvoice.customer?.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8" data-tour="sales-view-items-table">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-[40%] font-bold text-gray-700">Description</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">HSN/SAC</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">Qty</TableHead>
                          <TableHead className="font-bold text-gray-700 text-right">Unit Price</TableHead>
                          <TableHead className="font-bold text-gray-700 text-right">Tax (%)</TableHead>
                          <TableHead className="font-bold text-gray-700 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-center text-gray-500">{item.hsnSac || "-"}</TableCell>
                            <TableCell className="text-center">{item.quantity} {item.unit}</TableCell>
                            <TableCell className="text-right">₹{Number(item.unitPrice).toLocaleString("en-IN")}</TableCell>
                            <TableCell className="text-right">
                              {item.igstRate > 0 ? `IGST ${item.igstRate}%` : 
                               (item.cgstRate + item.sgstRate) > 0 ? `CGST+SGST ${item.cgstRate+item.sgstRate}%` : "0%"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">₹{Number(item.amount).toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end pt-6" data-tour="sales-view-financial-summary">
                    <div className="w-[350px] space-y-3 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{Number(selectedInvoice.subtotalAmount).toLocaleString("en-IN")}</span>
                      </div>
                      {Number(selectedInvoice.cgstAmount) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>CGST ({selectedInvoice.cgstRate}%):</span>
                          <span className="font-medium">₹{Number(selectedInvoice.cgstAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {Number(selectedInvoice.sgstAmount) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>SGST ({selectedInvoice.sgstRate}%):</span>
                          <span className="font-medium">₹{Number(selectedInvoice.sgstAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {Number(selectedInvoice.igstAmount) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>IGST ({selectedInvoice.igstRate}%):</span>
                          <span className="font-medium">₹{Number(selectedInvoice.igstAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {Number(selectedInvoice.discountAmount) > 0 && (
                        <div className="flex justify-between text-sm text-red-600 font-medium italic">
                          <span>Discount:</span>
                          <span>-₹{Number(selectedInvoice.discountAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-3 flex justify-between font-bold text-xl text-primary" data-tour="sales-total-amount-display">
                        <span>Grand Total:</span>
                        <span>₹{Number(selectedInvoice.totalAmount).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-8 mt-8 grid grid-cols-2 gap-8 text-sm" data-tour="sales-view-footer">
                    <div>
                      <h4 className="font-bold text-gray-700 uppercase text-xs mb-2">Payment Terms</h4>
                      <p className="text-gray-500">{selectedInvoice.paymentTerms || "Standard Net 30 days"}</p>
                      {selectedInvoice.notes && (
                        <div className="mt-4">
                          <h4 className="font-bold text-gray-700 uppercase text-xs mb-1">Notes</h4>
                          <p className="text-gray-500 italic">{selectedInvoice.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="h-20 flex items-end justify-end mb-2">
                        <div className="border-b-2 border-dotted border-gray-300 w-48 text-center pb-2 text-xs text-gray-400">
                          Authorised Signatory
                        </div>
                      </div>
                      <p className="font-bold text-primary uppercase text-xs">For HOTTIP INDIA POLYMERS</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Send Invoice Confirmation Dialog */}
          <AlertDialog
            open={isSendDialogOpen}
            onOpenChange={setIsSendDialogOpen}
          >
            <AlertDialogContent data-tour="sales-send-invoice-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle data-tour="sales-send-dialog-title">Send Invoice to Client</AlertDialogTitle>
                <AlertDialogDescription data-tour="sales-send-dialog-description">
                  Are you sure you want to send this invoice to the client? The
                  invoice status will be updated to "Sent".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter data-tour="sales-send-dialog-actions">
                <AlertDialogCancel data-tour="sales-send-cancel">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmSendInvoice}
                  disabled={sendInvoiceMutation.isPending}
                  data-tour="sales-send-confirm"
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
