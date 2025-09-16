import { useState } from "react";
import { format } from "date-fns";
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
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface VisitTableProps {
  visits: VisitWithDetails[];
  isLoading: boolean;
  onEdit: (visit: VisitWithDetails) => void;
  onDelete: (visit: VisitWithDetails) => void;
  onCheckIn: (visit: VisitWithDetails) => void;
  onCheckOut: (visit: VisitWithDetails) => void;
  onStatusUpdate: (visit: VisitWithDetails, status: VisitStatus, notes?: string) => void;
  onProofUpload: (visit: VisitWithDetails) => void;
}

export default function VisitTable({ 
  visits, 
  isLoading, 
  onEdit, 
  onDelete, 
  onCheckIn, 
  onCheckOut, 
  onStatusUpdate,
  onProofUpload 
}: VisitTableProps) {
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(null);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<VisitStatus>('scheduled');
  const [statusNotes, setStatusNotes] = useState('');

  // Get status badge variant and icon
  const getStatusInfo = (status: VisitStatus) => {
    switch (status) {
      case 'scheduled':
        return {
          variant: 'secondary' as const,
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900'
        };
      case 'in_progress':
        return {
          variant: 'default' as const,
          icon: Timer,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900'
        };
      case 'completed':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'cancelled':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900'
        };
    }
  };

  // Get purpose display text
  const getPurposeText = (purpose: string) => {
    const purposeMap: Record<string, string> = {
      'initial_meeting': 'Initial Meeting',
      'demo': 'Product Demo',
      'follow_up': 'Follow Up',
      'quotation_discussion': 'Quotation Discussion',
      'negotiation': 'Negotiation',
      'closing': 'Closing',
      'support': 'Support',
      'other': 'Other'
    };
    return purposeMap[purpose] || purpose;
  };

  // Check if visit can be checked in
  const canCheckIn = (visit: VisitWithDetails) => {
    return visit.status === 'scheduled' && !visit.actualStartTime;
  };

  // Check if visit can be checked out
  const canCheckOut = (visit: VisitWithDetails) => {
    return visit.status === 'in_progress' && visit.actualStartTime && !visit.actualEndTime;
  };

  // Handle status update
  const handleStatusUpdate = () => {
    if (selectedVisit) {
      onStatusUpdate(selectedVisit, newStatus, statusNotes);
      setStatusUpdateOpen(false);
      setSelectedVisit(null);
      setStatusNotes('');
    }
  };

  // Open status update dialog
  const openStatusUpdate = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
    setNewStatus(visit.status);
    setStatusUpdateOpen(true);
  };

  // Calculate visit duration
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
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Field Visits Found</h3>
          <p className="text-muted-foreground">
            No visits match your current filters. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visit Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((visit) => {
                const statusInfo = getStatusInfo(visit.status);
                const StatusIcon = statusInfo.icon;
                const duration = getVisitDuration(visit);

                return (
                  <TableRow key={visit.id} data-testid={`visit-row-${visit.visitNumber}`}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium" data-testid={`visit-number-${visit.visitNumber}`}>
                          {visit.visitNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getPurposeText(visit.purpose)}
                        </div>
                        {duration && (
                          <div className="text-xs text-green-600 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Duration: {duration}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {visit.lead?.firstName} {visit.lead?.lastName}
                        </div>
                        {visit.lead?.companyName && (
                          <div className="text-sm text-muted-foreground">
                            {visit.lead.companyName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {visit.assignedToUser?.firstName} {visit.assignedToUser?.lastName}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(visit.plannedDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {visit.plannedStartTime && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(visit.plannedStartTime), 'hh:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={statusInfo.variant}
                        className={`${statusInfo.bgColor} ${statusInfo.color} capitalize flex items-center space-x-1 w-fit`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{visit.status.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {visit.visitAddress}
                        {visit.visitCity && `, ${visit.visitCity}`}
                      </div>
                      {(visit.latitude && visit.longitude) && (
                        <div className="text-xs text-green-600 flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>GPS Available</span>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
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
                          
                          {visit.status === 'completed' && (
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {visits.map((visit) => {
          const statusInfo = getStatusInfo(visit.status);
          const StatusIcon = statusInfo.icon;
          const duration = getVisitDuration(visit);

          return (
            <Card key={visit.id} data-testid={`visit-card-${visit.visitNumber}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="font-semibold" data-testid={`visit-number-${visit.visitNumber}`}>
                      {visit.visitNumber}
                    </div>
                    <Badge 
                      variant={statusInfo.variant}
                      className={`${statusInfo.bgColor} ${statusInfo.color} capitalize flex items-center space-x-1 w-fit`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{visit.status.replace('_', ' ')}</span>
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
                      
                      {visit.status === 'completed' && (
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
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {visit.lead?.firstName} {visit.lead?.lastName}
                    </span>
                    {visit.lead?.companyName && (
                      <span className="text-sm text-muted-foreground">
                        - {visit.lead.companyName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(visit.plannedDate), 'MMM dd, yyyy')}
                    </span>
                    {visit.plannedStartTime && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(visit.plannedStartTime), 'hh:mm a')}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {visit.visitAddress}
                      {visit.visitCity && `, ${visit.visitCity}`}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Purpose: {getPurposeText(visit.purpose)}
                  </div>

                  {duration && (
                    <div className="text-xs text-green-600 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Duration: {duration}</span>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Assigned to: {visit.assignedToUser?.firstName} {visit.assignedToUser?.lastName}
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
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as VisitStatus)}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
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
    </>
  );
}