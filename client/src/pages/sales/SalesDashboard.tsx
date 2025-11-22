import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  FileDown, 
  Receipt, 
  Users, 
  Building2, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle
} from "lucide-react";

export default function SalesDashboard() {
  const { data: outboundQuotations, isLoading: outboundLoading } = useQuery({
    queryKey: ["/outbound-quotations"],
  });

  const { data: inboundQuotations, isLoading: inboundLoading } = useQuery({
    queryKey: ["/inbound-quotations"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/invoices"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/customers"],
  });

  // Calculate metrics
  const outboundCount = (outboundQuotations || []).length;
  const inboundCount = (inboundQuotations || []).length;
  const invoiceCount = (invoices || []).length;
  const clientCount = (customers || []).length;

  const pendingOutbound = (outboundQuotations || []).filter((q: any) => q.status === 'pending').length;
  const pendingInbound = (inboundQuotations || []).filter((q: any) => q.status === 'received' || q.status === 'under_review').length;
  
  const totalRevenue = (invoices || []).reduce((sum: number, invoice: any) => 
    invoice.status === 'paid' ? sum + parseFloat(invoice.totalAmount) : sum, 0
  );

  const conversionRate = outboundCount > 0 ? ((invoiceCount / outboundCount) * 100).toFixed(1) : '0';

  if (outboundLoading || inboundLoading || invoicesLoading || customersLoading) {
    return (
      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8" data-tour="sales-dashboard">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-sales-dashboard-title">
          Sales Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive overview of quotations, invoices, and sales performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Outbound Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-outbound-count">{outboundCount}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOutbound} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Inbound Quotations</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-inbound-count">{inboundCount}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInbound} need review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-invoice-count">{invoiceCount}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-client-count">{clientCount}</div>
            <p className="text-xs text-muted-foreground">
              Active client base
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Quotations to invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-actions">
              {pendingOutbound + pendingInbound}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest quotations and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-light">New outbound quotation</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-light">Invoice payment received</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <FileDown className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-light">Inbound quotation received</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>This month's sales metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Quotations Sent</span>
                <span className="text-sm font-light">{outboundCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Invoices Generated</span>
                <span className="text-sm font-light">{invoiceCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue Generated</span>
                <span className="text-sm font-light">₹{totalRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Clients</span>
                <span className="text-sm font-light">{clientCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}