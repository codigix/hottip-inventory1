import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users,
  MapPin,
  TrendingUp,
  Target,
  Calendar,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
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
  // Dashboard data query
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<MarketingDashboardData>({
    queryKey: ["/api/marketing"],
    queryFn: () => apiRequest("/api/marketing"),
  });

  // Recent leads
  const { data: recentLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: () => apiRequest("/api/leads"),
    select: (data: any[]) => data?.slice(0, 3) || [],
  });

  // Upcoming field visits
  const { data: upcomingVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ["/api/field-visits"],
    queryFn: () => apiRequest("/api/field-visits"),
    select: (data: any[]) => {
      return (
        data
          ?.filter(
            (visit: any) =>
              visit.status === "scheduled" || visit.status === "confirmed"
          )
          .slice(0, 3) || []
      );
    },
  });

  // Show loading skeleton while any query is loading
  if (isLoading || leadsLoading || visitsLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
        {/* Add more skeletons as needed */}
      </div>
    );
  }

  // Log errors for debugging
  if (error) {
    console.error("Dashboard fetch error:", error);
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load dashboard data. Please try again later.</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const totalLeads = dashboardData?.leads?.total || 0;
  const activeTasks = dashboardData?.tasks?.total || 0;
  const conversionRate = dashboardData?.leads?.conversionRate || 0;
  const fieldVisitsToday = dashboardData?.visits?.today || 0;
  const todayCompleted = dashboardData?.visits?.completed || 0;
  const todayPending = Math.max(0, fieldVisitsToday - todayCompleted);

  return (
    <div className="p-4 space-y-2">
      <div className="mb-8">
        <h1 className="text-xl  text-foreground " data-tour="marketing-header">
          Marketing Dashboard
        </h1>
        <p className="text-gray-500 text-xs">
          Overview of marketing activities, leads, and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="marketing-dashboard">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-tight">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalLeads}</div>
            <p className="text-[10px] text-slate-400 mt-1">
              {dashboardData?.leads?.monthlyNew || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-tight">Active Tasks</CardTitle>
            <Target className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeTasks}</div>
            <p className="text-[10px] text-slate-400 mt-1">
              {dashboardData?.tasks?.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-tight">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {dashboardData?.leads?.converted || 0} leads converted
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-tight">
              Field Visits Today
            </CardTitle>
            <MapPin className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{fieldVisitsToday}</div>
            <p className="text-[10px] text-slate-400 mt-1">
              {todayCompleted} completed, {todayPending} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads & Upcoming Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="flex items-center space-x-2 text-slate-800">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold">Recent Leads</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads && recentLeads.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentLeads.map((lead: any, index: number) => (
                  <div
                    key={lead.id || index}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 text-sm">
                          {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                        </p>
                        {lead.status === "converted" && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{lead.status}</span>
                          </div>
                        )}
                        {lead.status === "new" && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                            <PhoneCall className="h-3 w-3" />
                            <span>{lead.status}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {lead.email || lead.phone || "No info"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No recent leads found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Visits */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="flex items-center space-x-2 text-slate-800">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold">Upcoming Field Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingVisits && upcomingVisits.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {upcomingVisits.map((visit: any, index: number) => (
                  <div
                    key={visit.id || index}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <p className="font-medium text-slate-900 text-sm">
                        {visit.purpose || `Visit ${visit.visitNumber}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(visit.plannedDate).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-bold",
                        visit.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      )}
                    >
                      {visit.status || "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No upcoming visits scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
