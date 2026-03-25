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
  X,
  Truck,
  LayoutGrid,
  TrendingUp,
  AlertCircle,
  FileSearch,
  ArrowRight,
  ClipboardCheck,
  Package
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function VendorQuotations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: quotationsResponse, isLoading: quotationsLoading } = useQuery({
    queryKey: ["/api/vendor-quotations"],
    queryFn: async () => apiRequest("GET", "/api/vendor-quotations"),
  });

  const { data: vendorsResponse } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => apiRequest("GET", "/api/suppliers"),
  });

  const quotations = Array.isArray(quotationsResponse?.data) ? quotationsResponse.data : (Array.isArray(quotationsResponse) ? quotationsResponse : []);
  const vendors = Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : (Array.isArray(vendorsResponse) ? vendorsResponse : []);

  const getVendorName = (vendorId: string | number) => {
    if (!vendorId) return "N/A";
    const vendor = vendors.find((v: any) => v.id === vendorId || v.id.toString() === vendorId.toString());
    return vendor?.name || `Vendor ID: ${vendorId}`;
  };

  const metrics = [
    { label: "Active RFQs", value: quotations.filter((q: any) => q.status === 'rfq').length, icon: Send, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Under Review", value: quotations.filter((q: any) => q.status === 'under_review').length, icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Approved Quotes", value: quotations.filter((q: any) => q.status === 'approved').length, icon: CheckCircle2, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Total Volume", value: quotations.length, icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  const columns = [
    {
      key: "quotationNumber",
      header: "Quotation Information",
      cell: (q: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className=" text-slate-900">{q.quotationNumber}</span>
            <span className="text-xs text-slate-500">{getVendorName(q.senderId)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (q: any) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize font-normal p-1",
            q.status === 'approved' && "bg-emerald-50 text-emerald-700 border-emerald-200",
            q.status === 'under_review' && "bg-amber-50 text-amber-700 border-amber-200",
            q.status === 'rfq' && "bg-blue-50 text-blue-700 border-blue-200",
            q.status === 'rejected' && "bg-red-50 text-red-700 border-red-200",
            !q.status && "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {q.status?.replace('_', ' ') || 'draft'}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Valuation",
      cell: (q: any) => (
        <div className="flex flex-col">
          <span className="text-xs  text-slate-900">₹{parseFloat(q.totalAmount || 0).toLocaleString()}</span>
          <span className="text-xs text-slate-400  ">Incl. GST</span>
        </div>
      ),
    },
    {
      key: "quotationDate",
      header: "Timeline",
      cell: (q: any) => (
        <div className="flex flex-col text-[11px]">
          <span className="text-slate-700 ">Issued: {q.quotationDate ? format(new Date(q.quotationDate), "dd MMM yyyy") : "N/A"}</span>
          <span className="text-slate-400">Valid: {q.validUntil ? format(new Date(q.validUntil), "dd MMM yyyy") : "Open"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (q: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => {
              setSelectedQuotation(q);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              if (window.confirm("Delete this quotation?")) deleteQuotationMutation.mutate(q.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {q.status === 'approved' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              title="Create PO"
              onClick={() => {
                localStorage.setItem("create_po_from_quote", q.id);
                setLocation("/inventory/vendor-po");
              }}
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const [isRFQDialogOpen, setIsRFQDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

  const deleteQuotationMutation = useMutation({
    mutationFn: async (id: string | number) => apiRequest("DELETE", `/api/vendor-quotations/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted", description: "Quotation deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-quotations"] });
    },
  });

  const [activeTab, setActiveTab] = useState("request");
  const [isReceivedQuoteDialogOpen, setIsReceivedQuoteDialogOpen] = useState(false);
  const [rfqVendor, setRfqVendor] = useState("");
  const [rfqItems, setRfqItems] = useState<any[]>([{ id: Math.random().toString(36).substr(2, 9), materialName: "", type: "", designQty: 1, rate: 0, amount: 0 }]);
  const [rfqValidUntil, setRfqValidUntil] = useState("");
  const [rfqProject, setRfqProject] = useState("");
  const [rfqNotes, setRfqNotes] = useState("");
  const [rfqAttachment, setRfqAttachment] = useState<any>(null);

  const { data: materialRequestsResponse } = useQuery({
    queryKey: ["/api/material-requests"],
    queryFn: async () => apiRequest("GET", "/api/material-requests"),
  });
  const materialRequests = Array.isArray(materialRequestsResponse?.data) ? materialRequestsResponse.data : (Array.isArray(materialRequestsResponse) ? materialRequestsResponse : []);

  const resetForm = () => {
    setRfqVendor("");
    setRfqItems([{ id: Math.random().toString(36).substr(2, 9), materialName: "", type: "", designQty: 1, rate: 0, amount: 0 }]);
    setRfqValidUntil("");
    setRfqProject("");
    setRfqNotes("");
    setRfqAttachment(null);
  };

  const createRFQMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/vendor-quotations", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Operation completed successfully." });
      setIsRFQDialogOpen(false);
      setIsReceivedQuoteDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-quotations"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Operation failed.", variant: "destructive" });
    },
  });

  const updateQuotationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string | number, status: string }) => 
      apiRequest("PATCH", `/api/vendor-quotations/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Status Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-quotations"] });
    },
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (quote: any) => {
      toast({ title: "Logistics module coming soon" });
    },
  });

  const subtotal = rfqItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const gst = subtotal * 0.18;
  const totalAmount = subtotal + gst;

  const isLoading = quotationsLoading;

  const summaryCards = [
    { title: "Active RFQs", status: "rfq", icon: Send },
    { title: "Under Review", status: "under_review", icon: Clock },
    { title: "Responded", status: "responded", icon: RefreshCw },
    { title: "Approved", status: "approved", icon: CheckCircle2 },
    { title: "Receive", status: "received", icon: FileUp },
    { title: "Total Volume", status: "ALL", icon: FileText },
  ];

  const rfqColumns = [
    {
      key: "quotationNumber",
      header: "RFQ #",
      cell: (q: any) => <span className=" text-slate-800">{q.quotationNumber}</span>
    },
    {
      key: "senderId",
      header: "Vendor",
      cell: (q: any) => <span>{getVendorName(q.senderId)}</span>
    },
    {
      key: "quotationDate",
      header: "Issued Date",
      cell: (q: any) => <span>{q.quotationDate ? format(new Date(q.quotationDate), "dd MMM yyyy") : "N/A"}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: (q: any) => getStatusBadge(q.status)
    },
    {
      key: "actions",
      header: "Actions",
      cell: (q: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" 
            title="Log Received Quote"
            onClick={() => handleLogReceivedQuote(q)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewDetails(q)}>
            <Eye className="h-4 w-4 text-slate-400" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            title="Download RFQ PDF"
            onClick={() => window.open(`/api/vendor-quotations/${q.id}/pdf`, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(q.id)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      )
    }
  ];

  type RFQItem = {
    id: string;
    materialName: string;
    type: string;
    designQty: number;
    rate: number;
    amount: number;
  };

  const analysisColumns = [
    {
      key: "quotationNumber",
      header: "Ref #",
      sortable: true,
      cell: (q: any) => (
        <div className=" text-slate-800">{q.quotationNumber}</div>
      ),
    },
    {
      key: "senderId",
      header: "Vendor",
      sortable: true,
      cell: (q: any) => (
        <div className="text-slate-600">{getVendorName(q.senderId)}</div>
      ),
    },
    {
      key: "totalAmount",
      header: "Quote Amount",
      sortable: true,
      cell: (q: any) => (
        <div className=" text-slate-800 text-xs">
          ₹{parseFloat(q.totalAmount || 0).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (q: any) => {
        const statusColors: Record<string, string> = {
          received: "bg-blue-50 text-blue-700 border-blue-100",
          approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
          rejected: "bg-red-50 text-red-700 border-red-100",
        };
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs   py-0 h-5 shadow-none",
              statusColors[q.status] || "bg-slate-100 text-slate-600"
            )}
          >
            {q.status === 'received' ? 'receive' : q.status}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (q: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            title="Download PDF"
            onClick={() => window.open(`/api/vendor-quotations/${q.id}/pdf`, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => handleViewDetails(q)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {q.status === "received" && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs    border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                onClick={() => updateQuotationStatusMutation.mutate({ id: q.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs    border-red-100 text-red-700 hover:bg-red-50"
                onClick={() => updateQuotationStatusMutation.mutate({ id: q.id, status: "rejected" })}
              >
                Reject
              </Button>
            </>
          )}
          {q.status === "approved" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs border-blue-100 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                localStorage.setItem("create_po_from_quote", q.id);
                setLocation("/inventory/vendor-po");
              }}
            >
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Create PO
            </Button>
          )}
        </div>
      ),
    },
  ];

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

  const handleCreateReceivedQuote = () => {
    if (!rfqVendor) {
      toast({ title: "Error", description: "Please select a vendor", variant: "destructive" });
      return;
    }

    if (rfqItems.length === 0 || !rfqItems[0].materialName) {
      toast({ title: "Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }

    const quoteData = {
      quotationNumber: `QUO-${Math.floor(100000 + Math.random() * 900000)}`,
      quotationDate: new Date().toISOString(),
      validUntil: rfqValidUntil ? new Date(rfqValidUntil).toISOString() : null,
      subject: rfqProject ? `Quote for Project/MR: ${rfqProject}` : "Received Quotation",
      totalAmount: totalAmount.toString(),
      status: "received",
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

    createRFQMutation.mutate(quoteData);
  };

  const getStatusCount = (status: string) => {
    if (status === "ALL") return quotations.length;
    return quotations.filter((q: any) => q.status === status).length;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      rfq: "bg-slate-100 text-slate-600",
      responded: "bg-blue-50 text-blue-700 border-blue-100",
      under_review: "bg-amber-50 text-amber-700 border-amber-100",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-red-50 text-red-700 border-red-100",
      received: "bg-blue-50 text-blue-700 border-blue-100",
    };
    
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs   py-0 h-5 shadow-none",
          statusColors[status] || "bg-slate-100 text-slate-600"
        )}
      >
        {status === 'received' ? 'receive' : (status?.replace("_", " ") || "RECEIVED")}
      </Badge>
    );
  };

  const rfqQuotations = (quotations || []).filter((q: any) => q.status === "rfq" || q.status === "responded");
  const analysisQuotations = (quotations || []).filter((q: any) => q.status === "received" || q.status === "approved" || q.status === "rejected");

  function handleViewDetails(q: any) {
    setSelectedQuotation(q);
    setIsViewDialogOpen(true);
  }

  function handleDelete(id: any) {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      deleteQuotationMutation.mutate(id);
    }
  }

  const handleLogReceivedQuote = (q: any) => {
    resetForm();
    setRfqVendor(q.senderId);
    if (q.quotationItems && Array.isArray(q.quotationItems)) {
      setRfqItems(q.quotationItems.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        rate: item.rate || 0,
        amount: item.amount || 0
      })));
    }
    setRfqProject(q.quotationNumber);
    setIsReceivedQuoteDialogOpen(true);
  };

  return (
    <div className="p-2 space-y-3 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl  text-slate-800">Vendor Quotations</h1>
          <p className="text-xs text-slate-500">
            Request, compare and manage quotations from vendors and suppliers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 bg-white">
            <RefreshCw className="h-4 w-4 mr-2 text-slate-400" />
            Sync
          </Button>
          <Button 
            className="bg-primary hover:bg-primary text-white h-9 shadow-sm border-none"
            onClick={() => {
              resetForm();
              setIsRFQDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create RFQ
          </Button>
          <Button 
            variant="outline"
            className="h-9 border-slate-200 text-slate-600 bg-white"
            onClick={() => {
              resetForm();
              setIsReceivedQuoteDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 text-slate-400" /> Add Received Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm bg-white">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded bg-slate-50")}>
                  <card.icon className={cn("h-4 w-4 text-slate-400")} />
                </div>
                <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-xs  border-none">
                  +0%
                </Badge>
              </div>
              <p className="text-xs    text-slate-400 mb-1">{card.title}</p>
              <p className="text-xl  text-slate-800">{getStatusCount(card.status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="bg-white border border-slate-200 p-1 h-11 shadow-sm inline-flex w-auto">
          <TabsTrigger 
            value="request" 
            className="px-6 h-9 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none transition-all text-slate-600 text-xs   "
          >
            <Send className="h-4 w-4 mr-2" />
            RFQ Registry
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            className="px-6 h-9 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none transition-all text-slate-600 text-xs   "
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Quote Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-4 animate-in fade-in duration-300 outline-none">
          <div className="">
            <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm  text-slate-700">Request for Quotation Registry</h2>
                <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 text-xs ">
                  {rfqQuotations.length}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <DataTable
                data={rfqQuotations}
                columns={rfqColumns}
                isLoading={isLoading}
                searchable={true}
                searchKey="quotationNumber"
                searchPlaceholder="Search RFQs..."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4 animate-in fade-in duration-300 outline-none">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <LayoutGrid className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm  text-slate-700">Received Quotation Analysis</h2>
                <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 text-xs ">
                  {analysisQuotations.length}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <DataTable
                data={analysisQuotations}
                columns={analysisColumns}
                isLoading={isLoading}
                searchable={true}
                searchKey="quotationNumber"
                searchPlaceholder="Search Received Quotes..."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Received Quote Dialog */}
      <Dialog open={isReceivedQuoteDialogOpen} onOpenChange={setIsReceivedQuoteDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl flex flex-col max-h-[95vh]">
          <DialogHeader className="px-5 py-3 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="space-y-0.5">
              <DialogTitle className="text-base  text-slate-800">Add Received Quotation</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Log a quotation received from a vendor
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="p-4 space-y-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs  text-slate-700">MR to Load Requirements</label>
                <Select value={rfqProject} onValueChange={handleMRSelect}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-indigo-500 text-xs">
                    <SelectValue placeholder="Select Material Request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No MR Selected</SelectItem>
                    {materialRequests.map((mr: any) => (
                      <SelectItem key={mr.id} value={mr.id}>{mr.requestNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">Vendor *</label>
                <Select value={rfqVendor} onValueChange={setRfqVendor}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-indigo-500 text-xs">
                    <SelectValue placeholder="-- Select a Vendor --" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">Valid Until</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={rfqValidUntil}
                    onChange={(e) => setRfqValidUntil(e.target.value)}
                    className="h-9 border-slate-200 focus-visible:ring-indigo-500 pl-9 text-xs" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">Attachment</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type="file" 
                      id="received-quote-attachment"
                      onChange={(e) => setRfqAttachment(e.target.files?.[0] || null)}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="received-quote-attachment"
                      className="flex items-center justify-center h-9 border border-dashed border-slate-300 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <FileUp className="h-3.5 w-3.5 mr-2 text-slate-400" />
                      <span className="text-xs text-slate-500 truncate px-2">
                        {rfqAttachment ? rfqAttachment.name : "Click to upload quotation file"}
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
                <h3 className="text-[11px]  text-slate-400  ">Line Items</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-primary text-white hover:bg-primary border-none h-7 px-3 text-xs"
                  onClick={addRFQItem}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="border rounded overflow-hidden border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100 h-8">
                      <TableHead className="text-xs  text-slate-400  h-8 py-0">Material Name</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0">Type</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-center w-16">Qty</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-right w-24">Rate</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-right w-24">Amount</TableHead>
                      <TableHead className="h-8 py-0 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-transparent border-slate-50">
                        <TableCell className="p-2">
                          <Input 
                            placeholder="Material Name" 
                            value={item.materialName}
                            onChange={(e) => updateRFQItem(item.id, "materialName", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            placeholder="Type" 
                            value={item.type}
                            onChange={(e) => updateRFQItem(item.id, "type", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number" 
                            value={item.designQty}
                            onChange={(e) => updateRFQItem(item.id, "designQty", parseFloat(e.target.value) || 0)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-center text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number" 
                            value={item.rate}
                            onChange={(e) => updateRFQItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-right text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right  text-sm">
                          ₹{(item.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="p-2 text-right">
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
                    <span className="text-slate-500 ">Subtotal</span>
                    <span className="text-slate-700 ">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 ">GST (18%)</span>
                    <span className="text-slate-700 ">₹{gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-slate-800 text-sm">Total Amount</span>
                    <span className="text-slate-800 ">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs  text-slate-700">Notes (Optional)</label>
              <Textarea 
                placeholder="Add any notes" 
                value={rfqNotes}
                onChange={(e) => setRfqNotes(e.target.value)}
                className="min-h-[80px] border-slate-200 focus-visible:ring-indigo-500 text-sm" 
              />
            </div>
          </div>

          <DialogFooter className="px-5 py-3 bg-slate-50 border-t flex flex-row justify-end space-x-2 shrink-0">
            <Button variant="outline" onClick={() => setIsReceivedQuoteDialogOpen(false)} className="border-slate-200 text-slate-600 px-4 h-9 text-sm">
              Cancel
            </Button>
            <Button onClick={handleCreateReceivedQuote} className="bg-primary hover:bg-primary text-white px-6 h-9 text-sm  shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Received Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RFQ Dialog */}
      <Dialog open={isRFQDialogOpen} onOpenChange={setIsRFQDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none  rounded-xl flex flex-col max-h-[95vh]">
          <DialogHeader className="p-4 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="space-y-0.5">
              <DialogTitle className="text-base  text-slate-800">Create Quote Request (RFQ)</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Send a new request for quotation to a vendor
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="p-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">MR to Load Requirements</label>
                <Select value={rfqProject} onValueChange={handleMRSelect}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-indigo-500 text-xs">
                    <SelectValue placeholder="Select Material Request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No MR Selected</SelectItem>
                    {materialRequests.map((mr: any) => (
                      <SelectItem key={mr.id} value={mr.id}>{mr.requestNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">Vendor *</label>
                <Select value={rfqVendor} onValueChange={setRfqVendor}>
                  <SelectTrigger className="h-9 border-slate-200 focus:ring-indigo-500 text-xs">
                    <SelectValue placeholder="-- Select a Vendor --" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">Valid Until</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={rfqValidUntil}
                    onChange={(e) => setRfqValidUntil(e.target.value)}
                    className="h-9 border-slate-200 focus-visible:ring-indigo-500 pl-9 text-xs" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-slate-700">Design/Drawing Attachment</label>
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
                      className="flex items-center justify-center h-9 border border-dashed border-slate-300 rounded hover:bg-slate-50 cursor-pointer transition-colors"
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
                <h3 className="text-sm ">Requested Items</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-primary text-white hover:bg-primary border-none h-7 px-3 text-xs"
                  onClick={addRFQItem}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="border rounded overflow-hidden border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100 h-8">
                      <TableHead className="text-xs  text-slate-400  h-8 py-0">Material Name</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0">Type</TableHead>
                      <TableHead className="text-xs  text-slate-400  h-8 py-0 text-center w-16">Qty</TableHead>
                      <TableHead className="h-8 py-0 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-transparent border-slate-50">
                        <TableCell className="p-2">
                          <Input 
                            placeholder="Material Name" 
                            value={item.materialName}
                            onChange={(e) => updateRFQItem(item.id, "materialName", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            placeholder="Type" 
                            value={item.type}
                            onChange={(e) => updateRFQItem(item.id, "type", e.target.value)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-sm shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number" 
                            value={item.designQty}
                            onChange={(e) => updateRFQItem(item.id, "designQty", parseFloat(e.target.value) || 0)}
                            className="h-8 border-slate-200 focus-visible:ring-indigo-500 text-center text-sm px-1 shadow-none" 
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right">
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs  text-slate-700">Instructions for Vendor</label>
              <Textarea 
                placeholder="Add special instructions or notes" 
                value={rfqNotes}
                onChange={(e) => setRfqNotes(e.target.value)}
                className="min-h-[80px] border-slate-200 focus-visible:ring-indigo-500 text-sm" 
              />
            </div>
          </div>

          <DialogFooter className="px-5 py-3 bg-slate-50 border-t flex flex-row justify-end space-x-2 shrink-0">
            <Button variant="outline" onClick={() => setIsRFQDialogOpen(false)} className="border-slate-200 text-slate-600 p-2 text-xs">
              Cancel
            </Button>
            <Button onClick={handleCreateRFQ} className="bg-primary hover:bg-primary text-white p-2 text-xs">
              Send RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl flex flex-col max-h-[95vh]">
          <DialogHeader className="px-6 py-4 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl  text-slate-800">Quotation Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Viewing details for {selectedQuotation?.quotationNumber}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded" onClick={() => setIsViewDialogOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="p-6 space-y-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-sm  text-slate-400  tracking-widest">Quotation Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Number</p>
                    <p className="text-sm  text-slate-800">{selectedQuotation?.quotationNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Date</p>
                    <p className="text-sm  text-slate-700">
                      {selectedQuotation?.quotationDate ? format(new Date(selectedQuotation.quotationDate), "dd MMM yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Status</p>
                    <div className="mt-1">{selectedQuotation && getStatusBadge(selectedQuotation.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500   tracking-tighter">Valid Until</p>
                    <p className="text-sm  text-slate-700">
                      {selectedQuotation?.validUntil ? format(new Date(selectedQuotation.validUntil), "dd MMM yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm  text-slate-400  tracking-widest">Vendor Information</h3>
                <div className="bg-slate-50 p-4 rounded border border-slate-100 h-[100px] flex flex-col justify-center">
                  <p className="text-xs text-slate-500   tracking-tighter">Vendor Name</p>
                  <p className="text-lg  text-slate-800">{getVendorName(selectedQuotation?.senderId)}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono ">ID: {selectedQuotation?.senderId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm  text-slate-400  tracking-widest">Quotation Items</h3>
              <div className="border rounded-xl overflow-hidden border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-200">
                      <TableHead className="text-xs  text-slate-600  py-3">Material Name</TableHead>
                      <TableHead className="text-xs  text-slate-600  py-3">Type</TableHead>
                      <TableHead className="text-xs  text-slate-600  py-3 text-center">Qty</TableHead>
                      {selectedQuotation?.status !== 'rfq' && (
                        <>
                          <TableHead className="text-xs  text-slate-600  py-3 text-right">Rate</TableHead>
                          <TableHead className="text-xs  text-slate-600  py-3 text-right">Amount</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation?.quotationItems?.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="text-sm  text-slate-800 py-3">{item.materialName}</TableCell>
                        <TableCell className="text-sm text-slate-600 py-3">{item.type}</TableCell>
                        <TableCell className="text-sm font-mono text-center py-3">{item.designQty}</TableCell>
                        {selectedQuotation?.status !== 'rfq' && (
                          <>
                            <TableCell className="text-sm font-mono text-right py-3 text-slate-600">₹{(item.rate || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm  text-right py-3 text-slate-900 bg-slate-50/30">₹{(item.amount || 0).toLocaleString()}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {selectedQuotation?.status !== 'rfq' && (
              <div className="flex justify-end">
                <div className="w-72 space-y-3 bg-primary text-white p-5 rounded-xl border border-slate-800 shadow-xl">
                  <div className="flex justify-between items-center text-sm opacity-70">
                    <span className=" tracking-widest text-xs">Subtotal</span>
                    <span className="font-mono">₹{(selectedQuotation?.financialBreakdown?.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-70">
                    <span className=" tracking-widest text-xs">GST (18%)</span>
                    <span className="font-mono">₹{(selectedQuotation?.financialBreakdown?.gst || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="  tracking-widest text-xs">Total Amount</span>
                    <span className=" text-xl">₹{(parseFloat(selectedQuotation?.totalAmount) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedQuotation?.notes && (
              <div className="space-y-2">
                <h3 className="text-sm  text-slate-400  tracking-widest">Internal Notes</h3>
                <div className="bg-slate-50 p-4 rounded text-sm text-slate-600 border border-slate-100 italic">
                  "{selectedQuotation.notes}"
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex flex-row justify-end space-x-3 shrink-0">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-slate-200 text-slate-600   text-xs tracking-widest">
              Close
            </Button>
            <Button className="bg-primary hover:bg-primary text-white px-6   text-xs tracking-widest shadow-sm">
              <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
