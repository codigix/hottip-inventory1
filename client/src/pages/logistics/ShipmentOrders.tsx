import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Filter, Download, ShoppingCart, Clock, CheckCircle, Package, TrendingUp, RefreshCw, Eye, Trash2, CheckCircle2, XCircle, Calendar, MapPin, Plane, Ship, Truck, ShieldCheck, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Types
type LogisticsShipmentStatus = 'created' | 'packed' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'closed';

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
  deliveredAt?: string;
  closedAt?: string;
  currentStatus: LogisticsShipmentStatus;
  isApproved?: boolean;
  approvalDate?: string;
  approvalNotes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
  client?: { id: string; name: string; };
  vendor?: { id: string; name: string; };
  vendorName?: string;
  clientName?: string;
  plan?: any;
}

interface ShipmentMetrics {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

export default function ShipmentOrders() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("customer");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<LogisticsShipment | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isPlanningDialogOpen, setIsPlanningDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [shipmentPlan, setShipmentPlan] = useState<any>({
    shipmentType: "Sea",
    shipmentMode: "Import",
    incoterms: "FOB",
    status: "Planned",
  });

  const approveShipmentMutation = useMutation({
    mutationFn: async ({ id, isApproved, notes }: { id: string, isApproved: boolean, notes: string }) => {
      return apiRequest("POST", `/logistics/shipments/${id}/approve`, { isApproved, notes });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Success",
        description: variables.isApproved ? "Shipment approved successfully." : "Shipment rejected.",
      });
      setIsApproveDialogOpen(false);
      setApprovalNotes("");
      queryClient.invalidateQueries({ queryKey: ["/logistics/shipments"] });
      
      // If approved, open planning dialog automatically
      if (variables.isApproved) {
        setTimeout(() => {
          setIsPlanningDialogOpen(true);
        }, 100);
      }
    },
  });

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
      // Redirect to Shipment Tracking
      setLocation("/logistics/shipment-tracking");
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
      // Redirect to Shipment Tracking
      setLocation("/logistics/shipment-tracking");
    },
  });

  // Fetch plan for selected shipment when planning dialog opens
  const { data: existingPlan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['/logistics/shipments', selectedShipment?.id, 'plan'],
    queryFn: async () => {
      if (!selectedShipment?.id) return null;
      try {
        const res = await apiRequest("GET", `/logistics/shipments/${selectedShipment.id}/plan`);
        return await res.json();
      } catch (e) {
        return null;
      }
    },
    enabled: isPlanningDialogOpen && !!selectedShipment?.id,
  });

  useMemo(() => {
    if (existingPlan) {
      setShipmentPlan(existingPlan);
    } else if (selectedShipment) {
      setShipmentPlan({
        shipmentId: selectedShipment.id,
        planId: `PLAN-${selectedShipment.consignmentNumber}`,
        shipmentType: "Sea",
        shipmentMode: "Import",
        incoterms: "FOB",
        status: "Planned",
        plannedDispatch: selectedShipment.dispatchDate,
        expectedArrival: selectedShipment.expectedDeliveryDate,
      });
    }
  }, [existingPlan, selectedShipment, isPlanningDialogOpen]);

  // Fetch shipments data
  const { data: shipments = [], isLoading } = useQuery<LogisticsShipment[]>({
    queryKey: ['/logistics/shipments']
  });

  const { data: vendorsData = [] } = useQuery<any>({
    queryKey: ["/suppliers"],
  });

  const vendors = Array.isArray(vendorsData) ? vendorsData : ((vendorsData as any)?.suppliers || []);

  const getVendorName = (shipment: LogisticsShipment | any) => {
    if (!shipment) return "N/A";
    
    // Check flat properties first (now provided by backend mapping)
    if (shipment.vendorName) return shipment.vendorName;
    if (shipment.clientName) return shipment.clientName;
    if (shipment.customerName) return shipment.customerName;
    if (shipment.supplierName) return shipment.supplierName;
    
    // Check joined objects as fallback
    if (shipment.vendor?.name) return shipment.vendor.name;
    if (shipment.poVendor?.name) return shipment.poVendor.name;
    if (shipment.client?.name) return shipment.client.name;
    if (shipment.soCustomer?.name) return shipment.soCustomer.name;
    if (shipment.customer?.name) return shipment.customer.name;
    if (shipment.supplier?.name) return shipment.supplier.name;
    
    // Match from local vendors list if we have an ID
    const vId = shipment.vendorId || shipment.supplierId || shipment.clientId || shipment.customerId;
    if (vId) {
      const vendor = vendors.find((v: any) => v.id === vId);
      if (vendor) return vendor.name;
      
      // If no name found but we have an ID, show a shortened ID
      if (typeof vId === 'string' && vId.length > 8) {
        return `ID: ${vId.substring(0, 8)}...`;
      }
    }
    
    return "N/A";
  };

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
      queryClient.invalidateQueries({ queryKey: ["/logistics/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shipment order",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (shipment: LogisticsShipment) => {
    setSelectedShipment(shipment);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-normal">Delivered</Badge>;
      case "dispatched":
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-normal">Dispatched</Badge>;
      case "in_transit":
        return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-normal">In Transit</Badge>;
      case "packed":
        return <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-normal">Packed</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 border-slate-100 font-normal">{status}</Badge>;
    }
  };

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "dd/MM/yyyy");
  };

  const columns: Column<LogisticsShipment>[] = [
    {
      key: "consignmentNumber",
      header: "Order #",
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
      header: "Client/Vendor",
      cell: (shipment) => getVendorName(shipment),
      sortable: true,
    },
    {
      key: "source",
      header: "Route",
      cell: (shipment) => (
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">From: {shipment.source}</span>
          <span className="text-xs text-gray-500">To: {shipment.destination}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "currentStatus",
      header: "Status",
      cell: (shipment) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(shipment.currentStatus)}
          {shipment.isApproved === true ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs w-fit">
              <ShieldCheck className="h-3 w-3 mr-1" /> Approved
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs w-fit">
              Pending Approval
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Dates",
      cell: (shipment) => (
        <div className="text-xs text-slate-600">
          <div>Created: {formatDate(shipment.createdAt)}</div>
          {shipment.expectedDeliveryDate && (
            <div>Exp: {formatDate(shipment.expectedDeliveryDate)}</div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (shipment) => (
        <div className="flex justify-end space-x-1">
          {shipment.isApproved !== true && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                setSelectedShipment(shipment);
                setIsApproveDialogOpen(true);
              }}
              title="Approve Shipment"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          {shipment.isApproved === true && ['created', 'packed', 'planned'].includes(shipment.currentStatus?.toLowerCase()) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => {
                setSelectedShipment(shipment);
                setIsPlanningDialogOpen(true);
              }}
              title="Plan Shipment"
            >
              <Route className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
            onClick={() => handleViewDetails(shipment)}
          >
            <Eye className="h-4 w-4" />
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

  // Fetch shipment metrics
  const { data: metrics } = useQuery<ShipmentMetrics>({
    queryKey: ['/logistics/dashboard']
  });

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      // First, apply search term filter if it exists
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
          shipment.consignmentNumber.toLowerCase().includes(query) ||
          (shipment.poNumber || "").toLowerCase().includes(query) ||
          shipment.source.toLowerCase().includes(query) ||
          shipment.destination.toLowerCase().includes(query) ||
          shipment.vendorName?.toLowerCase().includes(query) ||
          shipment.clientName?.toLowerCase().includes(query) ||
          shipment.client?.name?.toLowerCase().includes(query) ||
          shipment.vendor?.name?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Then, filter by tab type
      if (activeTab === "customer") {
        // Show if explicitly a client shipment OR if it doesn't have explicit vendor IDs
        // This ensures auto-created SO shipments (which might have null clientId but are still customer-facing) show here
        return !!shipment.clientId || !!shipment.clientName || (!shipment.vendorId && !shipment.vendorName);
      }
      
      if (activeTab === "vendor") {
        // Only show vendor shipments that are NOT yet fully planned/tracked
        // Once planned, they should be managed in Vendor Tracking page
        const isVendorShipment = !!shipment.vendorId || !!shipment.vendorName || !!shipment.vendor?.name || !!shipment.supplier?.name;
        const isPlanned = shipment.currentStatus !== 'created' && shipment.currentStatus !== 'packed';
        
        return isVendorShipment && !isPlanned;
      }

      return true;
    });
  }, [shipments, searchTerm, activeTab]);

  if (isLoading) {
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
    <div className="p-4 space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black">Shipment Orders</h1>
          <p className="text-gray-500 text-xs">
            Manage and track customer shipment orders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Create Order
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="customer" className="px-6">Customer Shipments</TabsTrigger>
          <TabsTrigger value="vendor" className="px-6">Vendor Shipments</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none bg-card/50">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs text-emerald-500">+0%</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-xl">{metrics?.totalShipments || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/50">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-xs text-emerald-500">+0%</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl">{metrics?.pendingShipments || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/50">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-xs text-emerald-500">+0%</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">In Processing</p>
              <p className="text-xl">{metrics?.activeShipments || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/50">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs text-emerald-500">+0%</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">Completed</p>
              <p className="text-xl">{metrics?.deliveredShipments || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search by order number, customer, PO or location..." 
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

          <DataTable
            data={filteredShipments}
            columns={columns}
            searchable={false}
            isLoading={isLoading}
          />
        </div>
      </Tabs>

      {/* View Shipment Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary" />
              <span>Shipment Details: {selectedShipment?.consignmentNumber}</span>
            </DialogTitle>
            <DialogDescription>
              View complete details and item list for this shipment
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Vendor / Client</p>
                  <p className="text-slate-700 leading-tight">
                    {selectedShipment.vendorName || 
                     selectedShipment.supplier?.name || 
                     selectedShipment.vendor?.name || 
                     selectedShipment.clientName || 
                     "N/A"}
                  </p>
                  {(selectedShipment.supplier?.city || selectedShipment.supplier?.address) && (
                    <p className="text-xs text-gray-500 flex items-center">
                      <MapPin className="h-2 w-2 mr-1" />
                      {selectedShipment.supplier.city || selectedShipment.supplier.address}
                    </p>
                  )}
                  {selectedShipment.poNumber && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400">PO Number</p>
                      <p className="text-indigo-600">{selectedShipment.poNumber}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-slate-400">Status</p>
                  <div>{getStatusBadge(selectedShipment.currentStatus)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Route</p>
                  <p className="text-slate-600">From: {selectedShipment.source}</p>
                  <p className="text-slate-600">To: {selectedShipment.destination}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-slate-400">Dates</p>
                  <p className="text-slate-600 text-sm">Created: {formatDate(selectedShipment.createdAt)}</p>
                  {selectedShipment.expectedDeliveryDate && (
                    <p className="text-slate-600 text-sm">Expected: {formatDate(selectedShipment.expectedDeliveryDate)}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-800 flex items-center border-b border-slate-100 pb-2">
                  <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
                  SHIPMENT ITEMS
                </h3>
                
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="">Material Name</TableHead>
                        <TableHead className="">Type/Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-center">Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let displayItems = [];
                        if (Array.isArray(selectedShipment.items)) {
                          displayItems = selectedShipment.items;
                        } else if (typeof selectedShipment.items === 'string') {
                          try {
                            displayItems = JSON.parse(selectedShipment.items);
                          } catch (e) {
                            console.error("Error parsing shipment items:", e);
                          }
                        }

                        if (displayItems && displayItems.length > 0) {
                          return displayItems.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="">
                                {item.materialName || item.itemName || item.name || "N/A"}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {item.type || item.description || "N/A"}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.qty || item.quantity || 0}
                              </TableCell>
                              <TableCell className="text-center text-slate-500">
                                {item.unit || "pcs"}
                              </TableCell>
                            </TableRow>
                          ));
                        }

                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500 italic">
                              No items found for this shipment.
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {(selectedShipment as any).notes && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Notes</p>
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-slate-700 text-sm italic">
                    {(selectedShipment as any).notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="px-8">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Shipment Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-emerald-600">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Approve Shipment
            </DialogTitle>
            <DialogDescription>
              Verify and approve this shipment order for further planning and execution.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-700">Shipment: <span className="text-primary">{selectedShipment?.consignmentNumber}</span></p>
              <p className="text-xs text-slate-500">PO: {selectedShipment?.poNumber || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Approval Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any specific instructions or notes for the planning team..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsApproveDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => approveShipmentMutation.mutate({ id: selectedShipment!.id, isApproved: false, notes: approvalNotes })}
              disabled={approveShipmentMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              Reject
            </Button>
            <Button 
              onClick={() => approveShipmentMutation.mutate({ id: selectedShipment!.id, isApproved: true, notes: approvalNotes })}
              disabled={approveShipmentMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
            >
              {approveShipmentMutation.isPending ? "Approving..." : "Approve Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipment Planning Dialog */}
      <Dialog open={isPlanningDialogOpen} onOpenChange={setIsPlanningDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <span>Shipment Planning: {selectedShipment?.consignmentNumber}</span>
            </DialogTitle>
            <DialogDescription>
              Configure transport details, carrier information and expected schedule
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Transport Type</Label>
                <Select 
                  value={shipmentPlan.shipmentType} 
                  onValueChange={(val) => setShipmentPlan({...shipmentPlan, shipmentType: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sea">Sea Freight</SelectItem>
                    <SelectItem value="Air">Air Freight</SelectItem>
                    <SelectItem value="Road">Road Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Forwarder / Agent</Label>
                <Input 
                  value={shipmentPlan.forwarderAgent || ""} 
                  onChange={(e) => setShipmentPlan({...shipmentPlan, forwarderAgent: e.target.value})}
                  placeholder="Carrier name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Planned Dispatch</Label>
                  <Input 
                    type="date"
                    value={shipmentPlan.plannedDispatch ? new Date(shipmentPlan.plannedDispatch).toISOString().split('T')[0] : ""} 
                    onChange={(e) => setShipmentPlan({...shipmentPlan, plannedDispatch: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Arrival</Label>
                  <Input 
                    type="date"
                    value={shipmentPlan.expectedArrival ? new Date(shipmentPlan.expectedArrival).toISOString().split('T')[0] : ""} 
                    onChange={(e) => setShipmentPlan({...shipmentPlan, expectedArrival: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-sm flex items-center">
                {shipmentPlan.shipmentType === "Sea" && <Ship className="mr-2 h-4 w-4 text-blue-600" />}
                {shipmentPlan.shipmentType === "Air" && <Plane className="mr-2 h-4 w-4 text-orange-600" />}
                {shipmentPlan.shipmentType === "Road" && <Truck className="mr-2 h-4 w-4 text-emerald-600" />}
                Transport Details
              </h4>

              {shipmentPlan.shipmentType === "Sea" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Shipping Line" 
                      value={shipmentPlan.shippingLine || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, shippingLine: e.target.value})}
                    />
                    <Input 
                      placeholder="Vessel Name" 
                      value={shipmentPlan.vesselName || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, vesselName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Voyage Number" 
                      value={shipmentPlan.voyageNumber || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, voyageNumber: e.target.value})}
                    />
                    <Input 
                      placeholder="Container Number" 
                      value={shipmentPlan.containerNumber || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, containerNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="BL Number" 
                      value={shipmentPlan.blNumber || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, blNumber: e.target.value})}
                    />
                    <Input 
                      placeholder="Seal Number" 
                      value={shipmentPlan.sealNumber || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, sealNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Loading Port</Label>
                      <Input 
                        placeholder="Port of Loading" 
                        value={shipmentPlan.portOfLoading || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, portOfLoading: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Destination Port</Label>
                      <Input 
                        placeholder="Port of Destination" 
                        value={shipmentPlan.portOfDestination || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, portOfDestination: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Departure Date</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.departureDate ? new Date(shipmentPlan.departureDate).toISOString().split('T')[0] : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, departureDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">ETA Arrival</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.etaArrival ? new Date(shipmentPlan.etaArrival).toISOString().split('T')[0] : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, etaArrival: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {shipmentPlan.shipmentType === "Air" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Airline Name" 
                      value={shipmentPlan.airlineName || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, airlineName: e.target.value})}
                    />
                    <Input 
                      placeholder="Flight Number" 
                      value={shipmentPlan.flightNumber || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, flightNumber: e.target.value})}
                    />
                  </div>
                  <Input 
                    placeholder="AWB Number" 
                    value={shipmentPlan.awbNumber || ""} 
                    onChange={(e) => setShipmentPlan({...shipmentPlan, awbNumber: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Departure Airport</Label>
                      <Input 
                        placeholder="Departure" 
                        value={shipmentPlan.departureAirport || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, departureAirport: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Arrival Airport</Label>
                      <Input 
                        placeholder="Arrival" 
                        value={shipmentPlan.arrivalAirport || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, arrivalAirport: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Flight Departure</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.flightDeparture ? new Date(shipmentPlan.flightDeparture).toISOString().split('T')[0] : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, flightDeparture: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">ETA Arrival</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.etaArrivalAir ? new Date(shipmentPlan.etaArrivalAir).toISOString().split('T')[0] : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, etaArrivalAir: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {shipmentPlan.shipmentType === "Road" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Transport Company" 
                      value={shipmentPlan.transportCompany || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, transportCompany: e.target.value})}
                    />
                    <Input 
                      placeholder="Truck Number" 
                      value={shipmentPlan.truckNumber || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, truckNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Driver Name" 
                      value={shipmentPlan.driverName || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, driverName: e.target.value})}
                    />
                    <Input 
                      placeholder="Driver Phone" 
                      value={shipmentPlan.driverPhone || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, driverPhone: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Pickup Location</Label>
                      <Input 
                        placeholder="Pickup" 
                        value={shipmentPlan.pickupLocation || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, pickupLocation: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Delivery Location</Label>
                      <Input 
                        placeholder="Delivery" 
                        value={shipmentPlan.deliveryLocation || ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, deliveryLocation: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Dispatch Date</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.dispatchDateRoad ? new Date(shipmentPlan.dispatchDateRoad).toISOString().split('T')[0] : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, dispatchDateRoad: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Delivery Date</Label>
                      <Input 
                        type="date"
                        value={shipmentPlan.deliveryDateRoad ? new Date(shipmentPlan.deliveryDateRoad).toISOString().split('T')[0] : ""} 
                        onChange={(e) => setShipmentPlan({...shipmentPlan, deliveryDateRoad: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Clearance Section */}
              <div className="pt-4 border-t border-slate-200 mt-4 space-y-3">
                <h4 className="text-sm flex items-center text-indigo-600">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Custom Clearance
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Clearing Agent" 
                    value={shipmentPlan.clearingAgent || ""} 
                    onChange={(e) => setShipmentPlan({...shipmentPlan, clearingAgent: e.target.value})}
                  />
                  <Input 
                    placeholder="Bill of Entry" 
                    value={shipmentPlan.billOfEntry || ""} 
                    onChange={(e) => setShipmentPlan({...shipmentPlan, billOfEntry: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Import Duty (₹)</Label>
                    <Input 
                      type="number"
                      placeholder="Duty Amount" 
                      value={shipmentPlan.importDuty || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, importDuty: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">GST Paid (₹)</Label>
                    <Input 
                      type="number"
                      placeholder="GST Amount" 
                      value={shipmentPlan.gstPaid || ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, gstPaid: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Custom Status</Label>
                    <Select 
                      value={shipmentPlan.customStatus || "Pending"} 
                      onValueChange={(v) => setShipmentPlan({...shipmentPlan, customStatus: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Cleared">Cleared</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Clearance Date</Label>
                    <Input 
                      type="date"
                      value={shipmentPlan.clearanceDate ? new Date(shipmentPlan.clearanceDate).toISOString().split('T')[0] : ""} 
                      onChange={(e) => setShipmentPlan({...shipmentPlan, clearanceDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanningDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
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

                if (shipmentPlan.id) {
                  updatePlanMutation.mutate({ id: shipmentPlan.id, plan: sanitizedPlan });
                } else {
                  createPlanMutation.mutate(sanitizedPlan);
                }
              }}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createPlanMutation.isPending || updatePlanMutation.isPending ? "Saving..." : "Save Planning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
