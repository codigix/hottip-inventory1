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
}

export default function MarketingDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  // Dashboard data
  const { data: dashboardData, isLoading, error } = useQuery<MarketingDashboardData>({
    queryKey: ['/api/marketing/dashboard'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/marketing/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch marketing dashboard metrics');
      return res.json();
    },
  });

  // Recent leads
  const { data: recentLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/leads`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      return res.json();
    },
    select: (data: any[]) => data?.slice(0, 3) || []
  });

  // Upcoming field visits
  const { data: upcomingVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ['/api/field-visits'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/field-visits`);
      if (!res.ok) throw new Error('Failed to fetch visits');
      return res.json();
    },
    select: (data: any[]) => data?.filter(v => v.status === 'scheduled' || v.status === 'confirmed').slice(0, 3) || []
  });

  // Show skeletons if loading
  if (isLoading || leadsLoading || visitsLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }

  // Show error if fetch fails
  if (error) {
    console.error("Dashboard fetch error:", error);
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load dashboard data. Please try again later.</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Metrics calculations
  const totalLeads = dashboardData?.leads?.total || 0;
  const activeTasks = dashboardData?.tasks?.total || 0;
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-light">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.leads?.monthlyNew || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-light">Active Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.tasks?.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-light">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.leads?.converted || 0} leads converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-light">Field Visits Today</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fieldVisitsToday}</div>
            <p className="text-xs text-muted-foreground">
              {todayCompleted} completed, {todayPending} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Leads</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads?.length ? recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between">
                <div>
                  <p className="font-light">{lead.companyName || `${lead.firstName} ${lead.lastName}`}</p>
                  <p className="text-sm text-muted-foreground">{lead.industry || lead.email || 'No info'}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {lead.status === 'qualified' ? <CheckCircle2 className="h-4 w-4 text-green-500"/> : <PhoneCall className="h-4 w-4 text-blue-500"/>}
                  <span className="text-sm">{lead.status}</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-4">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent leads found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Field Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingVisits?.length ? upcomingVisits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between">
                <div>
                  <p className="font-light">{visit.purpose || `Visit ${visit.visitNumber}`}</p>
                  <p className="text-sm text-muted-foreground">{new Date(visit.plannedDate).toLocaleString()}</p>
                </div>
                <span className={`text-sm ${visit.status === 'confirmed' ? 'text-green-600' : 'text-blue-600'}`}>
                  {visit.status || 'Pending'}
                </span>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-4">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming visits scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
