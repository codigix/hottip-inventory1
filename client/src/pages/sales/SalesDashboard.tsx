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
      <div className="p-4">
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
    <div className="p-4 bg-slate-50 min-h-full">
      <div className="mb-8" data-tour="sales-dashboard">
        <h1 className="text-xl  text-slate-800" data-testid="text-sales-dashboard-title">
          Sales Dashboard
        </h1>
        <p className="text-slate-500 text-sm">
          Comprehensive overview of quotations, invoices, and sales performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-none  bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   text-slate-400">Outbound Quotations</CardTitle>
            <FileText className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-800" data-testid="text-outbound-count">{outboundCount}</div>
            <p className="text-xs  text-slate-500 mt-1">
              {pendingOutbound} pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   text-slate-400">Inbound Quotations</CardTitle>
            <FileDown className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-800" data-testid="text-inbound-count">{inboundCount}</div>
            <p className="text-xs  text-slate-500 mt-1">
              {pendingInbound} need review
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   text-slate-400">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-800" data-testid="text-invoice-count">{invoiceCount}</div>
            <p className="text-xs  text-slate-500 mt-1">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   text-slate-400">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-800" data-testid="text-client-count">{clientCount}</div>
            <p className="text-xs  text-slate-500 mt-1">
              Active client base
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="border-none  bg-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   opacity-60">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 opacity-40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl " data-testid="text-total-revenue">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs  opacity-60 mt-1">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   text-slate-400">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-800" data-testid="text-conversion-rate">{conversionRate}%</div>
            <p className="text-xs  text-slate-500 mt-1">
              Quotations to invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-none  bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs   text-slate-400">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-800" data-testid="text-pending-actions">
              {pendingOutbound + pendingInbound}
            </div>
            <p className="text-xs  text-slate-500 mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none  bg-white">
          <CardHeader>
            <CardTitle className="text-lg  text-slate-800">Recent Activity</CardTitle>
            <CardDescription className="text-slate-500">Latest quotations and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm  text-slate-800">New outbound quotation</p>
                  <p className="text-xs text-slate-500 ">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm  text-slate-800">Invoice payment received</p>
                  <p className="text-xs text-slate-500 ">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileDown className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm  text-slate-800">Inbound quotation received</p>
                  <p className="text-xs text-slate-500 ">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none  bg-white">
          <CardHeader>
            <CardTitle className="text-lg  text-slate-800">Performance Summary</CardTitle>
            <CardDescription className="text-slate-500">This month's sales metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm  text-slate-600">Quotations Sent</span>
                <span className="text-sm  text-slate-800">{outboundCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm  text-slate-600">Invoices Generated</span>
                <span className="text-sm  text-slate-800">{invoiceCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm  text-slate-600">Revenue Generated</span>
                <span className="text-sm  text-slate-800">₹{totalRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm  text-slate-600">Active Clients</span>
                <span className="text-sm  text-slate-800">{clientCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}