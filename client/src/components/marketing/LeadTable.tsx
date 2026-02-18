import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function LeadTable({
  leads = [],
  isLoading = false,
  onEdit,
  onView,
}: {
  leads?: LeadWithAssignee[];
  isLoading?: boolean;
  onEdit: (lead: LeadWithAssignee) => void;
  onView: (lead: LeadWithAssignee) => void;
}) {
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [statusChangeLeadId, setStatusChangeLeadId] = useState<string | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<LeadStatus | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadWithAssignee | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/marketing/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/marketing/leads"] });
      toast({ title: "Lead deleted successfully!" });
      setDeleteLeadId(null);
    },
  });

  // ✅ Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiRequest(`/marketing/leads/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/marketing/leads"] });
      toast({
        title:
          variables.status === "converted"
            ? "Lead converted successfully!"
            : "Lead status updated successfully!",
      });
      setStatusChangeLeadId(null);
      setNewStatus(null);
    },
  });

  // ✅ Convert lead mutation
  const convertMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/marketing/leads/${id}/convert`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/marketing/leads"] });
      toast({
        title: "Lead converted and handed over to Sales!",
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

  const getAvailableStatuses = (currentStatus: LeadStatus): LeadStatus[] =>
    LEAD_STATUS_WORKFLOW[currentStatus] || [];

  const formatCurrency = (amount: string | undefined) =>
    amount ? `₹${parseFloat(amount).toLocaleString("en-IN")}` : "Not specified";

  // ✅ Loading State
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

  // ✅ Empty State
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
                {/* ✅ Lead Info */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-light text-foreground">
                      {lead.firstName} {lead.lastName}
                    </div>
                    {lead.companyName && (
                      <div className="text-sm text-muted-foreground">
                        {lead.companyName}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created{" "}
                      {lead.createdAt
                        ? format(new Date(lead.createdAt), "MM dd, yyyy")
                        : "Unknown"}
                    </div>
                  </div>
                </TableCell>

                {/* ✅ Contact */}
                <TableCell>
                  <div className="space-y-1">
                    {lead.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                        {lead.email}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                        {lead.phone}
                      </div>
                    )}
                    {lead.city && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {lead.city}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* ✅ Source */}
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {lead.source?.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>

                {/* ✅ Status */}
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>

                {/* ✅ Priority */}
                <TableCell>
                  <PriorityBadge priority={lead.priority} />
                </TableCell>

                {/* ✅ Budget */}
                <TableCell>
                  {lead.estimatedBudget && (
                    <div className="text-sm">
                      {formatCurrency(lead.estimatedBudget)}
                    </div>
                  )}
                </TableCell>

                {/* ✅ Assignee */}
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

                {/* ✅ Last Contact */}
                <TableCell>
                  {lead.lastContactedDate ? (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      {format(new Date(lead.lastContactedDate), "MMM dd")}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Never</span>
                  )}
                </TableCell>

                {/* ✅ Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewingLead(lead)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {getAvailableStatuses(lead.status).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => {
                            setStatusChangeLeadId(lead.id);
                            setNewStatus(status);
                          }}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" /> Mark as{" "}
                          {status.replace("_", " ")}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteLeadId(lead.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Delete Confirmation */}
      <AlertDialog
        open={!!deleteLeadId}
        onOpenChange={() => setDeleteLeadId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Status Change Confirmation */}
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
                ? "Converting this lead will create a Sales customer record."
                : `Are you sure you want to mark as "${newStatus}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              {newStatus === "converted" ? "Convert Lead" : "Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
