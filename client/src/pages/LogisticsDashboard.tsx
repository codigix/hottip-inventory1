import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Navigation,
  FileUp,
  Route,
  User,
  Weight,
  DollarSign,
} from "lucide-react";

const shipmentFormSchema = z.object({
  consignmentNumber: z.string().min(1, "Consignment number is required"),
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  dispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  currentStatus: z.string().optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
  value: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  trackingUrl: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

type ShipmentForm = z.infer<typeof shipmentFormSchema>;

export default function LogisticsDashboard() {
  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const { toast } = useToast();

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/shipments"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
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
      currentStatus: "created",
      weight: "",
      volume: "",
      value: "",
      priority: "normal",
      trackingUrl: "",
      assignedTo: "",
      notes: "",
    },
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (data: ShipmentForm) => {
      return await apiRequest("/api/logistics/shipments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
      setIsShipmentDialogOpen(false);
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

  const updateShipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShipmentForm> }) => {
      return await apiRequest(`/api/logistics/shipments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
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

  const onSubmit = (data: ShipmentForm) => {
    if (editingShipment) {
      updateShipmentMutation.mutate({ id: editingShipment.id, data });
    } else {
      createShipmentMutation.mutate(data);
    }
  };

  const handleEdit = (shipment: any) => {
    setEditingShipment(shipment);
    form.reset({
      consignmentNumber: shipment.consignmentNumber || "",
      source: shipment.source || "",
      destination: shipment.destination || "",
      clientId: shipment.clientId || "",
      vendorId: shipment.vendorId || "",
      dispatchDate: shipment.dispatchDate ? new Date(shipment.dispatchDate).toISOString().split('T')[0] : "",
      expectedDeliveryDate: shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toISOString().split('T')[0] : "",
      currentStatus: shipment.currentStatus || "created",
      weight: shipment.weight || "",
      volume: shipment.volume || "",
      value: shipment.value || "",
      priority: shipment.priority || "normal",
      trackingUrl: shipment.trackingUrl || "",
      assignedTo: shipment.assignedTo || "",
      notes: shipment.notes || "",
    });
  };

  const shipmentColumns = [
    {
      key: "consignmentNumber",
      header: "Consignment #",
    },
    {
      key: "source",
      header: "Source",
    },
    {
      key: "destination",
      header: "Destination",
    },
    {
      key: "currentStatus",
      header: "Status",
      cell: (shipment: any) => {
        const statusColors = {
          created: "bg-gray-100 text-gray-800",
          packed: "bg-yellow-100 text-yellow-800",
          dispatched: "bg-blue-100 text-blue-800",
          in_transit: "bg-purple-100 text-purple-800",
          out_for_delivery: "bg-orange-100 text-orange-800",
          delivered: "bg-green-100 text-green-800",
          closed: "bg-gray-500 text-white",
        };
        
        const statusLabels = {
          created: "Created",
          packed: "Packed",
          dispatched: "Dispatched",
          in_transit: "In Transit",
          out_for_delivery: "Out for Delivery",
          delivered: "Delivered",
          closed: "Closed",
        };

        return (
          <Badge className={statusColors[shipment.currentStatus as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {statusLabels[shipment.currentStatus as keyof typeof statusLabels] || shipment.currentStatus}
          </Badge>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      cell: (shipment: any) => {
        const priorityColors = {
          normal: "bg-blue-100 text-blue-800",
          high: "bg-orange-100 text-orange-800",
          urgent: "bg-red-100 text-red-800",
        };
        
        return (
          <Badge className={priorityColors[shipment.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}>
            {(shipment.priority || "normal").charAt(0).toUpperCase() + (shipment.priority || "normal").slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "expectedDeliveryDate",
      header: "Expected Delivery",
      cell: (shipment: any) => shipment.expectedDeliveryDate 
        ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() 
        : "TBD",
    },
  ];

  // Calculate logistics metrics
  const totalShipments = (shipments || []).length;
  const inTransitShipments = (shipments || []).filter((s: any) => s.currentStatus === 'in_transit' || s.currentStatus === 'dispatched' || s.currentStatus === 'out_for_delivery').length;
  const deliveredShipments = (shipments || []).filter((s: any) => s.currentStatus === 'delivered' || s.currentStatus === 'closed').length;
  const pendingShipments = (shipments || []).filter((s: any) => s.currentStatus === 'created' || s.currentStatus === 'packed').length;

  if (shipmentsLoading || customersLoading || suppliersLoading || usersLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Logistics Dashboard</h1>
          <p className="text-muted-foreground">Manage shipments, tracking, and delivery operations</p>
        </div>
        <Dialog open={isShipmentDialogOpen || !!editingShipment} onOpenChange={(open) => {
          if (!open) {
            setIsShipmentDialogOpen(false);
            setEditingShipment(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsShipmentDialogOpen(true)} data-testid="button-create-shipment">
              <Plus className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingShipment ? "Edit Shipment" : "Create New Shipment"}</DialogTitle>
              <DialogDescription>
                {editingShipment ? "Update shipment details" : "Create a new shipment for delivery"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="consignmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consignment Number *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-consignment" placeholder="Enter consignment number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-source" placeholder="Source location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-destination" placeholder="Destination location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                            {(customers || []).map((customer: any) => (
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
                            {(suppliers || []).map((supplier: any) => (
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="created">Created</SelectItem>
                            <SelectItem value="packed">Packed</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
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
                        <FormLabel>Expected Delivery</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-delivery-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-weight" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume (m³)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-volume" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-value" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trackingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking URL</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-tracking-url" placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assigned">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {(users || []).map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsShipmentDialogOpen(false);
                      setEditingShipment(null);
                      form.reset();
                    }}
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
      </div>

      {/* Logistics Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Shipments</p>
                <p className="text-2xl font-bold text-foreground">{totalShipments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold text-foreground">{inTransitShipments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-foreground">{deliveredShipments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingShipments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipments Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
              <CardDescription>
                Track and manage all shipments and deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={(shipments || [])}
                columns={shipmentColumns}
                onEdit={handleEdit}
                searchable={true}
                searchKey="consignmentNumber"
              />
            </CardContent>
          </Card>
        </div>

        {/* Logistics Tools & Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Logistics Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => setIsShipmentDialogOpen(true)}
                data-testid="button-quick-shipment"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Shipment
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Route planning")}
                data-testid="button-route-planning"
              >
                <Route className="h-4 w-4 mr-2" />
                Route Planning
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Track shipments")}
                data-testid="button-track-shipments"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Track Shipments
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => console.log("Upload POD")}
                data-testid="button-upload-pod"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Upload POD
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Preparing</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">{pendingShipments}</p>
                  <p className="text-xs text-muted-foreground">shipments</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">In Transit</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">{inTransitShipments}</p>
                  <p className="text-xs text-muted-foreground">shipments</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-light text-foreground">Delivered</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-light text-foreground">{deliveredShipments}</p>
                  <p className="text-xs text-muted-foreground">shipments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(shipments || []).filter((s: any) => s.currentStatus === 'delivered').slice(0, 3).map((shipment: any) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-sm">
                    <div>
                      <p className="text-sm font-light">{shipment.consignmentNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {shipment.source} → {shipment.destination}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-light">{shipment.priority}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">No recent deliveries</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
