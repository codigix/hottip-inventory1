import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Navigation,
  CheckCircle,
  XCircle,
  Upload,
  Eye,
  Timer,
  FileText,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { FieldVisit } from "@shared/schema";

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

type VisitStatus = "scheduled" | "upcoming" | "completed" | "cancelled";

interface VisitTableProps {
  visits: VisitWithDetails[];
  isLoading: boolean;
  onEdit: (visit: VisitWithDetails) => void;
  onDelete: (visit: VisitWithDetails) => void;
  onCheckIn: (visit: VisitWithDetails) => void;
  onCheckOut: (visit: VisitWithDetails) => void;
  onProofUpload: (visit: VisitWithDetails) => void;
  onStatusUpdate?: (visit: VisitWithDetails, status: VisitStatus) => void;
}

export default function VisitTable({
  visits,
  isLoading,
  onEdit,
  onDelete,
  onCheckIn,
  onCheckOut,
  onProofUpload,
  onStatusUpdate,
}: VisitTableProps) {
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(
    null
  );
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<VisitStatus>("scheduled");
  const [statusNotes, setStatusNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Sort visits by createdAt/plannedDate (LIFO)
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const aDate = new Date(a.createdAt || a.plannedDate || 0).getTime();
      const bDate = new Date(b.createdAt || b.plannedDate || 0).getTime();
      return bDate - aDate;
    });
  }, [visits]);

  // Fetch visit history for the selected lead
  const { data: visitHistory = [] } = useQuery<VisitWithDetails[]>({
    queryKey: ["/api/field-visits", { leadId: selectedVisit?.leadId }],
    enabled: !!selectedVisit?.leadId && reportOpen,
  });

  // Fetch purpose logs for the selected visit
  const { data: purposeLogs = [] } = useQuery<any[]>({
    queryKey: [selectedVisit ? `/api/field-visits/${selectedVisit.id}/purpose-logs` : null],
    enabled: !!selectedVisit?.id && reportOpen,
  });

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(" ", "_");
    switch (normalizedStatus) {
      case "scheduled":
        return {
          variant: "secondary" as const,
          icon: Calendar,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900",
        };
      case "upcoming":
      case "in_progress":
        return {
          variant: "default" as const,
          icon: Timer,
          color: "text-orange-600",
          bgColor: "bg-orange-100 dark:bg-orange-900",
        };
      case "completed":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900",
        };
      case "cancelled":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900",
        };
      default:
        return {
          variant: "secondary" as const,
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100 dark:bg-gray-900",
        };
    }
  };

  // Map purpose for display
  const getPurposeText = (purpose: string) => {
    const purposeMap: Record<string, string> = {
      initial_meeting: "Initial Meeting",
      demo: "Product Demo",
      follow_up: "Follow Up",
      quotation_discussion: "Quotation Discussion",
      negotiation: "Negotiation",
      closing: "Closing",
      support: "Support",
      other: "Other",
    };
    return purposeMap[purpose] || purpose;
  };

  const canCheckIn = (visit: VisitWithDetails) =>
    visit.status === "scheduled" && !visit.actualStartTime;

  const canCheckOut = (visit: VisitWithDetails) =>
    (visit.status === "in_progress" || visit.status === "upcoming" || visit.status === "Upcoming") &&
    visit.actualStartTime &&
    !visit.actualEndTime;

  const openStatusUpdate = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    // Normalize status to lowercase for the select component
    let currentStatus = visit.status.toLowerCase().replace(" ", "_") as VisitStatus;
    if (currentStatus === ("in_progress" as any)) currentStatus = "upcoming";
    setNewStatus(currentStatus);
    setStatusUpdateOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (selectedVisit && onStatusUpdate) {
      onStatusUpdate(selectedVisit, newStatus);
      setStatusUpdateOpen(false);
      setStatusNotes("");
    }
  };

  const getVisitDuration = (visit: VisitWithDetails) => {
    if (visit.actualStartTime && visit.actualEndTime) {
      const start = new Date(visit.actualStartTime);
      const end = new Date(visit.actualEndTime);
      const durationMs = end.getTime() - start.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return null;
  };

  const columns = useMemo<Column<VisitWithDetails>[]>(() => [
    {
      key: "visitNumber",
      header: "Visit Details",
      cell: (visit) => {
        const duration = getVisitDuration(visit);
        return (
          <div className="space-y-1">
            <div className="font-light">{visit.visitNumber}</div>
            <div className="text-xs text-gray-500">
              {getPurposeText(visit.purpose)}
            </div>
            {duration && (
              <div className="text-xs text-green-600 flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Duration: {duration}</span>
              </div>
            )}
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "lead",
      header: "Customer",
      cell: (visit) => (
        <div className="space-y-1">
          <div className="">
            {visit.lead?.firstName} {visit.lead?.lastName}
          </div>
          {visit.lead?.companyName && (
            <div className="text-xs text-gray-500">
              {visit.lead.companyName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "assignedToUser",
      header: "Assigned To",
      cell: (visit) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-xs">
            {visit.assignedToUser?.firstName}{" "}
            {visit.assignedToUser?.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "plannedDate",
      header: "Date & Time",
      cell: (visit) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-xs">
              {format(new Date(visit.plannedDate), "MMM dd, yyyy")}
            </span>
          </div>
          {visit.plannedStartTime && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs">
                {format(new Date(visit.plannedStartTime), "hh:mm a")}
              </span>
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (visit) => {
        const statusInfo = getStatusInfo(visit.status);
        const StatusIcon = statusInfo.icon;
        return (
          <Badge
            variant={statusInfo.variant}
            className={`${statusInfo.bgColor} ${statusInfo.color} capitalize flex items-center space-x-1 w-fit`}
          >
            <StatusIcon className="h-3 w-3" />
            <span>{visit.status.toLowerCase().replace("_", " ") === "in progress" ? "Upcoming" : visit.status.replace("_", " ")}</span>
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: "visitAddress",
      header: "Location",
      cell: (visit) => (
        <>
          <div className="text-xs text-gray-500 max-w-[200px] truncate">
            {visit.visitAddress}
            {visit.visitCity && `, ${visit.visitCity}`}
          </div>
          {visit.latitude && visit.longitude && (
            <div className="text-xs text-green-600 flex items-center space-x-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span>GPS Available</span>
            </div>
          )}
        </>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (visit) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                data-testid={`visit-actions-${visit.visitNumber}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(visit)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setSelectedVisit(visit);
                  setReportOpen(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                View Report
              </DropdownMenuItem>

              {canCheckIn(visit) && (
                <DropdownMenuItem onClick={() => onCheckIn(visit)}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Check In
                </DropdownMenuItem>
              )}

              {canCheckOut(visit) && (
                <DropdownMenuItem onClick={() => onCheckOut(visit)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check Out
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => openStatusUpdate(visit)}
              >
                <Timer className="h-4 w-4 mr-2" />
                Update Status
              </DropdownMenuItem>

              {visit.status === "completed" && (
                <DropdownMenuItem
                  onClick={() => onProofUpload(visit)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Proof
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(visit)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }
  ], [onEdit, onCheckIn, onCheckOut, onStatusUpdate, onProofUpload]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg  mb-2">No Field Visits Found</h3>
          <p className="text-gray-500">
            No visits match your current filters. Try adjusting your search
            criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          data={visits}
          columns={columns}
          isLoading={isLoading}
          searchable={false}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {visits.map((visit) => {
          const statusInfo = getStatusInfo(visit.status);
          const StatusIcon = statusInfo.icon;
          const duration = getVisitDuration(visit);

          return (
            <Card
              key={visit.id}
              data-testid={`visit-card-${visit.visitNumber}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div
                      className=""
                      data-testid={`visit-number-${visit.visitNumber}`}
                    >
                      {visit.visitNumber}
                    </div>
                    <Badge
                      variant={statusInfo.variant}
                      className={`${statusInfo.bgColor} ${statusInfo.color} capitalize flex items-center space-x-1 w-fit`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{visit.status.toLowerCase().replace("_", " ") === "in progress" ? "Upcoming" : visit.status.replace("_", " ")}</span>
                    </Badge>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        data-testid={`visit-actions-${visit.visitNumber}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(visit)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedVisit(visit);
                          setReportOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        View Report
                      </DropdownMenuItem>

                      {canCheckIn(visit) && (
                        <DropdownMenuItem onClick={() => onCheckIn(visit)}>
                          <Navigation className="h-4 w-4 mr-2" />
                          Check In
                        </DropdownMenuItem>
                      )}

                      {canCheckOut(visit) && (
                        <DropdownMenuItem onClick={() => onCheckOut(visit)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check Out
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => openStatusUpdate(visit)}>
                        <Timer className="h-4 w-4 mr-2" />
                        Update Status
                      </DropdownMenuItem>

                      {visit.status === "completed" && (
                        <DropdownMenuItem onClick={() => onProofUpload(visit)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Proof
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onDelete(visit)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-light">
                      {visit.lead?.firstName} {visit.lead?.lastName}
                    </span>
                    {visit.lead?.companyName && (
                      <span className="text-sm text-gray-500">
                        - {visit.lead.companyName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {format(new Date(visit.plannedDate), "MMM dd, yyyy")}
                    </span>
                    {visit.plannedStartTime && (
                      <>
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {format(new Date(visit.plannedStartTime), "hh:mm a")}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {visit.visitAddress}
                      {visit.visitCity && `, ${visit.visitCity}`}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    Purpose: {getPurposeText(visit.purpose)}
                  </div>

                  {duration && (
                    <div className="text-xs text-green-600 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Duration: {duration}</span>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    Assigned to: {visit.assignedToUser?.firstName}{" "}
                    {visit.assignedToUser?.lastName}
                  </div>
                </div>

                <div className="flex space-x-2 mt-3">
                  {canCheckIn(visit) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCheckIn(visit)}
                      className="flex-1"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Check In
                    </Button>
                  )}

                  {canCheckOut(visit) && (
                    <Button
                      size="sm"
                      onClick={() => onCheckOut(visit)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Check Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Visit Status</DialogTitle>
            <DialogDescription>
              Change the status of visit {selectedVisit?.visitNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-light">New Status</label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as VisitStatus)}
              >
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-light">Notes (Optional)</label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                data-testid="textarea-status-notes"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setStatusUpdateOpen(false)}
                data-testid="button-cancel-status"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                data-testid="button-update-status"
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Visit Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2  text-slate-800 dark:text-slate-100">
              <FileText className="h-5 w-5 text-blue-500" />
              Field Visit Report - {selectedVisit?.visitNumber}
            </DialogTitle>
            <DialogDescription className="text-slate-500  italic">
              Detailed information about the visit and activities
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-primary rounded-lg">
                  <p className="text-xs text-slate-500   ">Date & Time</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm ">
                      {format(new Date(selectedVisit.plannedDate), "MMMM dd, yyyy")}
                    </span>
                  </div>
                  {selectedVisit.plannedStartTime && (
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm ">
                        {format(new Date(selectedVisit.plannedStartTime), "hh:mm a")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 p-3 bg-slate-50 dark:bg-primary rounded-lg">
                  <p className="text-xs text-slate-500   ">Status & Performance</p>
                  <div className="mt-1">
                    <Badge
                      variant={getStatusInfo(selectedVisit.status).variant}
                      className={`${getStatusInfo(selectedVisit.status).bgColor} ${getStatusInfo(selectedVisit.status).color} capitalize flex items-center space-x-1 w-fit`}
                    >
                      {selectedVisit.status.toLowerCase().replace("_", " ") === "in progress" ? "Upcoming" : selectedVisit.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {getVisitDuration(selectedVisit) && (
                    <div className="flex items-center gap-2 mt-1">
                      <Timer className="h-4 w-4 text-green-500" />
                      <span className="text-sm ">Duration: {getVisitDuration(selectedVisit)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 p-3 bg-slate-50 dark:bg-primary rounded-lg">
                  <p className="text-xs text-slate-500   ">Customer / Lead</p>
                  <p className="text-sm ">
                    {selectedVisit.lead?.firstName} {selectedVisit.lead?.lastName}
                  </p>
                  {selectedVisit.lead?.companyName && (
                    <p className="text-xs text-slate-500">{selectedVisit.lead.companyName}</p>
                  )}
                </div>

                <div className="space-y-1 p-3 bg-slate-50 dark:bg-primary rounded-lg">
                  <p className="text-xs text-slate-500   ">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm ">
                      {selectedVisit.assignedToUser?.firstName} {selectedVisit.assignedToUser?.lastName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 dark:bg-primary rounded-lg">
                <p className="text-xs text-slate-500   ">Location & Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-sm">
                    {selectedVisit.visitAddress}
                    {selectedVisit.visitCity && `, ${selectedVisit.visitCity}`}
                  </span>
                </div>
                {selectedVisit.latitude && selectedVisit.longitude && (
                  <p className="text-xs text-green-600  pl-6">
                    GPS Coordinates: {selectedVisit.latitude}, {selectedVisit.longitude}
                  </p>
                )}
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-primary rounded-lg border-l-4 border-blue-500">
                <p className="text-xs text-slate-500    mb-2">VISIT PURPOSE & SUMMARY</p>
                <div className="space-y-3">
                  {purposeLogs && purposeLogs.length > 0 ? (
                    purposeLogs
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                          <div className="space-y-1">
                            <p className="text-sm  text-slate-800 dark:text-slate-200">
                              {getPurposeText(log.purpose)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(log.visitDate), "dd MMM yyyy")}</span>
                            </div>
                          </div>
                          <div className="text-xs  text-green-600 ">
                            {log.status}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-slate-400" />
                      <p className="text-xs text-slate-500 italic">No visit purposes logged yet</p>
                    </div>
                  )}
                </div>

                {selectedVisit.notes && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500    mb-1">Current Visit Notes</p>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedVisit.notes}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => setReportOpen(false)}
                  className="bg-primary hover:bg-primary text-white  px-6"
                >
                  Close Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
