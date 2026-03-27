import {
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  User,
  Navigation,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  FileText,
  Building,
  Phone,
  MessageSquare,
  Eye,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { FieldVisit } from "@shared/schema";

interface VisitWithDetails extends FieldVisit {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    status?: string;
    estimatedBudget?: string | number;
  };
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

type VisitStatus = "scheduled" | "upcoming" | "completed" | "cancelled";

interface VisitCardProps {
  visit: VisitWithDetails;
  onEdit: (visit: VisitWithDetails) => void;
  onDelete: (visit: VisitWithDetails) => void;
  onCheckIn: (visit: VisitWithDetails) => void;
  onCheckOut: (visit: VisitWithDetails) => void;
  onProofUpload: (visit: VisitWithDetails) => void;
  onStatusUpdate?: (visit: VisitWithDetails, status: VisitStatus) => void;
  onViewReport: (visit: VisitWithDetails) => void;
  variant?: "default" | "kanban";
}

export default function VisitCard({
  visit,
  onEdit,
  onDelete,
  onCheckIn,
  onCheckOut,
  onProofUpload,
  onStatusUpdate,
  onViewReport,
  variant = "default",
}: VisitCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("visitId", visit.id);
    e.dataTransfer.effectAllowed = "move";
  };

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

  const statusInfo = getStatusInfo(visit.status);
  const StatusIcon = statusInfo.icon;

  const canCheckIn = visit.status?.toLowerCase()?.trim() === "scheduled";
  const canCheckOut = (visit.status?.toLowerCase()?.trim() === "in_progress" || visit.status?.toLowerCase()?.trim() === "upcoming") &&
    visit.actualStartTime &&
    !visit.actualEndTime;

  const formatCurrency = (amount: string | number | undefined) =>
    amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "₹0";

  if (variant === "kanban") {
    return (
      <Card
        draggable
        onDragStart={handleDragStart}
        className="group relative bg-white hover:shadow-md transition-all border-slate-200 cursor-grab active:cursor-grabbing"
      >
        <CardHeader className="p-3 pb-0 space-y-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-[13px] font-bold text-slate-800 truncate leading-tight">
              {visit.lead?.firstName} {visit.lead?.lastName}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewReport(visit)}>
                  <Eye className="h-4 w-4 mr-2" /> View Report
                </DropdownMenuItem>
                {visit.status?.toLowerCase() !== "completed" && (
                  <DropdownMenuItem onClick={() => onEdit(visit)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {!["upcoming", "in_progress", "completed"].includes(visit.status?.toLowerCase()?.trim()) && onStatusUpdate && (
                  <DropdownMenuItem onClick={() => onStatusUpdate(visit, "upcoming")}>
                    <Timer className="h-4 w-4 mr-2" /> Update Status
                  </DropdownMenuItem>
                )}
                {visit.status?.toLowerCase()?.trim() === "completed" && (
                  <DropdownMenuItem onClick={() => onProofUpload(visit)}>
                    <Upload className="h-4 w-4 mr-2" /> Upload Proof
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(visit)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2 pb-2 space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center text-[11px] text-slate-600">
              <Building className="h-3 w-3 mr-2 text-primary/70 shrink-0" />
              <span className="truncate font-medium">{visit.lead?.companyName || "No Company"}</span>
            </div>
            <div className="flex items-center text-[11px] text-slate-600">
              <User className="h-3 w-3 mr-2 text-primary/70 shrink-0" />
              <span className="truncate">{visit.assignedToUser?.firstName} {visit.assignedToUser?.lastName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[9px] py-0 px-1.5 h-4 capitalize border-none font-semibold">
                {getPurposeText(visit.purpose)}
              </Badge>
              <Badge
                variant={statusInfo.variant}
                className={`${statusInfo.bgColor} ${statusInfo.color} capitalize text-[9px] h-4 py-0 px-1.5 border-none font-semibold`}
              >
                {visit.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Deal Date</p>
              <p className="text-[10px] text-slate-700 font-bold">
                {format(new Date(visit.plannedDate), "MMM dd, yyyy")}
              </p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Estimated Budget</p>
              <p className="text-[10px] text-primary font-bold">
                {formatCurrency(visit.lead?.estimatedBudget)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
            <MapPin className="h-3 w-3 mr-1.5 mt-0.5 text-slate-400 shrink-0" />
            <span className="line-clamp-2 leading-snug">{visit.visitAddress}</span>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex justify-end gap-1.5">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-50">
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-50">
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500 hover:bg-orange-50" onClick={() => onViewReport(visit)}>
              <FileText className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="ml-auto">
            {canCheckIn && (
              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 py-0 border-primary/20 text-primary hover:bg-primary/5" onClick={() => onCheckIn(visit)}>
                Check In
              </Button>
            )}
            {canCheckOut && (
              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 py-0 border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => onCheckOut(visit)}>
                Check Out
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-[14px] font-bold text-slate-800 truncate max-w-[180px]">
              {visit.lead?.firstName} {visit.lead?.lastName}
            </CardTitle>
            {visit.lead?.companyName && (
              <p className="text-xs text-slate-500 truncate max-w-[180px] font-medium">
                {visit.lead.companyName}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewReport(visit)}>
                <Eye className="mr-2 h-4 w-4" /> View Report
              </DropdownMenuItem>
              {visit.status?.toLowerCase() !== "completed" && (
                <DropdownMenuItem onClick={() => onEdit(visit)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {!["upcoming", "in_progress", "completed"].includes(visit.status?.toLowerCase()?.trim()) && onStatusUpdate && (
                <DropdownMenuItem onClick={() => onStatusUpdate(visit, "upcoming")}>
                  <Timer className="h-4 w-4 mr-2" /> Update Status
                </DropdownMenuItem>
              )}
              {visit.status?.toLowerCase()?.trim() === "completed" && (
                <DropdownMenuItem onClick={() => onProofUpload(visit)}>
                  <Upload className="h-4 w-4 mr-2" /> Upload Proof
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(visit)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge
            variant={statusInfo.variant}
            className={`${statusInfo.bgColor} ${statusInfo.color} capitalize text-[10px] h-5 border-none font-bold`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {visit.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 px-2 bg-slate-50 border-slate-200 text-slate-600 font-bold">
            {getPurposeText(visit.purpose)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-2 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center text-xs text-slate-600">
            <Building className="h-3.5 w-3.5 mr-2 text-primary/70 shrink-0" />
            <span className="truncate font-medium">{visit.lead?.companyName || "No Company"}</span>
          </div>
          <div className="flex items-center text-xs text-slate-600">
            <Calendar className="h-3.5 w-3.5 mr-2 text-primary/70 shrink-0" />
            <span className="font-medium">{format(new Date(visit.plannedDate), "MMM dd, yyyy")}</span>
            {visit.plannedStartTime && (
              <span className="ml-3 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/70 shrink-0" />
                {format(new Date(visit.plannedStartTime), "hh:mm a")}
              </span>
            )}
          </div>
          <div className="flex items-start text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
            <MapPin className="h-3.5 w-3.5 mr-2 mt-0.5 text-slate-400 shrink-0" />
            <span className="line-clamp-2 leading-normal">{visit.visitAddress}{visit.visitCity ? `, ${visit.visitCity}` : ""}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">Budget</span>
            <span className="font-bold text-primary text-sm">
              {formatCurrency(visit.lead?.estimatedBudget)}
            </span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">Assigned To</span>
            <div className="flex items-center justify-end gap-1.5 font-bold text-slate-700 text-xs">
              <User className="h-3.5 w-3.5 opacity-70" />
              <span>{visit.assignedToUser?.firstName}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-1 flex justify-between items-center bg-slate-50/50 border-t border-slate-100 mt-2">
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-100/50">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-100/50">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {canCheckIn && (
            <Button variant="outline" size="sm" className="h-8 text-xs px-4 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors" onClick={() => onCheckIn(visit)}>
              Check In
            </Button>
          )}
          {canCheckOut && (
            <Button variant="outline" size="sm" className="h-8 text-xs px-4 border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors" onClick={() => onCheckOut(visit)}>
              Check Out
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
