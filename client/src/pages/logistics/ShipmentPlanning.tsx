import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, Legend
} from "recharts";
import { Plus, Search, Filter, Download, Calendar as CalendarIcon, MapPin, Route, Clock, TrendingUp, Eye, Package, ShoppingCart, Ship, Plane, Truck, ShieldCheck, CheckCircle2, MoreVertical, Edit, FileText, Anchor, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types
interface LogisticsShipment {
  id: string;
  consignmentNumber: string;
  poNumber?: string;
  source: string;
  destination: string;
  clientId?: string;
  vendorId?: string;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  currentStatus: string;
  isApproved: boolean;
  vendorName?: string;
  clientName?: string;
  vendor?: any;
  supplier?: any;
  items?: any[];
}

interface LogisticsShipmentPlan {
  id: string;
  shipmentId: string;
  planId: string;
  shipmentType: "Air" | "Sea" | "Road";
  shipmentMode: "Import" | "Export";
  incoterms: "FOB" | "CIF" | "EXW";
  forwarderAgent?: string;
  plannedDispatch?: string;
  expectedArrival?: string;
  status: string;

  // Sea Freight Details
  shippingLine?: string;
  vesselName?: string;
  voyageNumber?: string;
  containerNumber?: string;
  containerType?: "20FT" | "40FT";
  sealNumber?: string;
  blNumber?: string;
  portOfLoading?: string;
  portOfDestination?: string;
  departureDate?: string;
  etaArrival?: string;

  // Air Freight Details
  airlineName?: string;
  flightNumber?: string;
  awbNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  flightDeparture?: string;
  etaArrivalAir?: string;
  cargoWeight?: number;
  cargoVolume?: number;

  // Truck Transport Details
  transportCompany?: string;
  truckNumber?: string;
  driverName?: string;
  driverPhone?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  dispatchDateRoad?: string;
  deliveryDateRoad?: string;

  // Custom Clearance
  clearingAgent?: string;
  billOfEntry?: string;
  importDuty?: number;
  gstPaid?: number;
  customStatus?: "Pending" | "Cleared";
  clearanceDate?: string;
}

const analysisData = [
  { name: 'Mon', active: 40, planned: 24, completed: 20 },
  { name: 'Tue', active: 30, planned: 13, completed: 22 },
  { name: 'Wed', active: 20, planned: 58, completed: 18 },
  { name: 'Thu', active: 27, planned: 39, completed: 25 },
  { name: 'Fri', active: 18, planned: 48, completed: 21 },
  { name: 'Sat', active: 23, planned: 38, completed: 15 },
  { name: 'Sun', active: 34, planned: 43, completed: 12 },
];

const typeDistribution = [
  { name: 'Sea', value: 45, color: '#3b82f6' },
  { name: 'Air', value: 25, color: '#6366f1' },
  { name: 'Road', value: 30, color: '#10b981' },
];

export default function ShipmentPlanning() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("list");
  const [isPlanningDialogOpen, setIsPlanningDialogOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<LogisticsShipment | null>(null);
  const [shipmentPlan, setShipmentPlan] = useState<Partial<LogisticsShipmentPlan>>({
    shipmentType: "Sea",
    shipmentMode: "Import",
    incoterms: "FOB",
    status: "Planned",
  });

  const { data: shipments = [], isLoading: isLoadingShipments } = useQuery<LogisticsShipment[]>({
    queryKey: ['/logistics/shipments', { isApproved: true }]
  });

  const getVendorName = (shipment: LogisticsShipment | any) => {
    if (!shipment) return "N/A";
    return shipment.vendorName || shipment.supplier?.name || shipment.vendor?.name || shipment.clientName || "N/A";
  };

  // Fetch existing plans
  // Note: Backend doesn't have a direct get-all-plans yet, we'll fetch them individually or use a placeholder
  // For now, we use the shipments list as the main driver for planning

  const createPlanMutation = useMutation({
    mutationFn: async (plan: any) => {
      return apiRequest("POST", "/logistics/shipments/plans", plan);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shipment plan created successfully. Redirecting to tracking...",
      });
      setIsPlanningDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
      // Redirect to Vendor Tracking after successful planning
      setLocation("/logistics/vendor-tracking");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment plan",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, plan }: { id: string, plan: any }) => {
      return apiRequest("PUT", `/logistics/shipments/plans/${id}`, plan);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shipment plan updated successfully. Redirecting to tracking...",
      });
      setIsPlanningDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
      // Redirect to Vendor Tracking after successful planning
      setLocation("/logistics/vendor-tracking");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shipment plan",
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

  const handleOpenPlanning = async (shipment: LogisticsShipment, readOnly: boolean = false) => {
    setSelectedShipment(shipment);
    setIsReadOnly(readOnly);
    
    // Check if plan already exists
    try {
      const existingPlan = await apiRequest(`/logistics/shipments/${shipment.id}/plan`);
      setShipmentPlan(existingPlan);
    } catch (e: any) {
      console.log("No existing plan found, initializing new plan", e.message);
      setShipmentPlan({
        shipmentId: shipment.id,
        planId: `PLAN-${shipment.consignmentNumber}`,
        shipmentType: "Sea",
        shipmentMode: "Import",
        incoterms: "FOB",
        status: "Planned",
        plannedDispatch: shipment.dispatchDate,
        expectedArrival: shipment.expectedDeliveryDate,
      });
    }
    
    setIsPlanningDialogOpen(true);
  };

  const handleSavePlan = () => {
    // Sanitize shipmentPlan to remove nulls or empty strings for optional fields
    // and remove extra fields that shouldn't be sent to backend
    const sanitizedPlan = Object.entries(shipmentPlan).reduce((acc, [key, value]) => {
      // Keep shipmentId and planId as they are required
      if (key === "shipmentId" || key === "planId") {
        acc[key] = value;
        return acc;
      }

      // Remove internal/backend fields
      if (key === "id" || key === "createdAt" || key === "updatedAt" || key === "shipment" || key === "vendor" || key === "client") {
        return acc;
      }

      // Remove null or empty string values for optional fields
      if (value === null || value === "") {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {} as any);

    console.log("Saving sanitized shipment plan:", sanitizedPlan);

    if ((shipmentPlan as any).id) {
      updatePlanMutation.mutate({ id: (shipmentPlan as any).id, plan: sanitizedPlan });
    } else {
      createPlanMutation.mutate(sanitizedPlan);
    }
  };

  const columns: Column<LogisticsShipment>[] = [
    {
      key: "consignmentNumber",
      header: "Consignment #",
      cell: (shipment) => (
        <span className="text-primary">{shipment.consignmentNumber}</span>
      ),
      sortable: true,
    },
    {
      key: "poNumber",
      header: "PO Number",
      cell: (shipment) => shipment.poNumber || "N/A",
      sortable: true,
    },
    {
      key: "vendorName",
      header: "Vendor",
      cell: (shipment) => getVendorName(shipment),
      sortable: true,
    },
    {
      key: "source",
      header: "Route",
      cell: (shipment) => (
        <div className="text-xs">
          <div>From: {shipment.source}</div>
          <div>To: {shipment.destination}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: () => (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Approved
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (shipment) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => handleOpenPlanning(shipment, true)}
            title="View Plan"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleOpenPlanning(shipment, false)}
            title="Edit Plan"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white h-8"
            onClick={() => handleOpenPlanning(shipment, false)}
          >
            <CalendarIcon className="h-4 w-4 mr-2" /> Shipment Planning
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this shipment order?")) {
                deleteShipmentMutation.mutate(shipment.id);
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

  if (isLoadingShipments) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-2 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl">Shipment Planning</h1>
          <p className="text-gray-500 text-xs">
            Optimize routes and schedule future shipments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="list" className="px-6">Planning List</TabsTrigger>
          <TabsTrigger value="analysis" className="px-6">Route Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="  bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-blue-50">
                    <CalendarIcon className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-xs  text-emerald-500">+0%</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">Upcoming Visits</p>
                <p className="text-xl ">0</p>
              </CardContent>
            </Card>
            <Card className="  bg-card/50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-orange-50">
                    <Route className="h-3 w-3 text-orange-600" />
                  </div>
                  <span className="text-xs  text-emerald-500">+0%</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">Optimized Routes</p>
                <p className="text-xl ">0</p>
              </CardContent>
            </Card>
            <Card className="  bg-card/50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-indigo-50">
                    <MapPin className="h-3 w-3 text-indigo-600" />
                  </div>
                  <span className="text-xs  text-emerald-500">+0%</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">Active Clusters</p>
                <p className="text-xl ">0</p>
              </CardContent>
            </Card>
            <Card className="  bg-card/50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-green-50">
                    <Clock className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-xs  text-emerald-500">+0%</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">Resource Utilization</p>
                <p className="text-xl ">0%</p>
              </CardContent>
            </Card>
          </div>

          <DataTable
            data={shipments || []}
            columns={columns}
            searchPlaceholder="Search by consignment, PO, vendor, or client..."
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="  bg-card/50">
              <CardHeader>
                <CardTitle>Shipment Planning Performance</CardTitle>
                <CardDescription>Weekly overview of planned vs completed shipments</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#6366f1" radius={[4, 4, 0, 0]} name="Planned" />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="  bg-card/50">
              <CardHeader>
                <CardTitle>Shipment Mode Distribution</CardTitle>
                <CardDescription>Breakdown of shipments by transport mode</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2   bg-card/50">
              <CardHeader>
                <CardTitle>Planning Activity Trend</CardTitle>
                <CardDescription>Daily activity tracking for shipment planning</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analysisData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorActive)" 
                      name="Active Plans" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Shipment Planning Dialog */}
      <Dialog open={isPlanningDialogOpen} onOpenChange={setIsPlanningDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0  shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{isReadOnly ? "View Shipment Plan" : "Shipment Planning"}</DialogTitle>
            <DialogDescription className="text-xs">
              Optimize routes and schedule future shipments
            </DialogDescription>
          </DialogHeader>
          <div className=" p-2 bg-white sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl  mb-1 flex items-center">
                  <Package className="mr-3 h-8 w-8" />
                  {isReadOnly ? "View Shipment Plan" : "Shipment Planning"}
                </h2>
                <p className="opacity-90 text-xs">Optimize routes and schedule future shipments</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 px-4 py-2 rounded backdrop-blur-md">
                  <p className="text-xs   opacity-70">Plan Status</p>
                  <p className="text-sm ">{shipmentPlan.status || "Planned"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Left Column: Basic Info & Timeline */}
              <div className="md:col-span-1 space-y-3">
                <section className="bg-white p-2 rounded border border-slate-100 ">
                  <h3 className="text-sm  text-black  mb-4 flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-sm text-primary" /> Basic Information
                  </h3>
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs  text-slate-500">Plan ID</Label>
                      <Input 
                        value={shipmentPlan.planId || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, planId: e.target.value})}
                        className="bg-slate-50 border-slate-100 "
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                      <p className="text-xs  text-slate-500  tracking-tighter mb-1">Vendor Details</p>
                      <div className="flex flex-col space-y-0.5">
                        <p className=" text-slate-800 text-sm leading-tight">
                          {getVendorName(selectedShipment)}
                        </p>
                        {(selectedShipment?.supplier?.city || selectedShipment?.supplier?.address) && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="h-2 w-2 mr-1" />
                            {selectedShipment.supplier.city || selectedShipment.supplier.address}
                            {selectedShipment.supplier.country && `, ${selectedShipment.supplier.country}`}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                        PO: {selectedShipment?.poNumber || "N/A"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs  text-slate-500">Type</Label>
                        <Select 
                          value={shipmentPlan.shipmentType} 
                          onValueChange={(v: any) => setShipmentPlan({...shipmentPlan, shipmentType: v})}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="bg-slate-50 border-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sea">🚢 Sea</SelectItem>
                            <SelectItem value="Air">✈️ Air</SelectItem>
                            <SelectItem value="Road">🚛 Road</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs  text-slate-500">Mode</Label>
                        <Select 
                          value={shipmentPlan.shipmentMode} 
                          onValueChange={(v: any) => setShipmentPlan({...shipmentPlan, shipmentMode: v})}
                        >
                          <SelectTrigger className="bg-slate-50 border-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Import">Import</SelectItem>
                            <SelectItem value="Export">Export</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs  text-slate-500">Incoterms</Label>
                        <Select 
                          value={shipmentPlan.incoterms} 
                          onValueChange={(v: any) => setShipmentPlan({...shipmentPlan, incoterms: v})}
                        >
                          <SelectTrigger className="bg-slate-50 border-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FOB">FOB</SelectItem>
                            <SelectItem value="CIF">CIF</SelectItem>
                            <SelectItem value="EXW">EXW</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs  text-slate-500">Forwarder</Label>
                        <Input 
                          value={shipmentPlan.forwarderAgent || ""} 
                          onChange={(e) => setShipmentPlan({...shipmentPlan, forwarderAgent: e.target.value})}
                          placeholder="e.g. DHL"
                          className="bg-slate-50 border-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-2 rounded border border-slate-100  overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded -mr-16 -mt-16 pointer-events-none"></div>
                   <h3 className="text-sm  text-black  mb-6 flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-primary" /> Shipment Timeline
                  </h3>
                  <div className="space-y-0 relative pl-4">
                    <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    
                    {[
                      { label: "Planned", status: "completed", icon: CalendarIcon },
                      { label: "Vendor Ready", status: "pending", icon: Package },
                      { label: "Picked Up", status: "pending", icon: Truck },
                      { label: "Export Customs", status: "pending", icon: ShieldCheck },
                      { label: "In Transit", status: "pending", icon: Route },
                      { label: "Arrived India", status: "pending", icon: Anchor },
                      { label: "Import Customs", status: "pending", icon: ShieldCheck },
                      { label: "Out for Delivery", status: "pending", icon: Truck },
                      { label: "Delivered", status: "pending", icon: CheckCircle2 }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-4 mb-6 relative">
                        <div className={`z-10 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          step.status === "completed" ? "bg-primary border-primary text-white scale-125" : "bg-white border-slate-200"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded ${step.status === "completed" ? "bg-white" : "bg-slate-200"}`}></div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs  ${step.status === "completed" ? "text-primary" : "text-slate-400"}`}>{step.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Middle & Right Column: Freight Details */}
              <div className="md:col-span-2 space-y-3">
                {/* Specific Freight Details based on Type */}
                <section className="bg-white p-4 rounded border border-slate-100  relative">
                  {shipmentPlan.shipmentType === "Sea" && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center mb-6 border-b border-slate-50 pb-4">
                        <div className="bg-blue-50 p-3 rounded-xl mr-4">
                          <Ship className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl  text-slate-800">Sea Freight Details</h3>
                          <p className="text-xs text-slate-500 italic">Container shipping and port information</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs  text-slate-400   flex items-center">Vessel Info</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Shipping Line</Label>
                                <Input 
                                  value={shipmentPlan.shippingLine || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, shippingLine: e.target.value})}
                                  placeholder="e.g. MSC, Maersk"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Vessel Name</Label>
                                <Input 
                                  value={shipmentPlan.vesselName || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, vesselName: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-slate-600 ">Voyage Number</Label>
                              <Input 
                                value={shipmentPlan.voyageNumber || ""} 
                                onChange={(e) => setShipmentPlan({...shipmentPlan, voyageNumber: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs  text-slate-400   flex items-center">Container details</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Container #</Label>
                                <Input 
                                  value={shipmentPlan.containerNumber || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, containerNumber: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Type</Label>
                                <Select 
                                  value={shipmentPlan.containerType} 
                                  onValueChange={(v: any) => setShipmentPlan({...shipmentPlan, containerType: v})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="20FT">20FT Container</SelectItem>
                                    <SelectItem value="40FT">40FT Container</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Seal Number</Label>
                                <Input 
                                  value={shipmentPlan.sealNumber || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, sealNumber: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">BL Number</Label>
                                <Input 
                                  value={shipmentPlan.blNumber || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, blNumber: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4  border-t border-slate-50">
                          <div className="space-y-4">
                             <h4 className="text-xs  text-slate-400  ">Port Information</h4>
                             <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600  flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-slate-400" /> Port of Loading
                                  </Label>
                                  <Input 
                                    value={shipmentPlan.portOfLoading || ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, portOfLoading: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600  flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-slate-400" /> Port of Destination
                                  </Label>
                                  <Input 
                                    value={shipmentPlan.portOfDestination || ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, portOfDestination: e.target.value})}
                                  />
                                </div>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <h4 className="text-xs  text-slate-400  ">Transit Details</h4>
                             <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600  flex items-center">
                                    <CalendarIcon className="h-3 w-3 mr-1 text-slate-400" /> Departure Date
                                  </Label>
                                  <Input 
                                    type="date"
                                    value={shipmentPlan.departureDate ? format(new Date(shipmentPlan.departureDate), "yyyy-MM-dd") : ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, departureDate: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600  flex items-center">
                                    <Clock className="h-3 w-3 mr-1 text-slate-400" /> ETA (Arrival)
                                  </Label>
                                  <Input 
                                    type="date"
                                    value={shipmentPlan.etaArrival ? format(new Date(shipmentPlan.etaArrival), "yyyy-MM-dd") : ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, etaArrival: e.target.value})}
                                  />
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {shipmentPlan.shipmentType === "Air" && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center mb-6 border-b border-slate-50 pb-4">
                        <div className="bg-orange-50 p-3 rounded-xl mr-4">
                          <Plane className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-xl  text-slate-800">Air Freight Details</h3>
                          <p className="text-xs text-slate-500 italic">Flight details and cargo measurements</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs  text-slate-400   flex items-center">Flight Info</h4>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-slate-600 ">Airline Name</Label>
                              <Input 
                                value={shipmentPlan.airlineName || ""} 
                                onChange={(e) => setShipmentPlan({...shipmentPlan, airlineName: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Flight Number</Label>
                                <Input 
                                  value={shipmentPlan.flightNumber || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, flightNumber: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">AWB Number</Label>
                                <Input 
                                  value={shipmentPlan.awbNumber || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, awbNumber: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs  text-slate-400   flex items-center">Airport details</h4>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-slate-600  flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-slate-400" /> Departure Airport
                              </Label>
                              <Input 
                                value={shipmentPlan.departureAirport || ""} 
                                onChange={(e) => setShipmentPlan({...shipmentPlan, departureAirport: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-slate-600  flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-slate-400" /> Arrival Airport
                              </Label>
                              <Input 
                                value={shipmentPlan.arrivalAirport || ""} 
                                onChange={(e) => setShipmentPlan({...shipmentPlan, arrivalAirport: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4  border-t border-slate-50">
                           <div className="space-y-4">
                             <h4 className="text-xs  text-slate-400  ">Transit Details</h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600 ">Flight Departure</Label>
                                  <Input 
                                    type="date"
                                    value={shipmentPlan.flightDeparture ? format(new Date(shipmentPlan.flightDeparture), "yyyy-MM-dd") : ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, flightDeparture: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600 ">ETA Arrival</Label>
                                  <Input 
                                    type="date"
                                    value={shipmentPlan.etaArrivalAir ? format(new Date(shipmentPlan.etaArrivalAir), "yyyy-MM-dd") : ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, etaArrivalAir: e.target.value})}
                                  />
                                </div>
                             </div>
                           </div>
                           <div className="space-y-4">
                             <h4 className="text-xs  text-slate-400  ">Measurements</h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600 ">Weight (KG)</Label>
                                  <Input 
                                    type="number"
                                    value={shipmentPlan.cargoWeight || ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, cargoWeight: Number(e.target.value)})}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-slate-600 ">Volume (CBM)</Label>
                                  <Input 
                                    type="number"
                                    value={shipmentPlan.cargoVolume || ""} 
                                    onChange={(e) => setShipmentPlan({...shipmentPlan, cargoVolume: Number(e.target.value)})}
                                  />
                                </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {shipmentPlan.shipmentType === "Road" && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center mb-6 border-b border-slate-50 pb-4">
                        <div className="bg-emerald-50 p-3 rounded-xl mr-4">
                          <Truck className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm  text-slate-800">Road Transport Details</h3>
                          <p className="text-xs text-slate-500 italic">Trucking and delivery coordination</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                          <h4 className="text-xs  text-black   flex items-center">Vehicle & Driver</h4>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 text-xs ">Transport Co.</Label>
                                <Input 
                                  value={shipmentPlan.transportCompany || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, transportCompany: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 text-xs ">Truck Number</Label>
                                <Input 
                                  value={shipmentPlan.truckNumber || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, truckNumber: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Driver Name</Label>
                                <Input 
                                  value={shipmentPlan.driverName || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, driverName: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Driver Phone</Label>
                                <Input 
                                  value={shipmentPlan.driverPhone || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, driverPhone: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs  text-black   flex items-center">Route & Schedule</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600  flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-slate-400" /> Pickup
                                </Label>
                                <Input 
                                  value={shipmentPlan.pickupLocation || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, pickupLocation: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600  flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-slate-400" /> Delivery
                                </Label>
                                <Input 
                                  value={shipmentPlan.deliveryLocation || ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, deliveryLocation: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Dispatch Date</Label>
                                <Input 
                                  type="date"
                                  value={shipmentPlan.dispatchDateRoad ? format(new Date(shipmentPlan.dispatchDateRoad), "yyyy-MM-dd") : ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, dispatchDateRoad: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-slate-600 ">Delivery Date</Label>
                                <Input 
                                  type="date"
                                  value={shipmentPlan.deliveryDateRoad ? format(new Date(shipmentPlan.deliveryDateRoad), "yyyy-MM-dd") : ""} 
                                  onChange={(e) => setShipmentPlan({...shipmentPlan, deliveryDateRoad: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="bg-white p-2 rounded border border-slate-100  relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="flex items-center mb-6 border-b border-slate-50  relative">
                    <div className="bg-indigo-50 p-3 rounded-xl mr-4">
                      <ShieldCheck className="h-3 w-3 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm  text-slate-800">Custom Clearance</h3>
                      <p className="text-xs text-slate-500 italic">Legal and import-export documentation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 relative">
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 ">Clearing Agent</Label>
                      <Input 
                        value={shipmentPlan.clearingAgent || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, clearingAgent: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 ">Bill of Entry</Label>
                      <Input 
                        value={shipmentPlan.billOfEntry || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, billOfEntry: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 ">Custom Status</Label>
                      <Select 
                        value={shipmentPlan.customStatus} 
                        onValueChange={(v: any) => setShipmentPlan({...shipmentPlan, customStatus: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">🕒 Pending</SelectItem>
                          <SelectItem value="Cleared">✅ Cleared</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 ">Import Duty (₹)</Label>
                      <Input 
                        type="number"
                        value={shipmentPlan.importDuty || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, importDuty: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 ">GST Paid (₹)</Label>
                      <Input 
                        type="number"
                        value={shipmentPlan.gstPaid || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, gstPaid: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 ">Clearance Date</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.clearanceDate ? format(new Date(shipmentPlan.clearanceDate), "yyyy-MM-dd") : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, clearanceDate: e.target.value})}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 border-t border-slate-100 px-8 py-6 sticky bottom-0 z-10 flex justify-between items-center sm:justify-between">
            <div className="flex items-center text-slate-500 text-sm italic">
               <Clock className="h-4 w-4 mr-2" /> Last updated: {format(new Date(), "dd MMM, HH:mm")}
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setIsPlanningDialogOpen(false)} className="px-8 border-slate-200">
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button onClick={handleSavePlan} className="px-10 bg-primary hover:bg-primary/90 text-white " disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                  {(createPlanMutation.isPending || updatePlanMutation.isPending) ? "Saving..." : "Save Shipment Plan"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
