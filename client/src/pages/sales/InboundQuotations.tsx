import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploader } from "@/components/FileUploader";
import {
  Plus,
  FileDown,
  Eye,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  LayoutGrid,
  Trash2,
} from "lucide-react";
import { insertInboundQuotationSchema, type Supplier, type OutboundQuotation, type Customer } from "@shared/schema"; // Import Customer and Supplier type
import { z } from "zod";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  ""
);
const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api(?:\/)?$/, "") ||
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  "";

const normalizeAttachmentPath = (path: string | null | undefined) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      return `${url.pathname}${url.search}`;
    } catch {
      return path;
    }
  }
  return path.startsWith("/") ? path : `/${path}`;
};

const buildAttachmentUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = BACKEND_BASE_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

export default function InboundQuotations({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    uploadURL: string;
    fileName: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<
    string | number | null
  >(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedOutboundQuotation(null);
    }
  }, [isModalOpen]);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["/inbound-quotations"],
  });

  const { data: outboundQuotations = [] } = useQuery<OutboundQuotation[]>({
    queryKey: ["/outbound-quotations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  const [selectedOutboundQuotation, setSelectedOutboundQuotation] = useState<OutboundQuotation | null>(null);
  const [editableItems, setEditableItems] = useState<any[]>([]);

  // Update editable items when selected outbound quotation changes
  useEffect(() => {
    if (selectedOutboundQuotation?.quotationItems) {
      setEditableItems(selectedOutboundQuotation.quotationItems.map((item: any) => ({
        ...item,
        // Ensure we use the correct fields from OutboundQuotation items
        displayDescription: item.partDescription || item.itemName || item.description || "Item",
        displayQty: item.qty || item.quantity || 1,
        displayRate: item.unitPrice || item.rate || 0,
        displayAmount: item.amount || 0
      })));
    } else {
      setEditableItems([]);
    }
  }, [selectedOutboundQuotation]);

  const updateItemRate = (itemId: string, newRate: string) => {
    const rate = parseFloat(newRate) || 0;
    setEditableItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newAmount = (parseFloat(String(item.displayQty)) || 0) * rate;
        return { 
          ...item, 
          displayRate: rate,
          displayAmount: newAmount
        };
      }
      return item;
    }));
    
    // Also update total amount in form
    setTimeout(() => {
      const total = editableItems.reduce((sum, item) => {
        if (item.id === itemId) {
          return sum + ((parseFloat(String(item.displayQty)) || 0) * rate);
        }
        return sum + (parseFloat(String(item.displayAmount)) || 0);
      }, 0);
      form.setValue("totalAmount", total.toFixed(2));
    }, 0);
  };

  // Define the form schema based on the corrected Zod schema
  const quotationFormSchema = z.object({
    senderId: z.string().uuid("Sender ID must be a valid UUID"),
    quotationNumber: z.string().min(1, "Quotation number is required"),
    quotationDate: z.string().min(1, "Quotation date is required"), // Keep as string for form handling
    validUntil: z.string().optional(), // Keep as string for form handling
    subject: z.string().optional(),
    totalAmount: z.string().min(1, "Total amount is required"),
    status: z
      .enum(["received", "under_review", "approved", "rejected"])
      .default("received"),
    notes: z.string().optional(),
    senderType: z.enum(["client", "vendor", "supplier"]).default("client"),
    attachmentPath: z.string().nullable().optional(),
    attachmentName: z.string().nullable().optional(),
    quotationRef: z.string().optional(),
  });

  const form = useForm<z.infer<typeof quotationFormSchema>>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      senderId: "",
      quotationNumber: "",
      quotationDate: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      subject: "",
      totalAmount: "",
      status: "received",
      senderType: "client",
      notes: "",
      quotationRef: "",
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: z.infer<typeof quotationFormSchema>) => {
      const subtotal = editableItems.reduce((sum, item) => sum + (parseFloat(String(item.displayAmount)) || 0), 0);
      const gstRate = 0.18;
      const gstAmount = subtotal * gstRate;
      const discount = 0;
      const total = subtotal + gstAmount - discount;

      const formattedData = {
        ...data,
        userId: user?.id || "00000000-0000-0000-0000-000000000001",
        quotationDate: new Date(data.quotationDate),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        attachmentPath: normalizeAttachmentPath(uploadedFile?.uploadURL),
        attachmentName: uploadedFile ? uploadedFile.fileName : null,
        quotationRef: selectedOutboundQuotation?.id || null,
        quotationItems: editableItems,
        moldDetails: selectedOutboundQuotation?.moldDetails || [],
        financialBreakdown: {
          subtotal,
          gstRate: 18,
          gstAmount,
          discount,
          total
        }
      };

      return apiRequest("POST", "/inbound-quotations", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/inbound-quotations"] });
      toast({
        title: "Success",
        description: "Inbound quotation created successfully.",
      });
      setIsModalOpen(false);
      form.reset();
      setUploadedFile(null);
    },
    onError: (error: any) => {
      console.error("Failed to create quotation:", error);
      if (error?.data?.details) {
        toast({
          title: "Validation Error",
          description: "Please check the form fields for errors.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error?.data?.error ||
            "Failed to create quotation. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (values: z.infer<typeof quotationFormSchema>) => {
    createQuotationMutation.mutate(values);
  };

  const handleFileUpload = (result: {
    uploadURL: string;
    fileName: string;
  }) => {
    setUploadedFile(result);
    toast({
      title: "File uploaded",
      description: `${result.fileName} uploaded successfully. You can now submit the quotation.`,
    });
  };

  const handleDownloadAttachment = async (quotation: any) => {
    try {
      const filePath = normalizeAttachmentPath(quotation?.attachmentPath);

      if (!filePath) {
        toast({
          title: "No attachment",
          description: "This quotation does not have an uploaded file.",
          variant: "destructive",
        });
        return;
      }

      const pdfUrl = buildAttachmentUrl(filePath);
      const response = await fetch(pdfUrl, { credentials: "include" });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = quotation.attachmentName || "quotation.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download quotation attachment:", error);
      toast({
        title: "Download failed",
        description: "Unable to download the quotation attachment.",
        variant: "destructive",
      });
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({
      quotationId,
      status,
    }: {
      quotationId: string | number;
      status: string;
    }) => {
      return apiRequest("PUT", `/inbound-quotations/${quotationId}`, {
        status,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/inbound-quotations"] });
      toast({
        title: "Success",
        description: `Quotation ${
          variables.status === "approved" ? "accepted" : "rejected"
        } successfully.`,
      });
      setActionInProgressId(null);
    },
    onError: (error: any) => {
      console.error("Failed to update quotation status:", error);
      toast({
        title: "Error",
        description:
          error?.data?.error ||
          "Failed to update quotation status. Please try again.",
        variant: "destructive",
      });
      setActionInProgressId(null);
    },
  });

  const handleViewDetails = (quotation: any) => {
    setSelectedQuotationDetails(quotation);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (quotation: any, status: string) => {
    setActionInProgressId(quotation.id);
    updateStatusMutation.mutate({ quotationId: quotation.id, status });
  };

  const deleteQuotationMutation = useMutation({
    mutationFn: (id: string | number) => {
      return apiRequest("DELETE", `/api/inbound-quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/inbound-quotations"] });
      toast({
        title: "Success",
        description: "Quotation deleted successfully.",
      });
      setActionInProgressId(null);
    },
    onError: (error: any) => {
      console.error("Failed to delete quotation:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to delete quotation.",
        variant: "destructive",
      });
      setActionInProgressId(null);
    },
  });

  const handleDeleteQuotation = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      setActionInProgressId(id);
      deleteQuotationMutation.mutate(id);
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
      key: "sender",
      header: "Customer",
      cell: (quotation: any) => (
        <div>
          <div className="font-light">{quotation.sender?.name || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            {quotation.senderType?.toUpperCase() || "CLIENT"}
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
      cell: (quotation: any) =>
        `₹${parseFloat(quotation.totalAmount).toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (quotation: any) => {
        const statusColors = {
          received: "bg-blue-100 text-blue-800",
          under_review: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={
              statusColors[quotation.status as keyof typeof statusColors] ||
              statusColors.received
            }
          >
            {quotation.status?.replace("_", " ").toUpperCase() || "RECEIVED"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (quotation: any) => {
        const isApproved = quotation.status === "approved";
        const isRejected = quotation.status === "rejected";
        const isProcessing = actionInProgressId === quotation.id;

        return (
          <div className="flex items-center space-x-2" data-tour="sales-quotation-actions">
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-muted"
              onClick={() => handleViewDetails(quotation)}
              data-testid={`button-view-details-${quotation.id}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-muted text-blue-600"
              onClick={() => handleDownloadAttachment(quotation)}
              data-testid={`button-download-inbound-${quotation.id}`}
              title="Download Attachment"
            >
              <FileDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-muted text-green-600"
              disabled={isProcessing || isApproved}
              onClick={() => handleUpdateStatus(quotation, "approved")}
              data-testid={`button-approve-${quotation.id}`}
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-muted text-red-600"
              disabled={isProcessing || isRejected}
              onClick={() => handleUpdateStatus(quotation, "rejected")}
              data-testid={`button-reject-${quotation.id}`}
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-muted text-destructive"
              disabled={isProcessing}
              onClick={() => handleDeleteQuotation(quotation.id)}
              data-testid={`button-delete-inbound-${quotation.id}`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className={isEmbedded ? "" : "p-8"}>
      {!isEmbedded && (
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              data-testid="text-inbound-quotations-title"
            >
              Inbound Quotations
            </h1>
            <p className="text-muted-foreground">
              Manage quotations received from clients and vendors
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-inbound-quotation">
                <Upload className="h-4 w-4 mr-2" />
                Upload Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload received Quotation</DialogTitle>
                <DialogDescription>
                  Upload a quotation received from a client or vendor along with
                  quotation details.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quotationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation Number</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              const selected = outboundQuotations.find(q => q.quotationNumber === value);
                              setSelectedOutboundQuotation(selected || null);
                              if (selected) {
                                if (selected.customerId) form.setValue("senderId", selected.customerId);
                                form.setValue("totalAmount", String(selected.totalAmount));
                                form.setValue("senderType", "client");
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-quotation-number">
                                <SelectValue placeholder="Select quotation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {outboundQuotations.map((q) => (
                                <SelectItem key={q.id} value={q.quotationNumber}>
                                  {q.quotationNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="senderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-customer">
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Select a customer</SelectItem>
                              {customers.map((customer: Customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedOutboundQuotation && (
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                        <h4 className="text-sm font-bold text-blue-900 flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          Reference Details: {selectedOutboundQuotation.quotationNumber}
                        </h4>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                          Original Quotation
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {selectedOutboundQuotation.partNumber && selectedOutboundQuotation.partNumber !== "N/A" && (
                          <div className="bg-white p-2 rounded border border-blue-50 shadow-sm">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Part Number</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedOutboundQuotation.partNumber}</p>
                          </div>
                        )}
                        {selectedOutboundQuotation.jobCardNumber && selectedOutboundQuotation.jobCardNumber !== "N/A" && (
                          <div className="bg-white p-2 rounded border border-blue-50 shadow-sm">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Job Card #</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedOutboundQuotation.jobCardNumber}</p>
                          </div>
                        )}
                        {selectedOutboundQuotation.projectIncharge && selectedOutboundQuotation.projectIncharge !== "N/A" && (
                          <div className="bg-white p-2 rounded border border-blue-50 shadow-sm">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Project Incharge</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedOutboundQuotation.projectIncharge}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quotation Items Implementation</h5>
                        <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-2.5 text-left font-semibold text-slate-700">Item Description</th>
                                <th className="p-2.5 text-center font-semibold text-slate-700">Qty</th>
                                <th className="p-2.5 text-right font-semibold text-slate-700">Rate</th>
                                <th className="p-2.5 text-right font-semibold text-slate-700">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(selectedOutboundQuotation.quotationItems) ? (
                                selectedOutboundQuotation.quotationItems.map((item: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-2.5 font-medium text-slate-800">{item.itemName}</td>
                                    <td className="p-2.5 text-center text-slate-600">{item.quantity}</td>
                                    <td className="p-2.5 text-right text-slate-600">₹{parseFloat(item.unitPrice).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-bold text-slate-900">₹{parseFloat(item.amount).toLocaleString()}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-muted-foreground italic">No items found in reference</td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="bg-blue-50/30 font-bold border-t border-slate-200">
                              <tr>
                                <td colSpan={3} className="p-2.5 text-right text-slate-700">Quotation Total Value:</td>
                                <td className="p-2.5 text-right text-blue-700 text-sm">₹{parseFloat(String(selectedOutboundQuotation.totalAmount)).toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                      
                      {selectedOutboundQuotation.moldDetails && Object.keys(selectedOutboundQuotation.moldDetails).length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mold & Technical Specifications</h5>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            {Object.entries(selectedOutboundQuotation.moldDetails as Record<string, any>).map(([key, value]) => (
                              value && (
                                <div key={key} className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="text-muted-foreground font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-semibold text-slate-800">{String(value)}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="senderType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-sender-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="supplier">Supplier</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input
                              placeholder=""
                              {...field}
                              data-testid="input-total-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedOutboundQuotation && (
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                        <h4 className="text-sm font-bold text-blue-900 flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          Reference Details: {selectedOutboundQuotation.quotationNumber}
                        </h4>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                          Original Quotation
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {selectedOutboundQuotation.partNumber && selectedOutboundQuotation.partNumber !== "N/A" && (
                          <div className="bg-white p-2 rounded border border-blue-50 shadow-sm">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Part Number</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedOutboundQuotation.partNumber}</p>
                          </div>
                        )}
                        {selectedOutboundQuotation.jobCardNumber && selectedOutboundQuotation.jobCardNumber !== "N/A" && (
                          <div className="bg-white p-2 rounded border border-blue-50 shadow-sm">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Job Card #</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedOutboundQuotation.jobCardNumber}</p>
                          </div>
                        )}
                        {selectedOutboundQuotation.projectIncharge && selectedOutboundQuotation.projectIncharge !== "N/A" && (
                          <div className="bg-white p-2 rounded border border-blue-50 shadow-sm">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Project Incharge</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedOutboundQuotation.projectIncharge}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quotation Items Implementation</h5>
                        <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-2.5 text-left font-semibold text-slate-700">Item Description</th>
                                <th className="p-2.5 text-center font-semibold text-slate-700">Qty</th>
                                <th className="p-2.5 text-right font-semibold text-slate-700">Rate</th>
                                <th className="p-2.5 text-right font-semibold text-slate-700">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(selectedOutboundQuotation.quotationItems) ? (
                                selectedOutboundQuotation.quotationItems.map((item: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-2.5 font-medium text-slate-800">{item.itemName}</td>
                                    <td className="p-2.5 text-center text-slate-600">{item.quantity}</td>
                                    <td className="p-2.5 text-right text-slate-600">₹{parseFloat(item.unitPrice).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-bold text-slate-900">₹{parseFloat(item.amount).toLocaleString()}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-muted-foreground italic">No items found in reference</td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="bg-blue-50/30 font-bold border-t border-slate-200">
                              <tr>
                                <td colSpan={3} className="p-2.5 text-right text-slate-700">Quotation Total Value:</td>
                                <td className="p-2.5 text-right text-blue-700 text-sm">₹{parseFloat(String(selectedOutboundQuotation.totalAmount)).toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                      
                      {selectedOutboundQuotation.moldDetails && Object.keys(selectedOutboundQuotation.moldDetails).length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mold & Technical Specifications</h5>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            {Object.entries(selectedOutboundQuotation.moldDetails as Record<string, any>).map(([key, value]) => (
                              value && (
                                <div key={key} className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="text-muted-foreground font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-semibold text-slate-800">{String(value)}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quotationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-quotation-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-valid-until"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Q1 Material Supply"
                            {...field}
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about this quotation..."
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border rounded-lg p-4">
                    <h4 className="font-light mb-3">Upload Quotation File</h4>
                    <FileUploader
                      onUploadComplete={handleFileUpload}
                      acceptedFileTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="w-full"
                    />
                    {uploadedFile && (
                      <div
                        className="mt-2 text-sm text-green-600"
                        data-testid="text-upload-success"
                      >
                        ✓ File uploaded: {uploadedFile.fileName}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        form.reset();
                        setUploadedFile(null);
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createQuotationMutation.isPending}
                      data-testid="button-create-quotation"
                    >
                      {createQuotationMutation.isPending
                        ? "Creating..."
                        : "Create Quotation"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isEmbedded && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {/* We don't need a DialogTrigger here because QuotationsPage handles it via ref/click */}
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload received Quotation</DialogTitle>
              <DialogDescription>
                Upload a quotation received from a client or vendor along with
                quotation details.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* FORM FIELDS SAME AS ABOVE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Number</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selected = outboundQuotations.find(q => q.quotationNumber === value);
                            setSelectedOutboundQuotation(selected || null);
                            if (selected) {
                              if (selected.customerId) form.setValue("senderId", selected.customerId);
                              form.setValue("totalAmount", String(selected.totalAmount));
                              form.setValue("senderType", "client");
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-quotation-number-embedded">
                              <SelectValue placeholder="Select quotation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {outboundQuotations.map((q) => (
                              <SelectItem key={q.id} value={q.quotationNumber}>
                                {q.quotationNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-customer-embedded">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Select a customer</SelectItem>
                            {customers.map((customer: Customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="senderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-sender-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder=""
                            {...field}
                            data-testid="input-total-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-quotation-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-valid-until"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Q1 Material Supply"
                          {...field}
                          data-testid="input-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes about this quotation..."
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Live Preview of Selected Quotation Details */}
                {selectedOutboundQuotation && (
                  <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <LayoutGrid className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Linked Quotation: {selectedOutboundQuotation.quotationNumber}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">Previewing items and technical specifications</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 shadow-sm font-semibold px-3">
                        {selectedOutboundQuotation.status?.toUpperCase()}
                      </Badge>
                    </div>

                    {selectedOutboundQuotation.moldDetails && selectedOutboundQuotation.moldDetails.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mold Specifications</h5>
                          <div className="h-px flex-1 bg-slate-200"></div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                          <table className="w-full text-[11px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-2.5 text-left font-bold text-slate-600 uppercase tracking-tighter">Part Name</th>
                                <th className="p-2.5 text-left font-bold text-slate-600 uppercase tracking-tighter">Mold No</th>
                                <th className="p-2.5 text-left font-bold text-slate-600 uppercase tracking-tighter">Material</th>
                                <th className="p-2.5 text-right font-bold text-slate-600 uppercase tracking-tighter">Cavity</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedOutboundQuotation.moldDetails.map((mold: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-2.5 font-bold text-slate-800">{mold.partName}</td>
                                  <td className="p-2.5 text-slate-600 font-mono">{mold.mouldNo}</td>
                                  <td className="p-2.5 text-slate-600">{mold.plasticMaterial}</td>
                                  <td className="p-2.5 text-right font-bold text-slate-900">{mold.noOfCavity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {editableItems && editableItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Itemized Table (Define Rates)</h5>
                            <div className="h-px flex-1 bg-slate-200"></div>
                          </div>
                          <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-100">
                            Auto-Syncs Grand Total
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                          <table className="w-full text-[11px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-2.5 text-left font-bold text-slate-600 uppercase tracking-tighter">Description</th>
                                <th className="p-2.5 text-center font-bold text-slate-600 uppercase tracking-tighter w-16">Qty</th>
                                <th className="p-2.5 text-right font-bold text-slate-600 uppercase tracking-tighter w-28">Received Rate</th>
                                <th className="p-2.5 text-right font-bold text-slate-600 uppercase tracking-tighter w-28">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {editableItems.map((item: any, idx: number) => (
                                <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-2.5">
                                    <div className="font-bold text-slate-800 leading-tight">{item.displayDescription}</div>
                                    <div className="text-[9px] text-muted-foreground italic mt-0.5 flex items-center gap-1">
                                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                      Mold: {item.mouldNo || item.partName || "N/A"}
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-center text-slate-600 font-mono bg-slate-50/30 font-bold">{item.displayQty}</td>
                                  <td className="p-2.5 text-right">
                                    <div className="flex items-center justify-end group">
                                      <span className="text-slate-400 font-bold mr-1 group-focus-within:text-primary transition-colors">₹</span>
                                      <input 
                                        type="number" 
                                        value={item.displayRate}
                                        onChange={(e) => updateItemRate(item.id, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                          }
                                        }}
                                        className="w-20 p-1 border border-slate-200 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none text-right font-bold text-primary bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-right font-bold text-slate-900 bg-slate-50/30">
                                    ₹{parseFloat(String(item.displayAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white divide-y divide-slate-800">
                              {(() => {
                                const subtotal = editableItems.reduce((sum, item) => sum + (parseFloat(String(item.displayAmount)) || 0), 0);
                                const gstRate = 0.18;
                                const gstAmount = subtotal * gstRate;
                                const discount = 0;
                                const total = subtotal + gstAmount - discount;
                                
                                return (
                                  <>
                                    <tr className="border-t border-slate-700">
                                      <td colSpan={3} className="p-2 text-right text-[10px] font-bold uppercase tracking-widest opacity-70">Subtotal</td>
                                      <td className="p-2 text-right font-medium text-xs">
                                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} className="p-2 text-right text-[10px] font-bold uppercase tracking-widest opacity-70">GST (18%)</td>
                                      <td className="p-2 text-right font-medium text-xs">
                                        ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} className="p-2 text-right text-[10px] font-bold uppercase tracking-widest text-red-400 opacity-90">Discount</td>
                                      <td className="p-2 text-right font-medium text-xs text-red-400">
                                        -₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                      </td>
                                    </tr>
                                    <tr className="bg-slate-950">
                                      <td colSpan={3} className="p-3 text-right text-xs font-black uppercase tracking-widest">Total Amount</td>
                                      <td className="p-3 text-right font-black text-sm">
                                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                      </td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border rounded-lg p-4">
                  <h4 className="font-light mb-3">Upload Quotation File</h4>
                  <FileUploader
                    onUploadComplete={handleFileUpload}
                    acceptedFileTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full"
                  />
                  {uploadedFile && (
                    <div
                      className="mt-2 text-sm text-green-600"
                      data-testid="text-upload-success"
                    >
                      ✓ File uploaded: {uploadedFile.fileName}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      form.reset();
                      setUploadedFile(null);
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createQuotationMutation.isPending}
                    data-testid="button-create-quotation"
                  >
                    {createQuotationMutation.isPending
                      ? "Creating..."
                      : "Create Quotation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      <Card className="shadow-sm">
        {!isEmbedded && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileDown className="h-5 w-5" />
              <span>All Inbound Quotations</span>
            </CardTitle>
            <CardDescription>
              Client/Vendor → Company quotations with review workflow
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={isEmbedded ? "pt-6" : ""}>
          <DataTable
            data={quotations}
            columns={columns}
            searchable={true}
            searchKey="quotationNumber"
          />
        </CardContent>
      </Card>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Quotation Details: {selectedQuotationDetails?.quotationNumber}</span>
              <Badge variant="outline" className="ml-2 uppercase">
                {selectedQuotationDetails?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Technical and financial details of the received quotation.
            </DialogDescription>
          </DialogHeader>

          {selectedQuotationDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                  <p className="text-sm font-semibold">{new Date(selectedQuotationDetails.quotationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Valid Until</p>
                  <p className="text-sm font-semibold">{selectedQuotationDetails.validUntil ? new Date(selectedQuotationDetails.validUntil).toLocaleDateString() : "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Amount</p>
                  <p className="text-sm font-bold text-primary">₹{parseFloat(selectedQuotationDetails.totalAmount).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Sender</p>
                  <p className="text-sm font-semibold">{selectedQuotationDetails.sender?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Sender Type</p>
                  <p className="text-sm font-semibold uppercase">{selectedQuotationDetails.senderType}</p>
                </div>
                {selectedQuotationDetails.quotationRef && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Linked Ref</p>
                    <p className="text-sm font-semibold text-blue-600">ID: {selectedQuotationDetails.quotationRef.substring(0, 8)}...</p>
                  </div>
                )}
              </div>

              {selectedQuotationDetails.subject && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Subject</h4>
                  <div className="bg-white p-3 rounded border text-sm italic">
                    {selectedQuotationDetails.subject}
                  </div>
                </div>
              )}

              {selectedQuotationDetails.moldDetails && selectedQuotationDetails.moldDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3" />
                    Mold Specifications
                  </h4>
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-left font-bold text-slate-600 uppercase tracking-tighter">Part Name</th>
                          <th className="p-2 text-left font-bold text-slate-600 uppercase tracking-tighter">Mold No</th>
                          <th className="p-2 text-left font-bold text-slate-600 uppercase tracking-tighter">Material</th>
                          <th className="p-2 text-right font-bold text-slate-600 uppercase tracking-tighter">Cavity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuotationDetails.moldDetails.map((mold: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2 font-bold text-slate-800">{mold.partName}</td>
                            <td className="p-2 text-slate-600 font-mono">{mold.mouldNo}</td>
                            <td className="p-2 text-slate-600">{mold.plasticMaterial}</td>
                            <td className="p-2 text-right font-bold text-slate-900">{mold.noOfCavity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedQuotationDetails.quotationItems && selectedQuotationDetails.quotationItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Itemized Table
                  </h4>
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-left font-bold text-slate-600 uppercase tracking-tighter">Description</th>
                          <th className="p-2 text-center font-bold text-slate-600 uppercase tracking-tighter">Qty</th>
                          <th className="p-2 text-right font-bold text-slate-600 uppercase tracking-tighter">Rate</th>
                          <th className="p-2 text-right font-bold text-slate-600 uppercase tracking-tighter">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuotationDetails.quotationItems.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2">
                              <div className="font-bold text-slate-800 leading-tight">{item.displayDescription}</div>
                              <div className="text-[9px] text-muted-foreground italic">Mold: {item.mouldNo || "N/A"}</div>
                            </td>
                            <td className="p-2 text-center text-slate-600 font-mono font-bold">{item.displayQty}</td>
                            <td className="p-2 text-right text-primary font-bold">₹{parseFloat(String(item.displayRate)).toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-bold text-slate-900 bg-slate-50/30">₹{parseFloat(String(item.displayAmount)).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900 text-white divide-y divide-slate-800">
                        {selectedQuotationDetails.financialBreakdown ? (
                          <>
                            <tr>
                              <td colSpan={3} className="p-2 text-right text-[10px] font-bold uppercase tracking-widest opacity-70">Subtotal</td>
                              <td className="p-2 text-right font-medium text-xs">₹{parseFloat(String(selectedQuotationDetails.financialBreakdown.subtotal)).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="p-2 text-right text-[10px] font-bold uppercase tracking-widest opacity-70">GST (18%)</td>
                              <td className="p-2 text-right font-medium text-xs">₹{parseFloat(String(selectedQuotationDetails.financialBreakdown.gstAmount)).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr className="bg-slate-950">
                              <td colSpan={3} className="p-2 text-right text-[10px] font-black uppercase tracking-widest">Total Amount</td>
                              <td className="p-2 text-right font-black text-sm">₹{parseFloat(String(selectedQuotationDetails.financialBreakdown.total)).toLocaleString('en-IN')}</td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-2 text-right text-[10px] font-black uppercase tracking-widest">Grand Total</td>
                            <td className="p-2 text-right font-black text-sm">₹{parseFloat(selectedQuotationDetails.totalAmount).toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {selectedQuotationDetails.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Internal Notes</h4>
                  <div className="bg-white p-3 rounded border text-sm text-slate-600">
                    {selectedQuotationDetails.notes}
                  </div>
                </div>
              )}

              {selectedQuotationDetails.attachmentPath && (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{selectedQuotationDetails.attachmentName || "View Attachment"}</span>
                  </div>
                  <Button size="sm" onClick={() => handleDownloadAttachment(selectedQuotationDetails)}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden button for QuotationsPage to trigger upload dialog */}
      {isEmbedded && (
        <Button 
          className="hidden" 
          data-testid="button-upload-inbound-quotation" 
          onClick={() => setIsModalOpen(true)}
        />
      )}
    </div>
  );
}
