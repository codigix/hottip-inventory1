import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  FunnelChart, Funnel, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, MapPin, Target, Clock } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface ReportChartsProps {
  dateRange: DateRange;
}

interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
}

interface VisitTrendsData {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
  successRate: number;
}

interface TeamPerformanceData {
  userId: string;
  userName: string;
  visitsCompleted: number;
  leadsConverted: number;
  tasksCompleted: number;
  efficiency: number;
}

interface LeadSourceData {
  source: string;
  count: number;
  conversionRate: number;
  value: number;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.purple,
  COLORS.pink,
  COLORS.orange
];

export default function ReportCharts({ dateRange }: ReportChartsProps) {
  const dateRangeParam = React.useMemo(() => {
    if (!dateRange.from || !dateRange.to) return '';
    return `from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`;
  }, [dateRange.from, dateRange.to]);

  const { data: conversionData, isLoading: loadingConversion } = useQuery({
    queryKey: ['/marketing/conversion-rates', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: visitData, isLoading: loadingVisits } = useQuery({
    queryKey: ['/marketing/visit-success-rates', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['/marketing/team-performance', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ['/marketing/leads/metrics', dateRangeParam],
    enabled: !!dateRangeParam
  });

  // Transform API data for charts
  const conversionFunnelData: ConversionFunnelData[] = React.useMemo(() => {
    if (!conversionData || typeof conversionData !== 'object') return [];
    
    // Handle different possible API response formats
    if (Array.isArray(conversionData)) {
      return conversionData.map((item: any) => ({
        stage: item.stage || item.name || 'Unknown',
        count: item.count || item.value || 0,
        percentage: item.percentage || 0,
        dropoffRate: item.dropoffRate || 0
      }));
    }
    
    // If API returns aggregated metrics, transform to funnel format
    const conversionObj = conversionData as any;
    const stages = [
      { stage: 'New Leads', count: conversionObj?.totalLeads || 0 },
      { stage: 'Contacted', count: conversionObj?.contactedLeads || 0 },
      { stage: 'In Progress', count: conversionObj?.inProgressLeads || 0 },
      { stage: 'Converted', count: conversionObj?.convertedLeads || 0 }
    ];
    
    const totalLeads = stages[0].count;
    return stages.map((stage, index) => {
      const percentage = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
      const prevCount = index > 0 ? stages[index - 1].count : totalLeads;
      const dropoffRate = prevCount > 0 ? ((prevCount - stage.count) / prevCount) * 100 : 0;
      
      return {
        stage: stage.stage,
        count: stage.count,
        percentage: Math.round(percentage * 10) / 10,
        dropoffRate: Math.round(dropoffRate * 10) / 10
      };
    });
  }, [conversionData]);

  const visitTrendsData: VisitTrendsData[] = React.useMemo(() => {
    if (!visitData || !Array.isArray(visitData)) return [];
    
    return visitData.map((item: any) => ({
      date: item.date || item.visitDate || new Date().toISOString().split('T')[0],
      scheduled: item.scheduled || item.totalVisits || 0,
      completed: item.completed || item.completedVisits || 0,
      cancelled: item.cancelled || item.cancelledVisits || 0,
      successRate: item.successRate || (
        item.scheduled > 0 
          ? Math.round((item.completed / item.scheduled) * 1000) / 10
          : 0
      )
    }));
  }, [visitData]);

  const teamPerformanceData: TeamPerformanceData[] = React.useMemo(() => {
    if (!teamData || !Array.isArray(teamData)) return [];
    
    return teamData.map((item: any) => ({
      userId: item.userId || item.id || 'unknown',
      userName: item.userName || item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown User',
      visitsCompleted: item.visitsCompleted || item.completedVisits || 0,
      leadsConverted: item.leadsConverted || item.convertedLeads || 0,
      tasksCompleted: item.tasksCompleted || item.completedTasks || 0,
      efficiency: item.efficiency || item.productivityScore || 0
    }));
  }, [teamData]);

  const leadSourcesData: LeadSourceData[] = React.useMemo(() => {
    if (!leadsData || typeof leadsData !== 'object') return [];
    
    // Handle source distribution from leads metrics
    const leadsObj = leadsData as any;
    if (leadsObj?.sourceDistribution && Array.isArray(leadsObj.sourceDistribution)) {
      return leadsObj.sourceDistribution.map((item: any) => ({
        source: item.source || 'Unknown',
        count: item.count || item.total || 0,
        conversionRate: item.conversionRate || item.conversion || 0,
        value: item.count || item.total || 0
      }));
    }
    
    // Fallback: Create from available lead sources data
    const sources = leadsObj?.sources || [];
    return sources.map((source: any) => ({
      source: source.name || 'Unknown',
      count: source.count || 0,
      conversionRate: source.conversionRate || 0,
      value: source.count || 0
    }));
  }, [leadsData]);

  if (!dateRangeParam) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          Please select a date range to view charts and analytics
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conversion Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Lead Conversion Funnel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingConversion ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} leads` : `${value}%`,
                    name === 'count' ? 'Count' : 'Percentage'
                  ]}
                />
                <Legend />
                <Bar dataKey="count" fill={COLORS.primary} name="Lead Count" />
                <Bar dataKey="percentage" fill={COLORS.success} name="Conversion %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Visit Success Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Visit Success Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={visitTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'successRate' ? `${value}%` : value,
                      name === 'scheduled' ? 'Scheduled' : 
                      name === 'completed' ? 'Completed' : 
                      name === 'cancelled' ? 'Cancelled' : 'Success Rate'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke={COLORS.success} name="Completed" strokeWidth={2} />
                  <Line type="monotone" dataKey="cancelled" stroke={COLORS.danger} name="Cancelled" strokeWidth={2} />
                  <Line type="monotone" dataKey="successRate" stroke={COLORS.info} name="Success Rate %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead Sources Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Lead Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLeads ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leadSourcesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="source"
                    label={({ source, conversionRate }) => `${source}: ${conversionRate}%`}
                  >
                    {leadSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} leads`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span>Team Performance Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTeam ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visitsCompleted" fill={COLORS.primary} name="Visits Completed" />
                <Bar dataKey="leadsConverted" fill={COLORS.success} name="Leads Converted" />
                <Bar dataKey="tasksCompleted" fill={COLORS.warning} name="Tasks Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Team Efficiency Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Team Efficiency Scores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTeam ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke={COLORS.info} 
                  fill={COLORS.info} 
                  fillOpacity={0.3}
                  name="Efficiency %"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}