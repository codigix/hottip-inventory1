import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Phone, 
  Video, 
  Mail, 
  MessageSquare, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketingTask } from "@shared/schema";

interface FollowUpContentProps {
  leadId: string;
  onAddFollowUp: (leadId: string) => void;
}

export default function FollowUpContent({ leadId, onAddFollowUp }: FollowUpContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: followUps = [], isLoading } = useQuery<MarketingTask[]>({
    queryKey: ["/api/marketing/marketing-tasks", { leadId, type: "follow_up" }],
    queryFn: () => apiRequest(`/api/marketing/marketing-tasks?leadId=${leadId}&type=follow_up`),
    enabled: !!leadId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/marketing/marketing-tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/marketing-tasks", { leadId, type: "follow_up" }] });
      toast({ title: "Follow-up deleted" });
    }
  });

  const getIcon = (title: string, description: string | null) => {
    const text = (title + (description || "")).toLowerCase();
    if (text.includes("call") || text.includes("phone")) return <div className="p-1.5 bg-blue-50 rounded-full"><Phone className="h-4 w-4 text-blue-500" /></div>;
    if (text.includes("meet") || text.includes("video") || text.includes("zoom") || text.includes("google meet")) return <div className="p-1.5 bg-emerald-50 rounded-full"><Video className="h-4 w-4 text-emerald-500" /></div>;
    if (text.includes("email")) return <div className="p-1.5 bg-indigo-50 rounded-full"><Mail className="h-4 w-4 text-indigo-500" /></div>;
    if (text.includes("whatsapp") || text.includes("message")) return <div className="p-1.5 bg-green-50 rounded-full"><MessageSquare className="h-4 w-4 text-green-500" /></div>;
    return <div className="p-1.5 bg-slate-50 rounded-full"><CalendarIcon className="h-4 w-4 text-slate-500" /></div>;
  };

  const getTypeLabel = (title: string, description: string | null) => {
    const text = (title + (description || "")).toLowerCase();
    if (text.includes("call") || text.includes("phone")) return "Call";
    if (text.includes("google meet")) return "Google Meet";
    if (text.includes("zoom")) return "Zoom Meeting";
    if (text.includes("email")) return "Email";
    if (text.includes("whatsapp")) return "WhatsApp";
    return "Meeting";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 font-medium px-2 py-0 h-5">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 font-medium px-2 py-0 h-5">Scheduled</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 font-medium px-2 py-0 h-5">Pending</Badge>;
      default:
        return <Badge variant="outline" className="font-medium px-2 py-0 h-5">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Follow-up History</h4>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onAddFollowUp(leadId);
          }}
          className="gap-2 h-7 text-[10px] font-bold uppercase"
        >
          <Plus className="h-3 w-3" /> Add Follow-up
        </Button>
      </div>
      
      <Table>
        <TableHeader className="bg-slate-50/30">
          <TableRow className="border-b border-slate-100">
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2 w-16">Attempt</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2">Type</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2 text-center">Calendar</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2">Date & Time</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2">Subject</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2">Outcome</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-2 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ))
          ) : followUps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-slate-400">
                <div className="flex flex-col items-center gap-1">
                  <Clock className="h-6 w-6 opacity-10" />
                  <p className="text-[10px]">No follow-up attempts recorded yet</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            followUps.map((followUp, index) => (
              <TableRow key={followUp.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                <TableCell className="text-[10px] font-bold text-slate-300">#{followUps.length - index}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getIcon(followUp.title, followUp.description)}
                    <span className="text-[11px] font-semibold text-slate-700">{getTypeLabel(followUp.title, followUp.description)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-tighter">Synced</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-700">{followUp.dueDate ? format(new Date(followUp.dueDate), "dd MMM yyyy") : "-"}</span>
                    <span className="text-[9px] text-slate-400">{followUp.dueDate ? format(new Date(followUp.dueDate), "hh:mm a") : "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-medium text-slate-600 line-clamp-1 max-w-[180px]">
                    {followUp.title.replace("Follow-up: ", "").replace("Scheduled ", "")}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(followUp.status)}</TableCell>
                <TableCell>
                  <span className="text-[10px] text-slate-400">—</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500 hover:text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(followUp.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
