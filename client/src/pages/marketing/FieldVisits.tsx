import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Map, Table, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface VisitMetrics {
  totalVisits: number;
  todayVisits: number;
  scheduledVisits: number;
  inProgressVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  completionRate: number;
  averageDuration: number;
}

type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type ViewMode = 'table' | 'map';

export default function FieldVisits() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [gpsAction, setGpsAction] = useState<'check-in' | 'check-out'>('check-in');
  const [proofModalOpen, setProofModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch field visits with error handling
  const { data: visits = [], isLoading: visitsLoading, error: visitsError } = useQuery<VisitWithDetails[]>({
    queryKey: ['/api/field-visits'],
    meta: { errorMessage: "Failed to load field visits" }
  });

  // Fetch today's visits
  const { data: todayVisits = [] } = useQuery<VisitWithDetails[]>({
    queryKey: ['/api/field-visits/today'],
    meta: { errorMessage: "Failed to load today's visits" }
  });

  // Fetch visit metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<VisitMetrics>({
    queryKey: ['/api/field-visits/metrics'],
    meta: { errorMessage: "Failed to load visit metrics" }
  });

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    meta: { errorMessage: "Failed to load users" }
  });

  // Fetch leads for visit creation
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    meta: { errorMessage: "Failed to load leads" }
  });

  // Create visit mutation
  const createVisitMutation = useMutation({
    mutationFn: (data: InsertFieldVisit) => apiRequest('/api/field-visits', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/metrics'] });
      toast({ title: "Visit scheduled successfully!" });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error scheduling visit", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update visit mutation
  const updateVisitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertFieldVisit> }) => 
      apiRequest(`/api/field-visits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/metrics'] });
      toast({ title: "Visit updated successfully!" });
      setIsFormOpen(false);
      setSelectedVisit(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating visit", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete visit mutation
  const deleteVisitMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/field-visits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/metrics'] });
      toast({ title: "Visit deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting visit", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: ({ id, location }: { id: string; location: { latitude: number; longitude: number; location?: string; photoPath?: string } }) =>
      apiRequest(`/api/field-visits/${id}/check-in`, { method: 'POST', body: JSON.stringify(location) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/today'] });
      toast({ title: "Successfully checked in!" });
      setGpsModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error checking in", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: { 
        latitude: number; 
        longitude: number; 
        location?: string; 
        photoPath?: string;
        visitNotes?: string;
        outcome?: string;
        nextAction?: string;
      } 
    }) =>
      apiRequest(`/api/field-visits/${id}/check-out`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/today'] });
      toast({ title: "Successfully checked out!" });
      setGpsModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error checking out", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: VisitStatus; notes?: string }) =>
      apiRequest(`/api/field-visits/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/field-visits/today'] });
      toast({ title: "Visit status updated!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter visits based on status, assignee, and search term
  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || visit.assignedTo === assigneeFilter;
      const matchesSearch = !searchTerm || 
        visit.visitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.visitAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.lead?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.lead?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.lead?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesAssignee && matchesSearch;
    });
  }, [visits, statusFilter, assigneeFilter, searchTerm]);

  // Get status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = visits.reduce((acc, visit) => {
      acc[visit.status] = (acc[visit.status] || 0) + 1;
      return acc;
    }, {} as Record<VisitStatus, number>);
    
    return {
      all: visits.length,
      scheduled: counts.scheduled || 0,
      in_progress: counts.in_progress || 0,
      completed: counts.completed || 0,
      cancelled: counts.cancelled || 0
    };
  }, [visits]);

  // Handle form submission
  const handleFormSubmit = (data: InsertFieldVisit) => {
    if (selectedVisit) {
      updateVisitMutation.mutate({ id: selectedVisit.id, data });
    } else {
      createVisitMutation.mutate(data);
    }
  };

  // Handle visit edit
  const handleEditVisit = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setIsFormOpen(true);
  };

  // Handle visit delete
  const handleDeleteVisit = (visit: VisitWithDetails) => {
    if (confirm(`Are you sure you want to delete visit ${visit.visitNumber}?`)) {
      deleteVisitMutation.mutate(visit.id);
    }
  };

  // Handle GPS actions
  const handleGPSAction = (visit: VisitWithDetails, action: 'check-in' | 'check-out') => {
    setSelectedVisit(visit);
    setGpsAction(action);
    setGpsModalOpen(true);
  };

  // Handle GPS check-in
  const handleCheckIn = (location: { latitude: number; longitude: number; location?: string; photoPath?: string }) => {
    if (selectedVisit) {
      checkInMutation.mutate({ id: selectedVisit.id, location });
    }
  };

  // Handle GPS check-out
  const handleCheckOut = (data: { 
    latitude: number; 
    longitude: number; 
    location?: string; 
    photoPath?: string;
    visitNotes?: string;
    outcome?: string;
    nextAction?: string;
  }) => {
    if (selectedVisit) {
      checkOutMutation.mutate({ id: selectedVisit.id, data });
    }
  };

  // Handle status update
  const handleStatusUpdate = (visit: VisitWithDetails, status: VisitStatus, notes?: string) => {
    updateStatusMutation.mutate({ id: visit.id, status, notes });
  };

  // Handle proof upload
  const handleProofUpload = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setProofModalOpen(true);
  };

  // Default metrics if loading
  const displayMetrics: VisitMetrics = metrics || {
    totalVisits: 0,
    todayVisits: 0,
    scheduledVisits: 0,
    inProgressVisits: 0,
    completedVisits: 0,
    cancelledVisits: 0,
    completionRate: 0,
    averageDuration: 0
  };

  if (visitsError) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Field Visits</h2>
              <p className="text-muted-foreground">
                Failed to load field visits data. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
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
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
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
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
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
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
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
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
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
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
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
          queryClient.invalidateQueries({ queryKey: ['/api/field-visits'] });
          setProofModalOpen(false);
        }}
      />
    </div>
  );
}