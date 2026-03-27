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
  LayoutGrid,
  List,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  User,
  Download,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import VisitForm from "@/components/marketing/VisitForm";
import VisitTable from "@/components/marketing/VisitTable";
import VisitCard from "@/components/marketing/VisitCard";
import VisitMap from "@/components/marketing/VisitMap";
import GPSModal from "@/components/marketing/GPSModal";
import ProofUpload from "@/components/marketing/ProofUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";

import type { FieldVisit, InsertFieldVisit, User as UserType, Lead } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: { 
    id: string; 
    firstName: string; 
    lastName: string; 
    companyName?: string;
    status?: string;
    estimatedBudget?: string | number;
  };
  assignedToUser?: { id: string; firstName: string; lastName: string };
  assignedByUser?: { id: string; firstName: string; lastName: string };
}

type VisitStatus = "scheduled" | "upcoming" | "completed" | "cancelled";
type AnalysisCategory = "all" | "converted" | "quotation" | "won" | "lost";
type ViewMode = "list" | "kanban" | "map";

export default function FieldVisits() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [categoryFilter, setCategoryFilter] = useState<AnalysisCategory>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [gpsAction, setGpsAction] = useState<"check-in" | "check-out">("check-in");
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  /** ===== Queries ===== **/
  const { data: visitsData, isLoading: visitsLoading } = useQuery<VisitWithDetails[]>({
    queryKey: ["/field-visits"],
    queryFn: () => apiRequest("/api/field-visits"),
  });
  const safeVisits = Array.isArray(visitsData) ? visitsData : [];

  const { data: usersData } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });
  const users = Array.isArray(usersData) ? usersData : [];

  const { data: leadsData } = useQuery<Lead[]>({
    queryKey: ["/api/marketing/leads"],
    queryFn: () => apiRequest("/api/marketing/leads"),
  });
  const leads = Array.isArray(leadsData) ? leadsData : [];

  const kanbanData = useMemo(() => {
    const columns = {
      converted: [] as VisitWithDetails[],
      quotation: [] as VisitWithDetails[],
      won: [] as VisitWithDetails[],
      lost: [] as VisitWithDetails[],
    };

    safeVisits.forEach((v) => {
      // Filtering for Kanban board
      const matchesAssignee = assigneeFilter === "all" || v.assignedTo === assigneeFilter;

      if (matchesAssignee) {
        if (v.lead?.status === "lost") {
          columns.lost.push(v);
        } else if (v.purpose === "closing" && v.status?.toLowerCase() === "completed") {
          columns.won.push(v);
        } else if (v.purpose === "quotation_discussion") {
          columns.quotation.push(v);
        } else if (v.lead?.status === "converted") {
          columns.converted.push(v);
        }
      }
    });

    return columns;
  }, [safeVisits, assigneeFilter]);

  const analysisMetrics = useMemo(() => {
    const metrics = {
      all: { count: 0, budget: 0 },
      converted: { count: 0, budget: 0 },
      quotation: { count: 0, budget: 0 },
      won: { count: 0, budget: 0 },
      lost: { count: 0, budget: 0 },
    };
    safeVisits.forEach((v) => {
      const budget = Number(v.lead?.estimatedBudget || 0);
      metrics.all.count++;
      metrics.all.budget += budget;
      
      if (v.lead?.status === "converted") {
        metrics.converted.count++;
        metrics.converted.budget += budget;
      }
      if (v.purpose === "quotation_discussion") {
        metrics.quotation.count++;
        metrics.quotation.budget += budget;
      }
      if (v.purpose === "closing" && v.status?.toLowerCase() === "completed") {
        metrics.won.count++;
        metrics.won.budget += budget;
      }
      if (v.lead?.status === "lost") {
        metrics.lost.count++;
        metrics.lost.budget += budget;
      }
    });
    return metrics;
  }, [safeVisits]);

  const displayMetrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayVisits = safeVisits.filter(v => {
      if (!v.plannedDate) return false;
      return new Date(v.plannedDate).toISOString().split("T")[0] === today;
    }).length;

    const completionRate = safeVisits.length
      ? (safeVisits.filter(v => v.status?.toLowerCase() === "completed").length / safeVisits.length) * 100
      : 0;

    return {
      todayVisits,
      completionRate,
      totalBudget: analysisMetrics.all.budget,
    };
  }, [safeVisits, analysisMetrics]);

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

  const filteredVisits = useMemo(() => {
    return safeVisits.filter((v) => {
      let matchesCategory = categoryFilter === "all";
      if (categoryFilter === "converted") {
        matchesCategory = v.lead?.status === "converted";
      } else if (categoryFilter === "quotation") {
        matchesCategory = v.purpose === "quotation_discussion";
      } else if (categoryFilter === "won") {
        matchesCategory = v.purpose === "closing" && v.status?.toLowerCase() === "completed";
      } else if (categoryFilter === "lost") {
        matchesCategory = v.lead?.status === "lost";
      }

      const matchesAssignee = assigneeFilter === "all" || v.assignedTo === assigneeFilter;
        
      return matchesCategory && matchesAssignee;
    });
  }, [safeVisits, categoryFilter, assigneeFilter]);

  /** ===== Mutations ===== **/
  const createVisitMutation = useMutation({
    mutationFn: (data: InsertFieldVisit) =>
      apiRequest("/api/field-visits", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Deal scheduled successfully!" });
      setIsFormOpen(false);
    },
  });

  const updateVisitMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/field-visits/${data.id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Deal updated successfully!" });
      setIsFormOpen(false);
      setSelectedVisit(null);
    },
  });

  const deleteVisitMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/field-visits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Deal deleted successfully" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiRequest(`/api/field-visits/${id}/status`, { 
        method: "PUT",
        body: { status, notes }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Deal status updated successfully!" });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: any }) =>
      apiRequest(`/api/field-visits/${visitId}/check-in`, { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Checked in successfully!" });
      setGpsModalOpen(false);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: any }) =>
      apiRequest(`/api/field-visits/${visitId}/check-out`, { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
      toast({ title: "Checked out successfully!" });
      setGpsModalOpen(false);
    },
  });

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

  const handleViewReport = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setReportOpen(true);
  };

  const handleCheckIn = (locationData: any) => {
    if (selectedVisit?.id) {
      checkInMutation.mutate({ visitId: selectedVisit.id, data: locationData });
    }
  };

  const handleCheckOut = (locationData: any) => {
    if (selectedVisit?.id) {
      checkOutMutation.mutate({ visitId: selectedVisit.id, data: locationData });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const visitId = e.dataTransfer.getData("visitId");
    if (!visitId) return;

    const visit = safeVisits.find((v) => v.id === visitId);
    if (!visit) return;

    try {
      if (columnId === "lost") {
        if (visit.leadId) {
          await apiRequest(`/api/marketing/leads/${visit.leadId}/status`, {
            method: "PUT",
            body: { status: "lost" },
          });
          toast({ title: "Lead marked as lost" });
        }
      } else if (columnId === "won") {
        updateVisitMutation.mutate({
          ...visit,
          purpose: "closing",
          status: "Completed",
          actualEndTime: new Date().toISOString(),
        });
        toast({ title: "Deal marked as Won and Completed" });
      } else if (columnId === "quotation") {
        updateVisitMutation.mutate({
          ...visit,
          purpose: "quotation_discussion",
        });
        toast({ title: "Deal updated to Quotation Discussion" });
      } else if (columnId === "converted") {
        if (visit.leadId) {
          await apiRequest(`/api/marketing/leads/${visit.leadId}/convert`, {
            method: "POST",
          });
          toast({ title: "Lead converted to deal" });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/field-visits"] });
    } catch (error) {
      console.error("Drop failed:", error);
      toast({
        title: "Action failed",
        description: "Could not update status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Deals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule, track, and manage deals with GPS verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
            <Button
              variant={viewMode === 'list' ? 'white' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-8 px-3 ${viewMode === 'list' ? 'bg-white shadow-sm font-bold text-primary' : 'text-slate-500'}`}
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'white' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={`h-8 px-3 ${viewMode === 'kanban' ? 'bg-white shadow-sm font-bold text-primary' : 'text-slate-500'}`}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'map' ? 'white' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={`h-8 px-3 ${viewMode === 'map' ? 'bg-white shadow-sm font-bold text-primary' : 'text-slate-500'}`}
            >
              <Map className="h-4 w-4 mr-1.5" />
              Map
            </Button>
          </div>
          <Button 
            onClick={() => {
              setSelectedVisit(null);
              setIsFormOpen(true);
            }} 
            className="bg-primary hover:bg-primary/90 shadow-sm font-bold transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Deal
          </Button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between font-bold">
              All Deals
              <Users className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{analysisMetrics.all.count}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Budget:</span>
              <span className="text-[10px] text-slate-600 font-bold">₹{analysisMetrics.all.budget.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between font-bold">
              Converted Lead
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{analysisMetrics.converted.count}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Budget:</span>
              <span className="text-[10px] text-slate-600 font-bold">₹{analysisMetrics.converted.budget.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between font-bold">
              Quotation
              <Calendar className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{analysisMetrics.quotation.count}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Budget:</span>
              <span className="text-[10px] text-slate-600 font-bold">₹{analysisMetrics.quotation.budget.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between font-bold">
              Won
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{analysisMetrics.won.count}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Budget:</span>
              <span className="text-[10px] text-slate-600 font-bold">₹{analysisMetrics.won.budget.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center justify-between font-bold">
              Lost
              <XCircle className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{analysisMetrics.lost.count}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Budget:</span>
              <span className="text-[10px] text-slate-600 font-bold">₹{analysisMetrics.lost.budget.toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Filters:</span>
          </div>
          
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AnalysisCategory)}>
            <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200 font-medium">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="converted">Converted Lead</SelectItem>
              <SelectItem value="quotation">Quotation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-slate-50 border-slate-200 font-medium">
              <SelectValue placeholder="Assignee" />
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

          {(categoryFilter !== "all" || assigneeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setAssigneeFilter("all");
              }}
              className="text-slate-500 hover:text-slate-800 h-9 font-bold"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {viewMode === 'list' ? (
          <VisitTable
            visits={filteredVisits}
            isLoading={visitsLoading}
            onEdit={handleEditVisit}
            onDelete={handleDeleteVisit}
            onCheckIn={(v) => handleGPSAction(v, 'check-in')}
            onCheckOut={(v) => handleGPSAction(v, 'check-out')}
            onStatusUpdate={handleStatusUpdate}
            onProofUpload={handleProofUpload}
            onViewReport={handleViewReport}
          />
        ) : viewMode === 'kanban' ? (
          <div className="pb-4 h-[calc(100vh-320px)] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
              {[
                { id: "converted", label: "Converted Lead", color: "bg-blue-500", border: "border-t-blue-500", data: kanbanData.converted },
                { id: "quotation", label: "Quotation", color: "bg-yellow-500", border: "border-t-yellow-500", data: kanbanData.quotation },
                { id: "won", label: "Won", color: "bg-green-500", border: "border-t-green-500", data: kanbanData.won },
                { id: "lost", label: "Lost", color: "bg-red-500", border: "border-t-red-500", data: kanbanData.lost },
              ].map((column) => {
                const totalBudget = column.data.reduce((sum, v) => sum + Number(v.lead?.estimatedBudget || 0), 0);
                
                return (
                  <div 
                    key={column.id} 
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                    className={`flex flex-col bg-slate-50/80 rounded-lg border-t-4 ${column.border} shadow-sm overflow-hidden min-w-0 transition-all ${
                      dragOverColumn === column.id ? "bg-slate-200/80 ring-2 ring-primary/20 scale-[1.01]" : ""
                    }`}
                  >
                    <div className="p-3 border-b bg-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${column.color}`} />
                        <span className="font-bold text-[12px] text-slate-700 truncate uppercase tracking-tight">{column.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white/50 border-b flex items-center justify-between text-[10px] text-slate-500 shrink-0 font-bold">
                      <span>{column.data.length} Deals</span>
                      <span className="text-primary">₹{totalBudget.toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                      {column.data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg py-16 bg-white/30">
                          <span className="text-[11px] text-slate-400 font-medium">No Visits</span>
                        </div>
                      ) : (
                        column.data.map((visit) => (
                          <VisitCard
                            key={visit.id}
                            visit={visit}
                            onEdit={handleEditVisit}
                            onDelete={handleDeleteVisit}
                            onCheckIn={(v) => handleGPSAction(v, 'check-in')}
                            onCheckOut={(v) => handleGPSAction(v, 'check-out')}
                            onStatusUpdate={handleStatusUpdate}
                            onProofUpload={handleProofUpload}
                            onViewReport={handleViewReport}
                            variant="kanban"
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[600px] bg-slate-50 rounded-lg border shadow-inner overflow-hidden">
            <VisitMap
              visits={filteredVisits}
              isLoading={visitsLoading}
              onVisitSelect={setSelectedVisit}
              onCheckIn={(visit) => handleGPSAction(visit, 'check-in')}
              onCheckOut={(visit) => handleGPSAction(visit, 'check-out')}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader className="mb-6 border-b pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">
              {selectedVisit ? 'Edit Visit' : 'Schedule New Visit'}
            </DialogTitle>
            <DialogDescription>
              {selectedVisit ? 'Update the details for this field visit.' : 'Fill out the form below to schedule a new client visit.'}
            </DialogDescription>
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

      <GPSModal
        open={gpsModalOpen}
        onOpenChange={setGpsModalOpen}
        visit={selectedVisit}
        action={gpsAction}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        isLoading={gpsAction === 'check-in' ? checkInMutation.isPending : checkOutMutation.isPending}
      />

      <ProofUpload
        open={proofModalOpen}
        onOpenChange={setProofModalOpen}
        visit={selectedVisit}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['/field-visits'] });
          setProofModalOpen(false);
        }}
      />

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader className="mb-6 border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-slate-800 text-xl font-bold">
              <FileText className="h-6 w-6 text-primary" />
              Field Visit Report - {selectedVisit?.visitNumber}
            </DialogTitle>
            <DialogDescription className="text-slate-500 italic">
              Detailed information about the visit and activities
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Date & Time</p>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-slate-700">
                      {format(new Date(selectedVisit.plannedDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge className="bg-primary/10 text-primary border-none font-bold">
                      {selectedVisit.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm uppercase tracking-tight">Location Details</span>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {selectedVisit.visitAddress}{selectedVisit.visitCity ? `, ${selectedVisit.visitCity}` : ""}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setReportOpen(false)} className="font-bold">
                  Close
                </Button>
                <Button className="font-bold bg-primary hover:bg-primary/90">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
