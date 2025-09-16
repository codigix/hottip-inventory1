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
  const colorClass = LEAD_STATUS_COLORS[status];
  
  const statusLabels: Record<LeadStatus, string> = {
    new: 'New',
    contacted: 'Contacted',
    in_progress: 'In Progress',
    converted: 'Converted',
    dropped: 'Dropped'
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${colorClass} ${className}`}
      data-testid={`status-badge-${status}`}
    >
      {statusLabels[status]}
    </Badge>
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