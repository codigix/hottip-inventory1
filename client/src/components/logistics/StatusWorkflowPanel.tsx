import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock,
  FileUp,
  ArrowRight,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Use shared types and validation helpers
import type { 
  LogisticsShipment, 
  LogisticsShipmentStatus 
} from "@shared/schema";
import { 
  LOGISTICS_SHIPMENT_STATUSES, 
  getNextStatus, 
  isValidStatusTransition 
} from "@shared/schema";

// Import POD upload component
import PodUploadComponent from "./PodUploadComponent";

interface StatusWorkflowPanelProps {
  shipments: LogisticsShipment[];
}

// Status update form schema with proper enum validation
const statusUpdateSchema = z.object({
  status: z.enum(LOGISTICS_SHIPMENT_STATUSES, {
    errorMap: () => ({ message: "Invalid status value" })
  }),
  notes: z.string().optional(),
  location: z.string().optional(),
  podFile: z.string().optional(),
});

type StatusUpdateForm = z.infer<typeof statusUpdateSchema>;

export default function StatusWorkflowPanel({ shipments }: StatusWorkflowPanelProps) {
  const [selectedShipment, setSelectedShipment] = useState<LogisticsShipment | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showPodUpload, setShowPodUpload] = useState(false);
  const { toast } = useToast();

  const form = useForm<StatusUpdateForm>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: undefined,
      notes: "",
      location: "",
      podFile: "",
    },
  });

  // Status workflow configuration
  const statusWorkflow = [
    { 
      key: 'created', 
      label: 'Created', 
      icon: Package, 
      color: 'bg-gray-100 text-gray-800',
      description: 'Shipment created and ready for packing'
    },
    { 
      key: 'packed', 
      label: 'Packed', 
      icon: Package, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Items packed and ready for dispatch'
    },
    { 
      key: 'dispatched', 
      label: 'Dispatched', 
      icon: Truck, 
      color: 'bg-indigo-100 text-indigo-800',
      description: 'Shipment dispatched from warehouse'
    },
    { 
      key: 'in_transit', 
      label: 'In Transit', 
      icon: MapPin, 
      color: 'bg-purple-100 text-purple-800',
      description: 'Shipment in transit to destination'
    },
    { 
      key: 'out_for_delivery', 
      label: 'Out for Delivery', 
      icon: Truck, 
      color: 'bg-orange-100 text-orange-800',
      description: 'Out for final delivery'
    },
    { 
      key: 'delivered', 
      label: 'Delivered', 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-800',
      description: 'Successfully delivered to customer'
    },
    { 
      key: 'closed', 
      label: 'Closed', 
      icon: CheckCircle, 
      color: 'bg-slate-100 text-slate-800',
      description: 'Shipment completed and closed'
    },
  ];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ shipmentId, data }: { shipmentId: string; data: StatusUpdateForm }) => {
      return await apiRequest(`/api/logistics/shipments/${shipmentId}/status`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/dashboard"] });
      setShowStatusUpdate(false);
      setSelectedShipment(null);
      form.reset();
      toast({
        title: "Success",
        description: "Shipment status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Close shipment mutation (for POD upload)
  const closeShipmentMutation = useMutation({
    mutationFn: async ({ shipmentId, data }: { shipmentId: string; data: any }) => {
      return await apiRequest(`/api/logistics/shipments/${shipmentId}/close`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/dashboard"] });
      setShowPodUpload(false);
      setSelectedShipment(null);
      toast({
        title: "Success",
        description: "Shipment closed with POD uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close shipment",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (shipment: LogisticsShipment, newStatus: LogisticsShipmentStatus) => {
    // Validate status transition
    if (!isValidStatusTransition(shipment.currentStatus as LogisticsShipmentStatus, newStatus)) {
      toast({
        title: "Invalid Status Transition",
        description: `Cannot move from ${shipment.currentStatus} to ${newStatus}. Please follow the proper workflow sequence.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedShipment(shipment);
    form.setValue('status', newStatus);
    setShowStatusUpdate(true);
  };

  const handlePodUpload = (shipment: LogisticsShipment) => {
    setSelectedShipment(shipment);
    setShowPodUpload(true);
  };

  const onSubmitStatusUpdate = (data: StatusUpdateForm) => {
    if (selectedShipment) {
      updateStatusMutation.mutate({ shipmentId: selectedShipment.id, data });
    }
  };

  const onSubmitPodUpload = (data: any) => {
    if (selectedShipment) {
      closeShipmentMutation.mutate({ shipmentId: selectedShipment.id, data });
    }
  };

  // Group shipments by status
  const shipmentsByStatus = statusWorkflow.reduce((acc, status) => {
    acc[status.key] = shipments.filter(s => s.currentStatus === status.key);
    return acc;
  }, {} as Record<string, LogisticsShipment[]>);

  // Use the shared getNextStatus function from schema instead of local one

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {statusWorkflow.map((status, index) => {
          const Icon = status.icon;
          const count = shipmentsByStatus[status.key]?.length || 0;
          
          return (
            <div key={status.key} className="flex items-center">
              <div className="flex flex-col items-center space-y-2 min-w-[120px]">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{status.label}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{status.description}</div>
                </div>
              </div>
              
              {index < statusWorkflow.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-4" />
              )}
            </div>
          );
        })}
      </div>

      {/* Status Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statusWorkflow.map((status) => {
          const statusShipments = shipmentsByStatus[status.key] || [];
          const Icon = status.icon;
          
          return (
            <Card key={status.key} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Icon className="h-4 w-4" />
                  <span>{status.label}</span>
                  <Badge variant="secondary">{statusShipments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {statusShipments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No shipments in this status
                  </div>
                ) : (
                  statusShipments.map((shipment) => {
                    const nextStatus = getNextStatus(shipment.currentStatus as LogisticsShipmentStatus);
                    const nextStatusConfig = nextStatus ? statusWorkflow.find(s => s.key === nextStatus) : null;
                    
                    return (
                      <Card key={shipment.id} className="p-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm" data-testid={`workflow-shipment-${shipment.id}`}>
                            {shipment.consignmentNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.clientId ? 'Client Shipment' : shipment.vendorId ? 'Vendor Shipment' : 'Direct Shipment'}
                          </div>
                          <div className="text-xs">
                            {shipment.source} → {shipment.destination}
                          </div>
                          
                          <div className="flex space-x-1 pt-2">
                            {nextStatusConfig && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(shipment, nextStatus!)}
                                className="text-xs"
                                data-testid={`button-advance-${shipment.id}`}
                              >
                                → {nextStatusConfig.label}
                              </Button>
                            )}
                            
                            {shipment.currentStatus === 'delivered' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePodUpload(shipment)}
                                className="text-xs"
                                data-testid={`button-pod-${shipment.id}`}
                              >
                                <FileUp className="h-3 w-3 mr-1" />
                                POD
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
            <DialogDescription>
              Update status for shipment {selectedShipment?.consignmentNumber}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitStatusUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-location" />
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
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-status-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowStatusUpdate(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-update-status"
                >
                  Update Status
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* POD Upload Dialog */}
      <Dialog open={showPodUpload} onOpenChange={setShowPodUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Shipment with POD</DialogTitle>
            <DialogDescription>
              Upload Proof of Delivery and close shipment {selectedShipment?.consignmentNumber}
            </DialogDescription>
          </DialogHeader>
          
          <PodUploadComponent 
            shipment={selectedShipment}
            onClose={() => setShowPodUpload(false)}
            onComplete={(podData) => {
              onSubmitPodUpload(podData);
              setShowPodUpload(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}