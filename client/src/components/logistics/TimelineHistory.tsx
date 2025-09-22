import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, User, FileText, Package, Truck, CheckCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface LogisticsShipment {
  id: string;
  consignmentNumber: string;
  source: string;
  destination: string;
  currentStatus: string;
}

interface StatusUpdate {
  id: string;
  status: string;
  notes?: string;
  location?: string;
  updatedBy: string;
  createdAt: string;
  user?: { username: string; };
}

interface Checkpoint {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  user?: { username: string; };
}

interface TimelineHistoryProps {
  shipment: LogisticsShipment;
}

export default function TimelineHistory({ shipment }: TimelineHistoryProps) {
  // Fetch status updates for this shipment
  const { data: statusUpdates = [], isLoading: updatesLoading } = useQuery<StatusUpdate[]>({
    queryKey: ['/logistics/status-updates', shipment.id],
    queryFn: async () => {
      const response = await fetch(`/logistics/status-updates?shipmentId=${shipment.id}`);
      if (!response.ok) throw new Error('Failed to fetch status updates');
      return response.json();
    }
  });

  // Fetch GPS checkpoints for this shipment
  const { data: checkpoints = [], isLoading: checkpointsLoading } = useQuery<Checkpoint[]>({
    queryKey: ['/logistics/checkpoints', shipment.id],
    queryFn: async () => {
      const response = await fetch(`/logistics/checkpoints?shipmentId=${shipment.id}`);
      if (!response.ok) throw new Error('Failed to fetch checkpoints');
      return response.json();
    }
  });

  // Combine and sort timeline events
  const timelineEvents = [
    ...statusUpdates.map(update => ({
      id: `status-${update.id}`,
      type: 'status' as const,
      timestamp: update.createdAt,
      status: update.status,
      location: update.location,
      notes: update.notes,
      user: update.user?.username || 'System',
      data: update,
    })),
    ...checkpoints.map(checkpoint => ({
      id: `checkpoint-${checkpoint.id}`,
      type: 'checkpoint' as const,
      timestamp: checkpoint.createdAt,
      location: checkpoint.location,
      notes: checkpoint.notes,
      user: checkpoint.user?.username || 'Driver',
      data: checkpoint,
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getStatusIcon = (status: string) => {
    const icons = {
      created: Package,
      packed: Package,
      dispatched: Truck,
      in_transit: MapPin,
      out_for_delivery: Truck,
      delivered: CheckCircle,
      closed: CheckCircle,
    };
    return icons[status as keyof typeof icons] || Package;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      created: 'text-gray-500',
      packed: 'text-blue-500',
      dispatched: 'text-indigo-500',
      in_transit: 'text-purple-500',
      out_for_delivery: 'text-orange-500',
      delivered: 'text-green-500',
      closed: 'text-slate-500',
    };
    return colors[status as keyof typeof colors] || 'text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      created: 'Created',
      packed: 'Packed',
      dispatched: 'Dispatched',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      closed: 'Closed',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (updatesLoading || checkpointsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-light text-foreground mb-2">No Timeline Data</h3>
        <p className="text-muted-foreground">
          No status updates or checkpoints have been recorded for this shipment yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shipment Header */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{shipment.consignmentNumber}</h3>
              <p className="text-muted-foreground">
                {shipment.source} → {shipment.destination}
              </p>
            </div>
            <Badge className={getStatusColor(shipment.currentStatus)}>
              {getStatusLabel(shipment.currentStatus)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const isLast = index === timelineEvents.length - 1;
            
            return (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${
                  event.type === 'status' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {event.type === 'status' ? (
                    (() => {
                      const StatusIcon = getStatusIcon(event.status || '');
                      return <StatusIcon className="h-4 w-4" />;
                    })()
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-8">
                  <Card className={event.type === 'status' ? 'border-primary/20' : 'border-secondary/20'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {event.type === 'status' ? (
                            <Badge variant="outline" className={getStatusColor(event.status || '')}>
                              {getStatusLabel(event.status || '')}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              GPS Checkpoint
                            </Badge>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {event.user}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-center text-sm mb-2">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="font-light">{event.location}</span>
                        </div>
                      )}

                      {event.notes && (
                        <div className="flex items-start text-sm">
                          <FileText className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">{event.notes}</span>
                        </div>
                      )}

                      {/* GPS coordinates for checkpoints */}
                      {event.type === 'checkpoint' && event.data && 'latitude' in event.data && event.data.latitude && event.data.longitude && (
                        <div className="mt-2 text-xs text-muted-foreground font-mono">
                          GPS: {event.data.latitude.toFixed(6)}, {event.data.longitude.toFixed(6)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-light mb-2">Timeline Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Events:</span>
              <span className="ml-2 font-light">{timelineEvents.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status Updates:</span>
              <span className="ml-2 font-light">{statusUpdates.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">GPS Checkpoints:</span>
              <span className="ml-2 font-light">{checkpoints.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current Status:</span>
              <span className="ml-2 font-light">{getStatusLabel(shipment.currentStatus)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}