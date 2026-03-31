import { format } from "date-fns";
import {
  Phone,
  MessageSquare,
  Calendar,
  Briefcase,
  FileText,
  Clock,
  User,
  History,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
}

interface FollowupHierarchyProps {
  activities: Activity[];
  leadName: string;
}

export default function FollowupHierarchy({ activities, leadName }: FollowupHierarchyProps) {
  // Sort activities by date descending
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getActionIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="h-3.5 w-3.5" />;
      case "WHATSAPP":
        return <MessageSquare className="h-3.5 w-3.5" />;
      case "FOLLOW_UP":
        return <Calendar className="h-3.5 w-3.5" />;
      case "DEAL_CREATED":
        return <Briefcase className="h-3.5 w-3.5" />;
      case "QUOTATION":
        return <FileText className="h-3.5 w-3.5" />;
      case "CREATE_LEAD":
        return <User className="h-3.5 w-3.5" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };

  const getActionLabel = (type: string, details?: string) => {
    if (type === "QUOTATION" && details?.toLowerCase().includes("revised")) {
      return "Revised Quotation";
    }
    switch (type) {
      case "CALL":
        return "Call Done";
      case "WHATSAPP":
        return "WhatsApp Sent";
      case "FOLLOW_UP":
        return "Follow-up Scheduled";
      case "DEAL_CREATED":
        return "Deal Created";
      case "QUOTATION":
        return "Quotation Created";
      case "CREATE_LEAD":
        return "Lead Created";
      case "UPDATE_LEAD":
        return "Lead Updated";
      case "UPDATE_LEAD_STATUS":
        return "Status Changed";
      default:
        return type.replace(/_/g, " ");
    }
  };

  const getStatusBadge = (activity: Activity) => {
    if (activity.action === "CREATE_LEAD") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold text-emerald-600 border-emerald-100 bg-emerald-50">
          Contacted
        </Badge>
      );
    }
    if (activity.action === "QUOTATION") {
      const isRevised = activity.details?.toLowerCase().includes("revised");
      return (
        <Badge variant="outline" className={cn(
          "text-[10px] px-1.5 py-0 h-5 font-semibold",
          isRevised ? "text-amber-600 border-amber-100 bg-amber-50" : "text-emerald-600 border-emerald-100 bg-emerald-50"
        )}>
          {isRevised ? "Revised" : "Accepted"}
        </Badge>
      );
    }
    if (activity.action === "FOLLOW_UP") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold text-purple-600 border-purple-100 bg-purple-50">
          In Progress
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-semibold text-slate-600 border-slate-100 bg-slate-50">
        Completed
      </Badge>
    );
  };



  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="h-12 w-12 mb-2 opacity-20" />
        <p>No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Followup Hierarchy</h3>
        <button className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 uppercase tracking-tight">
          Sort By <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      <div className="relative pl-2 space-y-0">
        {/* Main Vertical Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />

        {sortedActivities.map((activity, index) => {
          return (
            <div key={activity.id} className="relative mb-5 last:mb-0">
              {/* Milestone/Activity Node */}
              <div className={cn(
                "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-md border-2 border-white shadow-sm z-10 transition-transform hover:scale-105 bg-slate-50 text-slate-400",
                activity.action === "CREATE_LEAD" && "bg-blue-500 text-white",
                activity.action === "DEAL_CREATED" && "bg-purple-500 text-white",
                activity.action === "QUOTATION" && "bg-red-500 text-white"
              )}>
                {getActionIcon(activity.action)}
              </div>

              {/* Connector Lines */}
              <div className="ml-10 pt-0.5">
                <div className="relative group">
                  {/* Horizontal Connector */}
                  <div className="absolute -left-2 top-3.5 w-2 h-0.5 bg-slate-100 group-hover:bg-slate-200" />
                  
                  <div className="flex items-center gap-3">
                    {/* Content Box */}
                    <div className="flex-1 flex items-center justify-between py-1.5 border-b border-slate-50 group-hover:border-slate-100 transition-colors">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[11px] font-bold text-slate-800">
                            {activity.action === "CREATE_LEAD" ? `Lead: ${leadName}` : getActionLabel(activity.action, activity.details)}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">
                          {activity.details || getActionLabel(activity.action)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase">
                          {format(new Date(activity.createdAt), "dd MMM, hh:mm:ss a")}
                        </span>
                        {getStatusBadge(activity)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
