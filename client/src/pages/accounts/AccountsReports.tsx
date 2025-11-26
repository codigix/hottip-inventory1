import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  TrendingUp,
  BarChart3,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  Clock,
  AlertTriangle,
  FileBarChart,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Users,
  Building2,
  PieChart,
  LineChart,
  Receipt,
  CreditCard,
  RefreshCw,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  TrendingDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  insertAccountReportSchema,
  type AccountReport,
  type InsertAccountReport,
} from "@shared/schema";
import {
  format,
  isEqual,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns";

// Schemas for report generation
const reportFormSchema = z
  .object({
    reportType: z.string().min(1, "Report type is required"),
    title: z.string().min(1, "Report title is required"),
    startDate: z.coerce.date("Please enter a valid start date"),
    endDate: z.coerce.date("Please enter a valid end date"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type ReportFormData = z.infer<typeof reportFormSchema>;

// Date range presets
const dateRangePresets = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
  { label: "Custom", value: "custom" },
];

// Report types configuration
const reportTypes = [
  {
    id: "daily_collections",
    name: "Daily Collections",
    description: "Daily cash collections and receipts",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    id: "receivables",
    name: "Accounts Receivable",
    description: "Outstanding customer payments aging report",
    icon: TrendingUp,
    color: "text-blue-600",
  },
  {
    id: "payables",
    name: "Accounts Payable",
    description: "Outstanding vendor payments and due dates",
    icon: TrendingDown,
    color: "text-orange-600",
  },
  {
    id: "gst_filing",
    name: "GST Filing",
    description: "GST returns and tax compliance reports",
    icon: Receipt,
    color: "text-purple-600",
  },
  {
    id: "cash_flow",
    name: "Cash Flow",
    description: "Cash inflows and outflows summary",
    icon: Activity,
    color: "text-indigo-600",
  },
  {
    id: "profit_loss",
    name: "Profit & Loss",
    description: "Income and expense statement",
    icon: BarChart3,
    color: "text-red-600",
  },
];

// Export formats
const exportFormats = [
  { label: "PDF", value: "pdf", icon: File },
  { label: "Excel", value: "excel", icon: FileSpreadsheet },
  { label: "CSV", value: "csv", icon: FileBarChart },
];

export default function AccountsReports() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<AccountReport | null>(
    null
  );
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<AccountReport | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    undefined
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    undefined
  );
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  // Data fetching - Fetch real-time data from APIs
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/reports"],
  });

  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/accounts/dashboard-metrics"],
  });

  const { data: cashFlowSummary } = useQuery({
    queryKey: ["/accounts/cash-flow-summary"],
  });

  const { data: receivablesTotal } = useQuery({
    queryKey: ["/accounts/receivables-total"],
  });

  const { data: payablesTotal } = useQuery({
    queryKey: ["/accounts/payables-total"],
  });

  // Form setup
  const generateForm = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "daily_collections",
      title: "Daily Collections Report - This Month",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    },
  });

  // Calculate metrics from real data
  const reportsArray = Array.isArray(reports) ? reports : [];
  const metrics = dashboardMetrics || {};

  const totalReports = reportsArray.length;
  const reportsThisMonth = reportsArray.filter((r: any) => {
    const reportDate = new Date(r.generatedAt);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return (
      reportDate.getMonth() === currentMonth &&
      reportDate.getFullYear() === currentYear
    );
  }).length;

  const totalDownloads = reportsArray.reduce(
    (sum: number, r: any) => sum + (r.downloadCount || 0),
    0
  );

  // Calculate collection rate from cash flow data - with divide by zero protection
  const collectionRate = (() => {
    if (!cashFlowSummary) return 0;

    const totalInflow = cashFlowSummary.totalInflow || 0;
    const receivablesAmount = receivablesTotal?.total || 0;
    const denominator = totalInflow + receivablesAmount;

    // Guard against divide by zero
    return denominator > 0 ? (totalInflow / denominator) * 100 : 0;
  })();

  // GST returns filed this year
  const gstReportsCurrent = reportsArray.filter(
    (r: any) =>
      r.reportType === "gst_filing" &&
      new Date(r.generatedAt).getFullYear() === new Date().getFullYear()
  ).length;

  // Date range calculation helper
  const calculateDateRange = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "this_week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "last_week":
        const lastWeek = subDays(now, 7);
        return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subDays(startOfMonth(now), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "this_quarter":
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Update form dates when preset changes
  const handleDateRangeChange = (preset: string) => {
    setSelectedDateRange(preset);
    if (preset !== "custom") {
      const range = calculateDateRange(preset);
      generateForm.setValue("startDate", range.start);
      generateForm.setValue("endDate", range.end);
      setCustomStartDate(range.start);
      setCustomEndDate(range.end);

      // Auto-update title when date range changes
      const selectedType = reportTypes.find(
        (t) => t.id === generateForm.getValues("reportType")
      );
      const dateLabel =
        dateRangePresets.find((p) => p.value === preset)?.label || "Custom";
      generateForm.setValue(
        "title",
        `${
          selectedType?.name || generateForm.getValues("reportType")
        } Report - ${dateLabel}`
      );
    }
  };

  // Mutations
  const generateReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await apiRequest("/reports", {
        method: "POST",
        body: JSON.stringify({
          reportType: data.reportType,
          dateRange: selectedDateRange,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/reports"] });
      toast({ title: "Success", description: "Report generated successfully" });
      setIsGenerateOpen(false);
      generateForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      format,
    }: {
      reportId: string;
      format: string;
    }) => {
      const response = await apiRequest(
        `/reports/${reportId}/export?format=${format}`,
        {
          method: "GET",
        }
      );
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Report exported to ${variables.format.toUpperCase()} successfully`,
      });
      // Trigger download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/reports/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/reports"] });
      toast({ title: "Success", description: "Report deleted successfully" });
      setIsDeleteOpen(false);
      setReportToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleGenerateSubmit = (data: ReportFormData) => {
    generateReportMutation.mutate(data);
  };

  const handleView = (report: AccountReport) => {
    setSelectedReport(report);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (report: AccountReport) => {
    setReportToDelete(report);
    setIsDeleteOpen(true);
  };

  const handleExport = (reportId: string, format: string) => {
    exportReportMutation.mutate({ reportId, format });
  };

  // Filter reports based on active tab and filters
  const filteredReports = reportsArray.filter((report: any) => {
    const matchesSearch =
      report.reportType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.status?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      reportTypeFilter === "all" || report.reportType === reportTypeFilter;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "recent" &&
        new Date(report.generatedAt) > subDays(new Date(), 7)) ||
      (activeTab === "completed" && report.status === "generated") ||
      (activeTab === "pending" && report.status === "generating");

    return matchesSearch && matchesType && matchesTab;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between" data-tour="accounts-reports-header">
        <div>
          <h1
            className="text-3xl font-bold text-foreground"
            data-testid="page-title"
          >
            Accounts Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate and export financial reports including collections,
            receivables, payables, and GST filings.
          </p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2"
              data-testid="button-generate-report"
            >
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Create a financial report with customizable date range and
                export options.
              </DialogDescription>
            </DialogHeader>
            <Form {...generateForm}>
              <form
                onSubmit={generateForm.handleSubmit(handleGenerateSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={generateForm.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-update title when report type changes
                            const selectedType = reportTypes.find(
                              (t) => t.id === value
                            );
                            const dateLabel =
                              dateRangePresets.find(
                                (p) => p.value === selectedDateRange
                              )?.label || "Custom";
                            generateForm.setValue(
                              "title",
                              `${
                                selectedType?.name || value
                              } Report - ${dateLabel}`
                            );
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-report-type" data-tour="accounts-reports-selector">
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {reportTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center gap-2">
                                  <type.icon
                                    className={`h-4 w-4 ${type.color}`}
                                  />
                                  {type.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generateForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter report title"
                            {...field}
                            data-testid="input-report-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Date Range</FormLabel>
                    <Select
                      value={selectedDateRange}
                      onValueChange={handleDateRangeChange}
                    >
                      <SelectTrigger data-testid="select-date-range" data-tour="accounts-reports-date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateRangePresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>

                {selectedDateRange === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generateForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <Popover
                            open={isStartCalendarOpen}
                            onOpenChange={setIsStartCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                  data-testid="input-start-date"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick start date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setIsStartCalendarOpen(false);
                                }}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generateForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <Popover
                            open={isEndCalendarOpen}
                            onOpenChange={setIsEndCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                  data-testid="input-end-date"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick end date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setIsEndCalendarOpen(false);
                                }}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGenerateOpen(false)}
                    data-testid="button-cancel-generate"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={generateReportMutation.isPending}
                    data-testid="button-submit-generate"
                  >
                    {generateReportMutation.isPending && (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-tour="accounts-financial-metrics">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">
              Reports Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div
                className="text-2xl font-bold"
                data-testid="text-reports-generated"
              >
                {reportsThisMonth}
              </div>
            )}
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">
              Total Downloads
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-total-downloads"
            >
              {totalDownloads}
            </div>
            <p className="text-xs text-muted-foreground">All exports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">
              Collection Rate
            </CardTitle>
            <TrendingUp
              className={`h-4 w-4 ${
                collectionRate >= 85 ? "text-green-500" : "text-orange-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                collectionRate >= 85 ? "text-green-600" : "text-orange-600"
              }`}
              data-testid="text-collection-rate"
            >
              {collectionRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {collectionRate >= 85 ? "Above target" : "Below target"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">
              GST Reports Filed
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-blue-600"
              data-testid="text-gst-reports"
            >
              {gstReportsCurrent}
            </div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Quick Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((type) => (
              <Card
                key={type.id}
                className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  generateForm.setValue("reportType", type.id as any);
                  setIsGenerateOpen(true);
                }}
                data-testid={`card-report-${type.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <type.icon className={`h-8 w-8 ${type.color} mt-1`} />
                    <div>
                      <h3 className="font-semibold text-sm">{type.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Generated Reports</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                  data-testid="input-search-reports"
                />
              </div>
              <Select
                value={reportTypeFilter}
                onValueChange={setReportTypeFilter}
              >
                <SelectTrigger
                  className="w-full sm:w-48"
                  data-testid="select-filter-type"
                >
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" data-testid="tab-all">
                All Reports
              </TabsTrigger>
              <TabsTrigger value="recent" data-testid="tab-recent">
                Recent
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">
                Completed
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Generating
              </TabsTrigger>
            </TabsList>

            {["all", "recent", "completed", "pending"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {reportsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[160px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Reports Found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "No reports match your search criteria."
                        : "Generate your first financial report to get started."}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setIsGenerateOpen(true)}
                        data-testid="button-generate-first-report"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Report
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report Type</TableHead>
                          <TableHead>Date Range</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Generated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report: any) => {
                          const reportType = reportTypes.find(
                            (t) => t.id === report.reportType
                          );
                          return (
                            <TableRow
                              key={report.id}
                              data-testid={`row-report-${report.id}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {reportType && (
                                    <reportType.icon
                                      className={`h-4 w-4 ${reportType.color}`}
                                    />
                                  )}
                                  <span className="font-light">
                                    {reportType?.name || report.reportType}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(report.startDate), "MMM dd")}{" "}
                                  -{" "}
                                  {format(
                                    new Date(report.endDate),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    report.status === "generated"
                                      ? "default"
                                      : "secondary"
                                  }
                                  data-testid={`badge-status-${report.id}`}
                                >
                                  {report.status === "generated" ? (
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                  ) : (
                                    <Clock className="mr-1 h-3 w-3" />
                                  )}
                                  {report.status === "generated"
                                    ? "Ready"
                                    : "Generating"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(report.generatedAt),
                                    "MMM dd, yyyy h:mm a"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(report)}
                                    data-testid={`button-view-${report.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {report.status === "generated" && (
                                    <>
                                      {exportFormats.map((format, index) => (
                                        <Button
                                          key={format.value}
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleExport(
                                              report.id,
                                              format.value
                                            )
                                          }
                                          disabled={
                                            exportReportMutation.isPending
                                          }
                                          data-testid={`button-export-${format.value}-${report.id}`}
                                          data-tour={index === 0 ? "accounts-reports-export-button" : undefined}
                                        >
                                          <format.icon className="h-4 w-4" />
                                        </Button>
                                      ))}
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(report)}
                                    className="text-destructive hover:text-destructive"
                                    data-testid={`button-delete-${report.id}`}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View report information and download options.
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-light text-muted-foreground">
                    Report Type
                  </Label>
                  <p className="text-sm mt-1 capitalize">
                    {selectedReport.reportType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">
                    Status
                  </Label>
                  <Badge
                    className="mt-1"
                    data-testid={`view-status-${selectedReport.id}`}
                  >
                    {selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">
                    Date Range
                  </Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedReport.startDate), "PPP")} -{" "}
                    {format(new Date(selectedReport.endDate), "PPP")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">
                    Generated
                  </Label>
                  <p className="text-sm mt-1">
                    {format(
                      new Date(selectedReport.generatedAt),
                      "PPP 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>

              {selectedReport.status === "generated" && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-light">Export Options</Label>
                  <div className="flex gap-2 mt-2">
                    {exportFormats.map((format) => (
                      <Button
                        key={format.value}
                        variant="outline"
                        onClick={() =>
                          handleExport(selectedReport.id, format.value)
                        }
                        disabled={exportReportMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid={`view-export-${format.value}`}
                      >
                        <format.icon className="h-4 w-4" />
                        {format.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Report Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone and will remove all associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                reportToDelete && deleteReportMutation.mutate(reportToDelete.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
