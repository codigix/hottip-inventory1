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

export default function DeliveryChallans() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredData = useMemo(() => {
    return challanShipments.filter(item => 
      item.consignmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.poNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [challanShipments, searchTerm]);

  const handleViewChallan = (shipmentId: string) => {
    openAuthenticatedPdf(`/api/logistics/shipments/${shipmentId}/delivery-challan`);
  };

  const sendToAccountsMutation = useMutation({
    mutationFn: async (shipment: any) => {
      const importDuty = Number(shipment.plan?.importDuty || 0);
      const gstPaid = Number(shipment.plan?.gstPaid || 0);
      const totalAmount = importDuty + gstPaid;

      // In a real scenario, we'd need a valid supplier ID from the database
      // For now, use the vendorId if present, or a fallback for demo
      const supplierId = shipment.vendorId || shipment.supplierId || "00000000-0000-0000-0000-000000000001";

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

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black mb-2">Delivery Challans</h1>
          <p className="text-gray-500">
            View and download generated delivery challans for completed shipments
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search by consignment #, PO #, or client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-none h-11"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden ">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="py-4  text-slate-700">Challan #</TableHead>
                <TableHead className="py-4  text-slate-700">Consignment #</TableHead>
                <TableHead className="py-4  text-slate-700">PO #</TableHead>
                <TableHead className="py-4  text-slate-700">Client / Vendor</TableHead>
                <TableHead className="py-4  text-slate-700">Route</TableHead>
                <TableHead className="py-4  text-slate-700 text-right">Delivery Date</TableHead>
                <TableHead className="w-[120px] text-right py-4  text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500 italic">
                    No delivery challans found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className=" text-primary py-4">DC-{item.consignmentNumber.split('-').pop()}</TableCell>
                    <TableCell className="py-4 ">{item.consignmentNumber}</TableCell>
                    <TableCell className="py-4 ">{item.poNumber || "N/A"}</TableCell>
                    <TableCell className="py-4">
                      <div className=" text-slate-900">{item.clientName || item.vendorName || "N/A"}</div>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {item.source} → {item.destination}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className=" text-slate-700">
                          {item.deliveredAt ? format(new Date(item.deliveredAt), "dd MMM yyyy") : "N/A"}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center">
                          <Calendar className="h-2 w-2 mr-1" /> Delivered
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-primary hover:text-primary hover:bg-primary/5"
                          onClick={() => handleViewChallan(item.id)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" /> View PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleSendToAccounts(item)}
                          disabled={sendToAccountsMutation.isPending}
                        >
                          {sendToAccountsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Send
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
