import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUS_WORKFLOW } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { StatusBadge, PriorityBadge } from "./StatusBadge";
import type { LeadWithAssignee, LeadStatus } from "@/types";

interface LeadTableProps {
  leads: LeadWithAssignee[];
  isLoading: boolean;
  onEdit: (lead: LeadWithAssignee) => void;
  onView: (lead: LeadWithAssignee) => void;
}

export default function LeadTable({
  leads,
  isLoading,
  onEdit,
  onView,
}: LeadTableProps) {
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [statusChangeLeadId, setStatusChangeLeadId] = useState<string | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<LeadStatus | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadWithAssignee | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/marketing/leads /${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads "] });
      toast({ title: "Lead deleted successfully!" });
      setDeleteLeadId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiRequest(`/api/marketing/leads /${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads "] });

      if (variables.status === "converted") {
        toast({
          title: "Lead converted successfully!",
          description: "Lead has been handed over to Sales module.",
        });
      } else {
        toast({ title: "Lead status updated successfully!" });
      }

      setStatusChangeLeadId(null);
      setNewStatus(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating lead status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/marketing/leads /${id}/convert`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads "] });
      toast({
        title: "Lead converted and handed over to Sales!",
        description:
          "A new customer record has been created in the Sales module.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error converting lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (deleteLeadId) deleteMutation.mutate(deleteLeadId);
  };

  const handleStatusChange = () => {
    if (statusChangeLeadId && newStatus) {
      if (newStatus === "converted") {
        convertMutation.mutate(statusChangeLeadId);
      } else {
        updateStatusMutation.mutate({
          id: statusChangeLeadId,
          status: newStatus,
        });
      }
    }
  };

  const getAvailableStatuses = (currentStatus: LeadStatus): LeadStatus[] => {
    return LEAD_STATUS_WORKFLOW[currentStatus] || [];
  };

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "Not specified";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-light text-foreground mb-2">
              No leads found
            </h3>
            <p className="text-sm text-muted-foreground">
              Get started by adding your first lead to the system.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Lead</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-light text-foreground">{lead.firstName} {lead.lastName}</div>
                    {lead.companyName && (
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">{lead.companyName}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created{" "}
                      {lead.createdAt
                        ? `Created ${format(
                            new Date(lead.createdAt),
                            "MM dd, yyyy"
                          )}`
                        : "Created date unknown"}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {lead.email && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">
                          {lead.email}
                        </span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.city && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{lead.city}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {lead.source?.replace("_", " ").toUpperCase() || ""}
                    </Badge>
                    {lead.sourceDetails && (
                      <div className="text-xs text-muted-foreground truncate max-w-[100px]">{lead.sourceDetails}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={lead.status} /></TableCell>
                <TableCell><PriorityBadge priority={lead.priority} /></TableCell>
                <TableCell>
                  {lead.estimatedBudget && <div className="text-sm font-light">{formatCurrency(lead.estimatedBudget)}</div>}
                  {lead.budgetRange && <div className="text-xs text-muted-foreground">Range: {lead.budgetRange}</div>}
                </TableCell>
                <TableCell>
                  {lead.assignee ? (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {lead.assignee.firstName[0]}
                          {lead.assignee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {lead.assignee.firstName} {lead.assignee.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.lastContactedDate ? (
                    <div className="flex items-center space-x-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {format(new Date(lead.lastContactedDate), "MMM dd")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`actions-${lead.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setViewingLead(lead)}
                        data-testid={`view-${lead.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(lead)}
                        data-testid={`edit-${lead.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {getAvailableStatuses(lead.status).length > 0 && (
                        <>
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {getAvailableStatuses(lead.status).map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => {
                                setStatusChangeLeadId(lead.id);
                                setNewStatus(status);
                              }}
                              data-testid={`status-${status}-${lead.id}`}
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Mark as {status.replace("_", " ")}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteLeadId(lead.id)}
                        className="text-destructive"
                        data-testid={`delete-${lead.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lead Details Modal */}
      <Dialog open={!!viewingLead} onOpenChange={() => setViewingLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Lead Details</span>
            </DialogTitle>
          </DialogHeader>

          {viewingLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-light text-foreground mb-2">
                    Personal Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong> {viewingLead.firstName}{" "}
                      {viewingLead.lastName}
                    </div>
                    {viewingLead.companyName && (
                      <div>
                        <strong>Company:</strong> {viewingLead.companyName}
                      </div>
                    )}
                    {viewingLead.email && (
                      <div>
                        <strong>Email:</strong> {viewingLead.email}
                      </div>
                    )}
                    {viewingLead.phone && (
                      <div>
                        <strong>Phone:</strong> {viewingLead.phone}
                      </div>
                    )}
                    {viewingLead.alternatePhone && (
                      <div>
                        <strong>Alt Phone:</strong> {viewingLead.alternatePhone}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-light text-foreground mb-2">
                    Lead Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Status:</strong>{" "}
                      <StatusBadge status={viewingLead.status} />
                    </div>
                    <div>
                      <strong>Priority:</strong>{" "}
                      <PriorityBadge priority={viewingLead.priority} />
                    </div>
                    <div>
                      <strong>Source:</strong>{" "}
                      {viewingLead.source.replace("_", " ")}
                    </div>
                    {viewingLead.sourceDetails && (
                      <div>
                        <strong>Source Details:</strong>{" "}
                        {viewingLead.sourceDetails}
                      </div>
                    )}
                    {viewingLead.referredBy && (
                      <div>
                        <strong>Referred By:</strong> {viewingLead.referredBy}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {viewingLead.address && (
                <>
                  <div>
                    <h3 className="font-light text-foreground mb-2">Address</h3>
                    <div className="text-sm space-y-1">
                      <div>{viewingLead.address}</div>
                      <div>
                        {[
                          viewingLead.city,
                          viewingLead.state,
                          viewingLead.zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div>{viewingLead.country}</div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {(viewingLead.requirementDescription ||
                viewingLead.estimatedBudget) && (
                <>
                  <div>
                    <h3 className="font-light text-foreground mb-2">
                      Requirements
                    </h3>
                    <div className="space-y-2 text-sm">
                      {viewingLead.requirementDescription && (
                        <div>
                          <strong>Description:</strong>{" "}
                          {viewingLead.requirementDescription}
                        </div>
                      )}
                      {viewingLead.estimatedBudget && (
                        <div>
                          <strong>Budget:</strong>{" "}
                          {formatCurrency(viewingLead.estimatedBudget)}
                        </div>
                      )}
                      {viewingLead.budgetRange && (
                        <div>
                          <strong>Budget Range:</strong>{" "}
                          {viewingLead.budgetRange}
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <h3 className="font-light text-foreground mb-2">Dates</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Created:</strong>{" "}
                    {format(new Date(viewingLead.createdAt), "MMM dd, yyyy")}
                  </div>
                  <div>
                    <strong>Updated:</strong>{" "}
                    {format(new Date(viewingLead.updatedAt), "MMM dd, yyyy")}
                  </div>
                  {viewingLead.lastContactedDate && (
                    <div>
                      <strong>Last Contact:</strong>{" "}
                      {format(
                        new Date(viewingLead.lastContactedDate),
                        "MMM dd, yyyy"
                      )}
                    </div>
                  )}
                  {viewingLead.followUpDate && (
                    <div>
                      <strong>Follow-up:</strong>{" "}
                      {format(
                        new Date(viewingLead.followUpDate),
                        "MMM dd, yyyy"
                      )}
                    </div>
                  )}
                </div>
              </div>

              {viewingLead.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-light text-foreground mb-2">Notes</h3>
                    <div className="text-sm bg-muted/50 p-3 rounded-sm">
                      {viewingLead.notes}
                    </div>
                  </div>
                </>
              )}

              {viewingLead.tags && viewingLead.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-light text-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingLead.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteLeadId}
        onOpenChange={() => setDeleteLeadId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lead and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={!!statusChangeLeadId}
        onOpenChange={() => {
          setStatusChangeLeadId(null);
          setNewStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Lead Status</AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === "converted"
                ? "Converting this lead will create a customer record in the Sales module and mark the lead as converted. This action cannot be undone."
                : `Are you sure you want to change the lead status to "${newStatus?.replace(
                    "_",
                    " "
                  )}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-status-change">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              data-testid="confirm-status-change"
            >
              {newStatus === "converted" ? "Convert Lead" : "Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
