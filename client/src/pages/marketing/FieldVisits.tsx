import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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

type VisitStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
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
    queryKey: ["field-visits"],
    queryFn: () => apiRequest("/field-visits"),
  });
  const safeVisits = Array.isArray(visitsData) ? visitsData : [];

  const { data: usersData } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => apiRequest("/users"),
  });
  const users = Array.isArray(usersData) ? usersData : [];

  const { data: leadsData } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: () => apiRequest("/leads"),
  });
  const leads = Array.isArray(leadsData) ? leadsData : [];

  /** ===== Mutations ===== **/
  const createVisitMutation = useMutation({
    mutationFn: (data: InsertFieldVisit) =>
      apiRequest("/field-visits", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-visits"] });
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
      queryClient.invalidateQueries({ queryKey: ["field-visits"] });
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
      ? (safeVisits.filter(v => v.status === "completed").length / safeVisits.length) * 100
      : 0,
  };

  /** ===== Computed Values ===== **/
  const filteredVisits = useMemo(() => {
    return safeVisits.filter((v) => {
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || v.assignedTo === assigneeFilter;
      const matchesSearch = !searchTerm || v.visitNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesAssignee && matchesSearch;
    });
  }, [safeVisits, statusFilter, assigneeFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0 };
    safeVisits.forEach((v) => {
      if (v.status in counts) counts[v.status]++;
    });
    return { all: safeVisits.length, ...counts };
  }, [safeVisits]);

  /** ===== Handlers ===== **/
  const handleFormSubmit = (data: InsertFieldVisit) => {
    if (selectedVisit) return; // Add update mutation here if needed
    createVisitMutation.mutate(data);
  };

  const handleEditVisit = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setIsFormOpen(true);
  };

  const handleDeleteVisit = (visit: VisitWithDetails) => {
    if (!window.confirm(`Are you sure you want to delete visit #${visit.visitNumber}?`)) return;
    deleteVisitMutation.mutate(visit.id);
  };

  const handleGPSAction = (visit: VisitWithDetails, action: "check-in" | "check-out") => {
    setSelectedVisit(visit);
    setGpsAction(action);
    setGpsModalOpen(true);
  };

  const handleStatusUpdate = (visit: VisitWithDetails, status: VisitStatus) => {
    // Implement status update mutation
    console.log("Update status", visit, status);
  };

  const handleProofUpload = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setProofModalOpen(true);
  };
  const handleCheckIn = (visit: VisitWithDetails) => {
    if (visit.id) checkInMutation.mutate(visit.id);
  };

const handleCheckOut = (visit: VisitWithDetails) => {
  if (visit.id) checkOutMutation.mutate(visit.id);
};
const checkInMutation = useMutation({
  mutationFn: (visitId: string) =>
    apiRequest(`/field-visits/${visitId}/check-in`, { method: "POST" }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["field-visits"] });
    toast({ title: "Checked in successfully!" });
  },
  onError: (error: any) => {
    toast({ title: "Error checking in", description: error.message, variant: "destructive" });
  },
});

const checkOutMutation = useMutation({
  mutationFn: (visitId: string) =>
    apiRequest(`/field-visits/${visitId}/check-out`, { method: "POST" }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["field-visits"] });
    toast({ title: "Checked out successfully!" });
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
    queryClient.invalidateQueries({ queryKey: ["field-visits"] });
    toast({ title: "Visit updated successfully!" });
    setIsFormOpen(false);
    setSelectedVisit(null);
  },
  onError: (error: any) => {
    toast({ title: "Error updating visit", description: error.message, variant: "destructive" });
  },
});
  if (visitsError) return <div className="p-8 text-red-600">Error loading visits</div>;
  if (visitsLoading) return <div className="p-8">Loading visits...</div>;

  return (
   <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="page-title">Field Visits</h1>
          <p className="text-muted-foreground">
            Schedule, track, and manage field visits with GPS verification
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'map' : 'table')}
            data-testid="toggle-view-mode"
          >
            {viewMode === 'table' ? <Map className="h-4 w-4 mr-2" /> : <Table className="h-4 w-4 mr-2" />}
            {viewMode === 'table' ? 'Map View' : 'Table View'}
          </Button>
          
          <Button 
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span>Today's Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-today-visits">
              {metricsLoading ? '...' : displayMetrics.todayVisits}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>Scheduled</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-scheduled-visits">
              {statusCounts.scheduled}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>In Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-in-progress-visits">
              {statusCounts.in_progress}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-completed-visits">
              {statusCounts.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Cancelled</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-cancelled-visits">
              {statusCounts.cancelled}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-500" />
              <span>Completion Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-completion-rate">
              {metricsLoading ? '...' : `${displayMetrics.completionRate?.toFixed(1) || 0}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search visits, customers, or addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-visits"
          />
        </div>
        
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-assignee-filter">
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

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as VisitStatus | 'all')}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all-visits">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled-visits">
            Scheduled ({statusCounts.scheduled})
          </TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress-visits">
            In Progress ({statusCounts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-visits">
            Completed ({statusCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled-visits">
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
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
            <VisitMap
              visits={filteredVisits}
              isLoading={visitsLoading}
              onVisitSelect={setSelectedVisit}
              onCheckIn={(visit) => handleGPSAction(visit, 'check-in')}
              onCheckOut={(visit) => handleGPSAction(visit, 'check-out')}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Visit Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
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
        isLoading={checkInMutation.isPending || checkOutMutation.isPending}
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
