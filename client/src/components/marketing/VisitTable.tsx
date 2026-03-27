import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
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
    estimatedBudget?: string | number;
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
  onViewReport: (visit: VisitWithDetails) => void;
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
  onViewReport,
}: VisitTableProps) {
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(
    null
  );
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
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

  const canCheckIn = useCallback((visit: VisitWithDetails) => {
    const status = visit.status?.toLowerCase()?.trim();
    return status === "scheduled";
  }, []);

  const canCheckOut = useCallback((visit: VisitWithDetails) => {
    const status = visit.status?.toLowerCase()?.trim();
    return (status === "in_progress" || status === "upcoming") &&
      visit.actualStartTime &&
      !visit.actualEndTime;
  }, []);

  const openStatusUpdate = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
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

  const columns = useMemo<Column<VisitWithDetails>[]>(() => [
    {
      key: "visitNumber",
      header: "Deal Details",
      cell: (visit) => {
        return (
          <div className="space-y-1">
            <div className="font-bold text-slate-800">{visit.visitNumber}</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight">
              {getPurposeText(visit.purpose)}
            </div>
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
          <div className="font-bold text-slate-800">
            {visit.lead?.firstName} {visit.lead?.lastName}
          </div>
          {visit.lead?.companyName && (
            <div className="text-xs text-slate-500 font-medium">
              {visit.lead.companyName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "budget",
      header: "Estimated Budget",
      cell: (visit) => (
        <div className="font-bold text-primary">
          ₹{Number(visit.lead?.estimatedBudget || 0).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      key: "assignedToUser",
      header: "Assigned To",
      cell: (visit) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
            <User className="h-3 w-3 text-slate-500" />
          </div>
          <span className="text-xs font-bold text-slate-700">
            {visit.assignedToUser?.firstName}
          </span>
        </div>
      ),
    },
    {
      key: "plannedDate",
      header: "Date & Time",
      cell: (visit) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700">
              {format(new Date(visit.plannedDate), "MMM dd, yyyy")}
            </span>
          </div>
          {visit.plannedStartTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-slate-500">
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
            className={`${statusInfo.bgColor} ${statusInfo.color} capitalize flex items-center gap-1.5 w-fit border-none font-bold text-[10px] h-6 px-2.5`}
          >
            <StatusIcon className="h-3 w-3" />
            <span>
              {visit.status.replace("_", " ")}
            </span>
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: "visitAddress",
      header: "Location",
      cell: (visit) => (
        <div className="flex items-start gap-1.5 max-w-[200px]">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-500 truncate leading-relaxed">
            {visit.visitAddress}
            {visit.visitCity && `, ${visit.visitCity}`}
          </div>
        </div>
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
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
              >
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewReport(visit)} className="font-medium">
                <Eye className="h-4 w-4 mr-2 text-blue-500" />
                View Report
              </DropdownMenuItem>
              {visit.status?.toLowerCase() !== "completed" && (
                <DropdownMenuItem onClick={() => onEdit(visit)} className="font-medium">
                  <Edit className="h-4 w-4 mr-2 text-orange-500" />
                  Edit
                </DropdownMenuItem>
              )}
              {canCheckIn(visit) && (
                <DropdownMenuItem onClick={() => onCheckIn(visit)} className="font-medium">
                  <Navigation className="h-4 w-4 mr-2 text-green-500" />
                  Check In
                </DropdownMenuItem>
              )}
              {!["upcoming", "in_progress", "completed"].includes(visit.status?.toLowerCase()?.trim()) && (
                <DropdownMenuItem onClick={() => openStatusUpdate(visit)} className="font-medium">
                  <Timer className="h-4 w-4 mr-2 text-indigo-500" />
                  Update Status
                </DropdownMenuItem>
              )}
              {visit.status?.toLowerCase()?.trim() === "completed" && (
                <DropdownMenuItem onClick={() => onProofUpload(visit)} className="font-medium">
                  <Upload className="h-4 w-4 mr-2 text-primary" />
                  Upload Proof
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(visit)} className="text-red-600 font-bold">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [onEdit, onDelete, onCheckIn, onCheckOut, onProofUpload, onStatusUpdate, onViewReport, canCheckIn, canCheckOut]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={sortedVisits}
        columns={columns}
        searchable={false}
        className="bg-white rounded-lg border shadow-sm"
      />

      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl">
          <DialogHeader className="mb-4 border-b pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">Update Visit Status</DialogTitle>
            <DialogDescription className="text-slate-500">
              Change the status of visit {selectedVisit?.visitNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Status</label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as VisitStatus)}
              >
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes (Optional)</label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="min-h-[100px] bg-slate-50 border-slate-200 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStatusUpdateOpen(false)}
                className="font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                className="font-bold bg-primary hover:bg-primary/90"
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
