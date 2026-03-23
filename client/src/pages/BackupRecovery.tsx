import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StartTourButton } from "@/components/StartTourButton";
import { adminBackupTour } from "@/components/tours/dashboardTour";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  RotateCcw, 
  Plus, 
  RefreshCcw, 
  ShieldCheck, 
  HardDrive, 
  Cloud,
  Clock,
  Trash2,
  FileArchive,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface Backup {
  id: number;
  name: string;
  createdAt: string;
  size: number;
  filePath: string;
}

const fetchBackups = async (): Promise<Backup[]> => {
  const res = await fetch("/api/admin/backups");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch backups");
  }
  return res.json();
};

const createBackup = async () => {
  const res = await fetch("/api/admin/backups", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create backup");
  return res.json();
};

const restoreBackup = async (id: number) => {
  const res = await fetch(`/api/admin/backups/${id}/restore`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to restore backup");
  return res.json();
};

function BackupRecovery() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/admin/backups"],
    queryFn: fetchBackups,
  });

  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/backups"] });
      toast({
        title: "Backup Created",
        description: "System backup has been completed successfully.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Backup Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: (data) => {
      toast({
        title: "Restore Initiated",
        description: data.message || "System is being restored to the selected point.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Restore Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const backups = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const totalStorage = useMemo(() => backups.reduce((acc, curr) => acc + (curr.size || 0), 0), [backups]);

  const columns: Column<Backup>[] = [
    {
      key: "name",
      header: "Backup Name",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <FileArchive className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-900">{item.name}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Creation Date",
      sortable: true,
      cell: (item) => item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy HH:mm:ss") : "-",
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
      cell: (item) => (
        <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50">
          {item.size} MB
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => restoreMutation.mutate(item.id)}
            disabled={restoreMutation.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Restore
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 text-slate-400 hover:text-slate-600"
            onClick={() => window.open(`/api/admin/backups/${item.id}/download`, "_blank")}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-lg font-semibold">Failed to load backups</h2>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900  flex items-center gap-2" data-tour="admin-backup-header">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Backup & Recovery
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Securely manage your data with automated snapshots and recovery points.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="bg-white"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-tour="admin-backup-create-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Creating..." : "New Snapshot"}
          </Button>
          <StartTourButton tourConfig={adminBackupTour} tourName="admin-backup" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              Total Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">{totalStorage.toFixed(2)} MB</div>
            <p className="text-xs text-slate-500 mt-1">Used by {backups.length} backup points</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Auto-Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl  text-slate-900">Daily</div>
            <p className="text-xs text-slate-500 mt-1">Next: Tomorrow, 02:00 AM</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Cloud className="h-4 w-4 text-emerald-500" />
              Cloud Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-slate-500 mt-1">Last synced: 2 hours ago</p>
          </CardContent>
        </Card>
      </div>

      <div className="border-slate-200 shadow-sm overflow-hidden">
        <div className=" border-b border-slate-100 my-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm text-slate-800">Snapshot History</CardTitle>
            <CardDescription className="text-xs">View and manage your recent system restore points.</CardDescription>
          </div>
          <Database className="h-5 w-5 text-slate-300" />
        </div>
        <div className="p-0">
          <DataTable
            data={backups}
            columns={columns}
            isLoading={isLoading}
            searchable={true}
            searchPlaceholder="Search snapshots by name..."
            defaultPageSize={10}
          />
        </div>
      </div>
    </div>
  );
}

export default BackupRecovery;
