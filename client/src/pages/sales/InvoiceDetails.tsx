import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Mail, 
  Building2, 
  User, 
  Calendar,
  CreditCard,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";

export default function InvoiceDetails() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: invoice, isLoading } = useQuery<any>({
    queryKey: [`/api/invoices/${id}`],
    select: (data) => data.invoice,
  });

  const handleDownload = async () => {
    try {
      const blob = await apiRequest("GET", `/api/invoices/${id}/pdf`, undefined, { responseType: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Invoice Not Found</h2>
        <Link href="/sales/invoices">
          <Button variant="link">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    sent: "bg-blue-50 text-blue-700 border-blue-100",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
    overdue: "bg-red-50 text-red-700 border-red-100",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200 opacity-50",
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sales/invoices">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs shadow-none px-2", statusColors[invoice.status] || statusColors.draft)}>
                {invoice.status?.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500">
                Created on {format(new Date(invoice.invoiceDate), "PPP")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-none">
            <Mail className="h-4 w-4 mr-2" />
            Send to Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Invoice Card */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardContent className="p-8">
            {/* Business Info */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
                  <h2 className="text-xl font-bold text-primary">HOTTIP INDIA POLYMERS</h2>
                </div>
                <p className="text-sm text-slate-500 max-w-xs whitespace-pre-line">
                  123, Industrial Area, Phase-II,
                  Pune - 411 001, Maharashtra
                </p>
                <p className="text-sm font-medium mt-1">GSTIN: 27AABCH1234F1Z5</p>
              </div>
              <div className="text-right">
                <h3 className="text-4xl font-black text-slate-100 uppercase tracking-tighter mb-2">Invoice</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="text-slate-400">Number:</span> <span className="font-bold">{invoice.invoiceNumber}</span></p>
                  <p className="text-sm"><span className="text-slate-400">Date:</span> <span>{format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}</span></p>
                  <p className="text-sm"><span className="text-slate-400">Due Date:</span> <span>{format(new Date(invoice.dueDate), "dd/MM/yyyy")}</span></p>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Bill/Ship To */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h4>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{invoice.customer?.name}</p>
                  <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
                    {invoice.billingAddress || invoice.customer?.address}
                  </p>
                  {invoice.billingGstNumber && (
                    <p className="text-sm font-medium mt-2">GSTIN: {invoice.billingGstNumber}</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ship To</h4>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
                    {invoice.shippingAddress || invoice.billingAddress || invoice.customer?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-12 border rounded-lg overflow-hidden border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Description</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">HSN/SAC</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Qty</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Unit Price</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item: any) => (
                    <TableRow key={item.id} className="border-b border-slate-100">
                      <TableCell className="py-4">
                        <p className="font-medium text-slate-800">{item.description}</p>
                      </TableCell>
                      <TableCell className="text-center text-slate-500 font-mono text-xs italic">{item.hsnSac || "-"}</TableCell>
                      <TableCell className="text-center text-slate-700">{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-right text-slate-700">₹{Number(item.unitPrice).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">₹{Number(item.amount).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">₹{Number(invoice.subtotalAmount).toLocaleString("en-IN")}</span>
                </div>
                
                {Number(invoice.cgstAmount) > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>CGST ({invoice.cgstRate}%)</span>
                    <span className="font-medium text-slate-900">₹{Number(invoice.cgstAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                
                {Number(invoice.sgstAmount) > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>SGST ({invoice.sgstRate}%)</span>
                    <span className="font-medium text-slate-900">₹{Number(invoice.sgstAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}

                {Number(invoice.igstAmount) > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>IGST ({invoice.igstRate}%)</span>
                    <span className="font-medium text-slate-900">₹{Number(invoice.igstAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}

                {Number(invoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600 italic">
                    <span>Discount</span>
                    <span>-₹{Number(invoice.discountAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <Separator className="my-2" />
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-bold text-slate-900">Grand Total</span>
                  <span className="text-2xl font-black text-primary">₹{Number(invoice.totalAmount).toLocaleString("en-IN")}</span>
                </div>
                
                <div className="pt-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest text-right">Amount in Words</p>
                  <p className="text-xs text-slate-500 text-right italic mt-1">{invoice.amountInWords}</p>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="mt-16 pt-8 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Terms</h4>
                    <p className="text-sm text-slate-600">{invoice.paymentTerms || "Standard Net 30 days"}</p>
                  </div>
                  {invoice.notes && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</h4>
                      <p className="text-sm text-slate-600 italic leading-relaxed">{invoice.notes}</p>
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col justify-end items-end">
                  <div className="w-48 border-b-2 border-slate-200 h-16 mb-2"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorised Signatory</p>
                  <p className="text-sm font-bold text-primary mt-1">For HOTTIP INDIA POLYMERS</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Due</span>
                <span className="font-bold text-slate-900">₹{Number(invoice.totalAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Paid Amount</span>
                <span className="font-bold text-emerald-600">₹{Number(invoice.paidAmount || 0).toLocaleString("en-IN")}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-900">Balance</span>
                <span className={cn(
                  "text-lg font-black",
                  Number(invoice.balanceAmount) > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  ₹{Number(invoice.balanceAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Logistics & Supply
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase">Place of Supply</p>
                <p className="font-medium">{invoice.placeOfSupply || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase">Transporter</p>
                <p className="font-medium">{invoice.transporterName || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase">E-Way Bill</p>
                <p className="font-medium font-mono text-xs">{invoice.ewayBillNumber || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
