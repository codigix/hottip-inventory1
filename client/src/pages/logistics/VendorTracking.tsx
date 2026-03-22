import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
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
  Package,
  Calendar as CalendarIcon,
  Trash2,
  RefreshCw,
  Users,
  Tag,
  Layout
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

import { DataTable, Column } from "@/components/ui/data-table";

const trackingStages = [
  { id: 'planned', label: 'Planned', icon: CalendarIcon, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-slate-100 text-slate-500', description: 'Shipment plan created' },
  { id: 'packed', label: 'Packed', icon: Package, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-emerald-100 text-emerald-600', description: 'Goods packed for shipment' },
  { id: 'dispatched', label: 'Dispatched', icon: Truck, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-blue-100 text-blue-600', description: 'Shipment left warehouse' },
  { id: 'vendor_ready', label: 'Vendor Ready', icon: Factory, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-purple-100 text-purple-600', description: 'Material ready at vendor factory' },
  { id: 'picked_up', label: 'Picked Up', icon: Truck, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-blue-100 text-blue-600', description: 'Forwarder collected shipment' },
  { id: 'export_customs', label: 'Export Customs', icon: FileText, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-orange-100 text-orange-600', description: 'China export clearance done' },
  { id: 'in_transit', label: 'In Transit', icon: Ship, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-indigo-100 text-indigo-600', description: 'Shipment moving via sea / air' },
  { id: 'arrived_india', label: 'Arrived India', icon: Anchor, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-cyan-100 text-cyan-600', description: 'Reached India port / airport' },
  { id: 'import_customs', label: 'Import Customs', icon: ShieldCheck, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-yellow-100 text-yellow-600', description: 'Custom clearance in India' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-amber-100 text-amber-600', description: 'Truck moving to warehouse' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-green-100 text-green-600', description: 'Goods received at warehouse' },
  { id: 'closed', label: 'Closed', icon: CheckCircle2, color: 'bg-slate-50 text-slate-400', activeColor: 'bg-primary text-white', description: 'Shipment completed' },
];

export default function VendorTracking() {
  const { toast } = useToast();
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/logistics/shipments']
  });

  const getVendorName = (shipment: any) => {
    if (!shipment) return "N/A";
    const vName = shipment.vendorName || shipment.supplier?.name || shipment.vendor?.name;
    const cName = shipment.clientName || shipment.client?.name;
    
    if (vName) return vName;
    if (cName) return `Client: ${cName}`;
    return "N/A";
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
        setSelectedShipment((prev: any) => prev ? { ...prev, status: variables.status } : null);
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

  const deleteShipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/logistics/shipments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shipment order deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shipment order",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (shipmentId: string, newStatus: string) => {
    updateStatusMutation.mutate({ shipmentId, status: newStatus });
  };

  const processedData = useMemo(() => {
    return shipments
      .filter(item => {
        const plan = item.plan || {};
        const vName = item.vendorName || item.supplier?.name || item.vendor?.name;
        if (!item.vendorId && !vName && !item.plan) return false;
        return true;
      })
      .map(item => {
        const plan = item.plan || {};
        
        let transport = "N/A";
        if (plan.shipmentType === "Sea") transport = `Sea (${plan.shippingLine || "N/A"})`;
        else if (plan.shipmentType === "Air") transport = `Air (${plan.airlineName || "N/A"})`;
        else if (plan.shipmentType === "Road") transport = "Road";

        const container = plan.containerNumber || plan.awbNumber || plan.truckNumber || "N/A";

        let status = (item.currentStatus || plan.status || "created").toLowerCase().replace(/\s+/g, '_');
        if (status === 'shipped') status = 'dispatched';

        const etaDate = plan.expectedArrival || plan.etaArrival || plan.etaArrivalAir || plan.deliveryDateRoad || item.expectedDeliveryDate;
        const eta = etaDate ? format(new Date(etaDate), "dd MMM yyyy") : "TBD";

        const route = plan.portOfLoading && plan.portOfDestination 
          ? `${plan.portOfLoading} → ${plan.portOfDestination}`
          : item.source && item.destination 
            ? `${item.source} → ${item.destination}`
            : "N/A";

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
          original: item
        };
      });
  }, [shipments]);

  const finalData = useMemo(() => {
    if (!statusFilter) return processedData;
    return processedData.filter(item => item.status === statusFilter);
  }, [processedData, statusFilter]);

  const getStatusBadge = (status: string) => {
    const stage = trackingStages.find(s => s.id === status);
    if (!stage) return <Badge variant="outline" className="text-xs">{(status || "").replace(/_/g, ' ')}</Badge>;
    
    return (
      <Badge className={`${stage.activeColor} border-none shadow-none px-2.5 py-1 text-[10px] tracking-wider`}>
        {stage.label}
      </Badge>
    );
  };

  const getStatusCount = (statusId: string) => {
    return processedData.filter(item => item.status === statusId).length;
  };

  const getStageIcon = (stage: any, isSelected: boolean, isActive: boolean) => {
    const Icon = stage.icon;
    return <Icon className="h-5 w-5" />;
  };

  const columns: Column<any>[] = [
    {
      key: "id",
      header: "Shipment ID",
      cell: (item) => <span className="text-primary text-xs hover:underline cursor-pointer transition-all duration-200" onClick={() => {
        setSelectedShipment(item);
        setIsDetailsOpen(true);
      }}>{item.id}</span>,
      sortable: true,
    },
    {
      key: "planId",
      header: "Plan ID",
      cell: (item) => (
        <span className="font-mono text-[10px] text-slate-400">{item.planId}</span>
      ),
      sortable: true,
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (item) => (
        <div className="max-w-[200px]">
          <div className="text-slate-900 text-xs">{item.vendor}</div>
          <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
            <MapPin className="h-2.5 w-2.5 mr-1 text-slate-300" /> {item.origin}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "transport",
      header: "Transport",
      cell: (item) => <span className="text-slate-600 text-xs">{item.transport}</span>,
      sortable: true,
    },
    {
      key: "container",
      header: "Container / AWB",
      cell: (item) => (
        <div className="bg-slate-50 border border-slate-100 rounded p-1 inline-block">
          <span className="font-mono text-[11px] text-slate-600 text-xs">
            {item.container}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "route",
      header: "Port Route",
      cell: (item) => (
        <div className="flex items-center text-slate-500 text-xs">
          <span className="truncate max-w-[80px]">{item.route.split(' → ')[0]}</span>
          <ArrowRight className="h-3 w-3 mx-1 text-slate-300 flex-shrink-0" />
          <span className="truncate max-w-[80px]">{item.route.split(' → ')[1]}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "eta",
      header: <div className="">ETA</div>,
      cell: (item) => <div className="text-right text-slate-700 text-xs">{item.eta}</div>,
      sortable: true,
    },
    {
      key: "totalAmount",
      header: <div className="text-right">Amount</div>,
      cell: (item) => (
        <div className="text-right">
          <div className="text-primary text-xs">₹{item.totalAmount.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400">Duty+GST</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => getStatusBadge(item.status),
      sortable: true,
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={() => {
              setSelectedShipment(item);
              setIsDetailsOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this shipment order?")) {
                deleteShipmentMutation.mutate(item.dbId);
              }
            }}
            disabled={deleteShipmentMutation.isPending}
          >
            {deleteShipmentMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-10 gap-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl text-slate-900">Vendor Transport Tracking</h1>
          <p className="text-slate-500 text-xs mt-1">
            Monitor international import shipments from vendors to warehouse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all h-10 px-4">
            <Clock className="mr-2 h-4 w-4 text-slate-400" /> History
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all h-10 px-4">
            <Plus className="mr-2 h-4 w-4" /> New Shipment
          </Button>
        </div>
      </div>

      {/* Tracking Workflow Stepper */}
      <div className="space-y-2 p-2">
        <div className="relative">
          <div className="absolute top-[15px] left-[4%] right-[4%] h-[1px] bg-primary hidden lg:block" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 relative z-10">
            {trackingStages.slice(0, 10).map((stage, idx) => {
              const count = getStatusCount(stage.id);
              const isActive = count > 0;
              const isSelected = statusFilter === stage.id;
              
              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => setStatusFilter(isSelected ? null : stage.id)}
                >
                  <div className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-300 border dotted ${
                    isSelected ? 'bg-[#3399FF] border-[#3399FF] text-white scale-110 shadow-blue-100' :
                    isActive ? 'bg-white border-[#3399FF] text-[#3399FF]' :
                    'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {isSelected ? (
                      <span className="text-xs">{idx + 1}</span>
                    ) : isActive ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span className="text-xs text-slate-300">{idx + 1}</span>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p className={`text-[11px] transition-colors ${
                      isSelected ? 'text-[#3399FF]' : isActive ? 'text-slate-800' : 'text-slate-900'
                    }`}>
                      {stage.label}
                    </p>
                    <div className="flex items-center justify-center mt-1">
                      <span className="text-xs text-slate-900">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex gap-12 border-t border-slate-50 pt-4">
          {trackingStages.slice(10).map((stage, idx) => {
            const count = getStatusCount(stage.id);
            const isActive = count > 0;
            const isSelected = statusFilter === stage.id;
            
            return (
              <div 
                key={stage.id} 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => setStatusFilter(isSelected ? null : stage.id)}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 ${
                  isSelected ? 'bg-[#3399FF] border-[#3399FF] text-white' :
                  isActive ? 'bg-white border-[#3399FF] text-[#3399FF]' :
                  'bg-white border-slate-200 text-slate-300'
                }`}>
                  {isActive ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs">{11 + idx}</span>}
                </div>
                <div>
                  <p className={`text-[10px]  ${
                    isSelected ? 'text-[#3399FF]' : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </p>
                  <p className="text-xl font-black text-slate-900 leading-none">{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DataTable
        data={finalData}
        columns={columns}
        searchPlaceholder="Search by shipment ID, vendor, container..."
      />

      {/* Shipment Details & Workflow Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-2">
            <DialogTitle className="text-xl flex items-center">
              <Box className="mr-2 h-3 w-3 text-primary" />
              Shipment Details: {selectedShipment?.id}
            </DialogTitle>
            <DialogDescription>
              Manage shipment progress and view transport details
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="flex flex-col h-full max-h-[85vh]">
              <ScrollArea className="flex-1">
                <div className="space-y-2 p-2">
                  {/* Modern Vertical Route & Info (Screenshot Style) */}
                  <div className="flex gap-8 p-2 bg-white rounded border border-slate-100 shadow-sm">
                    {/* Vertical Route Line & Details Section */}
                    <div className="flex-1 space-y-2">
                      {/* Route Header (Budapest -> Praha Style) */}
                      <div className="flex gap-4 mb-2">
                        <div className="flex flex-col items-center pt-1.5">
                          <div className="w-2.5 h-2.5 rounded bg-slate-400" />
                          <div className="w-0.5 h-10 bg-slate-200" />
                          <div className="w-2.5 h-2.5 rounded border-2 border-slate-400 bg-white" />
                        </div>
                        <div className="flex flex-col justify-between p-1">
                          <p className="text-sm text-slate-800 leading-none">{selectedShipment.origin || "Origin Port"}</p>
                          <p className="text-sm text-slate-800 leading-none">{selectedShipment.destination || "Destination Port"}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Shipment and route Section */}
                        <div className="space-y-2">
                          <h4 className="text-[#3399FF] text-sm">Shipment and route</h4>
                          <div className="flex items-start gap-4">
                            <Users className="h-3 w-3 text-slate-800 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-900">{selectedShipment.original?.items?.length || 0} items</p>
                              <p className="text-xs text-slate-900">{selectedShipment.container || "1 container"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Departure/Time Section */}
                        <div className="flex items-center gap-4">
                          <Clock className="h-3 w-3 text-slate-800" />
                          <p className="text-xs text-slate-900">
                            Dep.: {selectedShipment.original?.plan?.departureDate 
                              ? format(new Date(selectedShipment.original.plan.departureDate), "HH:mm") 
                              : "05:40"}
                          </p>
                        </div>

                        {/* Vehicle/Vessel Section */}
                        <div className="flex items-center gap-4">
                          {selectedShipment.original?.plan?.shipmentType === "Air" ? (
                            <Plane className="h-3 w-3 text-slate-800" />
                          ) : selectedShipment.original?.plan?.shipmentType === "Sea" ? (
                            <Ship className="h-3 w-3 text-slate-800" />
                          ) : (
                            <Truck className="h-3 w-3 text-slate-800" />
                          )}
                          <p className="text-xs text-slate-900 ">
                            {selectedShipment.original?.plan?.voyageNumber || 
                             selectedShipment.original?.plan?.flightNumber || 
                             selectedShipment.original?.plan?.truckNumber || 
                             "280 METROPOLITAN EC"}
                          </p>
                        </div>

                        {/* Service Request Section */}
                        <div className="space-y-2">
                          <h4 className="text-[#3399FF] text-sm">Service request</h4>
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 border-2 border-slate-900 flex items-center justify-center text-sm">
                              {selectedShipment.original?.plan?.shipmentType === "Air" ? "1" : "2"}
                            </div>
                            <p className="text-xs text-slate-900">
                              {selectedShipment.original?.plan?.incoterms || "Standard"} - {selectedShipment.original?.plan?.shipmentMode || "Import"}
                            </p>
                          </div>
                        </div>

                        {/* Offers Section */}
                        <div className="space-y-2">
                          <h4 className="text-[#3399FF] text-sm">Offers</h4>
                          <div className="flex items-center gap-4">
                            <Tag className="h-3 w-3 text-slate-800" />
                            <p className="text-xs text-slate-900">
                              Agent: {selectedShipment.original?.plan?.forwarderAgent || "Standard Carrier"}
                            </p>
                          </div>
                        </div>

                        {/* Seat Positioning / Container Placement */}
                        <div className="space-y-2">
                          <h4 className="text-[#3399FF] text-sm">Seat positioning</h4>
                          <div className="flex items-center gap-4">
                            <Layout className="h-3 w-3 text-slate-800" />
                            <p className="text-xs text-slate-900">
                              {selectedShipment.original?.plan?.containerType || selectedShipment.original?.plan?.vesselName || "Standard Placement"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Timeline */}
                  <div className="space-y-4 bg-white p-4 rounded border border-slate-100">
                    <h3 className="text-sm text-slate-500 flex items-center">
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
                              <div className={`z-10 w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${
                                isActive ? 'bg-primary border-primary text-white scale-110' : 
                                isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                'bg-white border-slate-200 text-slate-400'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <p className={`mt-2 text-[8px] text-center w-12 ${
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
                      <p className="text-xs text-slate-600">
                        Current Status: <span className="text-slate-900">{(selectedShipment?.status || "").replace(/_/g, ' ').toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Additional Details from Plan */}
                  {selectedShipment.original?.plan && (
                    <div className="space-y-2 mb-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3 p-2 bg-slate-50/50 rounded border border-slate-100">
                          <h4 className="text-xs text-slate-400  flex items-center">
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
                                  <span className="">{selectedShipment.original.plan.truckNumber || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Driver:</span>
                                  <span className="">{selectedShipment.original.plan.driverName || "N/A"} {selectedShipment.original.plan.driverPhone ? `(${selectedShipment.original.plan.driverPhone})` : ""}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                  <span className="text-slate-500">Pickup:</span>
                                  <span className="">{selectedShipment.original.plan.pickupLocation || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Delivery:</span>
                                  <span className="">{selectedShipment.original.plan.deliveryLocation || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                  <span className="text-slate-500">Dispatch:</span>
                                  <span className="">
                                    {selectedShipment.original.plan.dispatchDateRoad 
                                      ? format(new Date(selectedShipment.original.plan.dispatchDateRoad), "dd-MM-yyyy") 
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Exp. Delivery:</span>
                                  <span className="text-primary">
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
                                  <span className="">{selectedShipment.original.plan.voyageNumber || selectedShipment.original.plan.flightNumber || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "AWB #" : "BL/Seal #"}:</span>
                                  <span className="">
                                    {selectedShipment.original.plan.awbNumber || (
                                      (selectedShipment.original.plan.blNumber || "N/A") + " / " + (selectedShipment.original.plan.sealNumber || "N/A")
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                  <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "Loading Apt:" : "Loading Port:"}</span>
                                  <span className="">{selectedShipment.original.plan.portOfLoading || selectedShipment.original.plan.departureAirport || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">{selectedShipment.original.plan.shipmentType === "Air" ? "Dest. Apt:" : "Dest. Port:"}</span>
                                  <span className="">{selectedShipment.original.plan.portOfDestination || selectedShipment.original.plan.arrivalAirport || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                  <span className="text-slate-500">Departure:</span>
                                  <span className="">
                                    {selectedShipment.original.plan.departureDate || selectedShipment.original.plan.flightDeparture 
                                      ? format(new Date(selectedShipment.original.plan.departureDate || selectedShipment.original.plan.flightDeparture), "dd-MM-yyyy") 
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">ETA Arrival:</span>
                                  <span className="text-primary">
                                    {selectedShipment.original.plan.etaArrival || selectedShipment.original.plan.etaArrivalAir
                                      ? format(new Date(selectedShipment.original.plan.etaArrival || selectedShipment.original.plan.etaArrivalAir), "dd-MM-yyyy") 
                                      : "N/A"}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 p-4 bg-slate-50/50 rounded border border-slate-100">
                          <h4 className="text-xs text-slate-400  flex items-center">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Custom Clearance
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Agent:</span>
                              <span className="">{selectedShipment.original.plan.clearingAgent || "N/A"}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">B/E Number:</span>
                              <span className="">{selectedShipment.original.plan.billOfEntry || "N/A"}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                              <span className="text-slate-500">Import Duty:</span>
                              <span className="">₹{Number(selectedShipment.original.plan.importDuty || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">GST Paid:</span>
                              <span className="">₹{Number(selectedShipment.original.plan.gstPaid || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                              <span className="text-slate-500">Status:</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-5">
                                {selectedShipment.original.plan.customStatus || "Pending"}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Clearance Date:</span>
                              <span className="">
                                {selectedShipment.original.plan.clearanceDate 
                                  ? format(new Date(selectedShipment.original.plan.clearanceDate), "dd-MM-yyyy") 
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="bg-slate-50/50 p-4 border-t border-slate-100">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedShipment.dbId, getPreviousStatus(selectedShipment.status))}
                      disabled={selectedShipment.status === trackingStages[0].id || updateStatusMutation.isPending}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedShipment.dbId, getNextStatus(selectedShipment.status))}
                      disabled={selectedShipment.status === trackingStages[trackingStages.length - 1].id || updateStatusMutation.isPending}
                    >
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
