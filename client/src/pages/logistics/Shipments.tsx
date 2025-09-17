import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Download, Package, TrendingUp, Clock, CheckCircle, MapPin, FileText, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";

import ShipmentTable from "../../components/logistics/ShipmentTable";
import StatusWorkflowPanel from "../../components/logistics/StatusWorkflowPanel";
import TimelineHistory from "../../components/logistics/TimelineHistory";

// Types
type LogisticsShipmentStatus = 'created' | 'packed' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'closed';

interface LogisticsShipment {
  id: string;
  consignmentNumber: string;
  source: string;
  destination: string;
  clientId?: string;
  vendorId?: string;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  closedAt?: string;
  currentStatus: LogisticsShipmentStatus;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; };
  vendor?: { id: string; name: string; };
}

interface ShipmentMetrics {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

// Form schema
const shipmentFormSchema = z.object({
  consignmentNumber: z.string().min(1, "Consignment number is required"),
  source: z.string().min(1, "Source location is required"),
  destination: z.string().min(1, "Destination is required"),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  dispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

type ShipmentForm = z.infer<typeof shipmentFormSchema>;

export default function Shipments() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<LogisticsShipment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LogisticsShipmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string | 'all'>('all');
  const [selectedShipment, setSelectedShipment] = useState<LogisticsShipment | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const { toast } = useToast();

  // Fetch shipments data
  const { data: shipments = [], isLoading } = useQuery<LogisticsShipment[]>({
    queryKey: ['/api/logistics/shipments']
  });

  // Fetch shipment metrics
  const { data: metrics } = useQuery<ShipmentMetrics>({
    queryKey: ['/api/logistics/dashboard']
  });

  // Fetch customers for filters
  const { data: customers = [] } = useQuery<Array<{id: string; name: string}>>({
    queryKey: ['/api/customers']
  });

  // Fetch suppliers for filters
  const { data: suppliers = [] } = useQuery<Array<{id: string; name: string}>>({
    queryKey: ['/api/suppliers']
  });

  const form = useForm<ShipmentForm>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      consignmentNumber: "",
      source: "",
      destination: "",
      clientId: "",
      vendorId: "",
      dispatchDate: "",
      expectedDeliveryDate: "",
      notes: "",
    },
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: ShipmentForm) => {
      return await apiRequest("/api/logistics/shipments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/dashboard"] });
      setIsFormOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Shipment created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment",
        variant: "destructive",
      });
    },
  });

  // Update shipment mutation
  const updateShipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShipmentForm> }) => {
      return await apiRequest(`/api/logistics/shipments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/dashboard"] });
      setEditingShipment(null);
      form.reset();
      toast({
        title: "Success",
        description: "Shipment updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shipment",
        variant: "destructive",
      });
    },
  });

  // Delete shipment mutation
  const deleteShipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/logistics/shipments/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/dashboard"] });
      toast({
        title: "Success",
        description: "Shipment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shipment",
        variant: "destructive",
      });
    },
  });

  // Filter and search shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      // Status filter
      if (selectedStatus !== 'all' && shipment.currentStatus !== selectedStatus) return false;
      
      // Client filter
      if (clientFilter !== 'all' && shipment.clientId !== clientFilter) return false;
      
      // Vendor filter
      if (vendorFilter !== 'all' && shipment.vendorId !== vendorFilter) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          shipment.consignmentNumber.toLowerCase().includes(query) ||
          shipment.source.toLowerCase().includes(query) ||
          shipment.destination.toLowerCase().includes(query) ||
          shipment.client?.name?.toLowerCase().includes(query) ||
          shipment.vendor?.name?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [shipments, selectedStatus, clientFilter, vendorFilter, searchQuery]);

  // Get shipment counts by status
  const getStatusCount = (status: LogisticsShipmentStatus) => {
    return shipments.filter(shipment => shipment.currentStatus === status).length;
  };

  const handleAddShipment = () => {
    setEditingShipment(null);
    setIsFormOpen(true);
  };

  const handleEditShipment = (shipment: LogisticsShipment) => {
    setEditingShipment(shipment);
    form.reset({
      consignmentNumber: shipment.consignmentNumber,
      source: shipment.source,
      destination: shipment.destination,
      clientId: shipment.clientId || "",
      vendorId: shipment.vendorId || "",
      dispatchDate: shipment.dispatchDate ? new Date(shipment.dispatchDate).toISOString().split('T')[0] : "",
      expectedDeliveryDate: shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toISOString().split('T')[0] : "",
    });
    setIsFormOpen(true);
  };

  const handleViewTimeline = (shipment: LogisticsShipment) => {
    setSelectedShipment(shipment);
    setShowTimeline(true);
  };

  const handleDeleteShipment = (shipment: LogisticsShipment) => {
    if (window.confirm(`Are you sure you want to delete shipment ${shipment.consignmentNumber}? This action cannot be undone.`)) {
      deleteShipmentMutation.mutate(shipment.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingShipment(null);
    form.reset();
  };

  const onSubmit = (data: ShipmentForm) => {
    if (editingShipment) {
      updateShipmentMutation.mutate({ id: editingShipment.id, data });
    } else {
      createShipmentMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shipments Management</h1>
          <p className="text-muted-foreground">
            Manage shipments through the logistics workflow with status tracking and timeline history
          </p>
        </div>
        <Button onClick={handleAddShipment} data-testid="button-add-shipment">
          <Plus className="mr-2 h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-shipments">{metrics.totalShipments}</div>
              <p className="text-xs text-muted-foreground">
                All shipments in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-shipments">{metrics.activeShipments}</div>
              <p className="text-xs text-muted-foreground">
                In transit or pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-delivered-shipments">{metrics.deliveredShipments}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-ontime-rate">{metrics.onTimeDeliveryRate}%</div>
              <p className="text-xs text-muted-foreground">
                Delivery performance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" data-testid="tab-list">Shipment List</TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">Status Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments by consignment number, source, destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-shipments"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as LogisticsShipmentStatus | 'all')}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-client-filter">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Status Count Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {(['created', 'packed', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'closed'] as LogisticsShipmentStatus[]).map((status) => {
              const count = getStatusCount(status);
              const isSelected = selectedStatus === status;
              
              return (
                <Card 
                  key={status} 
                  className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedStatus(isSelected ? 'all' : status)}
                  data-testid={`card-status-${status}`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {status.replace('_', ' ')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Shipments Table */}
          <ShipmentTable
            shipments={filteredShipments as any}
            onEdit={handleEditShipment as any}
            onViewTimeline={handleViewTimeline as any}
            onDelete={handleDeleteShipment as any}
          />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <StatusWorkflowPanel shipments={filteredShipments} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Shipment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShipment ? "Edit Shipment" : "Create New Shipment"}</DialogTitle>
            <DialogDescription>
              {editingShipment ? "Update shipment details and tracking information" : "Create a new shipment for logistics tracking"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="consignmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consignment Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-consignment-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Location</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-source" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-destination" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No client</SelectItem>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vendor">
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No vendor</SelectItem>
                          {suppliers.map((supplier: any) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dispatchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dispatch Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-dispatch-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-expected-delivery" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleFormClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createShipmentMutation.isPending || updateShipmentMutation.isPending}
                  data-testid="button-save-shipment"
                >
                  {editingShipment ? "Update" : "Create"} Shipment
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Timeline History Dialog */}
      <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Shipment Timeline</span>
            </DialogTitle>
            <DialogDescription>
              Complete status history and timeline for shipment {selectedShipment?.consignmentNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedShipment && (
            <TimelineHistory shipment={selectedShipment} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}