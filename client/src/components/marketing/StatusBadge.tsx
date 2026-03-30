import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_COLORS, LEAD_PRIORITY_COLORS } from "@/types";
import type { LeadStatus, LeadPriority } from "@/types";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

interface PriorityBadgeProps {
  priority: LeadPriority;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = LEAD_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  
  const statusLabels: Record<string, string> = {
    NOT_CONTACTED: 'Not Contacted',
    CONTACTED: 'Contacted',
    Contacted: 'Contacted',
    contacted: 'Contacted',
    QUALIFIED: 'Qualified',
    WON: 'WON',
    LOST: 'Lost',
    // Add lowercase versions just in case
    not_contacted: 'Not Contacted',
    qualified: 'Qualified',
    won: 'WON',
    lost: 'Lost',
    new: 'New Lead',
    converted: 'WON'
  };

  const label = statusLabels[status] || status || 'Unknown';

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClass.split(' ')[0]}`} />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colorClass = LEAD_PRIORITY_COLORS[priority];
  
  const priorityLabels: Record<LeadPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} ${className}`}
      data-testid={`priority-badge-${priority}`}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}