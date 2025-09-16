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
  const dateRangeParam = dateRange.from && dateRange.to 
    ? `from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
    : '';

  const { data: conversionData, isLoading: loadingConversion } = useQuery({
    queryKey: ['/api/marketing/conversion-rates', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: visitData, isLoading: loadingVisits } = useQuery({
    queryKey: ['/api/marketing/visit-success-rates', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['/api/marketing/team-performance', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ['/api/leads/metrics', dateRangeParam],
    enabled: !!dateRangeParam
  });

  // Mock data for demonstration (replace with actual API data)
  const mockConversionFunnel: ConversionFunnelData[] = [
    { stage: 'New Leads', count: 150, percentage: 100, dropoffRate: 0 },
    { stage: 'Contacted', count: 120, percentage: 80, dropoffRate: 20 },
    { stage: 'In Progress', count: 75, percentage: 50, dropoffRate: 37.5 },
    { stage: 'Converted', count: 36, percentage: 24, dropoffRate: 52 }
  ];

  const mockVisitTrends: VisitTrendsData[] = [
    { date: '2025-01-10', scheduled: 12, completed: 10, cancelled: 2, successRate: 83.3 },
    { date: '2025-01-11', scheduled: 15, completed: 13, cancelled: 2, successRate: 86.7 },
    { date: '2025-01-12', scheduled: 8, completed: 7, cancelled: 1, successRate: 87.5 },
    { date: '2025-01-13', scheduled: 18, completed: 15, cancelled: 3, successRate: 83.3 },
    { date: '2025-01-14', scheduled: 20, completed: 18, cancelled: 2, successRate: 90 },
    { date: '2025-01-15', scheduled: 14, completed: 12, cancelled: 2, successRate: 85.7 },
    { date: '2025-01-16', scheduled: 16, completed: 14, cancelled: 2, successRate: 87.5 }
  ];

  const mockTeamPerformance: TeamPerformanceData[] = [
    { userId: '1', userName: 'John Smith', visitsCompleted: 45, leadsConverted: 12, tasksCompleted: 28, efficiency: 89 },
    { userId: '2', userName: 'Sarah Wilson', visitsCompleted: 52, leadsConverted: 15, tasksCompleted: 35, efficiency: 94 },
    { userId: '3', userName: 'Mike Johnson', visitsCompleted: 38, leadsConverted: 8, tasksCompleted: 22, efficiency: 76 },
    { userId: '4', userName: 'Emily Brown', visitsCompleted: 41, leadsConverted: 11, tasksCompleted: 29, efficiency: 85 }
  ];

  const mockLeadSources: LeadSourceData[] = [
    { source: 'Website', count: 45, conversionRate: 28, value: 45 },
    { source: 'Referrals', count: 32, conversionRate: 35, value: 32 },
    { source: 'Social Media', count: 28, conversionRate: 22, value: 28 },
    { source: 'Email Campaign', count: 25, conversionRate: 30, value: 25 },
    { source: 'Cold Calls', count: 20, conversionRate: 15, value: 20 }
  ];

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
              <BarChart data={mockConversionFunnel} layout="horizontal">
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
                <LineChart data={mockVisitTrends}>
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
                    data={mockLeadSources}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="source"
                    label={({ source, conversionRate }) => `${source}: ${conversionRate}%`}
                  >
                    {mockLeadSources.map((entry, index) => (
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
              <BarChart data={mockTeamPerformance}>
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
              <AreaChart data={mockTeamPerformance}>
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