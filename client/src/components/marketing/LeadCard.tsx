import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  MessageSquare,
  FileText as FileIcon,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import type { LeadWithAssignee, LeadStatus } from "@/types";
import { LEAD_STATUS_WORKFLOW } from "@/types";

interface LeadCardProps {
  lead: LeadWithAssignee;
  onEdit: (lead: LeadWithAssignee) => void;
  onView: (lead: LeadWithAssignee) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  variant?: "default" | "kanban";
}

export default function LeadCard({
  lead,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  variant = "default",
}: LeadCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("leadId", lead.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const getAvailableStatuses = (currentStatus: LeadStatus): LeadStatus[] =>
    LEAD_STATUS_WORKFLOW[currentStatus] || [];

  const formatCurrency = (amount: string | undefined) =>
    amount ? `₹${parseFloat(amount).toLocaleString("en-IN")}` : "Not specified";

  const user = lead.assignedToUser || lead.assignee;

  if (variant === "kanban") {
    return (
      <Card
        draggable
        onDragStart={handleDragStart}
        className="group relative bg-white hover:shadow-md transition-all border-slate-200 cursor-grab active:cursor-grabbing"
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-bold text-slate-800 truncate">
              {lead.firstName} {lead.lastName}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(lead)}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(lead)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {getAvailableStatuses(lead.status).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onStatusChange(lead.id, status)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Mark as{" "}
                    {status === "converted" ? "Converted to Deal" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2 pb-2 space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center text-[11px] text-slate-600">
              <Building className="h-3 w-3 mr-2 text-primary/70" />
              <span className="truncate">{lead.companyName || "No Company"}</span>
            </div>
            <div className="flex items-center text-[11px] text-slate-600">
              <User className="h-3 w-3 mr-2 text-primary/70" />
              <span className="truncate">{user ? `${user.firstName} ${user.lastName}` : "Unassigned"}</span>
            </div>
            <div className="flex items-center text-[11px] text-slate-600">
              <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-100 text-[9px] py-0 px-1.5 h-4 capitalize">
                {lead.source}
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Generate Date:</p>
              <p className="text-[10px] text-slate-700 font-medium">
                {lead.createdAt ? format(new Date(lead.createdAt), "MMM dd, yyyy") : "-"}
              </p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Next Followup:</p>
              <p className="text-[10px] text-red-500 font-medium">
                {lead.followUpDate ? format(new Date(lead.followUpDate), "MMM dd, yyyy") : "-"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-50">
            <Phone className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-50">
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500 hover:bg-orange-50">
            <FileIcon className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold truncate max-w-[150px]">
              {lead.firstName} {lead.lastName}
            </CardTitle>
            {lead.companyName && (
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                {lead.companyName}
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(lead)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {getAvailableStatuses(lead.status).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(lead.id, status)}
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> Mark as{" "}
                  {status === "converted" ? "Converted to Deal" : status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(lead.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 mt-2">
          <StatusBadge status={lead.status} />
          <PriorityBadge priority={lead.priority} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-2 space-y-3">
        <div className="space-y-1.5">
          {lead.email && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Mail className="h-3 w-3 mr-2" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="h-3 w-3 mr-2" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.city && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-2" />
              <span>{lead.city}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground uppercase font-semibold">Budget</span>
            <span className="font-medium text-primary">
              {lead.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "-"}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground uppercase font-semibold">Assigned To</span>
            {user ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[6px]">
                    {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.firstName}</span>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 text-[10px] text-muted-foreground flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1 opacity-70" />
          {lead.createdAt ? format(new Date(lead.createdAt), "MMM dd, yyyy") : "Unknown"}
        </div>
        <Badge variant="outline" className="text-[8px] h-4 font-normal uppercase">
          {lead.source?.replace("_", " ")}
        </Badge>
      </CardFooter>
    </Card>
  );
}
