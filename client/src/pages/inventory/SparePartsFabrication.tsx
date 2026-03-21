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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Clock, CheckCircle, AlertCircle, Settings, Plus, LayoutGrid, ClipboardList, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SparePartsFabrication() {
  const { toast } = useToast();
  const [isFabOrderDialogOpen, setIsFabOrderDialogOpen] = useState(false);
  const [fabOrderForm, setFabOrderForm] = useState<any>({});
  const [isSparePartDialogOpen, setIsSparePartDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isSparePartDialogOpen) setForm({});
  }, [isSparePartDialogOpen]);

  React.useEffect(() => {
    if (!isFabOrderDialogOpen) setFabOrderForm({});
  }, [isFabOrderDialogOpen]);

  // Fetch fabrication orders
  const { data: fabricationOrders = [], isLoading: fabOrdersLoading } = useQuery({
    queryKey: ["/api/fabrication-orders"],
    queryFn: async () => apiRequest("GET", "/api/fabrication-orders"),
  });

  // Fetch spare parts
  const { data: spareParts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["/api/spare-parts"],
    queryFn: async () => apiRequest("GET", "/api/spare-parts"),
  });

  // Add fabrication order mutation
  const addFabOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!data.partId || !data.quantity) throw new Error("Part and quantity are required");
      const payload = {
        partId: Number(data.partId),
        quantity: Number(data.quantity),
        status: data.status || "pending",
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        assignedTo: data.assignedTo || null,
        notes: data.notes || "",
      };
      return apiRequest("POST", "/api/fabrication-orders", payload);
    },
    onSuccess: () => {
      toast({ title: "Fabrication order added", description: "Order created successfully" });
      setIsFabOrderDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/fabrication-orders"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add fabrication order", variant: "destructive" });
    }
  });

  // Add spare part mutation
  const addSparePartMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!data.partNumber || !data.name) throw new Error("Part Number and Name are required");
      const payload = {
        partNumber: data.partNumber,
        name: data.name,
        type: data.type || null,
        status: data.status || "available",
        stock: Number(data.stock) || 0,
        minStock: Number(data.minStock) || 0,
        fabricationTime: data.fabricationTime ? Number(data.fabricationTime) : null,
        location: data.location || null,
        unit: data.unit || "pcs",
        unitCost: data.unitCost ? Number(data.unitCost) : 0,
        specifications: data.specifications || "",
      };
      return apiRequest("POST", "/api/spare-parts", payload);
    },
    onSuccess: () => {
      toast({ title: "Spare part added", description: "Spare part added successfully" });
      setIsSparePartDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add spare part", variant: "destructive" });
    }
  });

  const sparePartColumns = [
    {
      key: "partNumber",
      header: "Part Details",
      cell: (part: any) => (
        <div className="flex flex-col">
          <span className=" text-slate-900">{part.partNumber}</span>
          <span className="text-xs text-slate-500">{part.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (part: any) => (
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none capitalize">
          {(part.type || '').replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (part: any) => {
        const status = part.status || 'available';
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "capitalize font-normal",
              status === 'available' && "bg-emerald-50 text-emerald-700 border-emerald-200",
              status === 'in_fabrication' && "bg-amber-50 text-amber-700 border-amber-200",
              status === 'quality_check' && "bg-blue-50 text-blue-700 border-blue-200",
              status === 'damaged' && "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: "stock",
      header: "Stock Level",
      cell: (part: any) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            "",
            part.stock <= part.minStock ? "text-red-600" : "text-slate-700"
          )}>
            {part.stock} {part.unit}
          </span>
          {part.stock <= part.minStock && (
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (part: any) => (
        <span className="text-slate-600">{part.location || 'Not Set'}</span>
      )
    }
  ];

  const fabricationColumns = [
    {
      key: "partId",
      header: "Part / Description",
      cell: (order: any) => {
        const part = spareParts.find((p: any) => p.id === order.partId);
        return (
          <div className="flex flex-col">
            <span className=" text-slate-900">{part?.partNumber || `ID: ${order.partId}`}</span>
            <span className="text-xs text-slate-500 truncate max-w-[200px]">{part?.name || order.notes}</span>
          </div>
        );
      }
    },
    {
      key: "quantity",
      header: "Qty",
      cell: (order: any) => <span className="">{order.quantity}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: (order: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal",
            order.status === 'completed' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            order.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-200",
            order.status === 'pending' && "bg-slate-100 text-slate-600 border-slate-200",
            order.status === 'cancelled' && "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {order.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: "dueDate",
      header: "Timeline",
      cell: (order: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}</span>
          <span className="text-[10px] text-slate-400">Start: {order.startDate ? new Date(order.startDate).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    }
  ];

  const metrics = [
    { label: "Total Spare Parts", value: spareParts.length, icon: Wrench, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Low Stock Items", value: spareParts.filter((p: any) => p.stock <= p.minStock).length, icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "In Fabrication", value: fabricationOrders.filter((o: any) => o.status === 'in_progress').length, icon: Hammer, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Pending Quality", value: spareParts.filter((p: any) => p.status === 'quality_check').length, icon: Settings, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-6 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Spare Parts & Fabrication</h1>
          <p className="text-xs text-slate-500">Manage manufacturing components and custom fabrication workflows.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isSparePartDialogOpen} onOpenChange={setIsSparePartDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Spare Part
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Add New Spare Part</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addSparePartMutation.mutate(form); }} className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Part Number *</Label>
                    <Input className="border-slate-200" placeholder="SP-001" value={form.partNumber || ''} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Part Name *</Label>
                    <Input className="border-slate-200" placeholder="Bearing Assembly" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Type</Label>
                    <Select value={form.type || ''} onValueChange={val => setForm(f => ({ ...f, type: val }))}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw_material">Raw Material</SelectItem>
                        <SelectItem value="component">Component</SelectItem>
                        <SelectItem value="finished_part">Finished Part</SelectItem>
                        <SelectItem value="tool">Tool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Location</Label>
                    <Input className="border-slate-200" placeholder="A-01-05" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Fabrication Time (Hrs)</Label>
                    <Input type="number" className="border-slate-200" placeholder="0" value={form.fabricationTime || ''} onChange={e => setForm(f => ({ ...f, fabricationTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Stock (Initial)</Label>
                    <Input type="number" className="border-slate-200" placeholder="0" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Specifications</Label>
                  <Textarea className="border-slate-200 min-h-[100px]" placeholder="Enter technical details..." value={form.specifications || ''} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" type="button" onClick={() => setIsSparePartDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary text-white px-8" disabled={addSparePartMutation.isPending}>
                    {addSparePartMutation.isPending ? 'Saving...' : 'Create Part'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isFabOrderDialogOpen} onOpenChange={setIsFabOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm">
                <Hammer className="h-4 w-4 mr-2 text-slate-400" />
                New Fabrication Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">New Fabrication Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addFabOrderMutation.mutate(fabOrderForm); }} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-slate-700">Target Spare Part *</Label>
                    <Select value={fabOrderForm.partId || ''} onValueChange={val => setFabOrderForm(f => ({ ...f, partId: val }))}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select part to fabricate" />
                      </SelectTrigger>
                      <SelectContent>
                        {spareParts.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.partNumber} - {p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Quantity *</Label>
                    <Input type="number" min={1} className="border-slate-200" value={fabOrderForm.quantity || ''} onChange={e => setFabOrderForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Due Date</Label>
                    <Input type="date" className="border-slate-200" value={fabOrderForm.dueDate || ''} onChange={e => setFabOrderForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Notes / Fabrication Instructions</Label>
                  <Textarea className="border-slate-200 min-h-[100px]" value={fabOrderForm.notes || ''} onChange={e => setFabOrderForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" type="button" onClick={() => setIsFabOrderDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary text-white px-8" disabled={addFabOrderMutation.isPending}>
                    {addFabOrderMutation.isPending ? 'Creating...' : 'Start Fabrication'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-2 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", metric.bg)}>
                <metric.icon className={cn("h-5 w-5", metric.color)} />
              </div>
              <div>
                <p className="text-xs  text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inventory" className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-lg w-fit border border-slate-200">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
            Part Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <ClipboardList className="h-4 w-4 mr-2 text-slate-400" />
            Fabrication Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-0">
          <div className="">
            <div className="">
              <div className="text-lg  text-slate-800 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-slate-400" />
                Spare Parts Directory
              </div>
            </div>
            <div className="p-0">
              <DataTable 
                columns={sparePartColumns} 
                data={spareParts} 
                loading={partsLoading} 
                searchPlaceholder="Filter parts..."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <div className="">
            <div className="">
              <div className="text-lg  text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                Active Fabrication Registry
              </div>
            </div>
            <div className="p-0">
              <DataTable 
                columns={fabricationColumns} 
                data={fabricationOrders} 
                loading={fabOrdersLoading} 
                searchPlaceholder="Search orders..."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
