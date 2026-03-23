import { cn } from "@/lib/utils";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      sortable: true,
      cell: (invoice: any) => (
        <div className=" text-slate-800">{invoice.invoiceNumber}</div>
      ),
    },
    {
      key: "customer.name",
      header: "Client",
      sortable: true,
      cell: (invoice: any) => (
        <div>
          <div className="font-medium text-slate-700">{invoice.customer?.name || "N/A"}</div>
          <div className="text-xs text-slate-400   ">
            {invoice.customer?.gstNumber || "GST NOT PROVIDED"}
          </div>
        </div>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      sortable: true,
      cell: (invoice: any) => (
        <div className="text-xs text-slate-600">
          {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Value",
      sortable: true,
      cell: (invoice: any) => (
        <span className="text-xs  text-slate-800">
          ₹{parseFloat(invoice.totalAmount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "balanceAmount",
      header: "Balance",
      sortable: true,
      cell: (invoice: any) => (
        <span className={cn(
          "text-xs ",
          parseFloat(invoice.balanceAmount) > 0 ? "text-red-600" : "text-emerald-600"
        )}>
          ₹{parseFloat(invoice.balanceAmount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (invoice: any) => {
        const statusColors: Record<string, string> = {
          draft: "bg-slate-100 text-slate-600 border-slate-200",
          sent: "bg-blue-50 text-blue-700 border-blue-100",
          paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
          overdue: "bg-red-50 text-red-700 border-red-100",
          cancelled: "bg-slate-100 text-slate-600 border-slate-200 opacity-50",
        };
        return (
          <Badge
            variant="outline"
            className={cn(
              "text-xs   py-0 h-5 shadow-none",
              statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft
            )}
          >
            {invoice.status || "DRAFT"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (invoice: any) => (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => handleViewInvoice(invoice.id)}
            data-testid={`button-view-invoice-${invoice.id}`}
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => handleDownloadInvoice(invoice.id)}
            data-testid={`button-download-invoice-${invoice.id}`}
          >
            <Download className="h-4 w-4 text-slate-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-blue-600"
            onClick={() => handleSendInvoice(invoice.id)}
            data-testid={`button-send-invoice-${invoice.id}`}
          >
            <Send className="h-4 w-4 text-blue-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 space-y-3 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 tracking-tight">Invoice Management</h1>
          <p className="text-slate-500 text-sm">GST invoices with tax breakdowns and PDF downloads</p>
        </div>
        <Link href="/sales/invoices/new">
          <Button className="bg-primary hover:bg-primary text-white  transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200  overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={invoices || []}
            isLoading={isLoading}
            searchKey="invoiceNumber"
            searchPlaceholder="Search invoices..."
          />

          {/* View Invoice Modal */}
          <Dialog  open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-tour="sales-invoice-view-dialog">
              <DialogHeader className="sticky top-0 border-b z-10 p-4 bg-white">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <DialogTitle className="text-xl" data-tour="sales-view-invoice-title">
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
                <div className="p-2 space-y-3" data-tour="sales-invoice-view-content">
                  <div className="grid grid-cols-2 gap-4 border-b pb-6">
                    <div className="space-y-4">
                      <div data-tour="sales-view-billing-from">
                        <h4 className="text-xs   text-gray-400 ">From</h4>
                        <p className=" text-sm text-primary">HOTTIP INDIA POLYMERS</p>
                        <p className="text-xs text-gray-500 whitespace-pre-line">
                          123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra
                        </p>
                        <p className="text-xs  mt-1">GSTIN: 27AABCH1234F1Z5</p>
                      </div>
                      <div data-tour="sales-view-billing-to">
                        <h4 className="text-xs   text-gray-400 ">Bill To</h4>
                        <p className=" text-lg text-primary">{selectedInvoice.customer?.name}</p>
                        <p className="text-sm text-gray-500 whitespace-pre-line">
                          {selectedInvoice.billingAddress || selectedInvoice.customer?.address}
                        </p>
                        <p className="text-sm  mt-1">GSTIN: {selectedInvoice.billingGstNumber || selectedInvoice.customer?.gstNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-right">
                      <div className="bg-gray-50 p-4 rounded-lg inline-block text-left min-w-[200px]" data-tour="sales-view-invoice-info">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <span className="text-xs text-gray-500">Invoice Date:</span>
                          <span className="text-xs  text-right">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">Due Date:</span>
                          <span className="text-xs  text-right">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">Place of Supply:</span>
                          <span className="text-xs  text-right">{selectedInvoice.placeOfSupply || "N/A"}</span>
                        </div>
                      </div>
                      <div className="pt-2" data-tour="sales-view-shipping-info">
                        <h4 className="text-xs   text-gray-400 ">Ship To</h4>
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
                          <TableHead className="w-[40%]  text-gray-700">Description</TableHead>
                          <TableHead className=" text-gray-700 text-center">HSN/SAC</TableHead>
                          <TableHead className=" text-gray-700 text-center">Qty</TableHead>
                          <TableHead className=" text-gray-700 text-right">Unit Price</TableHead>
                          <TableHead className=" text-gray-700 text-right">Tax (%)</TableHead>
                          <TableHead className=" text-gray-700 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="">{item.description}</TableCell>
                            <TableCell className="text-center text-xs text-gray-500">{item.hsnSac || "-"}</TableCell>
                            <TableCell className="text-center text-xs">{item.quantity} {item.unit}</TableCell>
                            <TableCell className="text-right text-xs">₹{Number(item.unitPrice).toLocaleString("en-IN")}</TableCell>
                            <TableCell className="text-right text-xs">
                              {item.igstRate > 0 ? `IGST ${item.igstRate}%` : 
                               (item.cgstRate + item.sgstRate) > 0 ? `CGST+SGST ${item.cgstRate+item.sgstRate}%` : "0%"}
                            </TableCell>
                            <TableCell className="text-right ">₹{Number(item.amount).toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end " data-tour="sales-view-financial-summary">
                    <div className="w-[350px] space-y-3 bg-gray-50 p-2 rounded border border-gray-100 ">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="">₹{Number(selectedInvoice.subtotalAmount).toLocaleString("en-IN")}</span>
                      </div>
                      {Number(selectedInvoice.cgstAmount) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>CGST ({selectedInvoice.cgstRate}%):</span>
                          <span className="">₹{Number(selectedInvoice.cgstAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {Number(selectedInvoice.sgstAmount) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>SGST ({selectedInvoice.sgstRate}%):</span>
                          <span className="">₹{Number(selectedInvoice.sgstAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {Number(selectedInvoice.igstAmount) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>IGST ({selectedInvoice.igstRate}%):</span>
                          <span className="">₹{Number(selectedInvoice.igstAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {Number(selectedInvoice.discountAmount) > 0 && (
                        <div className="flex justify-between text-sm text-red-600  italic">
                          <span>Discount:</span>
                          <span>-₹{Number(selectedInvoice.discountAmount).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-3 flex justify-between  text-xl text-primary" data-tour="sales-total-amount-display">
                        <span className="text-sm">Grand Total:</span>
                        <span className="text-sm">₹{Number(selectedInvoice.totalAmount).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-8 mt-8 grid grid-cols-2 gap-4 text-sm" data-tour="sales-view-footer">
                    <div>
                      <h4 className=" text-gray-700  text-xs mb-2">Payment Terms</h4>
                      <p className="text-gray-500">{selectedInvoice.paymentTerms || "Standard Net 30 days"}</p>
                      {selectedInvoice.notes && (
                        <div className="mt-4">
                          <h4 className=" text-gray-700  text-xs mb-1">Notes</h4>
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
                      <p className=" text-primary  text-xs">For HOTTIP INDIA POLYMERS</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-20">
                  <div className="animate-spin rounded h-8 w-8 border-b-2 border-primary"></div>
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
