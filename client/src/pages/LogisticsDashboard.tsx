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
} from "lucide-react";

const shipmentFormSchema = z.object({
  orderId: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().min(1, "Carrier is required"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  estimatedDelivery: z.string().optional(),
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

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const form = useForm<ShipmentForm>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      orderId: "",
      trackingNumber: "",
      carrier: "",
      shippingAddress: "",
      estimatedDelivery: "",
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
      orderId: shipment.order?.id || "",
      trackingNumber: shipment.trackingNumber || "",
      carrier: shipment.carrier || "",
      shippingAddress: shipment.shippingAddress || "",
      estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toISOString().split('T')[0] : "",
      notes: shipment.notes || "",
    });
  };

  const shipmentColumns = [
    {
      key: "consignmentNumber",
      header: "Consignment #",
    },
    {
      key: "order.orderNumber",
      header: "Order #",
    },
    {
      key: "trackingNumber",
      header: "Tracking #",
      cell: (shipment: any) => shipment.trackingNumber || "N/A",
    },
    {
      key: "carrier",
      header: "Carrier",
    },
    {
      key: "status",
      header: "Status",
      cell: (shipment: any) => {
        const statusColors = {
          preparing: "bg-yellow-100 text-yellow-800",
          in_transit: "bg-blue-100 text-blue-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        
        const statusLabels = {
          preparing: "Preparing",
          in_transit: "In Transit",
          delivered: "Delivered",
          cancelled: "Cancelled",
        };

        return (
          <Badge className={statusColors[shipment.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {statusLabels[shipment.status as keyof typeof statusLabels] || shipment.status}
          </Badge>
        );
      },
    },
    {
      key: "estimatedDelivery",
      header: "Est. Delivery",
      cell: (shipment: any) => shipment.estimatedDelivery 
        ? new Date(shipment.estimatedDelivery).toLocaleDateString() 
        : "TBD",
    },
  ];

  // Calculate logistics metrics
  const totalShipments = (shipments || []).length;
  const inTransitShipments = (shipments || []).filter((s: any) => s.status === 'in_transit').length;
  const deliveredShipments = (shipments || []).filter((s: any) => s.status === 'delivered').length;
  const pendingShipments = (shipments || []).filter((s: any) => s.status === 'preparing').length;

  if (shipmentsLoading) {
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
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order">
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No order</SelectItem>
                          {(orders || []).map((order: any) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.orderNumber} - {order.customer?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-carrier">
                              <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fedex">FedEx</SelectItem>
                            <SelectItem value="ups">UPS</SelectItem>
                            <SelectItem value="dhl">DHL</SelectItem>
                            <SelectItem value="usps">USPS</SelectItem>
                            <SelectItem value="local">Local Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-tracking" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDelivery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Delivery</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-delivery-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
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
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
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
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
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
                  <span className="text-sm font-medium text-foreground">Preparing</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{pendingShipments}</p>
                  <p className="text-xs text-muted-foreground">shipments</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">In Transit</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{inTransitShipments}</p>
                  <p className="text-xs text-muted-foreground">shipments</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Delivered</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{deliveredShipments}</p>
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
                {(shipments || []).filter((s: any) => s.status === 'delivered').slice(0, 3).map((shipment: any) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div>
                      <p className="text-sm font-medium">{shipment.consignmentNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {shipment.order?.orderNumber || 'Direct Shipment'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{shipment.carrier}</p>
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
