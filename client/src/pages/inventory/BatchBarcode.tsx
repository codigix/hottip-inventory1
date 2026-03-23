import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Scan, Package, Plus, Search, LayoutGrid, ClipboardList, History, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BatchBarcode() {
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  // Mock data (replace with actual query if needed)
  const batches = [
    {
      id: "1",
      batchNumber: "BTH-2024-001",
      productName: "Steel Rods",
      quantity: 100,
      remainingQuantity: 85,
      manufactureDate: "2024-01-15",
      expiryDate: "2024-12-15",
      location: "WH-A-001",
      qualityStatus: "approved"
    },
    {
      id: "2",
      batchNumber: "BTH-2024-002",
      productName: "Aluminum Sheets", 
      quantity: 50,
      remainingQuantity: 50,
      manufactureDate: "2024-01-20",
      expiryDate: "2025-01-20",
      location: "WH-B-005",
      qualityStatus: "pending"
    }
  ];

  const barcodes = [
    {
      id: "1",
      barcode: "QR001234567890",
      type: "QR",
      entityType: "batch",
      entityId: "BTH-2024-001",
      generatedAt: "2024-01-15"
    }
  ];

  const batchColumns = [
    {
      key: "batchNumber",
      header: "Batch Details",
      cell: (batch: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-900">{batch.batchNumber}</span>
          <span className="text-xs text-slate-500">{batch.productName}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Inventory Status",
      cell: (batch: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700">{batch.remainingQuantity} / {batch.quantity}</span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${(batch.remainingQuantity / batch.quantity) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "manufactureDate",
      header: "Timeline",
      cell: (batch: any) => (
        <div className="flex flex-col text-xs">
          <span className="text-slate-600">MFG: {new Date(batch.manufactureDate).toLocaleDateString()}</span>
          <span className="text-slate-400">EXP: {new Date(batch.expiryDate).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Storage",
      cell: (batch: any) => (
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-normal">
          {batch.location}
        </Badge>
      )
    },
    {
      key: "qualityStatus",
      header: "QC Status",
      cell: (batch: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal",
            batch.qualityStatus === 'approved' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            batch.qualityStatus === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
            batch.qualityStatus === 'rejected' && "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {batch.qualityStatus}
        </Badge>
      ),
    }
  ];

  const barcodeColumns = [
    {
      key: "barcode",
      header: "Identifier",
      cell: (code: any) => (
        <div className="flex items-center gap-3">
          {/* <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <QrCode className="h-4 w-4 text-slate-400" />
          </div> */}
          <div className="flex flex-col">
            <span className="font-mono text-xs text-xs text-slate-900">{code.barcode}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{code.type} Code</span>
          </div>
        </div>
      ),
    },
    {
      key: "entityId",
      header: "Linked Reference",
      cell: (code: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">{code.entityId}</span>
          <span className="text-xs text-slate-400 capitalize">{code.entityType} Entity</span>
        </div>
      ),
    },
    {
      key: "generatedAt",
      header: "Registration",
      cell: (code: any) => (
        <span className="text-slate-500 text-xs">{new Date(code.generatedAt).toLocaleDateString()}</span>
      ),
    }
  ];

  const metrics = [
    { label: "Active Batches", value: "24", icon: Package, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Generated Codes", value: "156", icon: QrCode, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Scanned Today", value: "42", icon: Scan, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Expiring Soon", value: "3", icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Batch & Barcode Management</h1>
          <p className="text-xs text-slate-500">Track production lots and manage product identification systems.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Create New Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Batch Number</Label>
                  <Input className="border-slate-200" placeholder="BTH-2024-XXX" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Product</Label>
                  <Select>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Steel Rods</SelectItem>
                      <SelectItem value="2">Aluminum Sheets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Quantity</Label>
                    <Input type="number" className="border-slate-200" placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Location</Label>
                    <Input className="border-slate-200" placeholder="WH-A-001" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Manufacture Date</Label>
                    <Input type="date" className="border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Expiry Date</Label>
                    <Input type="date" className="border-slate-200" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setIsBatchDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button className="bg-primary hover:bg-primary text-white px-8">Create Batch</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm">
                <Scan className="h-4 w-4 mr-2 text-slate-400" />
                Scan Code
              </Button>
            </DialogTrigger>
            <DialogContent className="border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Code Scanner</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 pt-4 text-center">
                <div className="aspect-square w-full max-w-[280px] mx-auto border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden group">
                  <QrCode className="h-24 w-24 text-slate-200 group-hover:text-slate-300 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/5 to-transparent animate-scan" />
                  <Button variant="outline" className="mt-8 border-slate-200 bg-white">
                    Activate Camera
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input className="pl-10 border-slate-200 bg-slate-50/50" placeholder="Enter code manually..." />
                </div>
              </div>
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
                <p className="text-xs font-medium text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="batches" className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-lg w-fit border border-slate-200">
          <TabsTrigger value="batches" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
            Active Batches
          </TabsTrigger>
          <TabsTrigger value="barcodes" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <QrCode className="h-4 w-4 mr-2 text-slate-400" />
            Code Directory
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:shadow-sm px-6">
            <History className="h-4 w-4 mr-2 text-slate-400" />
            Scan History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                Batch Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={batches}
                columns={batchColumns}
                searchPlaceholder="Filter batches..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcodes" className="mt-0">
          <Card className="">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-slate-400" />
                Identifier Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={barcodes}
                columns={barcodeColumns}
                searchPlaceholder="Search identifiers..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-none shadow-sm bg-white min-h-[400px] flex flex-col items-center justify-center">
            <div className="text-center space-y-3 p-12">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                <History className="h-8 w-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-medium">No Scan Activity</p>
                <p className="text-slate-500 text-sm max-w-[240px]">Real-time scan history will appear here once scanning begins.</p>
              </div>
              <Button variant="outline" className="mt-4 border-slate-200 text-slate-600 hover:bg-slate-50">
                Refresh Log
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
