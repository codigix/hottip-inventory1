import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Package, 
  MapPin, 
  Calendar,
  ExternalLink,
  Send,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { openAuthenticatedPdf } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { DataTable, Column } from "@/components/ui/data-table";

export default function DeliveryChallans() {
  const { toast } = useToast();

  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/logistics/shipments']
  });

  // Filter for only delivered or closed shipments that might have challans
  const challanShipments = useMemo(() => {
    return shipments.filter(s => 
      s.currentStatus === 'delivered' || 
      s.currentStatus === 'closed'
    );
  }, [shipments]);

  const handleViewChallan = (shipmentId: string) => {
    openAuthenticatedPdf(`/api/logistics/shipments/${shipmentId}/delivery-challan`);
  };

  const sendToAccountsMutation = useMutation({
    mutationFn: async (shipment: any) => {
      const importDuty = Number(shipment.plan?.importDuty || 0);
      const gstPaid = Number(shipment.plan?.gstPaid || 0);
      const totalAmount = importDuty + gstPaid;

      // In a real scenario, we'd need a valid supplier ID from the database
      // Prioritize vendorId, then fallback to clientId for customer-related costs
      const supplierId = shipment.vendorId || shipment.clientId || shipment.supplierId || "00000000-0000-0000-0000-000000000001";

      return apiRequest("POST", "/accounts-payables", {
        supplierId,
        amountDue: totalAmount,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        notes: `Duty & GST for Shipment ${shipment.consignmentNumber} (PO: ${shipment.poNumber || 'N/A'})`,
        poId: shipment.poId || null
      });
    },
    onSuccess: () => {
      toast({
        title: "Sent to Accounts",
        description: "The shipment financial details have been forwarded to Accounts Payable.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send to accounts.",
        variant: "destructive",
      });
    }
  });

  const handleSendToAccounts = (shipment: any) => {
    sendToAccountsMutation.mutate(shipment);
  };

  const columns: Column<any>[] = [
    {
      key: "challanNumber",
      header: "Challan #",
      cell: (item) => <span className="text-primary">DC-{item.consignmentNumber.split('-').pop()}</span>,
      sortable: true,
    },
    {
      key: "consignmentNumber",
      header: "Consignment #",
      cell: (item) => item.consignmentNumber,
      sortable: true,
    },
    {
      key: "poNumber",
      header: "PO #",
      cell: (item) => item.poNumber || "N/A",
      sortable: true,
    },
    {
      key: "clientName",
      header: "Client / Vendor",
      cell: (item) => (
        <div className="text-slate-900">{item.clientName || item.vendorName || "N/A"}</div>
      ),
      sortable: true,
    },
    {
      key: "route",
      header: "Route",
      cell: (item) => (
        <div className="flex items-center text-xs text-slate-500">
          <MapPin className="h-3 w-3 mr-1 text-slate-400" />
          {item.source} → {item.destination}
        </div>
      ),
      sortable: true,
    },
    {
      key: "deliveredAt",
      header: <div className="text-right">Delivery Date</div>,
      cell: (item) => (
        <div className="flex flex-col items-end">
          <span className="text-slate-700">
            {item.deliveredAt ? format(new Date(item.deliveredAt), "dd MMM yyyy") : "N/A"}
          </span>
          <span className="text-xs text-gray-500 flex items-center">
            <Calendar className="h-2 w-2 mr-1" /> Delivered
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary hover:bg-primary/5"
            onClick={() => handleViewChallan(item.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" /> View PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            onClick={() => handleSendToAccounts(item)}
            disabled={sendToAccountsMutation.isPending}
          >
            {sendToAccountsMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3 mr-1" />
            )}
            Send
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl">Delivery Challans</h1>
          <p className="text-gray-500 text-xs">
            View and download generated delivery challans for completed shipments
          </p>
        </div>
      </div>

      <DataTable
        data={challanShipments}
        columns={columns}
        searchPlaceholder="Search by consignment #, PO #, or client..."
      />
    </div>
  );
}
