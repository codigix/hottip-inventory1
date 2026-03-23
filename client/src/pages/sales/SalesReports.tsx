import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, Download, Calendar as CalendarIcon, TrendingUp, FileText, Receipt } from "lucide-react";
import { format } from "date-fns";

export default function SalesReports() {
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("pipeline");

  const { data: outboundQuotations } = useQuery({
    queryKey: ["/outbound-quotations"],
  });

  const { data: inboundQuotations } = useQuery({
    queryKey: ["/inbound-quotations"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/invoices"],
  });

  // Calculate report metrics
  const totalQuotationsSent = (outboundQuotations || []).length;
  const totalInvoicesGenerated = (invoices || []).length;
  const conversionRate = totalQuotationsSent > 0 ? ((totalInvoicesGenerated / totalQuotationsSent) * 100).toFixed(1) : '0';

  const totalRevenue = (invoices || []).reduce((sum: number, invoice: any) => 
    invoice.status === 'paid' ? sum + parseFloat(invoice.totalAmount) : sum, 0
  );

  const pendingRevenue = (invoices || []).reduce((sum: number, invoice: any) => 
    invoice.status === 'sent' ? sum + parseFloat(invoice.balanceAmount) : sum, 0
  );

  return (
    <div className="p-2 space-y-3 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl  text-slate-900 tracking-tight">Sales Reports</h1>
          <p className="text-slate-500 text-sm">Analytics, pipeline reports, and export options</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[160px] bg-white border-slate-200  text-xs h-9">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pipeline">Pipeline Report</SelectItem>
              <SelectItem value="conversion">Conversion Analysis</SelectItem>
              <SelectItem value="client-history">Client History</SelectItem>
              <SelectItem value="vendor-summary">Vendor Summary</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-slate-200  text-xs h-9">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                {dateRange ? format(dateRange, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button className="bg-primary hover:bg-primary text-white  text-xs h-9">
            <Download className="h-3.5 w-3.5 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Quotations Sent", value: totalQuotationsSent, icon: FileText, desc: "Outbound quotations", bg: "bg-slate-100 border-slate-200" },
          { title: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, desc: "Quotations to invoices", bg: "bg-slate-50 border-slate-200" },
          { title: "Revenue Generated", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: Receipt, desc: "From paid invoices", bg: "bg-slate-100 border-slate-200 " },
          { title: "Pending Revenue", value: `₹${pendingRevenue.toLocaleString('en-IN')}`, icon: BarChart3, desc: "Outstanding invoices", bg: "bg-slate-50 border-slate-200" }
        ].map((stat, i) => (
          <Card key={i} className={cn("border ", stat.bg)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs  text-slate-500  ">{stat.title}</p>
                  <h3 className="text-xl  text-slate-900">{stat.value}</h3>
                  <p className="text-xs text-slate-400">{stat.desc}</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-slate-100 ">
                  <stat.icon className="h-4 w-4 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200  overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm  text-slate-800">Pipeline Analysis</CardTitle>
            <CardDescription className="text-xs">Quotation flow and status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[
                { label: "Draft Quotations", count: (outboundQuotations || []).filter((q: any) => q.status === 'draft').length, color: "bg-slate-100 text-slate-600" },
                { label: "Sent Quotations", count: (outboundQuotations || []).filter((q: any) => q.status === 'sent').length, color: "bg-blue-50 text-blue-700" },
                { label: "Pending Approval", count: (outboundQuotations || []).filter((q: any) => q.status === 'pending').length, color: "bg-amber-50 text-amber-700" },
                { label: "Approved Quotations", count: (outboundQuotations || []).filter((q: any) => q.status === 'approved').length, color: "bg-emerald-50 text-emerald-700" },
                { label: "Rejected Quotations", count: (outboundQuotations || []).filter((q: any) => q.status === 'rejected').length, color: "bg-red-50 text-red-700" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                  <Badge variant="outline" className={cn(" shadow-none border-none", item.color)}>
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200  overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm  text-slate-800">Inbound Summary</CardTitle>
            <CardDescription className="text-xs">Quotations received from clients/vendors</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[
                { label: "Received", count: (inboundQuotations || []).filter((q: any) => q.status === 'received').length, color: "bg-slate-100 text-slate-600" },
                { label: "Under Review", count: (inboundQuotations || []).filter((q: any) => q.status === 'under_review').length, color: "bg-blue-50 text-blue-700" },
                { label: "Approved", count: (inboundQuotations || []).filter((q: any) => q.status === 'approved').length, color: "bg-emerald-50 text-emerald-700" },
                { label: "Rejected", count: (inboundQuotations || []).filter((q: any) => q.status === 'rejected').length, color: "bg-red-50 text-red-700" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                  <Badge variant="outline" className={cn(" shadow-none border-none", item.color)}>
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}