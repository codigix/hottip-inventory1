import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  Briefcase,
  History,
  BarChart3,
  RefreshCw,
  MoreHorizontal,
  FileText,
  MapPin,
  ShieldCheck,
  CreditCard,
  LayoutGrid,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorManagement() {
  const { toast } = useToast();
  
  // Communication form state
  const [commVendorId, setCommVendorId] = useState("");
  const [commType, setCommType] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commNotes, setCommNotes] = useState("");
  const [commDate, setCommDate] = useState("");
  const [commFollowUp, setCommFollowUp] = useState(false);
  const [isSavingComm, setIsSavingComm] = useState(false);

  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isCommunicationDialogOpen, setIsCommunicationDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [editingVendor, setEditingVendor] = useState<any>(null);

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
    setVendorName(''); setVendorContactPerson(''); setVendorEmail(''); setVendorPhone('');
    setVendorGstNumber(''); setVendorPanNumber(''); setVendorAddress('');
    setVendorPaymentTerms('30'); setVendorCreditLimit(''); setVendorNotes('');
    setVendorIsActive(true); setEditingVendor(null);
  };

  // Vendor mutations
  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/suppliers', data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor created' });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setIsVendorDialogOpen(false); resetVendorForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message || 'Failed to create vendor', variant: 'destructive' })
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('PUT', `/api/suppliers/${data.id}`, data.patch),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setIsVendorDialogOpen(false); resetVendorForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message || 'Failed to update vendor', variant: 'destructive' })
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: any) => apiRequest('DELETE', `/api/suppliers/${id}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vendor deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
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
      contactPerson: vendorContactPerson.trim(),
      contactEmail: vendorEmail.trim() || null,
      contactPhone: vendorPhone.trim() || null,
      gstNumber: vendorGstNumber.trim(),
      panNumber: vendorPanNumber.trim(),
      address: vendorAddress.trim(),
      paymentTerms: parseInt(vendorPaymentTerms),
      creditLimit: vendorCreditLimit ? parseFloat(vendorCreditLimit) : 0,
      notes: vendorNotes,
      isActive: vendorIsActive
    };
    if (editingVendor) {
      updateVendorMutation.mutate({ id: editingVendor.id, patch: payload });
    } else {
      createVendorMutation.mutate(payload);
    }
  };

  const { data: vendorsResponse, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => apiRequest("GET", "/api/suppliers"),
  });

  const { data: communicationsResponse, isLoading: communicationsLoading } = useQuery({
    queryKey: ["/api/vendor-communications"],
    queryFn: async () => apiRequest("GET", "/api/vendor-communications"),
  });

  const vendors = Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : (Array.isArray(vendorsResponse) ? vendorsResponse : []);
  const communications = Array.isArray(communicationsResponse?.data) ? communicationsResponse.data : (Array.isArray(communicationsResponse) ? communicationsResponse : []);

  const metrics = [
    { label: "Active Vendors", value: vendors.filter((v: any) => v.isActive !== false).length, icon: Building2, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Pending Tasks", value: communications.filter((c: any) => c.followUpRequired).length, icon: MessageSquare, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Recent Comms", value: communications.length, icon: History, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Active Terms", value: vendors.filter((v: any) => v.paymentTerms).length, icon: CreditCard, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  const vendorColumns = [
    {
      key: "name",
      header: "Vendor Profile",
      cell: (vendor: any) => (
        <div className="flex items-center gap-3">
          {/* <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <Building2 className="h-4 w-4 text-slate-400" />
          </div> */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-900">{vendor.name}</span>
            <span className="text-xs text-slate-500 uppercase tracking-tight">{vendor.contactPerson || 'No Contact Person'}</span>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Channels",
      cell: (vendor: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Mail className="h-3 w-3 text-slate-400" />
            <span>{vendor.contactEmail || vendor.email || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{vendor.contactPhone || vendor.phone || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      key: "compliance",
      header: "Tax ID",
      cell: (vendor: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">GSTIN</span>
          <span className="font-mono text-[11px] text-slate-600">{vendor.gstNumber || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: "paymentTerms",
      header: "Terms",
      cell: (vendor: any) => (
        <Badge variant="outline" className="font-medium text-xs bg-slate-50 text-slate-600 border-slate-200">
          {vendor.paymentTerms ?? '30'} DAYS
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (vendor: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal p-1",
            vendor.isActive !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {vendor.isActive !== false ? "Active" : "Archived"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (vendor: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => {
              setEditingVendor(vendor);
              setVendorName(vendor.name || ''); setVendorEmail(vendor.contactEmail || vendor.email || '');
              setVendorPhone(vendor.contactPhone || vendor.phone || ''); setVendorContactPerson(vendor.contactPerson || '');
              setVendorGstNumber(vendor.gstNumber || ''); setVendorPanNumber(vendor.panNumber || '');
              setVendorAddress(vendor.address || ''); setVendorPaymentTerms(String(vendor.paymentTerms ?? '30'));
              setVendorCreditLimit(String(vendor.creditLimit ?? '')); setVendorNotes(vendor.notes || '');
              setVendorIsActive(vendor.isActive !== false); setIsVendorDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              if (window.confirm('Delete this vendor profile?')) deleteVendorMutation.mutate(vendor.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Vendor Management</h1>
          <p className="text-xs text-slate-500">Maintain long-term relationships and compliance records for your supplier network.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50 " onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] })}>
            <RefreshCw className="h-4 w-4 mr-2 text-slate-400" />
            Sync Registry
          </Button>
          <Button className="bg-primary hover:bg-primary text-white shadow-sm " onClick={() => { resetVendorForm(); setIsVendorDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Vendor
          </Button>
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

      <div className="">
        <div className="">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium text-slate-800 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-slate-400" />
              Vendor Registry
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 border-none">
              {vendors.length} Total Vendors
            </Badge>
          </div>
        </div>
        <div className="p-0 mt-4">
          <DataTable
            data={vendors}
            columns={vendorColumns}
            loading={vendorsLoading}
            searchPlaceholder="Search vendor name or contact..."
          />
        </div>
      </div>

      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent className="max-w-2xl border-none shadow-2xl max-h-[75vh] overflow-scroll">
          <DialogHeader>
            <DialogTitle className="text-xl  text-slate-900">{editingVendor ? 'Edit Vendor Profile' : 'New Vendor Registration'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Company Name *</Label>
              <Input value={vendorName} onChange={e => setVendorName(e.target.value)} className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Primary Contact</Label>
              <Input value={vendorContactPerson} onChange={e => setVendorContactPerson(e.target.value)} className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Business Email</Label>
              <Input value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Contact Number</Label>
              <Input value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">GSTIN</Label>
              <Input value={vendorGstNumber} onChange={e => setVendorGstNumber(e.target.value)} className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">PAN Number</Label>
              <Input value={vendorPanNumber} onChange={e => setVendorPanNumber(e.target.value)} className="border-slate-200" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-slate-700">Registered Address</Label>
              <Textarea value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} className="border-slate-200 min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Payment Terms (Days)</Label>
              <Select value={vendorPaymentTerms} onValueChange={setVendorPaymentTerms}>
                <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immediate / Cash</SelectItem>
                  <SelectItem value="15">Net 15</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="45">Net 45</SelectItem>
                  <SelectItem value="60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
            <Button variant="ghost" onClick={() => setIsVendorDialogOpen(false)} className="text-slate-600">Cancel</Button>
            <Button onClick={handleSaveVendor} className="bg-primary hover:bg-primary text-white px-8">
              {editingVendor ? 'Update Profile' : 'Save Vendor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
