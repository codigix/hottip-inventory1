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

export default function SparePartsFabrication() {
  const [isSparePartDialogOpen, setIsSparePartDialogOpen] = useState(false);
  
  const { toast } = useToast();
  // Fetch spare parts (products with category 'spare_part')
  const { data: sparePartsRaw = [], isLoading: partsLoading } = useQuery({
    queryKey: ["/products", "spare_parts"],
    queryFn: async () => {
      const all = await apiRequest("GET", "/products");
      return (all || []).filter((p: any) => p.category === "spare_part");
    }
  });
  // Map backend fields to expected table fields (now direct from DB)
  const spareParts = (sparePartsRaw || []).map((p: any) => ({
    id: p.id,
    partNumber: p.sku || '',
    name: p.name || '',
    type: p.type || '',
    status: p.status || '',
    stock: typeof p.stock === 'number' ? p.stock : 0,
    minStock: typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 0,
    fabricationTime: typeof p.fabricationTime === 'number' ? p.fabricationTime : '',
    location: p.location || '',
  }));

  // Add spare part mutation
  const addSparePartMutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate required fields
      if (!data.partNumber || !data.name) throw new Error("Part Number and Name are required");
      // Map to products table fields (all fields now supported)
      const payload = {
        sku: data.partNumber,
        name: data.name,
        category: "spare_part",
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.minStock) || 0,
        unit: data.unit || "pcs",
        price: Number(data.unitCost) || 0,
        description: data.specifications || "",
        location: data.location || "",
        fabricationTime: data.fabricationTime ? Number(data.fabricationTime) : null,
        type: data.type || null,
        status: data.status || null,
      };
      return apiRequest("POST", "/products", payload);
    },
    onSuccess: () => {
      toast({ title: "Spare part added", description: "Spare part added successfully" });
      setIsSparePartDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/products", "spare_parts"] });
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
          <Button variant="outline" data-testid="button-fabrication-order">
            <Settings className="h-4 w-4 mr-2" />
            New Fabrication Order
          </Button>
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
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle>Quality Control Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-light">Precision Gear - SP-087</p>
                      <p className="text-sm text-muted-foreground">Awaiting inspection</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Inspect
                    </Button>
                    <Button size="sm">
                      Approve
                    </Button>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground py-8">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No other items in quality control queue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}