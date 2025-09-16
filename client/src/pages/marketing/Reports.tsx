import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Target, 
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DateRangeSelector from "@/components/marketing/DateRangeSelector";
import ReportCharts from "@/components/marketing/ReportCharts";
import ReportTable, { type TableColumn } from "@/components/marketing/ReportTable";
import ExportModal from "@/components/marketing/ExportModal";
import { format } from "date-fns";
import exportService, { type ExportData } from "@/services/exportService";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface KPIMetric {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ElementType;
  color: string;
}

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);

  const dateRangeParam = dateRange.from && dateRange.to 
    ? `from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
    : '';

  // API Queries
  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ['/api/leads', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: leadsMetrics, isLoading: loadingLeadsMetrics } = useQuery({
    queryKey: ['/api/leads/metrics', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: fieldVisitsData, isLoading: loadingVisits } = useQuery({
    queryKey: ['/api/field-visits', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: visitsMetrics, isLoading: loadingVisitsMetrics } = useQuery({
    queryKey: ['/api/field-visits/metrics', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/marketing-tasks', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: tasksMetrics, isLoading: loadingTasksMetrics } = useQuery({
    queryKey: ['/api/marketing-tasks/metrics', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: conversionData, isLoading: loadingConversion } = useQuery({
    queryKey: ['/api/marketing/conversion-rates', dateRangeParam],
    enabled: !!dateRangeParam
  });

  const { data: teamPerformance, isLoading: loadingTeamPerf } = useQuery({
    queryKey: ['/api/marketing/team-performance', dateRangeParam],
    enabled: !!dateRangeParam
  });

  // Calculate KPI metrics
  const kpiMetrics: KPIMetric[] = [
    {
      label: 'Total Leads',
      value: Array.isArray(leadsData) ? leadsData.length : 0,
      change: { value: 12, type: 'increase' },
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Lead Conversion Rate',
      value: leadsMetrics && typeof leadsMetrics === 'object' && 'conversionRate' in leadsMetrics 
        ? `${leadsMetrics.conversionRate}%` : '0%',
      change: { value: 3.2, type: 'increase' },
      icon: Target,
      color: 'text-green-600'
    },
    {
      label: 'Field Visits Completed',
      value: Array.isArray(fieldVisitsData) 
        ? fieldVisitsData.filter((v: any) => v.status === 'completed').length 
        : 0,
      change: { value: 8, type: 'increase' },
      icon: MapPin,
      color: 'text-purple-600'
    },
    {
      label: 'Visit Success Rate',
      value: visitsMetrics && typeof visitsMetrics === 'object' && 'successRate' in visitsMetrics
        ? `${visitsMetrics.successRate}%` : '0%',
      change: { value: 5.1, type: 'increase' },
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    {
      label: 'Tasks Completed',
      value: Array.isArray(tasksData) 
        ? tasksData.filter((t: any) => t.status === 'completed').length 
        : 0,
      change: { value: 15, type: 'increase' },
      icon: Activity,
      color: 'text-orange-600'
    },
    {
      label: 'Team Productivity',
      value: teamPerformance && typeof teamPerformance === 'object' && 'averageProductivity' in teamPerformance
        ? `${teamPerformance.averageProductivity}%` : '0%',
      change: { value: 2.3, type: 'increase' },
      icon: TrendingUp,
      color: 'text-indigo-600'
    }
  ];

  // Table column configurations
  const leadsColumns: TableColumn[] = [
    { 
      key: 'name', 
      header: 'Lead Name', 
      sortable: true,
      formatter: (value) => value || 'N/A'
    },
    { 
      key: 'email', 
      header: 'Email', 
      sortable: true 
    },
    { 
      key: 'phone', 
      header: 'Phone', 
      sortable: true 
    },
    { 
      key: 'source', 
      header: 'Source', 
      sortable: true,
      formatter: (value) => (
        <Badge variant="outline">{value || 'Unknown'}</Badge>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true,
      formatter: (value) => {
        const statusColors = {
          'new': 'bg-blue-100 text-blue-800',
          'contacted': 'bg-yellow-100 text-yellow-800',
          'qualified': 'bg-green-100 text-green-800',
          'converted': 'bg-emerald-100 text-emerald-800',
          'lost': 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {value || 'New'}
          </Badge>
        );
      }
    },
    { 
      key: 'createdAt', 
      header: 'Created Date', 
      sortable: true,
      formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A'
    }
  ];

  const visitsColumns: TableColumn[] = [
    { 
      key: 'customerName', 
      header: 'Customer', 
      sortable: true 
    },
    { 
      key: 'visitDate', 
      header: 'Visit Date', 
      sortable: true,
      formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : 'N/A'
    },
    { 
      key: 'assignedTo', 
      header: 'Assigned To', 
      sortable: true 
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true,
      formatter: (value) => {
        const statusColors = {
          'scheduled': 'bg-blue-100 text-blue-800',
          'in_progress': 'bg-yellow-100 text-yellow-800',
          'completed': 'bg-green-100 text-green-800',
          'cancelled': 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {value || 'Scheduled'}
          </Badge>
        );
      }
    },
    { 
      key: 'location', 
      header: 'Location', 
      sortable: true 
    },
    { 
      key: 'outcome', 
      header: 'Outcome', 
      sortable: true,
      formatter: (value) => value || 'Pending'
    }
  ];

  const tasksColumns: TableColumn[] = [
    { 
      key: 'title', 
      header: 'Task Title', 
      sortable: true 
    },
    { 
      key: 'assignedTo', 
      header: 'Assigned To', 
      sortable: true 
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true,
      formatter: (value) => {
        const statusColors = {
          'pending': 'bg-gray-100 text-gray-800',
          'in_progress': 'bg-blue-100 text-blue-800',
          'completed': 'bg-green-100 text-green-800',
          'overdue': 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {value || 'Pending'}
          </Badge>
        );
      }
    },
    { 
      key: 'priority', 
      header: 'Priority', 
      sortable: true,
      formatter: (value) => {
        const priorityColors = {
          'low': 'bg-green-100 text-green-800',
          'medium': 'bg-yellow-100 text-yellow-800',
          'high': 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={priorityColors[value as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}>
            {value || 'Medium'}
          </Badge>
        );
      }
    },
    { 
      key: 'dueDate', 
      header: 'Due Date', 
      sortable: true,
      formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : 'No due date'
    }
  ];

  // Export functionality
  const handleMasterExport = () => {
    setShowExportModal(true);
  };

  const getMasterExportData = (): ExportData => {
    const reportData = [
      ['KPI Metrics', '', '', ''],
      ...kpiMetrics.map(metric => [metric.label, metric.value, '', '']),
      ['', '', '', ''],
      ['Summary Statistics', '', '', ''],
      ['Total Leads', Array.isArray(leadsData) ? leadsData.length : 0, '', ''],
      ['Total Field Visits', Array.isArray(fieldVisitsData) ? fieldVisitsData.length : 0, '', ''],
      ['Total Marketing Tasks', Array.isArray(tasksData) ? tasksData.length : 0, '', ''],
      ['Date Range', dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : '', 
       dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : '', '']
    ];

    return {
      headers: ['Metric', 'Value', 'Change', 'Notes'],
      rows: reportData,
      metadata: exportService.generateMetadata(reportData.length, dateRange)
    };
  };

  const hasDateRange = dateRange.from && dateRange.to;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="reports-title">
            Marketing Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence for marketing operations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleMasterExport}
            disabled={!hasDateRange}
            data-testid="master-export-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Master Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Report Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            data-testid="reports-date-range-selector"
          />
        </CardContent>
      </Card>

      {!hasDateRange && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a date range to view reports and analytics.
          </AlertDescription>
        </Alert>
      )}

      {hasDateRange && (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiMetrics.map((metric, index) => {
              const Icon = metric.icon;
              const isLoading = loadingLeads || loadingLeadsMetrics || loadingVisits || 
                              loadingVisitsMetrics || loadingTasks || loadingTasksMetrics;
              
              return (
                <Card key={index} data-testid={`kpi-card-${index}`}>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {metric.label}
                          </p>
                          <p className="text-2xl font-bold" data-testid={`kpi-value-${index}`}>
                            {metric.value}
                          </p>
                          {metric.change && (
                            <p className={`text-xs flex items-center ${
                              metric.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {metric.change.type === 'increase' ? '+' : '-'}{metric.change.value}%
                            </p>
                          )}
                        </div>
                        <Icon className={`h-8 w-8 ${metric.color}`} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Reports Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="leads" data-testid="tab-leads">
                Lead Analytics
              </TabsTrigger>
              <TabsTrigger value="visits" data-testid="tab-visits">
                Field Visits
              </TabsTrigger>
              <TabsTrigger value="tasks" data-testid="tab-tasks">
                Task Performance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div id="overview-charts">
                <ReportCharts dateRange={dateRange} />
              </div>
            </TabsContent>

            {/* Leads Analytics Tab */}
            <TabsContent value="leads" className="space-y-6">
              <ReportTable
                data={Array.isArray(leadsData) ? leadsData : []}
                columns={leadsColumns}
                title="Lead Performance Analytics"
                isLoading={loadingLeads}
                emptyMessage="No leads found for the selected period"
                exportFilename={`leads-report-${format(new Date(), 'yyyy-MM-dd')}`}
                dateRange={dateRange}
              />
            </TabsContent>

            {/* Field Visits Tab */}
            <TabsContent value="visits" className="space-y-6">
              <ReportTable
                data={Array.isArray(fieldVisitsData) ? fieldVisitsData : []}
                columns={visitsColumns}
                title="Field Visit Performance"
                isLoading={loadingVisits}
                emptyMessage="No field visits found for the selected period"
                exportFilename={`field-visits-report-${format(new Date(), 'yyyy-MM-dd')}`}
                dateRange={dateRange}
              />
            </TabsContent>

            {/* Tasks Performance Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <ReportTable
                data={Array.isArray(tasksData) ? tasksData : []}
                columns={tasksColumns}
                title="Marketing Task Performance"
                isLoading={loadingTasks}
                emptyMessage="No marketing tasks found for the selected period"
                exportFilename={`marketing-tasks-report-${format(new Date(), 'yyyy-MM-dd')}`}
                dateRange={dateRange}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Master Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={getMasterExportData()}
        defaultFilename={`marketing-master-report-${format(new Date(), 'yyyy-MM-dd')}`}
        title="Marketing Master Report"
        chartElementId="overview-charts"
        dateRange={dateRange}
      />
    </div>
  );
}