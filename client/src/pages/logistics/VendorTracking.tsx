import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Package, 
  Factory, 
  Truck, 
  FileText, 
  Ship, 
  Plane, 
  Anchor, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  ArrowLeft,
  Info,
  Eye,
  Box,
  Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getNextStatus, getPreviousStatus } from "@shared/schema";
import { openAuthenticatedPdf } from "@/lib/utils";

const trackingStages = [
  { id: 'created', label: 'Created', icon: Package, color: 'bg-slate-50 text-slate-500', description: 'Shipment created' },
  { id: 'planned', label: 'Planned', icon: CalendarIcon, color: 'bg-slate-100 text-slate-600', description: 'Shipment plan created' },
  { id: 'packed', label: 'Packed', icon: Box, color: 'bg-emerald-100 text-emerald-600', description: 'Goods packed for shipment' },
  { id: 'dispatched', label: 'Dispatched', icon: Truck, color: 'bg-blue-50 text-blue-500', description: 'Shipment left warehouse' },
  { id: 'vendor_ready', label: 'Vendor Ready', icon: Factory, color: 'bg-purple-100 text-purple-600', description: 'Material ready at vendor factory' },
  { id: 'picked_up', label: 'Picked Up', icon: Truck, color: 'bg-blue-100 text-blue-600', description: 'Forwarder collected shipment' },
  { id: 'export_customs', label: 'Export Customs', icon: FileText, color: 'bg-orange-100 text-orange-600', description: 'China export clearance done' },
  { id: 'in_transit', label: 'In Transit', icon: Ship, color: 'bg-indigo-100 text-indigo-600', description: 'Shipment moving via sea / air' },
  { id: 'arrived_india', label: 'Arrived India', icon: Anchor, color: 'bg-cyan-100 text-cyan-600', description: 'Reached India port / airport' },
  { id: 'import_customs', label: 'Import Customs', icon: ShieldCheck, color: 'bg-yellow-100 text-yellow-600', description: 'Custom clearance in India' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-amber-100 text-amber-600', description: 'Truck moving to warehouse' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 text-green-600', description: 'Goods received at warehouse' },
  { id: 'closed', label: 'Closed', icon: CheckCircle2, color: 'bg-slate-800 text-white', description: 'Shipment completed' },
];

export default function VendorTracking() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/logistics/shipments']
  });

  const getVendorName = (shipment: any) => {
    if (!shipment) return "N/A";
    return shipment.vendorName || shipment.supplier?.name || shipment.vendor?.name || shipment.clientName || "N/A";
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ shipmentId, status }: { shipmentId: string, status: string }) => {
      return apiRequest("PUT", `/logistics/shipments/${shipmentId}/status`, { status });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Shipment status updated to ${(variables.status || "").replace(/_/g, ' ')} successfully.`,
      });

      // If status is 'delivered', open delivery challan
      if (variables.status === 'delivered') {
        openAuthenticatedPdf(`/api/logistics/shipments/${variables.shipmentId}/delivery-challan`);
      }

      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
      // Update local selected shipment if open
      if (selectedShipment) {
        const updated = processedData.find(s => s.dbId === selectedShipment.dbId);
        if (updated) setSelectedShipment(updated);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (shipmentId: string, newStatus: string) => {
    updateStatusMutation.mutate({ shipmentId, status: newStatus });
  };

  const processedData = useMemo(() => {
    // Only include shipments that have a plan
    return shipments
      .filter(item => item.plan && item.plan.planId)
      .map(item => {
        const plan = item.plan || {};
        
        // Determine transport display
        let transport = "N/A";
        if (plan.shipmentType === "Sea") transport = `Sea (${plan.shippingLine || "N/A"})`;
        else if (plan.shipmentType === "Air") transport = `Air (${plan.airlineName || "N/A"})`;
        else if (plan.shipmentType === "Road") transport = "Road";

        // Determine container/AWB
        const container = plan.containerNumber || plan.awbNumber || plan.truckNumber || "N/A";

        // Determine status - prioritized shipment status over plan status
        let status = (item.currentStatus || plan.status || "created").toLowerCase().replace(/\s+/g, '_');
        
        // Basic normalization if needed
        if (status === 'shipped') status = 'dispatched';

        // ETA
        const etaDate = plan.expectedArrival || plan.etaArrival || plan.etaArrivalAir || plan.deliveryDateRoad || item.expectedDeliveryDate;
        const eta = etaDate ? format(new Date(etaDate), "dd MMM yyyy") : "TBD";

        // Route
        const route = plan.portOfLoading && plan.portOfDestination 
          ? `${plan.portOfLoading} → ${plan.portOfDestination}`
          : item.source && item.destination 
            ? `${item.source} → ${item.destination}`
            : "N/A";

        // Financials
        const importDuty = Number(plan.importDuty || 0);
        const gstPaid = Number(plan.gstPaid || 0);
        const totalAmount = importDuty + gstPaid;

        return {
          id: item.consignmentNumber,
          dbId: item.id,
          planId: plan.planId || "N/A",
          vendor: getVendorName(item),
          transport,
          container,
          status,
          eta,
          route,
          origin: item.source,
          destination: item.destination,
          importDuty,
          gstPaid,
          totalAmount,
          original: item // Keep the original object here for easy access
        };
      });
  }, [shipments]);

  const filteredData = useMemo(() => {
    return processedData.filter(item => 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.container.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  const getStatusBadge = (status: string) => {
    const stage = trackingStages.find(s => s.id === status);
    if (!stage) return <Badge variant="outline" className="uppercase text-[10px]">{(status || "").replace(/_/g, ' ')}</Badge>;
    
    return (
      <Badge variant="outline" className={`${stage.color} border-none font-medium px-2 py-0.5 uppercase text-[10px]`}>
        {stage.label}
      </Badge>
    );
  };

  const getStatusCount = (statusId: string) => {
    return processedData.filter(item => item.status === statusId).length;
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-10 gap-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vendor Transport Tracking</h1>
          <p className="text-muted-foreground">
            Monitor international import shipments from vendors to warehouse
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-slate-200">
            <Clock className="mr-2 h-4 w-4" /> History
          </Button>
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Shipment
          </Button>
        </div>
      </div>

      {/* Tracking Workflow Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {trackingStages.map((stage) => {
          const Icon = stage.icon;
          const count = getStatusCount(stage.id);
          return (
            <Card key={stage.id} className={`border-none shadow-sm ${count > 0 ? 'bg-white ring-1 ring-primary/20' : 'bg-slate-50 opacity-70'}`}>
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <div className={`p-1.5 rounded-full ${stage.color} mb-1.5`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-tight text-slate-500 mb-1 leading-none">{stage.label}</p>
                <p className="text-xl font-black leading-none">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by shipment ID, vendor, container..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-none h-11 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="h-11 px-5 border-slate-200">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" className="h-11 px-5 border-slate-200">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="w-[180px] py-4 font-semibold text-slate-700">Shipment ID</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Plan ID</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Vendor</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Transport</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Container / AWB</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Port Route</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700 text-right">ETA</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700 text-right">Amount</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Status</TableHead>
                <TableHead className="w-[150px] text-right py-4 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground italic">
                    No shipments found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="font-bold text-primary py-4">{item.id}</TableCell>
                    <TableCell className="py-4 font-mono text-[10px] text-slate-500">{item.planId}</TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-900">{item.vendor}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center">
                        <MapPin className="h-2 w-2 mr-1" /> {item.origin}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-medium">{item.transport}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-mono text-[10px]">
                        {item.container}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">{item.route}</TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="font-bold text-slate-700">{item.eta}</div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="font-bold text-primary">₹{item.totalAmount.toLocaleString('en-IN')}</div>
                      <div className="text-[9px] text-muted-foreground">Duty+GST</div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        {getNextStatus(item.status) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(item.dbId, getNextStatus(item.status)!);
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            Next: {(getNextStatus(item.status) || "").replace(/_/g, ' ')}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                          onClick={() => {
                            setSelectedShipment(item);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Shipment Details & Workflow Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Package className="mr-2 h-6 w-6 text-primary" />
              Shipment Details: {selectedShipment?.id}
            </DialogTitle>
            <DialogDescription>
              Manage shipment progress and view transport details
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 py-4 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-slate-100 bg-slate-50/50 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <Factory className="mr-2 h-4 w-4" /> Vendor / Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-bold text-lg leading-tight">{selectedShipment.vendor}</p>
                      {(selectedShipment.original?.supplier?.city || selectedShipment.original?.supplier?.address) && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                          <MapPin className="h-2 w-2 mr-1" />
                          {selectedShipment.original.supplier.city || selectedShipment.original.supplier.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">PO: {selectedShipment.original?.poNumber || "N/A"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedShipment.origin} → {selectedShipment.destination}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-100 bg-slate-50/50 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <Truck className="mr-2 h-4 w-4" /> Transport
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-bold text-lg">{selectedShipment.transport}</p>
                      <p className="text-xs font-mono">{selectedShipment.container}</p>
                      {selectedShipment.original?.plan?.vesselName && (
                        <p className="text-xs text-muted-foreground mt-1">Vessel: {selectedShipment.original.plan.vesselName}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Status and Timeline */}
                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                    <Clock className="mr-2 h-4 w-4" /> Shipment Timeline
                  </h3>
                  <div className="relative pt-2">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full bg-slate-100 -translate-y-1/2"></div>
                    <div className="flex justify-between items-center relative">
                      {trackingStages.slice(0, 9).map((stage, idx) => {
                        const isActive = stage.id === selectedShipment.status;
                        const isCompleted = trackingStages.findIndex(s => s.id === selectedShipment.status) > idx;
                        const Icon = stage.icon;
                        
                        return (
                          <div key={stage.id} className="flex flex-col items-center group">
                            <div className={`z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              isActive ? 'bg-primary border-primary text-white scale-110' : 
                              isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                              'bg-white border-slate-200 text-slate-400'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <p className={`mt-2 text-[8px] font-bold uppercase text-center w-12 ${
                              isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              {stage.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg flex items-center space-x-3 mt-4">
                    <Info className="h-4 w-4 text-blue-500" />
                    <p className="text-xs font-medium text-slate-600">
                      Current Status: <span className="font-bold text-slate-900">{(selectedShipment?.status || "").replace(/_/g, ' ').toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Additional Details from Plan */}
                {selectedShipment.original?.plan && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                          {selectedShipment.original.plan.shipmentType === "Air" && <Plane className="h-3 w-3 mr-1" />}
                          {selectedShipment.original.plan.shipmentType === "Sea" && <Ship className="h-3 w-3 mr-1" />}
                          {selectedShipment.original.plan.shipmentType === "Road" && <Truck className="h-3 w-3 mr-1" />}
                          {selectedShipment.original.plan.shipmentType === "Road" ? "Vehicle & Route Details" : "Transit & Port Details"}
                        </h4>
                        <div className="space-y-2">
                          {selectedShipment.original.plan.shipmentType === "Road" ? (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Truck Number:</span>
                                <span className="font-medium">{selectedShipment.original.plan.truckNumber || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Driver:</span>
                                <span className="font-medium">{selectedShipment.original.plan.driverName || "N/A"} {selectedShipment.original.plan.driverPhone ? `(${selectedShipment.original.plan.driverPhone})` : ""}</span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-500">Pickup:</span>
                                <span className="font-medium">{selectedShipment.original.plan.pickupLocation || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Delivery:</span>
                                <span className="font-medium">{selectedShipment.original.plan.deliveryLocation || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-500">Dispatch:</span>
                                <span className="font-medium">
                                  {selectedShipment.original.plan.dispatchDateRoad 
                                    ? format(new Date(selectedShipment.original.plan.dispatchDateRoad), "dd-MM-yyyy") 
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Exp. Delivery:</span>
                                <span className="font-medium text-primary">
                                  {selectedShipment.original.plan.deliveryDateRoad 
                                    ? format(new Date(selectedShipment.original.plan.deliveryDateRoad), "dd-MM-yyyy") 
                                    : "N/A"}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "Flight #" : "Voyage #"}:</span>
                                <span className="font-medium">{selectedShipment.original.plan.voyageNumber || selectedShipment.original.plan.flightNumber || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "AWB #" : "BL/Seal #"}:</span>
                                <span className="font-medium">
                                  {selectedShipment.original.plan.awbNumber || (
                                    (selectedShipment.original.plan.blNumber || "N/A") + " / " + (selectedShipment.original.plan.sealNumber || "N/A")
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "Loading Apt:" : "Loading Port:"}</span>
                                <span className="font-medium">{selectedShipment.original.plan.portOfLoading || selectedShipment.original.plan.departureAirport || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "Dest. Apt:" : "Dest. Port:"}</span>
                                <span className="font-medium">{selectedShipment.original.plan.portOfDestination || selectedShipment.original.plan.arrivalAirport || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-500">Departure:</span>
                                <span className="font-medium">
                                  {selectedShipment.original.plan.departureDate || selectedShipment.original.plan.flightDeparture 
                                    ? format(new Date(selectedShipment.original.plan.departureDate || selectedShipment.original.plan.flightDeparture), "dd-MM-yyyy") 
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">ETA Arrival:</span>
                                <span className="font-medium text-primary">
                                  {selectedShipment.original.plan.etaArrival || selectedShipment.original.plan.etaArrivalAir
                                    ? format(new Date(selectedShipment.original.plan.etaArrival || selectedShipment.original.plan.etaArrivalAir), "dd-MM-yyyy") 
                                    : "N/A"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Custom Clearance
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Bill of Entry:</span>
                            <span className="font-medium">{selectedShipment.original.plan.billOfEntry || "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Custom Status:</span>
                            <Badge variant="outline" className="h-4 text-[9px] bg-green-50 border-green-200 text-green-700">
                              {selectedShipment.original.plan.customStatus || "Pending"}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Import Duty:</span>
                            <span className="font-medium">₹{selectedShipment.original.plan.importDuty || "0.00"}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">GST Paid:</span>
                            <span className="font-medium">₹{selectedShipment.original.plan.gstPaid || "0.00"}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Clearance Date:</span>
                            <span className="font-medium">{selectedShipment.original.plan.clearanceDate ? format(new Date(selectedShipment.original.plan.clearanceDate), "dd-MM-yyyy") : "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Clearing Agent:</span>
                            <span className="font-medium">{selectedShipment.original.plan.clearingAgent || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipment Items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                    <Package className="mr-2 h-4 w-4" /> Shipment Items
                  </h3>
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-xs">Material Name</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Qty</TableHead>
                          <TableHead className="text-xs">Unit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedShipment.original?.items && Array.isArray(selectedShipment.original.items) && selectedShipment.original.items.length > 0 ? (
                          selectedShipment.original.items.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs font-medium">{item.materialName}</TableCell>
                              <TableCell className="text-xs text-slate-500">{item.description || item.type || "Material"}</TableCell>
                              <TableCell className="text-xs text-right font-bold">{item.quantity}</TableCell>
                              <TableCell className="text-xs">{item.unit}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-xs text-slate-400">No items listed</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <div className="flex w-full justify-between items-center">
              <div>
                {getPreviousStatus(selectedShipment?.status || "") && (
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                    onClick={() => handleStatusUpdate(selectedShipment.dbId, getPreviousStatus(selectedShipment.status)!)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to {(getPreviousStatus(selectedShipment.status) || "").replace(/_/g, ' ')}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                {getNextStatus(selectedShipment?.status || "") && (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleStatusUpdate(selectedShipment.dbId, getNextStatus(selectedShipment.status)!)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Next: {(getNextStatus(selectedShipment.status) || "").replace(/_/g, ' ')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
