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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-sales-reports-title">
            Sales Reports
          </h1>
          <p className="text-muted-foreground">
            Analytics, pipeline reports, and export options
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]" data-testid="select-report-type">
              <SelectValue placeholder="Select report type" />
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
              <Button variant="outline" data-testid="button-date-range">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange ? format(dateRange, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Quotations Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-quotations-sent">{totalQuotationsSent}</div>
            <p className="text-xs text-muted-foreground">
              Outbound quotations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate-report">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Quotations to invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Revenue Generated</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue-generated">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Pending Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-revenue">
              ₹{pendingRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Analysis</CardTitle>
            <CardDescription>Quotation flow and status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Draft Quotations</span>
                <Badge variant="secondary">
                  {(outboundQuotations || []).filter((q: any) => q.status === 'draft').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Sent Quotations</span>
                <Badge variant="secondary">
                  {(outboundQuotations || []).filter((q: any) => q.status === 'sent').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Approval</span>
                <Badge variant="secondary">
                  {(outboundQuotations || []).filter((q: any) => q.status === 'pending').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Approved Quotations</span>
                <Badge variant="secondary">
                  {(outboundQuotations || []).filter((q: any) => q.status === 'approved').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rejected Quotations</span>
                <Badge variant="secondary">
                  {(outboundQuotations || []).filter((q: any) => q.status === 'rejected').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inbound Summary</CardTitle>
            <CardDescription>Quotations received from clients/vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Received</span>
                <Badge variant="secondary">
                  {(inboundQuotations || []).filter((q: any) => q.status === 'received').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Under Review</span>
                <Badge variant="secondary">
                  {(inboundQuotations || []).filter((q: any) => q.status === 'under_review').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Approved</span>
                <Badge variant="secondary">
                  {(inboundQuotations || []).filter((q: any) => q.status === 'approved').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rejected</span>
                <Badge variant="secondary">
                  {(inboundQuotations || []).filter((q: any) => q.status === 'rejected').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}