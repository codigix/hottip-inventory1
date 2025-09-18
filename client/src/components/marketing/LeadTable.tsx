import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Eye, Edit, Trash2, ArrowRight, Phone, Mail, MapPin, Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUS_WORKFLOW } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

// =====================
// Utility for safe date formatting
// =====================
const safeFormat = (date?: string | null, fmt = 'MMM dd, yyyy') => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "Invalid Date" : format(d, fmt);
};

export default function LeadTable({ leads, isLoading, onEdit, onView }: LeadTableProps) {
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [statusChangeLeadId, setStatusChangeLeadId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<LeadStatus | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadWithAssignee | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ title: "Lead deleted successfully!" });
      setDeleteLeadId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error deleting lead", description: error.message, variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiRequest(`/api/leads/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      if (variables.status === 'converted') {
        toast({ title: "Lead converted successfully!", description: "Lead has been handed over to Sales module." });
      } else {
        toast({ title: "Lead status updated successfully!" });
      }
      setStatusChangeLeadId(null);
      setNewStatus(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating lead status", description: error.message, variant: "destructive" });
    }
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/leads/${id}/convert`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ title: "Lead converted and handed over to Sales!", description: "A new customer record has been created in the Sales module." });
    },
    onError: (error: any) => {
      toast({ title: "Error converting lead", description: error.message, variant: "destructive" });
    }
  });

  const handleDelete = () => {
    if (deleteLeadId) deleteMutation.mutate(deleteLeadId);
  };

  const handleStatusChange = () => {
    if (statusChangeLeadId && newStatus) {
      if (newStatus === 'converted') {
        convertMutation.mutate(statusChangeLeadId);
      } else {
        updateStatusMutation.mutate({ id: statusChangeLeadId, status: newStatus });
      }
    }
  };

  const getAvailableStatuses = (currentStatus: LeadStatus): LeadStatus[] => {
    return LEAD_STATUS_WORKFLOW[currentStatus] || [];
  };

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "Not specified";
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
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
        <CardContent className="pt-6 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-light text-foreground mb-2">No leads found</h3>
          <p className="text-sm text-muted-foreground">Get started by adding your first lead to the system.</p>
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
                      Created {safeFormat(lead.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {lead.email && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{lead.email}</span>
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
                    <Badge variant="outline" className="text-xs">{lead.source.replace('_', ' ').toUpperCase()}</Badge>
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
                        <AvatarFallback className="text-xs">{lead.assignee.firstName[0]}{lead.assignee.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{lead.assignee.firstName} {lead.assignee.lastName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.lastContactedDate ? safeFormat(lead.lastContactedDate, 'MMM dd') : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  {/* Dropdown and actions */}
                  {/* ... keep your existing DropdownMenu code here ... */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modals and dialogs */}
      {/* All format() calls replaced with safeFormat() */}
    </>
  );
}
