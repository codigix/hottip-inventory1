import { useState } from "react";
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
import { Building2, Phone, Mail, MessageSquare, Calendar, Plus, Eye, Edit } from "lucide-react";

export default function VendorManagement() {
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isCommunicationDialogOpen, setIsCommunicationDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const { toast } = useToast();

  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/suppliers"],
  });

  // Fetch vendor communications
  const { data: communications, isLoading: communicationsLoading } = useQuery({
    queryKey: ["/vendor-communications"],
  });

  // Vendor columns
  const vendorColumns = [
    {
      key: "name",
      header: "Vendor Name",
      cell: (vendor: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-light">{vendor.name}</p>
            <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      cell: (vendor: any) => (
        <div>
          {vendor.email && (
            <div className="flex items-center space-x-1 text-sm">
              <Mail className="h-3 w-3" />
              <span>{vendor.email}</span>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{vendor.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "gstNumber",
      header: "GST Number",
    },
    {
      key: "paymentTerms",
      header: "Payment Terms",
      cell: (vendor: any) => `${vendor.paymentTerms} days`,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (vendor: any) => (
        <Badge variant={vendor.isActive ? "default" : "secondary"}>
          {vendor.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    }
  ];

  // Communication columns
  const communicationColumns = [
    {
      key: "type",
      header: "Type",
      cell: (comm: any) => (
        <Badge variant="outline" className="capitalize">
          {comm.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "subject",
      header: "Subject",
    },
    {
      key: "supplier.name",
      header: "Vendor",
    },
    {
      key: "status",
      header: "Status",
      cell: (comm: any) => (
        <Badge variant={comm.status === 'completed' ? 'default' : 'outline'}>
          {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "scheduledDate",
      header: "Date",
      cell: (comm: any) => comm.scheduledDate ? new Date(comm.scheduledDate).toLocaleDateString() : '-',
    },
    {
      key: "followUpRequired",
      header: "Follow-up",
      cell: (comm: any) => comm.followUpRequired ? (
        <Badge variant="outline" className="text-orange-600">
          Required
        </Badge>
      ) : null,
    }
  ];

  if (vendorsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  const activeVendors = (vendors?.suppliers || []).filter((v: any) => v.isActive).length;
  const totalCommunications = (communications || []).length;
  const pendingFollowUps = (communications || []).filter((c: any) => c.followUpRequired).length;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Vendor Management</h1>
          <p className="text-muted-foreground">Manage vendor relationships and communication history</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-vendor">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input id="name" placeholder="Company name..." data-testid="input-vendor-name" />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" placeholder="Contact person..." />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@vendor.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" placeholder="GST registration number" />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input id="panNumber" placeholder="PAN number" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Full address..." />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                  <Input id="paymentTerms" type="number" defaultValue="30" />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input id="creditLimit" type="number" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional notes..." />
                </div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsVendorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-save-vendor">
                    Add Vendor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCommunicationDialogOpen} onOpenChange={setIsCommunicationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-communication">
                <MessageSquare className="h-4 w-4 mr-2" />
                Log Communication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Communication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(vendors?.suppliers || []).map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="communicationType">Communication Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="quote_request">Quote Request</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Communication subject..." />
                </div>
                <div>
                  <Label htmlFor="commNotes">Notes</Label>
                  <Textarea id="commNotes" placeholder="Communication details..." />
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input id="scheduledDate" type="datetime-local" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="followUpRequired" />
                  <Label htmlFor="followUpRequired">Follow-up required</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCommunicationDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-save-communication">
                    Save Communication
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold text-foreground">{activeVendors}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Communications</p>
                <p className="text-2xl font-bold text-foreground">{totalCommunications}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-foreground">{pendingFollowUps}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendors">Vendor Directory</TabsTrigger>
          <TabsTrigger value="communications">Communication History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Vendor Directory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={vendors || []}
                columns={vendorColumns}
                searchable={true}
                searchKey="name"
                onEdit={(vendor) => {
                  setEditingVendor(vendor);
                  setIsVendorDialogOpen(true);
                }}
                onView={(vendor) => {
                  setSelectedVendor(vendor);
                }}
                onDelete={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Communication History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {communicationsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <DataTable
                  data={communications || []}
                  columns={communicationColumns}
                  searchable={true}
                  searchKey="subject"
                  onView={() => { }}
                  onEdit={() => { }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Vendor performance metrics and ratings will be displayed here.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Communication frequency and response time analytics.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}