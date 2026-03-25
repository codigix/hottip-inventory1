import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Map,
  Table,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import VisitForm from "@/components/marketing/VisitForm";
import VisitTable from "@/components/marketing/VisitTable";
import VisitMap from "@/components/marketing/VisitMap";
import GPSModal from "@/components/marketing/GPSModal";
import ProofUpload from "@/components/marketing/ProofUpload";

import type { FieldVisit, InsertFieldVisit, User, Lead } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: { id: string; firstName: string; lastName: string; companyName?: string };
  assignedToUser?: { id: string; firstName: string; lastName: string };
  assignedByUser?: { id: string; firstName: string; lastName: string };
}

type VisitStatus = "scheduled" | "upcoming" | "completed" | "cancelled";
type ViewMode = "table" | "map";

export default function FieldVisits() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [gpsAction, setGpsAction] = useState<"check-in" | "check-out">("check-in");
  const [proofModalOpen, setProofModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  /** ===== Queries ===== **/
  const { data: visitsData, isLoading: visitsLoading, error: visitsError } = useQuery<VisitWithDetails[]>({
    queryKey: ["/field-visits"],
    queryFn: () => apiRequest("/field-visits"),
  });
  const safeVisits = Array.isArray(visitsData) ? visitsData : [];

  const { data: usersData } = useQuery<User[]>({
    queryKey: ["/users"],
    queryFn: () => apiRequest("/users"),
  });
  const users = Array.isArray(usersData) ? usersData : [];

  const { data: leadsData } = useQuery<Lead[]>({
    queryKey: ["/marketing/leads"],
    queryFn: () => apiRequest("/marketing/leads"),
  });
  const leads = Array.isArray(leadsData) ? leadsData : [];

  /** ===== Mutations ===== **/
  const createVisitMutation = useMutation({
    mutationFn: (data: InsertFieldVisit) =>
      apiRequest("/field-visits", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      queryClient.invalidateQueries({ queryKey: ["/marketing-tasks"] });
      toast({ title: "Visit scheduled successfully!" });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error scheduling visit", description: error.message, variant: "destructive" });
    },
  });

  // Example delete mutation
  const deleteVisitMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/field-visits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Visit deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting visit", description: error.message, variant: "destructive" });
    },
  });

  /** ===== Metrics ===== **/
  const metricsLoading = visitsLoading;
  const displayMetrics = {
    todayVisits: safeVisits.filter(v => v.date === new Date().toISOString().split("T")[0]).length,
    completionRate: safeVisits.length
      ? (safeVisits.filter(v => v.status?.toLowerCase() === "completed").length / safeVisits.length) * 100
      : 0,
  };

  /** ===== Computed Values ===== **/
  const filteredVisits = useMemo(() => {
    return safeVisits.filter((v) => {
      const normalizedStatus = v.status?.toLowerCase().replace(" ", "_");
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || v.assignedTo === assigneeFilter;
      const matchesSearch = !searchTerm || v.visitNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesAssignee && matchesSearch;
    });
  }, [safeVisits, statusFilter, assigneeFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { scheduled: 0, upcoming: 0, completed: 0, cancelled: 0 };
    safeVisits.forEach((v) => {
      const normalizedStatus = v.status?.toLowerCase().replace(" ", "_");
      if (normalizedStatus === "in_progress") {
        counts["upcoming"]++;
      } else if (normalizedStatus in counts) {
        counts[normalizedStatus]++;
      }
    });
    return { all: safeVisits.length, ...counts };
  }, [safeVisits]);

  /** ===== Handlers ===== **/
  const handleFormSubmit = (data: InsertFieldVisit) => {
    if (selectedVisit) {
      updateVisitMutation.mutate({ ...selectedVisit, ...data });
    } else {
      createVisitMutation.mutate(data);
    }
  };

  const handleEditVisit = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setIsFormOpen(true);
  };

  const handleDeleteVisit = (visit: VisitWithDetails) => {
    deleteVisitMutation.mutate(visit.id);
  };

  const handleGPSAction = (visit: VisitWithDetails, action: "check-in" | "check-out") => {
    setSelectedVisit(visit);
    setGpsAction(action);
    setGpsModalOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiRequest(`/field-visits/${id}/status`, { 
        method: "PUT",
        body: JSON.stringify({ status, notes })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Visit status updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusUpdate = (visit: VisitWithDetails, status: VisitStatus) => {
    const statusMap: Record<string, string> = {
      scheduled: "Scheduled",
      upcoming: "Upcoming",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    updateStatusMutation.mutate({ id: visit.id, status: statusMap[status] });
  };

  const handleProofUpload = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setProofModalOpen(true);
  };
  const handleCheckIn = (locationData: { latitude: number; longitude: number; location?: string; photoPath?: string }) => {
    if (selectedVisit?.id) {
      checkInMutation.mutate({ visitId: selectedVisit.id, data: locationData });
    }
  };

  const handleCheckOut = (locationData: any) => {
    if (selectedVisit?.id) {
      checkOutMutation.mutate({ visitId: selectedVisit.id, data: locationData });
    }
  };

  const checkInMutation = useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: any }) =>
      apiRequest(`/field-visits/${visitId}/check-in`, { 
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Checked in successfully!" });
      setGpsModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error checking in", description: error.message, variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: any }) =>
      apiRequest(`/field-visits/${visitId}/check-out`, { 
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Checked out successfully!" });
      setGpsModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error checking out", description: error.message, variant: "destructive" });
    },
  });
const updateVisitMutation = useMutation({
  mutationFn: (data: VisitWithDetails) =>
    apiRequest(`/field-visits/${data.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
    toast({ title: "Visit updated successfully!" });
    setIsFormOpen(false);
    setSelectedVisit(null);
  },
  onError: (error: any) => {
    toast({ title: "Error updating visit", description: error.message, variant: "destructive" });
  },
});
  if (visitsError) return <div className="p-4 text-red-600">Error loading visits</div>;
  if (visitsLoading) return <div className="p-4">Loading visits...</div>;

  return (
    <div className="space-y-2 p-4 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 flex items-center gap-2" data-testid="page-title">
            <MapPin className="h-6 w-6 text-primary" />
            Field Visits
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Schedule, track, and manage field visits with GPS verification.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'map' : 'table')}
            className="bg-white"
            data-testid="toggle-view-mode"
          >
            {viewMode === 'table' ? <Map className="h-4 w-4 mr-2" /> : <Table className="h-4 w-4 mr-2" />}
            {viewMode === 'table' ? 'Map View' : 'Table View'}
          </Button>
          
          <Button 
            size="sm"
            onClick={() => {
              setSelectedVisit(null);
              setIsFormOpen(true);
            }}
            data-testid="button-schedule-visit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
              Today's Visits
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl text-slate-900" data-testid="metric-today-visits">
              {metricsLoading ? '...' : displayMetrics.todayVisits}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
              Scheduled
              <Clock className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl text-slate-900" data-testid="metric-scheduled-visits">
              {statusCounts.scheduled}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
              In Progress
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl text-slate-900" data-testid="metric-in-progress-visits">
              {statusCounts.in_progress}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
              Completed
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl text-slate-900" data-testid="metric-completed-visits">
              {statusCounts.completed}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
              Cancelled
              <XCircle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl text-slate-900" data-testid="metric-cancelled-visits">
              {statusCounts.cancelled}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between">
              Comp. Rate
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl text-slate-900" data-testid="metric-completion-rate">
              {metricsLoading ? '...' : `${displayMetrics.completionRate?.toFixed(1) || 0}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="border-slate-200 shadow-sm bg-white p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search visits, customers, or addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 h-10"
              data-testid="input-search-visits"
            />
          </div>
          
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full sm:w-64 bg-slate-50 border-slate-200 h-10" data-testid="select-assignee-filter">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as VisitStatus | 'all')} className="w-full">
          <div className="p-2 border-b border-slate-100">
            <TabsList className="bg-slate-100/50 p-1 my-2 w-full justify-start  gap-1">
              <TabsTrigger value="all" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                All <Badge variant="secondary" className="ml-2 bg-gray-600">{statusCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Scheduled <Badge variant="secondary" className="ml-2 bg-gray-600">{statusCounts.scheduled}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                In Progress <Badge variant="secondary" className="ml-2 bg-gray-600">{statusCounts.in_progress}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Completed <Badge variant="secondary" className="ml-2 bg-gray-600">{statusCounts.completed}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className=" data-[state=active]:shadow-sm p-1 border border-gray-200">
                Cancelled <Badge variant="secondary" className="ml-2 bg-gray-600">{statusCounts.cancelled}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={statusFilter} className="mt-0 p-0">
            {viewMode === 'table' ? (
              <VisitTable
                visits={filteredVisits}
                isLoading={visitsLoading}
                onEdit={handleEditVisit}
                onDelete={handleDeleteVisit}
                onCheckIn={(visit) => handleGPSAction(visit, 'check-in')}
                onCheckOut={(visit) => handleGPSAction(visit, 'check-out')}
                onStatusUpdate={handleStatusUpdate}
                onProofUpload={handleProofUpload}
              />
            ) : (
              <div className="h-[600px] p-4">
                <VisitMap
                  visits={filteredVisits}
                  isLoading={visitsLoading}
                  onVisitSelect={setSelectedVisit}
                  onCheckIn={(visit) => handleGPSAction(visit, 'check-in')}
                  onCheckOut={(visit) => handleGPSAction(visit, 'check-out')}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Visit Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="my-4">
            <DialogTitle>
              {selectedVisit ? 'Edit Visit' : 'Schedule New Visit'}
            </DialogTitle>
          </DialogHeader>
          <VisitForm
            visit={selectedVisit}
            leads={leads}
            users={users}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedVisit(null);
            }}
            isLoading={createVisitMutation.isPending || updateVisitMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* GPS Check-in/Check-out Modal */}
      <GPSModal
        open={gpsModalOpen}
        onOpenChange={setGpsModalOpen}
        visit={selectedVisit}
        action={gpsAction}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        isLoading={gpsAction === 'check-in' ? checkInMutation.isPending : checkOutMutation.isPending}
      />

      {/* Proof Upload Modal */}
      <ProofUpload
        open={proofModalOpen}
        onOpenChange={setProofModalOpen}
        visit={selectedVisit}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['/field-visits'] });
          setProofModalOpen(false);
        }}
      />
    </div>
  );
}
