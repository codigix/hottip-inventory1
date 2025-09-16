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
import { QrCode, Scan, Package, Plus, Download, Search } from "lucide-react";

export default function BatchBarcode() {
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  // Mock data
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
      header: "Batch Number",
      cell: (batch: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{batch.batchNumber}</span>
        </div>
      ),
    },
    {
      key: "productName",
      header: "Product",
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (batch: any) => (
        <div>
          <p className="font-medium">{batch.remainingQuantity}/{batch.quantity}</p>
          <p className="text-xs text-muted-foreground">Remaining/Total</p>
        </div>
      ),
    },
    {
      key: "manufactureDate",
      header: "Manufacture Date",
      cell: (batch: any) => new Date(batch.manufactureDate).toLocaleDateString(),
    },
    {
      key: "location",
      header: "Location",
    },
    {
      key: "qualityStatus",
      header: "Quality Status",
      cell: (batch: any) => (
        <Badge variant={batch.qualityStatus === 'approved' ? 'default' : 'outline'}>
          {batch.qualityStatus.charAt(0).toUpperCase() + batch.qualityStatus.slice(1)}
        </Badge>
      ),
    }
  ];

  const barcodeColumns = [
    {
      key: "barcode",
      header: "Barcode/QR Code",
      cell: (code: any) => (
        <div className="flex items-center space-x-3">
          <QrCode className="h-6 w-6" />
          <div>
            <p className="font-mono text-sm">{code.barcode}</p>
            <p className="text-xs text-muted-foreground">{code.type} Code</p>
          </div>
        </div>
      ),
    },
    {
      key: "entityType",
      header: "Linked To",
      cell: (code: any) => (
        <div>
          <p className="capitalize">{code.entityType}</p>
          <p className="text-sm text-muted-foreground">{code.entityId}</p>
        </div>
      ),
    },
    {
      key: "generatedAt",
      header: "Generated",
      cell: (code: any) => new Date(code.generatedAt).toLocaleDateString(),
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Batch & Barcode Management</h1>
          <p className="text-muted-foreground">Lot tracking and QR/barcode scanning support</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-batch">
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input id="batchNumber" placeholder="BTH-2024-XXX" data-testid="input-batch-number" />
                </div>
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Steel Rods</SelectItem>
                      <SelectItem value="2">Aluminum Sheets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="100" />
                </div>
                <div>
                  <Label htmlFor="location">Storage Location</Label>
                  <Input id="location" placeholder="WH-A-001" />
                </div>
                <div>
                  <Label htmlFor="manufactureDate">Manufacture Date</Label>
                  <Input id="manufactureDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-save-batch">
                    Create Batch
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-scan-barcode">
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Scan Barcode/QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Point camera at barcode/QR code</p>
                  <Button className="mt-4" variant="outline">
                    Start Camera
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Or enter code manually:</p>
                  <Input placeholder="Enter barcode..." data-testid="input-manual-barcode" />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" data-testid="button-generate-codes">
            <QrCode className="h-4 w-4 mr-2" />
            Generate Codes
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Batches</p>
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Generated Codes</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
              <QrCode className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scanned Today</p>
                <p className="text-2xl font-bold text-foreground">42</p>
              </div>
              <Scan className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <Search className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="batches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="batches">Batch Management</TabsTrigger>
          <TabsTrigger value="barcodes">Barcode Directory</TabsTrigger>
          <TabsTrigger value="scanning">Scanning History</TabsTrigger>
        </TabsList>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Batch Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={batches}
                columns={batchColumns}
                searchable={true}
                searchKey="batchNumber"
                onEdit={() => {}}
                onView={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcodes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Barcode Directory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={barcodes}
                columns={barcodeColumns}
                searchable={true}
                searchKey="barcode"
                onView={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanning">
          <Card>
            <CardHeader>
              <CardTitle>Recent Scanning Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scanning activity recorded yet</p>
                <p className="text-sm">Start scanning barcodes to see history here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}