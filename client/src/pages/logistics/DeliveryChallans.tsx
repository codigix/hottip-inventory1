import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Package, 
  MapPin, 
  Calendar,
  ExternalLink
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

export default function DeliveryChallans() {
  const [searchTerm, setSearchTerm] = useState("");

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

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Delivery Challans</h1>
          <p className="text-muted-foreground">
            View and download generated delivery challans for completed shipments
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by consignment #, PO #, or client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-none h-11"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="py-4 font-semibold text-slate-700">Challan #</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Consignment #</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Client / Vendor</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Route</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700 text-right">Delivery Date</TableHead>
                <TableHead className="w-[120px] text-right py-4 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    No delivery challans found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="font-bold text-primary py-4">DC-{item.consignmentNumber.split('-').pop()}</TableCell>
                    <TableCell className="py-4 font-medium">{item.consignmentNumber}</TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-900">{item.clientName || item.vendorName || "N/A"}</div>
                      <div className="text-[10px] text-muted-foreground">PO: {item.poNumber || "N/A"}</div>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {item.source} → {item.destination}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-slate-700">
                          {item.deliveredAt ? format(new Date(item.deliveredAt), "dd MMM yyyy") : "N/A"}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          <Calendar className="h-2 w-2 mr-1" /> Delivered
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => handleViewChallan(item.id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" /> View PDF
                      </Button>
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
