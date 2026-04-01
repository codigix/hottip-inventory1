import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  FileText,
  Upload,
  RefreshCw,
  Download,
  Calculator,
  Check,
  X,
  FileEdit,
  FileCheck,
  FileX,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUS_WORKFLOW } from "@/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, Column } from "@/components/ui/data-table";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { StatusBadge, PriorityBadge } from "./StatusBadge";
import FollowUpForm from "./FollowUpForm";
import FollowUpContent from "./FollowUpContent";
import CompleteFollowUpDialog from "./CompleteFollowUpDialog";
import EstimationDetailsDialog from "../sales/EstimationDetailsDialog";
import type { LeadWithAssignee, LeadStatus } from "@/types";

export default function LeadTable({
  leads = [],
  isLoading = false,
  onEdit,
  onView,
  isSalesMode = false,
  onAddQuotation,
  onReviseQuotation,
  onUploadProof,
  onConvert,
}: {
  leads?: LeadWithAssignee[];
  isLoading?: boolean;
  onEdit: (lead: LeadWithAssignee) => void;
  onView: (lead: LeadWithAssignee) => void;
  isSalesMode?: boolean;
  onAddQuotation?: (lead: LeadWithAssignee) => void;
  onReviseQuotation?: (lead: LeadWithAssignee) => void;
  onUploadProof?: (lead: LeadWithAssignee) => void;
  onConvert?: (lead: LeadWithAssignee) => void;
}) {
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [statusChangeLeadId, setStatusChangeLeadId] = useState<string | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<LeadStatus | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadWithAssignee | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isCompleteFollowUpOpen, setIsCompleteFollowUpOpen] = useState(false);
  const [completeFollowUpTaskId, setCompleteFollowUpTaskId] = useState<string | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);
  const [editFollowUpId, setEditFollowUpId] = useState<string | null>(null);
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  const [estimationQuotationId, setEstimationQuotationId] = useState<string | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Sort leads by createdAt (LIFO)
  const sortedLeads = useMemo(() => {
    return [...(leads || [])].sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [leads]);

  // ✅ Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/marketing/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      toast({ title: "Lead deleted successfully!" });
      setDeleteLeadId(null);
    },
  });

  // ✅ Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiRequest(`/api/marketing/leads/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks"] });
      toast({
        title:
          variables.status === "WON"
            ? "Lead confirmed for sales successfully!"
            : "Lead status updated successfully!",
      });
      setStatusChangeLeadId(null);
      setNewStatus(null);
    },
  });

  // ✅ Convert lead mutation
  const convertMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/marketing/leads/${id}/convert`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks"] });
      toast({
        title: "Lead confirmed for Sales and handed over!",
      });
    },
  });

  const handleDelete = () => {
    if (deleteLeadId) deleteMutation.mutate(deleteLeadId);
  };

  const handleStatusChange = () => {
    if (statusChangeLeadId && newStatus) {
      if (newStatus === "WON") {
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
    (amount && parseFloat(amount) !== 0) ? `₹${parseFloat(amount).toLocaleString("en-IN")}` : "Not Set";

  const columns = useMemo<Column<LeadWithAssignee>[]>(() => [
    {
      key: "firstName",
      header: "Lead",
      cell: (lead) => (
        <div className="space-y-1">
          <div className="text-xs text-foreground">
            {lead.firstName} {lead.lastName}
          </div>
          {lead.companyName && (
            <div className="text-xs text-gray-500">
              {lead.companyName}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Created{" "}
            {lead.createdAt
              ? format(new Date(lead.createdAt), "MM dd, yyyy")
              : "Unknown"}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "email",
      header: "Contact",
      cell: (lead) => (
        <div className="space-y-1">
          {lead.email && (
            <div className="flex text-xs items-center text-sm">
              <Mail className="h-3 w-3 mr-1 text-gray-500" />
              {lead.email}
            </div>
          )}
          {lead.phone && (
            <div className="flex text-xs items-center text-sm">
              <Phone className="h-3 w-3 mr-1 text-gray-500" />
              {lead.phone}
            </div>
          )}
          {lead.city && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              {lead.city}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      cell: (lead) => (
        <Badge variant="outline" className="text-xs lowercase">
          {lead.source?.replace("_", " ").toUpperCase()}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (lead) => <StatusBadge status={lead.status} />,
      sortable: true,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (lead) => <PriorityBadge priority={lead.priority} />,
      sortable: true,
    },
    {
      key: "estimatedBudget",
      header: "Budget",
      cell: (lead) => lead.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "-",
      sortable: true,
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      cell: (lead: any) => {
        const user = lead.assignedToUser || lead.assignee;
        if (user && (user.firstName || user.lastName)) {
          return (
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {(user.firstName?.[0] || "") + (user.lastName?.[0] || "") || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">
                {user.firstName} {user.lastName}
              </span>
            </div>
          );
        }
        return (
          <span className="text-xs text-gray-500 italic">
            {lead.assignedTo ? `User (${lead.assignedTo.slice(0, 8)})` : "Unassigned"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (lead) => (
        <div className="flex items-center justify-end gap-1">
          {isSalesMode ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => setLocation(`/sales/leads/${lead.id}`)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => onAddQuotation?.(lead)}
                title="Create Quotation"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => onReviseQuotation?.(lead)}
                title="Revise Quotation"
              >
                <FileEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  if (lead.quotationId) {
                    setEstimationQuotationId(lead.quotationId);
                    setEstimationDialogOpen(true);
                  } else {
                    toast({
                      title: "No Quotation Found",
                      description: "Create a quotation first to view estimation details.",
                      variant: "destructive"
                    });
                  }
                }}
                title="View Estimation"
              >
                <Calculator className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setFollowUpLeadId(lead.id);
                  setEditFollowUpId(null);
                  setIsFollowUpModalOpen(true);
                }}
                title="Follow-up"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteLeadId(lead.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => setLocation(`/marketing/leads/${lead.id}`)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => onEdit(lead)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => {
                  setFollowUpLeadId(lead.id);
                  setEditFollowUpId(null);
                  setIsFollowUpModalOpen(true);
                }}
                title="Follow-up"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              {onUploadProof && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => onUploadProof(lead)}
                  title="Upload Proof"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteLeadId(lead.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    }
  ], [onEdit, getAvailableStatuses, isSalesMode, onAddQuotation, onReviseQuotation, onUploadProof]);

  return (
    <>
      <div className="bg-white rounded-md">
        <DataTable
          data={sortedLeads}
          columns={columns}
          isLoading={isLoading}
          searchable={false}
          defaultPageSize={10}
          expandableContent={(lead) => (
            <FollowUpContent
              leadId={lead.id}
              leadStatus={lead.status}
              onAddFollowUp={(id) => {
                setFollowUpLeadId(id);
                setEditFollowUpId(null);
                setIsFollowUpModalOpen(true);
              }}
              onEditFollowUp={(lId, tId) => {
                setFollowUpLeadId(lId);
                setEditFollowUpId(tId);
                setIsFollowUpModalOpen(true);
              }}
              onCompleteFollowUp={(_, tId) => {
                setCompleteFollowUpTaskId(tId);
                setIsCompleteFollowUpOpen(true);
              }}
            />
          )}
        />
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
              {newStatus === "WON"
                ? "Confirming this lead for sales will create a Sales customer record."
                : `Are you sure you want to mark as "${newStatus}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} data-tour={newStatus === "WON" ? "marketing-lead-conversion-button" : undefined}>
              {newStatus === "WON" ? "Confirm for Sales" : "Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ View Details Dialog */}
      <Dialog
        open={!!viewingLead}
        onOpenChange={() => setViewingLead(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-sm">
                      {viewingLead.firstName[0]}
                      {viewingLead.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-3">
                    <h3 className="text-sm ">
                      {viewingLead.firstName} {viewingLead.lastName}
                    </h3>
                    <p className="text-gray-500 text-xs">
                      {viewingLead.companyName || "No Company"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-end space-y-2">
                  <StatusBadge status={viewingLead.status} />
                  <PriorityBadge priority={viewingLead.priority} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className=" text-sm text-gray-900">
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      {viewingLead.email || "No email"}
                    </div>
                    <div className="flex items-center text-xs">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      {viewingLead.phone || "No phone"}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {viewingLead.address ? (
                        <span>
                          {viewingLead.address}, {viewingLead.city},{" "}
                          {viewingLead.state} {viewingLead.zipCode}
                        </span>
                      ) : (
                        "No address"
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className=" text-sm text-gray-900">
                    Lead Source & Budget
                  </h4>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Source: </span>
                      <Badge variant="outline" className="capitalize">
                        {viewingLead.source?.replace("_", " ")}
                      </Badge>
                    </div>
                    {viewingLead.sourceDetails && (
                      <div className="text-xs text-gray-500 ml-4">
                        Details: {viewingLead.sourceDetails}
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="text-gray-500">Budget: </span>
                      <span className="">
                        {formatCurrency(viewingLead.estimatedBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {viewingLead.requirementDescription && (
                <div className="space-y-2">
                  <h4 className=" text-sm text-gray-900">
                    Requirement Description
                  </h4>
                  <p className="text-xs text-gray-600 bg-gray-50  rounded-md">
                    {viewingLead.requirementDescription}
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div>
                  Created:{" "}
                  {viewingLead.createdAt
                    ? format(new Date(viewingLead.createdAt), "PPP")
                    : "Unknown"}
                </div>
                <div>ID: {viewingLead.id}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {followUpLeadId && (
        <FollowUpForm
          open={isFollowUpModalOpen}
          onOpenChange={(open) => {
            setIsFollowUpModalOpen(open);
            if (!open) {
              setFollowUpLeadId(null);
              setEditFollowUpId(null);
            }
          }}
          leadId={followUpLeadId}
          editId={editFollowUpId}
        />
      )}

      {estimationQuotationId && (
        <EstimationDetailsDialog
          open={estimationDialogOpen}
          onOpenChange={setEstimationDialogOpen}
          quotationId={estimationQuotationId}
        />
      )}

      {completeFollowUpTaskId && (
        <CompleteFollowUpDialog
          open={isCompleteFollowUpOpen}
          onOpenChange={(open) => {
            setIsCompleteFollowUpOpen(open);
            if (!open) setCompleteFollowUpTaskId(null);
          }}
          taskId={completeFollowUpTaskId}
        />
      )}
    </>
  );
}
