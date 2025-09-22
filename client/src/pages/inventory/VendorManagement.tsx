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

  // Vendor form state
  const [vendorName, setVendorName] = useState('');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorGstNumber, setVendorGstNumber] = useState('');
  const [vendorPanNumber, setVendorPanNumber] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorPaymentTerms, setVendorPaymentTerms] = useState('30');
  const [vendorCreditLimit, setVendorCreditLimit] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const [vendorIsActive, setVendorIsActive] = useState(true);

  const resetVendorForm = () => {
    setVendorName('');
    setVendorContactPerson('');
    setVendorEmail('');
    setVendorPhone('');
    setVendorGstNumber('');
    setVendorPanNumber('');
    setVendorAddress('');
    setVendorPaymentTerms('30');
    setVendorCreditLimit('');
    setVendorNotes('');
    setVendorIsActive(true);
    setEditingVendor(null);
  };

  // Vendor mutations (CRUD)
  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/suppliers', data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor created' });
      queryClient.invalidateQueries({ queryKey: ['/suppliers'] });
      setIsVendorDialogOpen(false);
      resetVendorForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message || 'Failed to create vendor', variant: 'destructive' })
  });
  const updateVendorMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('PUT', `/suppliers/${data.id}`, data.patch),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor updated' });
      queryClient.invalidateQueries({ queryKey: ['/suppliers'] });
      setIsVendorDialogOpen(false);
      resetVendorForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message || 'Failed to update vendor', variant: 'destructive' })
  });
  const deleteVendorMutation = useMutation({
    mutationFn: async (id: any) => apiRequest('DELETE', `/suppliers/${id}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor deleted' });
      queryClient.invalidateQueries({ queryKey: ['/suppliers'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message || 'Failed to delete vendor', variant: 'destructive' })
  });

  const handleSaveVendor = () => {
    if (!vendorName.trim()) {
      toast({ title: 'Error', description: 'Vendor name is required', variant: 'destructive' });
      return;
    }
    const payload = {
      name: vendorName.trim(),
      contactEmail: vendorEmail.trim() || null,
      contactPhone: vendorPhone.trim() || null,
    };
    if (editingVendor) {
      updateVendorMutation.mutate({ id: editingVendor.id, patch: payload });
    } else {
      createVendorMutation.mutate(payload);
    }
  };

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
      cell: (vendor: any) => {
        const email = vendor.email || vendor.contactEmail;
        const phone = vendor.phone || vendor.contactPhone;
        return (
          <div>
            {email && (
              <div className="flex items-center space-x-1 text-sm">
                <Mail className="h-3 w-3" />
                <span>{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "gstNumber",
      header: "GST Number",
    },
    {
      key: "paymentTerms",
      header: "Payment Terms",
      cell: (vendor: any) => (vendor.paymentTerms != null ? `${vendor.paymentTerms} days` : '-'),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (vendor: any) => {
        const isActive = vendor.isActive !== false; // default to active when undefined
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
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

  const vendorsArray = Array.isArray(vendors) ? vendors : (vendors?.suppliers || []);
  const activeVendors = (vendorsArray || []).filter((v: any) => v.isActive !== false).length;
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
                  <Input id="name" placeholder="Company name..." data-testid="input-vendor-name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" placeholder="Contact person..." value={vendorContactPerson} onChange={(e) => setVendorContactPerson(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@vendor.com" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" placeholder="GST registration number" value={vendorGstNumber} onChange={(e) => setVendorGstNumber(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input id="panNumber" placeholder="PAN number" value={vendorPanNumber} onChange={(e) => setVendorPanNumber(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Full address..." value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                  <Input id="paymentTerms" type="number" value={vendorPaymentTerms} onChange={(e) => setVendorPaymentTerms(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input id="creditLimit" type="number" placeholder="0" value={vendorCreditLimit} onChange={(e) => setVendorCreditLimit(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional notes..." value={vendorNotes} onChange={(e) => setVendorNotes(e.target.value)} />
                </div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsVendorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-save-vendor" onClick={handleSaveVendor} disabled={createVendorMutation.isPending || updateVendorMutation.isPending}>
                    {editingVendor ? (updateVendorMutation.isPending ? 'Saving...' : 'Save Changes') : (createVendorMutation.isPending ? 'Adding...' : 'Add Vendor')}
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
                data={vendorsArray}
                columns={vendorColumns}
                searchable={true}
                searchKey="name"
                onEdit={(vendor) => {
                  setEditingVendor(vendor);
                  setVendorName(vendor.name || '');
                  setVendorEmail(vendor.contactEmail || vendor.email || '');
                  setVendorPhone(vendor.contactPhone || vendor.phone || '');
                  setVendorContactPerson(vendor.contactPerson || '');
                  setVendorGstNumber(vendor.gstNumber || '');
                  setVendorPanNumber(vendor.panNumber || '');
                  setVendorAddress(vendor.address || '');
                  setVendorPaymentTerms(String(vendor.paymentTerms ?? '30'));
                  setVendorCreditLimit(String(vendor.creditLimit ?? ''));
                  setVendorNotes(vendor.notes || '');
                  setVendorIsActive(vendor.isActive !== false);
                  setIsVendorDialogOpen(true);
                }}
                onView={(vendor) => {
                  setSelectedVendor(vendor);
                }}
                onDelete={(vendor) => {
                  if (!vendor?.id) return;
                  deleteVendorMutation.mutate(vendor.id);
                }}
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