import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock,
  Activity,
  AlertCircle,
  TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Import shared types
import type { LogisticsShipment } from "@shared/schema";
import { LOGISTICS_SHIPMENT_STATUSES } from "@shared/schema";

// Import components
import StatusWorkflowPanel from "@/components/logistics/StatusWorkflowPanel";
import ShipmentTable from "@/components/logistics/ShipmentTable";

export default function StatusWorkflow() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch shipments data
  const { data: shipments = [], isLoading, error } = useQuery<LogisticsShipment[]>({
    queryKey: ["/logistics/shipments"],
    queryFn: async () => {
      const res = await fetch(`/api/logistics/shipments`);
      if (!res.ok) throw new Error("Failed to fetch shipments");
      const data = await res.json();
      return Array.isArray(data) ? data : data.shipments ?? [];
    },
  });

  // Filter shipments based on status and search
  const filteredShipments = (shipments ?? []).filter((shipment) => {
    const matchesStatus = statusFilter === "all" || (shipment.currentStatus?.toLowerCase() === statusFilter.toLowerCase());
    const matchesSearch = searchTerm === "" || 
      shipment.consignmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate workflow metrics
  const workflowMetrics = LOGISTICS_SHIPMENT_STATUSES.reduce((acc, status) => {
    acc[status] = shipments.filter(s => s.currentStatus?.toLowerCase() === status.toLowerCase()).length;
    return acc;
  }, {} as Record<string, number>);

  const totalShipments = shipments.length;
  const activeShipments = shipments.filter(s => !['delivered', 'closed'].includes(s.currentStatus?.toLowerCase() || '')).length;
  const completedToday = shipments.filter(s => 
    s.currentStatus?.toLowerCase() === 'delivered' && 
    new Date(s.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load shipments data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Status Workflow</h1>
          <p className="text-muted-foreground">
            Manage shipment status transitions and workflow operations
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            <Activity className="h-3 w-3 mr-1" />
            {activeShipments} Active
          </Badge>
          <Badge variant="outline" className="text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            {completedToday} Completed Today
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalShipments}</p>
                <p className="text-xs text-muted-foreground">Total Shipments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{workflowMetrics.in_transit || 0}</p>
                <p className="text-xs text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{workflowMetrics.out_for_delivery || 0}</p>
                <p className="text-xs text-muted-foreground">Out for Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{workflowMetrics.delivered || 0}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by consignment number, source, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-shipments"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {LOGISTICS_SHIPMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow" data-testid="tab-workflow">
            <Package className="h-4 w-4 mr-2" />
            Workflow View
          </TabsTrigger>
          <TabsTrigger value="table" data-testid="tab-table">
            <TrendingUp className="h-4 w-4 mr-2" />
            Table View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <StatusWorkflowPanel shipments={filteredShipments} />
          )}
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Shipments Table</CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentTable 
                  shipments={filteredShipments}
                  onEdit={() => {}}
                  onViewTimeline={() => {}}
                  onDelete={() => {}}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}