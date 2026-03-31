import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  X, 
  Mail, 
  Phone, 
  User, 
  Calculator,
  FileText,
  Calendar,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { type OutboundQuotation, type Customer } from "@shared/schema";

interface EstimationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
}

export default function EstimationDetailsDialog({
  open,
  onOpenChange,
  quotationId,
}: EstimationDetailsDialogProps) {
  const { data: quotation, isLoading: isLoadingQuotation } = useQuery<OutboundQuotation>({
    queryKey: [`/api/outbound-quotations/${quotationId}`],
    queryFn: () => apiRequest("GET", `/api/outbound-quotations/${quotationId}`),
    enabled: open && !!quotationId,
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: [`/api/customers/${quotation?.customerId}`],
    queryFn: () => apiRequest("GET", `/api/customers/${quotation?.customerId}`),
    enabled: !!quotation?.customerId,
  });

  const { data: history = [] } = useQuery<OutboundQuotation[]>({
    queryKey: [`/api/outbound-quotations?customerId=${quotation?.customerId}`],
    enabled: !!quotation?.customerId,
    queryFn: () => apiRequest("GET", `/api/outbound-quotations?customerId=${quotation?.customerId}`),
  });

  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime()
  );

  const handleDownloadPDF = async (id?: string, number?: string) => {
    const targetId = id || quotation?.id;
    const targetNumber = number || quotation?.quotationNumber;
    if (!targetId) return;
    try {
      const response = await apiRequest(
        "GET",
        `/outbound-quotations/${targetId}/pdf`,
        undefined,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Quotation_${targetNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  if (isLoadingQuotation || !quotation) return null;

  const subtotal = parseFloat(String(quotation.subtotalAmount || 0));
  const discount = parseFloat(String(quotation.discountAmount || 0));
  const tax = parseFloat(String(quotation.taxAmount || 0));
  const total = parseFloat(String(quotation.totalAmount || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl">
        {/* Custom Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Quotation</h2>
            <span className="text-xl font-bold text-red-500">#{quotation.quotationNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => handleDownloadPDF()}
              className="bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 h-9 flex items-center gap-2 shadow-sm"
            >
              Download <ChevronDown className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8 bg-slate-50/30">
          {/* Estimation Details Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Estimation Details</h3>
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 uppercase text-[10px] font-bold px-2">
                {quotation.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimate Date</p>
                <p className="text-sm font-bold text-slate-700">{format(new Date(quotation.quotationDate), "dd MMM yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</p>
                <p className="text-sm font-bold text-slate-700">{quotation.validUntil ? format(new Date(quotation.validUntil), "dd MMM yyyy") : "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Client Personal Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client Personal Info</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                  <User className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{customer?.name || "N/A"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Client Name</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{customer?.email || "N/A"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <Phone className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{customer?.phone || "N/A"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                </div>
              </div>
            </div>
          </div>

          {/* About Business Section */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">About Business</h3>
            <div className="bg-white border p-3 rounded-lg text-xs italic text-slate-600 italic">
              Client: {customer?.company || customer?.name}
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Job Description</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Discount</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(quotation.quotationItems as any[] || []).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">{item.partName || item.itemName || "Item"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.partDescription}</p>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-700">{item.qty || item.quantity}</td>
                    <td className="px-4 py-4 text-right font-medium text-slate-700">₹{(parseFloat(item.unitPrice) || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right font-medium text-slate-700">₹0.00</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-800">₹{(parseFloat(item.amount) || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pr-4">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sub Total</span>
                <span className="text-sm font-bold text-slate-700">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discount (0.00%)</span>
                <span className="text-sm font-bold text-slate-700">-₹{discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax (10.00%)</span>
                <span className="text-sm font-bold text-slate-700">₹{tax.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-slate-800">Total Amount</span>
                <span className="text-2xl font-black text-red-500">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions Section */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms and Conditions</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              {quotation.termsConditions || "The products/services listed in this invoice will be delivered/provided as per the specifications and schedule detailed in the invoice or as agreed upon by both parties in previous communications."}
            </p>
          </div>

          {/* Version History Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold text-slate-800">Version History</h3>
            <div className="space-y-3">
              {sortedHistory.map((v, i) => (
                <div key={v.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs",
                      i === 0 ? "bg-red-50 text-red-500 border border-red-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                    )}>
                      V{sortedHistory.length - i}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {v.status === 'draft' ? 'Draft Quotation' : 'Revised Quotation'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        {format(new Date(v.quotationDate), "dd/MM/yyyy")}
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          v.status === 'draft' ? "bg-orange-500" : "bg-blue-500"
                        )} />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-slate-700">₹{parseFloat(String(v.totalAmount)).toLocaleString()}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors"
                      onClick={() => handleDownloadPDF(v.id, v.quotationNumber)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
