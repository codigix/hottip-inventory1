import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wrench, Package, Clock, CheckCircle, AlertCircle, Settings, Plus, FileText } from "lucide-react";

// Quality Control Queue Component
function QualityControlQueue() {
  const { data: fabricationOrders = [], isLoading } = useQuery({
    queryKey: ["/fabrication-orders"],
    queryFn: async () => apiRequest("GET", "/fabrication-orders"),
  });
  const { data: spareParts = [] } = useQuery({
    queryKey: ["/spare-parts"],
    queryFn: async () => apiRequest("GET", "/spare-parts"),
  });
  const { toast } = useToast();
  const qcMutation = useMutation({
    mutationFn: async ({ id, qcStatus, qcNotes }: any) => {
      return apiRequest("PATCH", `/fabrication-orders/${id}/qc`, { qcStatus, qcNotes });
    },
    onSuccess: () => {
      toast({ title: "QC status updated", description: "Quality control status saved." });
      queryClient.invalidateQueries({ queryKey: ["/fabrication-orders"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update QC status", variant: "destructive" });
    }
  });
  const [inspectId, setInspectId] = useState<string|null>(null);
  const [qcNotes, setQcNotes] = useState("");

  // Show only orders with qcStatus 'pending'
  const pendingOrders = (fabricationOrders || []).filter((o: any) => o.qcStatus === "pending");

  if (isLoading) return <div>Loading...</div>;
  if (pendingOrders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No items in quality control queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingOrders.map((order: any) => {
        const part = spareParts.find((p: any) => p.id === order.partId);
        const isInspecting = inspectId === order.id;
        return (
          <div key={order.id} className="flex flex-col border rounded-lg p-4 bg-yellow-50 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-light">{part ? `${part.name} - ${part.partNumber}` : order.partId}</p>
                  <p className="text-sm text-muted-foreground">Awaiting inspection</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => { setInspectId(order.id); setQcNotes(order.qcNotes || ""); }}>Inspect</Button>
                <Button size="sm" onClick={() => qcMutation.mutate({ id: order.id, qcStatus: "approved", qcNotes: order.qcNotes })}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => { setInspectId(order.id); setQcNotes(order.qcNotes || ""); }}>Reject</Button>
              </div>
            </div>
            {isInspecting && (
              <div className="border rounded-lg p-6 bg-white shadow-md mt-4">
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-2">Inspect Product</h3>
                  <p><b>Part Number:</b> {part ? part.partNumber : order.partId}</p>
                  <p><b>Name:</b> {part ? part.name : "-"}</p>
                  <p><b>Quantity:</b> {order.quantity}</p>
                  <p><b>Notes:</b> {order.notes}</p>
                </div>
                <div className="mb-4">
                  <Label htmlFor="qc-notes">Inspection Notes</Label>
                  <Textarea id="qc-notes" value={qcNotes} onChange={e => setQcNotes(e.target.value)} placeholder="Describe any issues or confirm good condition..." />
                </div>
                <div className="flex space-x-2 justify-end">
                  <Button size="sm" onClick={() => { qcMutation.mutate({ id: order.id, qcStatus: "approved", qcNotes }); setInspectId(null); }}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => { qcMutation.mutate({ id: order.id, qcStatus: "rejected", qcNotes }); setInspectId(null); }}>Reject</Button>
                  <Button size="sm" variant="outline" onClick={() => setInspectId(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SparePartsFabrication() {
    // Fabrication Orders state and API
  const [isFabOrderDialogOpen, setIsFabOrderDialogOpen] = useState(false);
  const [fabOrderForm, setFabOrderForm] = useState<any>({});
  // Fetch fabrication orders
  const { data: fabricationOrders = [], isLoading: fabOrdersLoading } = useQuery({
    queryKey: ["/fabrication-orders"],
    queryFn: async () => apiRequest("GET", "/fabrication-orders"),
  });
  // Add fabrication order mutation
  const addFabOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!data.partId || !data.quantity) throw new Error("Part and quantity are required");
      const payload = {
        partId: data.partId,
        quantity: Number(data.quantity),
        status: data.status || "pending",
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
        assignedTo: data.assignedTo || undefined,
        notes: data.notes || "",
      };
      return apiRequest("POST", "/fabrication-orders", payload);
    },
    onSuccess: () => {
      toast({ title: "Fabrication order added", description: "Order created successfully" });
      setIsFabOrderDialogOpen(false);
      setFabOrderForm({});
      queryClient.invalidateQueries({ queryKey: ["/fabrication-orders"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add fabrication order", variant: "destructive" });
    }
  });
  const [isSparePartDialogOpen, setIsSparePartDialogOpen] = useState(false);
  
  const { toast } = useToast();
  // Fetch spare parts from /api/spare-parts
  const { data: spareParts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["/spare-parts"],
    queryFn: async () => {
      return await apiRequest("GET", "/spare-parts");
    }
  });

  // Add spare part mutation (POST to /api/spare-parts)
  const addSparePartMutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate required fields
      if (!data.partNumber || !data.name) throw new Error("Part Number and Name are required");
      // Map to spareParts table fields
      const payload = {
        partNumber: data.partNumber,
        name: data.name,
        type: data.type || null,
        status: data.status || null,
        stock: Number(data.stock) || 0,
        minStock: Number(data.minStock) || 0,
        fabricationTime: data.fabricationTime ? Number(data.fabricationTime) : null,
        location: data.location || null,
        unit: data.unit || "pcs",
        unitCost: data.unitCost ? Number(data.unitCost) : 0,
        specifications: data.specifications || "",
      };
      return apiRequest("POST", "/spare-parts", payload);
    },
    onSuccess: () => {
      toast({ title: "Spare part added", description: "Spare part added successfully" });
      setIsSparePartDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/spare-parts"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add spare part", variant: "destructive" });
    }
  });

  // Form state for modal
  const [form, setForm] = useState<any>({});
  React.useEffect(() => { if (!isSparePartDialogOpen) setForm({}); }, [isSparePartDialogOpen]);

  const sparePartColumns = [
    {
      key: "partNumber",
      header: "Part Number",
      cell: (part: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-light">{part.partNumber}</p>
            <p className="text-sm text-muted-foreground">{part.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (part: any) => (
        <Badge variant="outline" className="capitalize">
          {(part.type || '').replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (part: any) => {
        const statusConfig = {
          available: { color: "default", icon: CheckCircle },
          in_fabrication: { color: "outline", icon: Clock },
          quality_check: { color: "outline", icon: Settings },
          ready: { color: "default", icon: CheckCircle },
          damaged: { color: "destructive", icon: AlertCircle }
        };
        const status = part.status || '';
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "outline", icon: FileText };
        const Icon = config.icon;
        return (
          <Badge variant={config.color as any} className="flex items-center space-x-1">
            <Icon className="h-3 w-3" />
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </Badge>
        );
      },
    },
    {
      key: "stock",
      header: "Stock",
      cell: (part: any) => (
        <div className="flex items-center space-x-2">
          <span className="font-light">{part.stock}</span>
          <div className={`w-2 h-2 rounded-full ${part.stock <= part.minStock ? 'bg-red-500' : 'bg-green-500'}`} />
        </div>
      ),
    },
    {
      key: "fabricationTime",
      header: "Fabrication Time",
      cell: (part: any) => `${part.fabricationTime} hrs`,
    },
    {
      key: "location",
      header: "Location",
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Spare Parts & Fabrication</h1>
          <p className="text-muted-foreground">Track part status and fabrication workflow</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isSparePartDialogOpen} onOpenChange={setIsSparePartDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-spare-part">
                <Plus className="h-4 w-4 mr-2" />
                Add Spare Part
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Spare Part</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addSparePartMutation.mutate(form); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partNumber">Part Number *</Label>
                    <Input id="partNumber" placeholder="SP-001" data-testid="input-part-number" value={form.partNumber || ''} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="partName">Part Name *</Label>
                    <Input id="partName" placeholder="Bearing Assembly" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="partType">Type</Label>
                    <Select value={form.type || ''} onValueChange={val => setForm(f => ({ ...f, type: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw_material">Raw Material</SelectItem>
                        <SelectItem value="component">Component</SelectItem>
                        <SelectItem value="finished_part">Finished Part</SelectItem>
                        <SelectItem value="tool">Tool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Storage Location</Label>
                    <Input id="location" placeholder="A-01-05" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="fabricationTime">Fabrication Time (hours)</Label>
                    <Input id="fabricationTime" type="number" placeholder="4" value={form.fabricationTime || ''} onChange={e => setForm(f => ({ ...f, fabricationTime: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="unitCost">Unit Cost</Label>
                    <Input id="unitCost" type="number" placeholder="0" value={form.unitCost || ''} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="specifications">Specifications</Label>
                    <Textarea id="specifications" placeholder="Technical specifications..." value={form.specifications || ''} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))} />
                  </div>
                  <div className="col-span-2 flex justify-end space-x-2">
                    <Button variant="outline" type="button" onClick={() => setIsSparePartDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-spare-part" type="submit" disabled={addSparePartMutation.isPending}>
                      {addSparePartMutation.isPending ? 'Adding...' : 'Add Spare Part'}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isFabOrderDialogOpen} onOpenChange={setIsFabOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-fabrication-order">
                <Settings className="h-4 w-4 mr-2" />
                New Fabrication Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Fabrication Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addFabOrderMutation.mutate(fabOrderForm); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="fab-part">Spare Part *</Label>
                    <Select value={fabOrderForm.partId || ''} onValueChange={val => setFabOrderForm(f => ({ ...f, partId: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select spare part..." />
                      </SelectTrigger>
                      <SelectContent>
                        {spareParts.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.partNumber} - {p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fab-qty">Quantity *</Label>
                    <Input id="fab-qty" type="number" min={1} value={fabOrderForm.quantity || ''} onChange={e => setFabOrderForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="fab-status">Status</Label>
                    <Select value={fabOrderForm.status || 'pending'} onValueChange={val => setFabOrderForm(f => ({ ...f, status: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fab-start">Start Date</Label>
                    <Input id="fab-start" type="date" value={fabOrderForm.startDate || ''} onChange={e => setFabOrderForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="fab-due">Due Date</Label>
                    <Input id="fab-due" type="date" value={fabOrderForm.dueDate || ''} onChange={e => setFabOrderForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="fab-notes">Notes</Label>
                    <Textarea id="fab-notes" value={fabOrderForm.notes || ''} onChange={e => setFabOrderForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="col-span-2 flex justify-end space-x-2">
                    <Button variant="outline" type="button" onClick={() => setIsFabOrderDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button data-testid="button-save-fab-order" type="submit" disabled={addFabOrderMutation.isPending}>
                      {addFabOrderMutation.isPending ? 'Adding...' : 'Add Fabrication Order'}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Parts</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">In Fabrication</p>
                <p className="text-2xl font-bold text-foreground">8</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Quality Check</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Ready Parts</p>
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="parts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="parts">Spare Parts Inventory</TabsTrigger>
          <TabsTrigger value="fabrication">Fabrication Orders</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
        </TabsList>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Spare Parts Inventory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={spareParts}
                columns={sparePartColumns}
                searchable={true}
                searchKey="partNumber"
                onEdit={() => {}}
                onView={() => {}}
                isLoading={partsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fabrication">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Fabrication Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-light">Custom Valve - SP-002</p>
                        <p className="text-sm text-muted-foreground">Started: 2 days ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={65} className="w-32" />
                      <p className="text-sm text-muted-foreground mt-1">65% Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Settings className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-light">Motor Mount - SP-015</p>
                        <p className="text-sm text-muted-foreground">Started: 5 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={20} className="w-32" />
                      <p className="text-sm text-muted-foreground mt-1">20% Complete</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fabrication Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-3 py-2 text-left">Part</th>
                        <th className="px-3 py-2 text-left">Quantity</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Start Date</th>
                        <th className="px-3 py-2 text-left">Due Date</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fabOrdersLoading ? (
                        <tr><td colSpan={6}><Skeleton className="h-8 w-full" /></td></tr>
                      ) : fabricationOrders.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No fabrication orders</td></tr>
                      ) : fabricationOrders.map((order: any) => {
                        const part = spareParts.find((p: any) => p.id === order.partId);
                        return (
                          <tr key={order.id} className="border-b">
                            <td className="px-3 py-2">{part ? `${part.partNumber} - ${part.name}` : order.partId}</td>
                            <td className="px-3 py-2">{order.quantity}</td>
                            <td className="px-3 py-2 capitalize">{order.status.replace('_', ' ')}</td>
                            <td className="px-3 py-2">{order.startDate ? order.startDate.slice(0, 10) : ''}</td>
                            <td className="px-3 py-2">{order.dueDate ? order.dueDate.slice(0, 10) : ''}</td>
                            <td className="px-3 py-2">{order.notes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle>Quality Control Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <QualityControlQueue />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </main>
  );
}