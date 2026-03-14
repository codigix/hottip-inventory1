import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
  FileUp,
  Send,
  MoreHorizontal,
  PlusCircle,
  Calendar,
  X
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const summaryCards = [
  {
    title: "Total Quotations",
    status: "ALL",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Sent RFQ",
    status: "rfq",
    icon: Send,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Under Review",
    status: "under_review",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Received",
    status: "received",
    icon: FileUp,
    color: "text-blue-500",
    bg: "bg-blue-50/50",
  },
  {
    title: "Approved",
    status: "approved",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Rejected",
    status: "rejected",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  }
];

interface RFQItem {
  id: string;
  materialName: string;
  type: string;
  designQty: number;
  rate: number;
  amount: number;
}

export default function VendorQuotations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRFQDialogOpen, setIsRFQDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  
  // RFQ Form State
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([
    { id: Math.random().toString(36).substr(2, 9), materialName: "", type: "", designQty: 1, rate: 0, amount: 0 }
  ]);
  const [rfqVendor, setRfqVendor] = useState("");
  const [rfqProject, setRfqProject] = useState("");
  const [rfqValidUntil, setRfqValidUntil] = useState("");
  const [rfqNotes, setRfqNotes] = useState("");
  const [rfqAttachment, setRfqAttachment] = useState<File | null>(null);

  const createRFQMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/vendor-quotations", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "RFQ created and sent to vendor successfully.",
      });
      setIsRFQDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/vendor-quotations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create RFQ",
        variant: "destructive",
      });
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/vendor-quotations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Vendor quotation deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/vendor-quotations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRfqItems([{ id: Math.random().toString(36).substr(2, 9), materialName: "", type: "", designQty: 1, rate: 0, amount: 0 }]);
    setRfqVendor("");
    setRfqProject("");
    setRfqValidUntil("");
    setRfqNotes("");
    setRfqAttachment(null);
  };

  const { data: materialRequests = [] } = useQuery({
    queryKey: ["/material-requests"],
  });

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["/vendor-quotations"],
  });

  const { data: vendorsData = [] } = useQuery({
    queryKey: ["/suppliers"],
  });

  const vendors = Array.isArray(vendorsData) ? vendorsData : (vendorsData?.suppliers || []);

  const getVendorName = (vendorId: string | number) => {
    if (!vendorId) return "N/A";
    const vendor = vendors.find((v: any) => v.id === vendorId || v.id.toString() === vendorId.toString());
    return vendor?.name || `Vendor ID: ${vendorId}`;
  };

  const handleMRSelect = async (mrId: string) => {
    setRfqProject(mrId);
    if (!mrId || mrId === "none") return;

    try {
      const mr = await apiRequest("GET", `/material-requests/${mrId}`);
      if (mr && mr.items && mr.items.length > 0) {
        const mappedItems = mr.items.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          materialName: item.productName || item.sparePartName || item.notes || "Unknown Item",
          type: "Material",
          designQty: parseFloat(item.quantity) || 0,
          rate: 0,
          amount: 0
        }));
        setRfqItems(mappedItems);
        
        toast({
          title: "Requirements Loaded",
          description: `Loaded ${mappedItems.length} items from ${mr.requestNumber}`,
        });
      }
    } catch (error) {
      console.error("Error loading MR details:", error);
      toast({
        title: "Error",
        description: "Failed to load material request details",
        variant: "destructive",
      });
    }
  };

  const addRFQItem = () => {
    setRfqItems([...rfqItems, { 
      id: Math.random().toString(36).substr(2, 9), 
      materialName: "", 
      type: "", 
      designQty: 1,
      rate: 0,
      amount: 0
    }]);
  };

  const removeRFQItem = (id: string) => {
    if (rfqItems.length > 1) {
      setRfqItems(rfqItems.filter(item => item.id !== id));
    }
  };

  const updateRFQItem = (id: string, field: keyof RFQItem, value: any) => {
    setRfqItems(rfqItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "designQty" || field === "rate") {
          updatedItem.amount = (updatedItem.designQty || 0) * (updatedItem.rate || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleCreateRFQ = () => {
    if (!rfqVendor) {
      toast({ title: "Error", description: "Please select a vendor", variant: "destructive" });
      return;
    }

    if (rfqItems.length === 0 || !rfqItems[0].materialName) {
      toast({ title: "Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }

    const rfqData = {
      quotationNumber: `RFQ-${Math.floor(100000 + Math.random() * 900000)}`,
      quotationDate: new Date().toISOString(),
      validUntil: rfqValidUntil ? new Date(rfqValidUntil).toISOString() : null,
      subject: rfqProject ? `RFQ for Project/MR: ${rfqProject}` : "Request for Quotation",
      totalAmount: totalAmount.toString(),
      status: "rfq",
      notes: rfqNotes,
      senderId: rfqVendor,
      userId: user?.id || "00000000-0000-0000-0000-000000000001",
      quotationItems: rfqItems,
      financialBreakdown: {
        subtotal,
        gst,
        total: totalAmount
      }
    };

    createRFQMutation.mutate(rfqData);
  };

  const subtotal = rfqItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const gst = subtotal * 0.18;
  const totalAmount = subtotal + gst;

  const filteredQuotations = quotations.filter((q: any) => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCount = (status: string) => {
    if (status === "ALL") return quotations.length;
    return quotations.filter((q: any) => q.status === status).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-normal">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-600 border-red-100 font-normal">Rejected</Badge>;
      case "under_review":
        return <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-normal">Under Review</Badge>;
      case "rfq":
        return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-normal">Sent RFQ</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-600 border-red-100 font-normal">Rejected</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-normal">{status || "Received"}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vendor Quotations</h1>
          <p className="text-muted-foreground">
            Manage and review quotations received from suppliers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setIsRFQDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Request Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className="text-xs font-medium text-emerald-500">+0%</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{getStatusCount(card.status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by quotation number or subject..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-none h-11 shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="h-11 px-5 border-slate-200">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" className="h-11 px-5 border-slate-200">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="w-[180px] py-4 font-semibold text-slate-700">Quotation #</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Vendor</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Subject</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Amount</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">Date</TableHead>
                <TableHead className="text-right py-4 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                    Loading quotations...
                  </TableCell>
                </TableRow>
              ) : filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                    No vendor quotations found.
                  </TableCell>
                </TableRow>
              ) : filteredQuotations.map((q: any) => (
                <TableRow key={q.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-bold text-indigo-600 py-4">
                    {q.quotationNumber}
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-700">
                    {getVendorName(q.senderId)}
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 max-w-[200px] truncate">
                    {q.subject || "No Subject"}
                  </TableCell>
                  <TableCell className="py-4">
                    {getStatusBadge(q.status)}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-slate-900">
                    ₹{(parseFloat(q.totalAmount) || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4 text-slate-500">
                    {q.quotationDate ? format(new Date(q.quotationDate), "dd MMM yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => {
                          setSelectedQuotation(q);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this quotation?")) {
                            deleteQuotationMutation.mutate(q.id);
                          }
                        }}
                        disabled={deleteQuotationMutation.isPending}
                      >
                        {deleteQuotationMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isRFQDialogOpen} onOpenChange={setIsRFQDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl rounded-xl">
          <DialogHeader className="px-5 py-3 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0">
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-bold text-slate-800">Create Quote Request (RFQ)</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-500">
                Send a new request for quotation to a vendor
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsRFQDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Project/MR to Load Requirements</label>
                <Select value={rfqProject} onValueChange={handleMRSelect}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-indigo-500 text-sm">
                    <SelectValue placeholder="Select Material Request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No MR Selected</SelectItem>
                    {materialRequests.map((mr: any) => (
                      <SelectItem key={mr.id} value={mr.id}>{mr.requestNumber}</SelectItem>
                    ))}
                    {materialRequests.length === 0 && (
                      <SelectItem value="loading" disabled>No MRs found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Vendor *</label>
                <Select value={rfqVendor} onValueChange={setRfqVendor}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-indigo-500 text-sm">
                    <SelectValue placeholder="-- Select a Vendor --" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                    {vendors.length === 0 && (
                      <SelectItem value="none" disabled>No vendors found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Valid Until</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={rfqValidUntil}
                    onChange={(e) => setRfqValidUntil(e.target.value)}
                    className="h-9 border-slate-200 focus-visible:ring-indigo-500 pl-9 text-sm" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Design/Drawing Attachment</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type="file" 
                      id="rfq-attachment"
                      onChange={(e) => setRfqAttachment(e.target.files?.[0] || null)}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="rfq-attachment"
                      className="flex items-center justify-center h-9 border border-dashed border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <FileUp className="h-3.5 w-3.5 mr-2 text-slate-400" />
                      <span className="text-xs text-slate-500 truncate px-2">
                        {rfqAttachment ? rfqAttachment.name : "Click to upload design"}
                      </span>
                    </label>
                  </div>
                  {rfqAttachment && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:text-red-600"
                      onClick={() => setRfqAttachment(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Line Items</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-indigo-600 text-white hover:bg-indigo-700 border-none h-7 px-3 text-xs font-bold"
                  onClick={addRFQItem}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100 h-8">
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase h-8 py-0">Material Name</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase h-8 py-0">Type</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase h-8 py-0 text-center w-20">Qty</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase h-8 py-0 text-right w-24">Rate</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase h-8 py-0 text-right w-24">Amount</TableHead>
                      <TableHead className="h-8 py-0 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-transparent border-slate-50">
                        <TableCell className="py-2 px-3">
                          <Input 
                            placeholder="Material Name" 
                            value={item.materialName}
                            onChange={(e) => updateRFQItem(item.id, "materialName", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input 
                            placeholder="Type" 
                            value={item.type}
                            onChange={(e) => updateRFQItem(item.id, "type", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input 
                            type="number" 
                            value={item.designQty}
                            onChange={(e) => updateRFQItem(item.id, "designQty", parseFloat(e.target.value) || 0)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-center text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Input 
                            type="number" 
                            value={item.rate}
                            onChange={(e) => updateRFQItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-right text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right font-medium text-sm">
                          ₹{(item.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeRFQItem(item.id)}
                            disabled={rfqItems.length === 1}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-slate-700 font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">GST (18%)</span>
                    <span className="text-slate-700 font-bold">₹{gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-indigo-600 font-bold">Total Amount</span>
                    <span className="text-indigo-600 font-extrabold">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
              <Textarea 
                placeholder="Add any notes" 
                value={rfqNotes}
                onChange={(e) => setRfqNotes(e.target.value)}
                className="min-h-[80px] border-slate-200 focus-visible:ring-indigo-500 text-sm" 
              />
            </div>
          </div>

          <DialogFooter className="px-5 py-3 bg-slate-50 border-t flex flex-row justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsRFQDialogOpen(false)} className="border-slate-200 text-slate-600 px-4 h-9 text-sm">
              Cancel
            </Button>
            <Button onClick={handleCreateRFQ} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-9 text-sm font-bold">
              Create Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl">
          <DialogHeader className="px-6 py-4 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-800">Quotation Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Viewing details for {selectedQuotation?.quotationNumber}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setIsViewDialogOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quotation Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Number</p>
                    <p className="text-sm font-bold text-indigo-600">{selectedQuotation?.quotationNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Date</p>
                    <p className="text-sm font-medium">
                      {selectedQuotation?.quotationDate ? format(new Date(selectedQuotation.quotationDate), "dd MMM yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                    <div className="mt-1">{selectedQuotation && getStatusBadge(selectedQuotation.status)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Valid Until</p>
                    <p className="text-sm font-medium">
                      {selectedQuotation?.validUntil ? format(new Date(selectedQuotation.validUntil), "dd MMM yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Vendor Information</h3>
                <div className="bg-slate-50 p-4 rounded-lg h-[100px] flex flex-col justify-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Vendor Name</p>
                  <p className="text-lg font-bold text-slate-800">{getVendorName(selectedQuotation?.senderId)}</p>
                  <p className="text-xs text-slate-500 mt-1">ID: {selectedQuotation?.senderId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quotation Items</h3>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-bold py-3">Material Name</TableHead>
                      <TableHead className="text-xs font-bold py-3">Type</TableHead>
                      <TableHead className="text-xs font-bold py-3 text-center">Qty</TableHead>
                      <TableHead className="text-xs font-bold py-3 text-right">Rate</TableHead>
                      <TableHead className="text-xs font-bold py-3 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation?.quotationItems?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm py-3 font-medium">{item.materialName}</TableCell>
                        <TableCell className="text-sm py-3">{item.type}</TableCell>
                        <TableCell className="text-sm py-3 text-center">{item.designQty}</TableCell>
                        <TableCell className="text-sm py-3 text-right">₹{(item.rate || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm py-3 text-right font-bold">₹{(item.amount || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-72 space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-slate-700">₹{(selectedQuotation?.financialBreakdown?.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span>GST (18%)</span>
                  <span className="font-bold">₹{(selectedQuotation?.financialBreakdown?.gst || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-indigo-600 font-extrabold">Total Amount</span>
                  <span className="text-indigo-600 font-black text-xl">₹{(parseFloat(selectedQuotation?.totalAmount) || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedQuotation?.notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Notes</h3>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 italic">
                  "{selectedQuotation.notes}"
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex flex-row justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-slate-200">
              Close
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
