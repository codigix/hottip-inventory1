import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Target, 
  Calendar,
  PhoneCall,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface MarketingDashboardData {
  leads: {
    total: number;
    active: number;
    converted: number;
    conversionRate: number;
    monthlyNew: number;
    pendingFollowUps: number;
  };
  visits: {
    total: number;
    completed: number;
    today: number;
    successRate: number;
    weeklyCompleted: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    today: number;
    completionRate: number;
  };
  attendance?: {
    totalEmployees?: number;
    presentToday?: number;
  };
}

export default function MarketingDashboard() {
  const { data: dashboardData, isLoading, error } = useQuery<MarketingDashboardData>({
    queryKey: ['/api/marketing/dashboard']
  });

  const { data: recentLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/leads'],
    select: (data: any[]) => data?.slice(0, 3) || [] // Get first 3 leads for recent activity
  });

  const { data: upcomingVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ['/api/field-visits'],
    select: (data: any[]) => {
      // Get next 3 upcoming visits (scheduled or confirmed status)
      return data?.filter((visit: any) => 
        visit.status === 'scheduled' || visit.status === 'confirmed'
      ).slice(0, 3) || [];
    }
  });

  if (isLoading || leadsLoading || visitsLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Loading skeleton for key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} data-testid={`card-loading-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeleton for recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeleton for performance overview */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of marketing activities, leads, and performance metrics
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load dashboard data. Please try again later.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics with fallback values
  const totalLeads = dashboardData?.leads?.total || 0;
  const activeCampaigns = dashboardData?.tasks?.total || 0; // Using total tasks as campaigns proxy
  const conversionRate = dashboardData?.leads?.conversionRate || 0;
  const fieldVisitsToday = dashboardData?.visits?.today || 0;
  const todayCompleted = dashboardData?.visits?.completed || 0;
  const todayPending = Math.max(0, fieldVisitsToday - todayCompleted);

  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Marketing Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of marketing activities, leads, and performance metrics
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-total-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-leads">
              {totalLeads}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.leads?.monthlyNew || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-campaigns">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-tasks">
              {activeCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.tasks?.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.leads?.converted || 0} leads converted
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-field-visits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Visits Today</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-field-visits-today">
              {fieldVisitsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayCompleted} completed, {todayPending} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-leads">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Leads</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads && recentLeads.length > 0 ? (
              recentLeads.map((lead: any, index: number) => {
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'qualified':
                      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                    case 'follow_up':
                      return <PhoneCall className="h-4 w-4 text-blue-500" />;
                    case 'contacted':
                      return <PhoneCall className="h-4 w-4 text-blue-500" />;
                    case 'new':
                    default:
                      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
                  }
                };

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case 'qualified':
                      return 'Qualified';
                    case 'follow_up':
                      return 'Follow-up';
                    case 'contacted':
                      return 'Contacted';
                    case 'new':
                    default:
                      return 'New';
                  }
                };

                return (
                  <div key={lead.id || index} className="flex items-center justify-between" data-testid={`lead-${index}`}>
                    <div>
                      <p className="font-medium">
                        {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.industry || lead.email || 'No company info'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(lead.status)}
                      <span className="text-sm">{getStatusLabel(lead.status)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent leads found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-visits">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Field Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingVisits && upcomingVisits.length > 0 ? (
              upcomingVisits.map((visit: any, index: number) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'confirmed':
                      return 'text-green-600 font-medium';
                    case 'scheduled':
                      return 'text-blue-600 font-medium';
                    default:
                      return 'text-gray-600 font-medium';
                  }
                };

                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  
                  if (date.toDateString() === today.toDateString()) {
                    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  } else if (date.toDateString() === tomorrow.toDateString()) {
                    return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  } else {
                    return date.toLocaleDateString([], { 
                      weekday: 'long', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                  }
                };

                return (
                  <div key={visit.id || index} className="flex items-center justify-between" data-testid={`visit-${index}`}>
                    <div>
                      <p className="font-medium">
                        {visit.purpose || `Visit ${visit.visitNumber}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(visit.plannedDate)}
                      </p>
                    </div>
                    <span className={`text-sm ${getStatusColor(visit.status)}`}>
                      {visit.status?.charAt(0).toUpperCase() + visit.status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming visits scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card data-testid="card-performance-overview">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600" data-testid="performance-total-leads">
                {dashboardData?.leads?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600" data-testid="performance-converted">
                {dashboardData?.leads?.converted || 0}
              </div>
              <p className="text-sm text-muted-foreground">Converted</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600" data-testid="performance-field-visits">
                {dashboardData?.visits?.completed || 0}
              </div>
              <p className="text-sm text-muted-foreground">Field Visits Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}