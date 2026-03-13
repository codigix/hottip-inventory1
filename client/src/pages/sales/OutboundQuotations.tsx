import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation, Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Send,
  Download,
  Filter,
  Receipt,
  Trash2,
} from "lucide-react";
import {
  type Customer,
  type OutboundQuotation,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function OutboundQuotations() {
  const [, setLocation] = useLocation();
  const [selectedQuotation, setSelectedQuotation] =
    useState<OutboundQuotation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [filteredQuotations, setFilteredQuotations] = useState<
    OutboundQuotation[]
  >([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { toast } = useToast();

  const { data: quotations = [], isLoading } = useQuery<OutboundQuotation[]>({
    queryKey: ["/outbound-quotations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  // --- EXPORT FILTER SCHEMA ---
  const exportFilterSchema = z.object({
    customerId: z.string().optional(),
    status: z
      .enum(["draft", "sent", "pending", "approved", "rejected"])
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });

  const exportForm = useForm<z.infer<typeof exportFilterSchema>>({
    resolver: zodResolver(exportFilterSchema),
    defaultValues: {
      customerId: "",
      status: undefined,
      startDate: "",
      endDate: "",
    },
  });

  // --- MAIN TABLE FILTER STATE ---
  const [mainFilters, setMainFilters] = useState({
    customerId: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [displayedQuotations, setDisplayedQuotations] = useState<
    OutboundQuotation[]
  >([]);

  // Update displayed quotations when quotations data loads
  useEffect(() => {
    if (quotations) {
      setDisplayedQuotations(quotations);
    }
  }, [quotations]);

  // Apply main table filters
  const applyMainFilters = async () => {
    try {
      const params = new URLSearchParams();
      if (mainFilters.customerId)
        params.append("customerId", mainFilters.customerId);
      if (mainFilters.status) params.append("status", mainFilters.status);
      if (mainFilters.startDate)
        params.append("startDate", mainFilters.startDate);
      if (mainFilters.endDate) params.append("endDate", mainFilters.endDate);

      const queryString = params.toString();
      const url = queryString
        ? `/outbound-quotations?${queryString}`
        : "/outbound-quotations";

      const response = await apiRequest<OutboundQuotation[]>("GET", url);
      setDisplayedQuotations(response || []);

      toast({
        title: "Filters Applied",
        description: `Showing ${response?.length || 0} quotation(s)`,
      });
    } catch (error) {
      console.error("Error applying filters:", error);
      toast({
        title: "Error",
        description: "Failed to apply filters",
        variant: "destructive",
      });
    }
  };

  // Clear main filters
  const clearMainFilters = () => {
    setMainFilters({
      customerId: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setDisplayedQuotations(quotations || []);
    toast({
      title: "Filters Cleared",
      description: "Showing all quotations",
    });
  };

  // Handler for View action
  const handleViewQuotation = (quotation: OutboundQuotation) => {
    setSelectedQuotation(quotation);
    setIsViewDialogOpen(true);
  };

  // Handler for Edit action
  const handleEditQuotation = (quotation: OutboundQuotation) => {
    setLocation(`/sales/outbound-quotations/edit/${quotation.id}`);
  };

  // Handler for Send action
  const handleSendQuotation = async (quotation: OutboundQuotation) => {
    try {
      await apiRequest("PUT", `/outbound-quotations/${quotation.id}`, {
        status: "sent",
      });

      toast({
        title: "Success",
        description: "Quotation sent successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["/outbound-quotations"] });
    } catch (error: any) {
      console.error("Failed to send quotation:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to send quotation",
        variant: "destructive",
      });
    }
  };

  // Handler for Download PDF action
  const handleDownloadPDF = async (quotation: OutboundQuotation) => {
    try {
      const response = await apiRequest(
        "GET",
        `/outbound-quotations/${quotation.id}/pdf`,
        undefined,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Quotation_${quotation.quotationNumber}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Quotation PDF downloaded successfully",
      });
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download quotation PDF",
        variant: "destructive",
      });
    }
  };

  // Handler for Convert to Invoice action
  const handleConvertToInvoice = async (quotation: OutboundQuotation) => {
    try {
      const invoiceNumber = quotation.quotationNumber.replace(/^QUO/i, "INV");
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const subtotal = parseFloat(String(quotation.subtotalAmount || quotation.totalAmount || 0));
      const taxAmount = parseFloat(String(quotation.taxAmount || 0));
      const discount = parseFloat(String(quotation.discountAmount || 0));
      const total = parseFloat(String(quotation.totalAmount || subtotal + taxAmount - discount));

      const cgstRate = taxAmount > 0 ? 9 : 0;
      const sgstRate = taxAmount > 0 ? 9 : 0;
      const cgstAmount = taxAmount / 2;
      const sgstAmount = taxAmount / 2;

      const invoiceData = {
        invoiceNumber,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        userId: quotation.userId || "b34e3723-ba42-402d-b454-88cf96340573",
        status: "draft" as const,
        invoiceDate,
        dueDate,
        subtotalAmount: String(subtotal),
        cgstRate,
        cgstAmount: String(cgstAmount),
        sgstRate,
        sgstAmount: String(sgstAmount),
        igstRate: 0,
        igstAmount: "0",
        discountAmount: String(discount),
        totalAmount: String(total),
        balanceAmount: String(total),
      };

      await apiRequest("POST", "/invoices", invoiceData);

      toast({
        title: "Success",
        description: `Quotation converted to invoice ${invoiceNumber}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/outbound-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/invoices"] });
    } catch (error: any) {
      console.error("Failed to convert quotation to invoice:", error);
      toast({
        title: "Error",
        description:
          error?.data?.error || "Failed to convert quotation to invoice",
        variant: "destructive",
      });
    }
  };

  // Handler for Delete action
  const handleDeleteQuotation = async (quotation: OutboundQuotation) => {
    if (!window.confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}?\n\nThis will also delete all related sales orders and invoices.`)) {
      return;
    }

    try {
      await apiRequest("DELETE", `/outbound-quotations/${quotation.id}`);

      toast({
        title: "Success",
        description: "Quotation and related records deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["/outbound-quotations"] });
    } catch (error: any) {
      console.error("Failed to delete quotation:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to delete quotation",
        variant: "destructive",
      });
    }
  };

  // --- EXPORT ALL FUNCTIONALITY ---
  const handleExportAll = () => {
    setIsExportDialogOpen(true);
    exportForm.reset();
    setFilteredQuotations([]);
  };

  const handleExportFilterSubmit = async (
    data: z.infer<typeof exportFilterSchema>
  ) => {
    try {
      setIsPreviewLoading(true);
      const queryParams = new URLSearchParams();
      if (data.customerId) queryParams.append("customerId", data.customerId);
      if (data.status) queryParams.append("status", data.status);
      if (data.startDate) queryParams.append("startDate", data.startDate);
      if (data.endDate) queryParams.append("endDate", data.endDate);

      const url = `/outbound-quotations?${queryParams.toString()}`;
      const response = await apiRequest<OutboundQuotation[]>("GET", url);
      setFilteredQuotations(response || []);
    } catch (error) {
      console.error("Export filter error:", error);
      toast({
        title: "Error",
        description: "Failed to filter quotations for export",
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleExportAllSubmit = async () => {
    try {
      const csvData = [
        ["Quotation Number", "Client Name", "Date", "Status", "Subtotal", "Tax", "Discount", "Total Amount"],
        ...filteredQuotations.map((q) => [
          q.quotationNumber,
          q.customer?.name || "N/A",
          new Date(q.quotationDate).toLocaleDateString(),
          q.status,
          q.subtotalAmount,
          q.taxAmount,
          q.discountAmount,
          q.totalAmount,
        ]),
      ];

      const csvContent = csvData.map((e) => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Quotations_Export_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${filteredQuotations.length} quotations to CSV`,
      });
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export quotations",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      key: "quotationNumber",
      header: "Quotation #",
      cell: (quotation: any) => (
        <div className="font-light">{quotation.quotationNumber}</div>
      ),
    },
    {
      key: "customer",
      header: "Client",
      cell: (quotation: any) => (
        <div>
          <div className="font-light">{quotation.customer?.name || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            {quotation.customer?.email || ""}
          </div>
        </div>
      ),
    },
    {
      key: "quotationDate",
      header: "Date",
      cell: (quotation: any) =>
        new Date(quotation.quotationDate).toLocaleDateString(),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      cell: (quotation: any) => {
        let total = parseFloat(String(quotation.totalAmount)) || 0;
        if (total === 0 && quotation.subtotalAmount) {
          total = parseFloat(String(quotation.subtotalAmount)) || 0;
        }
        return `₹${total.toLocaleString("en-IN", { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (quotation: any) => {
        const statusColors = {
          draft: "bg-gray-100 text-gray-800",
          sent: "bg-blue-100 text-blue-800",
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={
              statusColors[quotation.status as keyof typeof statusColors] ||
              statusColors.draft
            }
          >
            {quotation.status?.toUpperCase() || "DRAFT"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (quotation: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewQuotation(quotation)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditQuotation(quotation)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendQuotation(quotation)}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadPDF(quotation)}
          >
            <Download className="h-4 w-4" />
          </Button>
          {quotation.status === "approved" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleConvertToInvoice(quotation)}
            >
              <Receipt className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteQuotation(quotation)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const exportPreviewColumns = [
    {
      key: "quotationNumber",
      header: "Quotation #",
      cell: (quotation: any) => (
        <div className="font-light">{quotation.quotationNumber}</div>
      ),
    },
    {
      key: "customer",
      header: "Client",
      cell: (quotation: any) => (
        <div className="font-light">{quotation.customer?.name || "N/A"}</div>
      ),
    },
    {
      key: "quotationDate",
      header: "Date",
      cell: (quotation: any) =>
        new Date(quotation.quotationDate).toLocaleDateString(),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      cell: (quotation: any) => {
        let total = parseFloat(String(quotation.totalAmount)) || 0;
        if (total === 0 && quotation.subtotalAmount) {
          total = parseFloat(String(quotation.subtotalAmount)) || 0;
        }
        return `₹${total.toLocaleString("en-IN", { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (quotation: any) => {
        const statusColors = {
          draft: "bg-gray-100 text-gray-800",
          sent: "bg-blue-100 text-blue-800",
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={
              statusColors[quotation.status as keyof typeof statusColors] ||
              statusColors.draft
            }
          >
            {quotation.status?.toUpperCase() || "DRAFT"}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Outbound Quotations
          </h1>
          <p className="text-muted-foreground">
            Manage quotations sent to clients with full PDF field support
          </p>
        </div>
        <Link href="/sales/outbound-quotations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Total Quotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quotations.filter((q) => q.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {quotations.filter((q) => q.status === "pending" || q.status === "sent").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {quotations.filter((q) => q.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter Quotations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Customer</label>
              <Select
                value={mainFilters.customerId}
                onValueChange={(v) =>
                  setMainFilters((prev) => ({ ...prev, customerId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Customers</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={mainFilters.status}
                onValueChange={(v) =>
                  setMainFilters((prev) => ({ ...prev, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">From Date</label>
              <Input
                type="date"
                value={mainFilters.startDate}
                onChange={(e) =>
                  setMainFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={mainFilters.endDate}
                  onChange={(e) =>
                    setMainFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
              <Button onClick={applyMainFilters} variant="secondary">
                Apply
              </Button>
              <Button onClick={clearMainFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quotation List</CardTitle>
            <CardDescription>
              Browse and manage your outbound quotations
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayedQuotations}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* View Quotation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold uppercase">
              Quotation Details
            </DialogTitle>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-6 p-6">
              {/* Company & Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6">
                <div>
                  <h3 className="font-bold text-xl text-primary mb-2">
                    {selectedQuotation.companyName || "CHENNUPATI PLASTICS"}
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedQuotation.companyAddress}
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    GSTIN: {selectedQuotation.companyGstin}
                  </p>
                  <p className="text-sm">Email: {selectedQuotation.companyEmail}</p>
                </div>

                <div className="md:text-right">
                  <h3 className="font-bold text-lg mb-1">Bill To:</h3>
                  <p className="font-semibold text-lg">
                    {selectedQuotation.customer?.name}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedQuotation.customer?.address}
                  </p>
                  <p className="text-sm mt-2">
                    GSTIN: {selectedQuotation.customer?.gstNumber || "N/A"}
                  </p>
                </div>
              </div>

              {/* Quotation Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground">Quotation #</p>
                  <p className="font-bold">{selectedQuotation.quotationNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-bold">
                    {new Date(selectedQuotation.quotationDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid Until</p>
                  <p className="font-bold">
                    {selectedQuotation.validUntil ? new Date(selectedQuotation.validUntil).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className="font-bold capitalize">
                    {selectedQuotation.status}
                  </Badge>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold uppercase">Description</th>
                      <th className="px-4 py-3 text-center font-bold uppercase w-24">Qty</th>
                      <th className="px-4 py-3 text-right font-bold uppercase w-32">Unit Price</th>
                      <th className="px-4 py-3 text-right font-bold uppercase w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedQuotation.quotationItems as any[])?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium">
                          {item.partDescription || item.partName || item.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-right">₹{parseFloat(String(item.unitPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right font-bold">₹{parseFloat(String(item.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end">
                <div className="w-full md:w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{parseFloat(String(selectedQuotation.subtotalAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({selectedQuotation.gstPercentage}%):</span>
                    <span className="font-medium">₹{parseFloat(String(selectedQuotation.taxAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {parseFloat(String(selectedQuotation.discountAmount)) > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Discount:</span>
                      <span>-₹{parseFloat(String(selectedQuotation.discountAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Grand Total:</span>
                    <span>₹{parseFloat(String(selectedQuotation.totalAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t text-sm">
                <div>
                  <h4 className="font-bold mb-2">Terms & Conditions</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Delivery: {selectedQuotation.deliveryTerms || "Ex-works"}</li>
                    <li>Payment: {selectedQuotation.paymentTerms || "As per agreement"}</li>
                    <li>Warranty: {selectedQuotation.warrantyTerms || "Standard"}</li>
                  </ul>
                </div>
                {selectedQuotation.notes && (
                  <div>
                    <h4 className="font-bold mb-2">Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedQuotation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export All Quotations</DialogTitle>
            <DialogDescription>
              Filter quotations and export them to a CSV file.
            </DialogDescription>
          </DialogHeader>

          <Form {...exportForm}>
            <form
              onSubmit={exportForm.handleSubmit(handleExportFilterSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={exportForm.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Clients" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Clients</SelectItem>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={exportForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Statuses</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={exportForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={exportForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={isPreviewLoading}>
                  {isPreviewLoading ? "Filtering..." : "Apply Filters"}
                </Button>
              </div>
            </form>
          </Form>

          {filteredQuotations.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Preview ({filteredQuotations.length} records)
              </h3>
              <div className="max-h-60 overflow-y-auto rounded-md border">
                <DataTable
                  data={filteredQuotations}
                  columns={exportPreviewColumns}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleExportAllSubmit}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
