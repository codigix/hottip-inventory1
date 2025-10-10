import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
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
  PlusCircle,
} from "lucide-react";
import {
  insertOutboundQuotationSchema,
  type InsertOutboundQuotation,
  type Customer,
  type OutboundQuotation,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function OutboundQuotations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] =
    useState<OutboundQuotation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false); // For Export All
  const [filteredQuotations, setFilteredQuotations] = useState<
    OutboundQuotation[]
  >([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { toast } = useToast();

  // State for dynamic form sections
  const [moldDetails, setMoldDetails] = useState<any[]>([]);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);

  const { data: quotations = [], isLoading } = useQuery<OutboundQuotation[]>({
    queryKey: ["/outbound-quotations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  // Use shared schema with enhanced validation messages
  const quotationFormSchema = insertOutboundQuotationSchema
    .extend({
      quotationNumber: z
        .string()
        .min(1, "⚠️ Quotation number is required (e.g., QUO-2025-001)"),
      customerId: z
        .string()
        .min(1, "⚠️ Please select a customer from the dropdown"),
      subtotalAmount: z
        .string()
        .min(1, "⚠️ Subtotal amount is required (e.g., 1000.00)"),
      totalAmount: z
        .string()
        .min(1, "⚠️ Total amount is required (e.g., 1180.00)"),
    })
    .omit({
      warrantyTerms: true,
      specialTerms: true,
    });

  const form = useForm<z.infer<typeof quotationFormSchema>>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      status: "draft",
      quotationDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotalAmount: "0.00",
      taxAmount: "0.00",
      discountAmount: "0.00",
      totalAmount: "0.00",
      quotationNumber: "",
      customerId: "",
      userId: "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Real user ID from database
      deliveryTerms: "",
      paymentTerms: "",
      bankingDetails: "",
      termsConditions: "",
      notes: "",
      jobCardNumber: "",
      partNumber: "",
      projectIncharge: "",
      moldDetails: [],
      quotationItems: [],
      gstType: "IGST",
      gstPercentage: "18",
      packaging: "",
      bankName: "",
      bankAccountNo: "",
      bankIfscCode: "",
      bankBranch: "",
      companyName: "CHENNUPATI PLASTICS",
      companyAddress:
        "123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra",
      companyGstin: "27AAAAA0000A1Z5",
      companyEmail: "info@chennupatiplastics.com",
      companyPhone: "+91-9876543210",
      companyWebsite: "www.chennupatiplastics.com",
    },
  });

  // --- EXPORT FILTER SCHEMA ---
  const exportFilterSchema = z.object({
    customerId: z.string().optional(),
    status: z
      .enum(["draft", "sent", "pending", "approved", "rejected"])
      .optional(),
    startDate: z.string().optional(), // Keep as string for form handling
    endDate: z.string().optional(), // Keep as string for form handling
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

  // Update displayed quotations when quotations data changes or filters change
  const applyMainFilters = async () => {
    try {
      console.log("🔍 [MAIN] Applying filters:", mainFilters);

      // Build query string
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

      console.log("🔍 [MAIN] Fetching from URL:", url);

      const response = await apiRequest<OutboundQuotation[]>("GET", url);
      console.log("🔍 [MAIN] Filtered quotations received:", response?.length);

      setDisplayedQuotations(response || []);

      toast({
        title: "Filters Applied",
        description: `Showing ${response?.length || 0} quotation(s)`,
      });
    } catch (error) {
      console.error("❌ [MAIN] Error applying filters:", error);
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

  // Initialize displayed quotations when quotations data loads
  useEffect(() => {
    if (quotations && quotations.length > 0) {
      setDisplayedQuotations(quotations);
    }
  }, [quotations]);

  const createQuotationMutation = useMutation({
    mutationFn: (data: z.infer<typeof quotationFormSchema>) =>
      apiRequest("POST", "/outbound-quotations", {
        ...data,
        userId: "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Real user ID from database
        moldDetails,
        quotationItems,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outbound-quotations"] });
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      setMoldDetails([]);
      setQuotationItems([]);
    },
    onError: (error: any) => {
      console.error("Quotation creation error:", error);

      // Parse server validation errors and set field errors
      const issues = error?.data?.errors ?? error?.errors;
      if (Array.isArray(issues)) {
        issues.forEach((e: { path?: string[]; message: string }) => {
          const fieldName = e.path?.[0] as keyof InsertOutboundQuotation;
          if (fieldName) {
            form.setError(fieldName, { type: "server", message: e.message });
          }
        });
      }

      toast({
        title: "Validation Error",
        description:
          error?.message || "Please fix the highlighted fields and try again",
        variant: "destructive",
      });
    },
  });

  // Handler for View action
  const handleViewQuotation = (quotation: OutboundQuotation) => {
    setSelectedQuotation(quotation);
    setIsViewDialogOpen(true);
  };

  // Handler for Edit action
  const handleEditQuotation = (quotation: OutboundQuotation) => {
    setSelectedQuotation(quotation);
    setIsEditDialogOpen(true);

    // Set the dynamic arrays
    setMoldDetails(quotation.moldDetails || []);
    setQuotationItems(quotation.quotationItems || []);

    // Reset form with quotation data
    // Ensure dates are Date objects for the form controls
    const resetData = {
      ...quotation,
      quotationDate: new Date(quotation.quotationDate),
      validUntil: quotation.validUntil
        ? new Date(quotation.validUntil)
        : undefined,
      subtotalAmount: String(quotation.subtotalAmount),
      taxAmount: String(quotation.taxAmount),
      discountAmount: String(quotation.discountAmount),
      totalAmount: String(quotation.totalAmount),
      customerId: quotation.customerId || "",
      userId: quotation.userId || "79c36f2b-237a-4ba6-a4b3-a12fc8a18446",
      status: quotation.status || "draft",
      projectIncharge: quotation.projectIncharge || "",
      bankingDetails: quotation.bankingDetails || "",
      termsConditions: quotation.termsConditions || "",
      moldDetails: quotation.moldDetails || [],
      quotationItems: quotation.quotationItems || [],
    };
    console.log("Resetting form with data:", resetData); // Debug log
    form.reset(resetData);
  };

  // Handler for Send action (updates status to 'sent')
  const handleSendQuotation = async (quotation: OutboundQuotation) => {
    try {
      // Update the status to "sent"
      await apiRequest("PUT", `/outbound-quotations/${quotation.id}`, {
        status: "sent", // Only send the status field to update
      });

      toast({
        title: "Success",
        description: "Quotation sent successfully",
      });

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/outbound-quotations"] });
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
      // Assuming you have an API endpoint that generates and returns a PDF file
      const response = await apiRequest(
        "GET",
        `/outbound-quotations/${quotation.id}/pdf`,
        undefined, // No body needed for GET
        { responseType: "blob" } // Important: Tell fetch/Axios to expect a binary blob
      );

      // Create a temporary anchor element to trigger the download
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
      // Generate invoice number (replace QUO with INV)
      const invoiceNumber = quotation.quotationNumber.replace(/^QUO/i, "INV");

      // Set invoice date to today, due date to 30 days from now
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const subtotal = quotation.subtotalAmount || quotation.totalAmount || 0;
      const taxAmount = quotation.taxAmount || 0;
      const discount = quotation.discountAmount || 0;
      const total = quotation.totalAmount || subtotal + taxAmount - discount;

      // Assume CGST and SGST if taxAmount > 0
      const cgstRate = taxAmount > 0 ? 9 : 0;
      const sgstRate = taxAmount > 0 ? 9 : 0;
      const cgstAmount = taxAmount / 2;
      const sgstAmount = taxAmount / 2;

      const invoiceData = {
        invoiceNumber,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        userId: quotation.userId || "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Default user ID
        status: "draft" as const,
        invoiceDate,
        dueDate,
        subtotalAmount: subtotal,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate: 0,
        igstAmount: 0,
        discountAmount: discount,
        totalAmount: total,
        balanceAmount: total, // Initially balance = total
      };

      // Create the invoice
      await apiRequest("POST", "/invoices", invoiceData);

      toast({
        title: "Success",
        description: `Quotation converted to invoice ${invoiceNumber}`,
      });

      // Refresh quotations list
      queryClient.invalidateQueries({ queryKey: ["/outbound-quotations"] });

      // Optionally refresh invoices list if you have it
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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

  // --- EXPORT ALL FUNCTIONALITY ---
  // Handler for Export All action (opens dialog)
  const handleExportAll = () => {
    setIsExportDialogOpen(true);
    exportForm.reset(); // Reset the export form when opening
    setFilteredQuotations([]); // Clear previous filtered results
  };

  // Handler for Export Filter Submit (preview filtered results)
  const handleExportFilterSubmit = async (
    data: z.infer<typeof exportFilterSchema>
  ) => {
    try {
      setIsPreviewLoading(true);
      console.log("🐛 [EXPORT] Applying filters:", data);

      // Build query params for the GET request
      const queryParams = new URLSearchParams();
      if (data.customerId && data.customerId !== "") {
        queryParams.append("customerId", data.customerId);
      }
      if (data.status) {
        queryParams.append("status", data.status);
      }
      if (data.startDate) {
        queryParams.append("startDate", data.startDate);
      }
      if (data.endDate) {
        queryParams.append("endDate", data.endDate);
      }

      const url = `/outbound-quotations?${queryParams.toString()}`;
      console.log("🐛 [EXPORT] Fetching from URL:", url);

      // Fetch filtered quotations from the backend
      // This assumes your backend supports query parameters for filtering
      const response = await apiRequest<OutboundQuotation[]>("GET", url);

      console.log("🐛 [EXPORT] Filtered quotations received:", response);
      console.log("🐛 [EXPORT] Number of quotations:", response?.length);
      console.log(
        "🐛 [EXPORT] Quotation statuses:",
        response?.map((q) => ({ number: q.quotationNumber, status: q.status }))
      );

      setFilteredQuotations(response || []);
      console.log("🐛 [EXPORT] State updated with quotations");

      toast({
        title: "Success",
        description: `Found ${
          response?.length || 0
        } quotations matching your filters.`,
      });
    } catch (error: any) {
      console.error("❌ [EXPORT] Failed to filter quotations:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to filter quotations",
        variant: "destructive",
      });
      setFilteredQuotations([]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Handler for Export All Submit (download filtered results)
  const handleExportAllSubmit = async () => {
    try {
      if (filteredQuotations.length === 0) {
        toast({
          title: "Info",
          description: "No quotations to export. Please apply filters first.",
          variant: "default",
        });
        return;
      }

      // Prepare the query parameters for the export API based on current export form values
      const formData = exportForm.getValues();
      const queryParams = new URLSearchParams();
      if (formData.customerId && formData.customerId !== "") {
        queryParams.append("customerId", formData.customerId);
      }
      if (formData.status) {
        queryParams.append("status", formData.status);
      }
      if (formData.startDate) {
        queryParams.append("startDate", formData.startDate);
      }
      if (formData.endDate) {
        queryParams.append("endDate", formData.endDate);
      }

      // Call the API to generate the export (e.g., CSV, Excel, or PDF of all matching quotations)
      // This assumes your backend has an endpoint like `/outbound-quotations/export`
      const response = await apiRequest(
        "GET",
        `/outbound-quotations/export?${queryParams.toString()}`,
        undefined,
        { responseType: "blob" } // Expect a binary file
      );

      // Trigger download of the exported file
      const filename = `Outbound_Quotations_Export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`; // Adjust extension based on your backend's output
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Quotations exported successfully",
      });

      setIsExportDialogOpen(false); // Close the dialog after successful export
      setFilteredQuotations([]); // Clear the preview
    } catch (error: any) {
      console.error("Failed to export quotations:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to export quotations",
        variant: "destructive",
      });
    }
  };

  // Helper functions for Mold Details
  const addMoldDetail = () => {
    setMoldDetails([
      ...moldDetails,
      {
        no: moldDetails.length + 1,
        partName: "",
        mouldNo: "",
        plasticMaterial: "",
        colourChange: "",
        mfi: "",
        wallThickness: "",
        noOfCavity: 1,
        gfPercent: "",
        mfPercent: "",
        partWeight: 0,
        systemSuggested: "",
        noOfDrops: 1,
        trialDate: "",
        quotationFor: "",
      },
    ]);
  };

  const removeMoldDetail = (index: number) => {
    const updated = moldDetails.filter((_, i) => i !== index);
    // Renumber the items
    const renumbered = updated.map((item, i) => ({ ...item, no: i + 1 }));
    setMoldDetails(renumbered);
  };

  const updateMoldDetail = (index: number, field: string, value: any) => {
    const updated = [...moldDetails];
    updated[index] = { ...updated[index], [field]: value };
    setMoldDetails(updated);
  };

  // Helper functions for Quotation Items
  const addQuotationItem = () => {
    setQuotationItems([
      ...quotationItems,
      {
        no: quotationItems.length + 1,
        partName: "",
        partDescription: "",
        uom: "NOS",
        qty: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeQuotationItem = (index: number) => {
    const updated = quotationItems.filter((_, i) => i !== index);
    // Renumber the items
    const renumbered = updated.map((item, i) => ({ ...item, no: i + 1 }));
    setQuotationItems(renumbered);
  };

  const updateQuotationItem = (index: number, field: string, value: any) => {
    const updated = [...quotationItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate amount if qty or unitPrice changes
    if (field === "qty" || field === "unitPrice") {
      const qty = field === "qty" ? parseFloat(value) || 0 : updated[index].qty;
      const unitPrice =
        field === "unitPrice"
          ? parseFloat(value) || 0
          : updated[index].unitPrice;
      updated[index].amount = qty * unitPrice;
    }

    setQuotationItems(updated);
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
      cell: (quotation: any) =>
        `₹${parseFloat(quotation.totalAmount).toLocaleString("en-IN")}`,
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
          {/* View Button */}
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-view-${quotation.id}`}
            onClick={() => handleViewQuotation(quotation)}
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Edit Button */}
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-edit-${quotation.id}`}
            onClick={() => handleEditQuotation(quotation)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* Send Button */}
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-send-${quotation.id}`}
            onClick={() => handleSendQuotation(quotation)}
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* Download PDF Button */}
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-download-${quotation.id}`}
            onClick={() => handleDownloadPDF(quotation)}
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Convert to Invoice Button - only for approved quotations */}
          {quotation.status === "approved" && (
            <Button
              size="sm"
              variant="ghost"
              data-testid={`button-convert-${quotation.id}`}
              onClick={() => handleConvertToInvoice(quotation)}
            >
              <Receipt className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Columns for the filtered preview table in the export dialog
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
        <div>
          <div className="font-light">{quotation.customer?.name || "N/A"}</div>
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
          <h1
            className="text-3xl font-bold tracking-tight"
            data-testid="text-outbound-quotations-title"
          >
            Outbound Quotations
          </h1>
          <p className="text-muted-foreground">
            Manage quotations sent to clients with full PDF field support
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-outbound-quotation">
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quotation</DialogTitle>
              <DialogDescription>
                Create a new outbound quotation for your client
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  (data) => createQuotationMutation.mutate(data)
                  // (errors) => {
                  //   console.error('Form validation errors:', errors);
                  //   toast({
                  //     title: "Validation Error",
                  //     description: "Please fix the highlighted fields and try again",

                  //     variant: "destructive",
                  //   });
                  // }
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quotation Number{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="QUO-2024-001"
                            data-testid="input-quotation-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Customer <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No client</SelectItem>
                            {(customers || []).map((customer: any) => (
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
                    name="quotationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={
                              field.value instanceof Date &&
                              !isNaN(field.value.getTime())
                                ? field.value.toISOString().split("T")[0]
                                : new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
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
                            value={
                              field.value instanceof Date &&
                              !isNaN(field.value.getTime())
                                ? field.value.toISOString().split("T")[0]
                                : new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
                            data-testid="input-valid-until-date"
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
                    name="subtotalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Subtotal Amount{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-subtotal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-tax"
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
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Amount</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-discount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Total Amount <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-total"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* GST Details Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    GST & Tax Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gstType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "IGST"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GST type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="IGST">IGST</SelectItem>
                              <SelectItem value="CGST_SGST">
                                CGST + SGST
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gstPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || "18"}
                              type="number"
                              step="0.01"
                              placeholder="18"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Terms Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Terms & Conditions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="50% advance, 50% against delivery"
                              data-testid="input-payment-terms"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Terms</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="25-30 days from approval"
                              data-testid="input-delivery-terms"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="packaging"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Packaging</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Standard export packaging"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Banking Details Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Banking Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="State Bank of India"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccountNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="1234567890"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankIfscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="SBIN0001234"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankBranch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="Pune Main Branch"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Company Details Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Company Details (for PDF Header)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="CHENNUPATI PLASTICS"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyGstin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company GSTIN</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="27AAAAA0000A1Z5"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Address</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="companyEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                type="email"
                                placeholder="info@chennupatiplastics.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Phone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="+91-9876543210"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="www.chennupatiplastics.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Mold/Part Details Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">
                      Mold / Part Details
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addMoldDetail}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Mold Detail
                    </Button>
                  </div>

                  {moldDetails.length > 0 && (
                    <div className="space-y-4">
                      {moldDetails.map((mold, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">
                              Mold Detail #{mold.no}
                            </h4>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMoldDetail(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Part Name
                              </label>
                              <Input
                                value={mold.partName}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "partName",
                                    e.target.value
                                  )
                                }
                                placeholder="TTC 161"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Mould No
                              </label>
                              <Input
                                value={mold.mouldNo}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "mouldNo",
                                    e.target.value
                                  )
                                }
                                placeholder="250ML JAR"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Plastic Material
                              </label>
                              <Input
                                value={mold.plasticMaterial}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "plasticMaterial",
                                    e.target.value
                                  )
                                }
                                placeholder="PP"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Colour Change
                              </label>
                              <Input
                                value={mold.colourChange}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "colourChange",
                                    e.target.value
                                  )
                                }
                                placeholder="YES"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">MFI</label>
                              <Input
                                value={mold.mfi}
                                onChange={(e) =>
                                  updateMoldDetail(index, "mfi", e.target.value)
                                }
                                placeholder="MFI"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Wall Thickness
                              </label>
                              <Input
                                value={mold.wallThickness}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "wallThickness",
                                    e.target.value
                                  )
                                }
                                placeholder="0.4 MM"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                No. of Cavity
                              </label>
                              <Input
                                type="number"
                                value={mold.noOfCavity}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "noOfCavity",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                placeholder="1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                GF% + MP%
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  value={mold.gfPercent}
                                  onChange={(e) =>
                                    updateMoldDetail(
                                      index,
                                      "gfPercent",
                                      e.target.value
                                    )
                                  }
                                  placeholder="GF%"
                                />
                                <Input
                                  value={mold.mfPercent}
                                  onChange={(e) =>
                                    updateMoldDetail(
                                      index,
                                      "mfPercent",
                                      e.target.value
                                    )
                                  }
                                  placeholder="MP%"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Part Weight (Gms)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={mold.partWeight}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "partWeight",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="7.8"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                System Suggested
                              </label>
                              <Input
                                value={mold.systemSuggested}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "systemSuggested",
                                    e.target.value
                                  )
                                }
                                placeholder="Single Valve gate"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                No. of Drops
                              </label>
                              <Input
                                type="number"
                                value={mold.noOfDrops}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "noOfDrops",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                placeholder="1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Trial Date
                              </label>
                              <Input
                                type="date"
                                value={mold.trialDate}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "trialDate",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="text-sm font-medium">
                                Quotation For
                              </label>
                              <Input
                                value={mold.quotationFor}
                                onChange={(e) =>
                                  updateMoldDetail(
                                    index,
                                    "quotationFor",
                                    e.target.value
                                  )
                                }
                                placeholder="TTC-161 250ML JAR SINGLE DROP NEEDLE VALAVE GATE PNEUMATIC HOT SPRUE - JK25051740-C"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quotation Items Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Quotation Items</h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addQuotationItem}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {quotationItems.length > 0 && (
                    <div className="space-y-4">
                      {quotationItems.map((item, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Item #{item.no}</h4>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeQuotationItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Part Name
                              </label>
                              <Input
                                value={item.partName}
                                onChange={(e) =>
                                  updateQuotationItem(
                                    index,
                                    "partName",
                                    e.target.value
                                  )
                                }
                                placeholder="VALVE TYPE NOZZLE"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-sm font-medium">
                                Part Description
                              </label>
                              <Input
                                value={item.partDescription}
                                onChange={(e) =>
                                  updateQuotationItem(
                                    index,
                                    "partDescription",
                                    e.target.value
                                  )
                                }
                                placeholder="AMP-D15-26120"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">UOM</label>
                              <Select
                                value={item.uom}
                                onValueChange={(value) =>
                                  updateQuotationItem(index, "uom", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select UOM" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NOS">NOS</SelectItem>
                                  <SelectItem value="KG">KG</SelectItem>
                                  <SelectItem value="PCS">PCS</SelectItem>
                                  <SelectItem value="SET">SET</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Quantity
                              </label>
                              <Input
                                type="number"
                                value={item.qty}
                                onChange={(e) =>
                                  updateQuotationItem(
                                    index,
                                    "qty",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Unit Price (INR)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateQuotationItem(
                                    index,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="176500.00"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Amount (INR)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                readOnly
                                className="bg-gray-100"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Total Calculation */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between font-semibold text-lg">
                              <span>TOTAL INR:</span>
                              <span>
                                ₹
                                {quotationItems
                                  .reduce((sum, item) => sum + item.amount, 0)
                                  .toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="border-t pt-4 mt-4">
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Additional notes for the quotation"
                          data-testid="textarea-notes"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createQuotationMutation.isPending}
                    data-testid="button-submit"
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

      {/* View Quotation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              QUOTATION
            </DialogTitle>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-6 p-6">
              {/* Company Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg">Hottip India Polymers</h3>
                  <p className="font-semibold">HOT RUNNER SYSTEMS</p>
                  <p>Pune, Maharashtra</p>
                  <p>Email: info@hottipindia.com</p>
                  <p>Mobile: +91-9876543210</p>
                  <p>Website: www.hottipindia.com</p>
                  <p>GST Number: 27AAAAA0000A1Z5</p>
                </div>

                {/* Customer Details */}
                <div>
                  <h3 className="font-bold">Bill To:</h3>
                  <p className="font-semibold">
                    {selectedQuotation.customer?.name || "N/A"}
                  </p>
                  {selectedQuotation.customer?.company && (
                    <p>{selectedQuotation.customer.company}</p>
                  )}
                  <p>{selectedQuotation.customer?.address || "N/A"}</p>
                  <p>
                    GST Number: {selectedQuotation.customer?.gstNumber || "N/A"}
                  </p>
                  <p>Phone: {selectedQuotation.customer?.phone || "N/A"}</p>
                  <p>Email: {selectedQuotation.customer?.email || "N/A"}</p>
                  <p>
                    Contact Person: Mr.{" "}
                    {selectedQuotation.customer?.contactPerson || "N/A"}
                  </p>
                </div>
              </div>

              {/* Quotation Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <div className="text-right">
                  <p>
                    <strong>Quotation Ref No:</strong>{" "}
                    {selectedQuotation.quotationNumber}
                  </p>
                  <p>
                    <strong>Quotation Date:</strong>{" "}
                    {new Date(
                      selectedQuotation.quotationDate
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Project Incharge:</strong>{" "}
                    {selectedQuotation.projectIncharge || "N/A"}
                  </p>
                  <p>
                    <strong>Job Card Details:</strong>{" "}
                    {selectedQuotation.jobCardNumber || "N/A"}
                  </p>
                </div>
              </div>

              {/* Mold / Part Details */}
              {selectedQuotation.moldDetails &&
                selectedQuotation.moldDetails.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">
                      Section 1 – Mold / Part Details
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              No
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Part Name
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Mould No
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Plastic Material
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Colour Change
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              MFI
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Wall Thickness
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              No. of Cavity
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              GF% + MF%
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Part Weight (Gms)
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              System Suggested
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              No. of Drops
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left">
                              Trial Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedQuotation.moldDetails.map(
                            (mold: any, index: number) => (
                              <tr key={index}>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.no}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.partName}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.mouldNo}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.plasticMaterial}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.colourChange}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.mfi}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.wallThickness}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.noOfCavity}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.gfPercent} + {mold.mfPercent}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.partWeight}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.systemSuggested}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.noOfDrops}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {mold.trialDate || "-"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Quotation Items Table */}
              {selectedQuotation.quotationItems &&
                selectedQuotation.quotationItems.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">
                      Section 2 – Quotation Items Table
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              No
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Part Name
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Part Description
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              UOM
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Qty
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Unit Price (INR)
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Amount (INR)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedQuotation.quotationItems.map(
                            (item: any, index: number) => (
                              <tr key={index}>
                                <td className="border border-gray-300 px-4 py-2">
                                  {item.no}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {item.partName}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {item.partDescription}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {item.uom}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {item.qty}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  ₹{item.unitPrice.toLocaleString("en-IN")}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  ₹{item.amount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            )
                          )}
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-gray-300 px-4 py-2 text-right font-bold"
                            >
                              TOTAL
                            </td>
                            <td className="border border-gray-300 px-4 py-2 font-bold">
                              ₹
                              {parseFloat(
                                selectedQuotation.subtotalAmount
                              ).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Financial Summary */}
              <div className="text-right">
                <h3 className="font-bold text-lg mb-4">Financial Summary</h3>
                <p>
                  <strong>Basic Amount:</strong> ₹
                  {parseFloat(selectedQuotation.subtotalAmount).toLocaleString(
                    "en-IN"
                  )}
                </p>
                {selectedQuotation.taxAmount &&
                  parseFloat(selectedQuotation.taxAmount) > 0 && (
                    <p>
                      <strong>IGST 18%:</strong> ₹
                      {parseFloat(selectedQuotation.taxAmount).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                {selectedQuotation.discountAmount &&
                  parseFloat(selectedQuotation.discountAmount) > 0 && (
                    <p>
                      <strong>Discount:</strong> ₹
                      {parseFloat(
                        selectedQuotation.discountAmount
                      ).toLocaleString("en-IN")}
                    </p>
                  )}
                <p className="font-bold text-xl">
                  <strong>Grand Total:</strong> ₹
                  {parseFloat(selectedQuotation.totalAmount).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              {/* Terms & Conditions */}
              <div>
                <h3 className="font-bold text-lg mb-2">Terms & Conditions</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Delivery:</strong>{" "}
                    {selectedQuotation.deliveryTerms ||
                      "25–30 days from approval of drawings"}
                  </li>
                  <li>
                    <strong>Packaging:</strong> Standard
                  </li>
                  <li>
                    <strong>Payment:</strong>{" "}
                    {selectedQuotation.paymentTerms ||
                      "50% advance, 50% against delivery"}
                  </li>
                  <li>
                    <strong>Warranty:</strong>{" "}
                    {selectedQuotation.warrantyTerms || "18 months"}
                  </li>
                  {selectedQuotation.specialTerms && (
                    <li>
                      <strong>Special Terms:</strong>{" "}
                      {selectedQuotation.specialTerms}
                    </li>
                  )}
                  <li>
                    One Nozzle Heater & one Nozzle T/C included in package
                  </li>
                </ul>
              </div>

              {/* Notes */}
              {selectedQuotation.notes && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Notes</h3>
                  <p>{selectedQuotation.notes}</p>
                </div>
              )}

              {/* Status */}
              <div className="text-center">
                <Badge
                  variant={
                    selectedQuotation.status === "approved"
                      ? "default"
                      : selectedQuotation.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  Status: {selectedQuotation.status?.toUpperCase() || "DRAFT"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Quotation: {selectedQuotation?.quotationNumber}
            </DialogTitle>
            <DialogDescription>
              Update the details of this quotation
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                if (!selectedQuotation) return;
                // Create PUT request to update existing quotation
                apiRequest(
                  "PUT",
                  `/outbound-quotations/${selectedQuotation.id}`,
                  {
                    ...data,
                    userId: "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Real user ID from database
                  }
                )
                  .then(() => {
                    toast({
                      title: "Success",
                      description: "Quotation updated successfully",
                    });
                    setIsEditDialogOpen(false);
                    queryClient.invalidateQueries({
                      queryKey: ["/api/outbound-quotations"],
                    });
                  })
                  .catch((error: any) => {
                    console.error("Failed to update quotation:", error);
                    toast({
                      title: "Error",
                      description:
                        error?.data?.error || "Failed to update quotation",
                      variant: "destructive",
                    });
                  });
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quotationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quotation Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="QUO-2024-001"
                          data-testid="input-quotation-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Customer <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No client</SelectItem>
                          {(customers || []).map((customer: any) => (
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
                  name="quotationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quotation Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value instanceof Date &&
                            !isNaN(field.value.getTime())
                              ? field.value.toISOString().split("T")[0]
                              : new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
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
                          value={
                            field.value instanceof Date &&
                            !isNaN(field.value.getTime())
                              ? field.value.toISOString().split("T")[0]
                              : new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                          data-testid="input-valid-until-date"
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
                  name="subtotalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Subtotal Amount <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-subtotal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-tax"
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
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-discount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Total Amount <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-total"
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
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="30 days"
                          data-testid="input-payment-terms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Terms</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Ex-works"
                          data-testid="input-delivery-terms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Additional notes for the quotation"
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQuotationMutation.isPending}
                  data-testid="button-submit"
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

      {/* Export All Dialog */}
      <Dialog
        open={isExportDialogOpen}
        onOpenChange={(open) => {
          setIsExportDialogOpen(open);
          if (!open) {
            setFilteredQuotations([]); // Clear preview when closing
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export All Quotations</DialogTitle>
            <DialogDescription>
              Filter quotations and export them to a file.
            </DialogDescription>
          </DialogHeader>

          <Form {...exportForm}>
            <form
              onSubmit={exportForm.handleSubmit(handleExportFilterSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Name Filter */}
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
                          <SelectTrigger data-testid="select-export-client">
                            <SelectValue placeholder="All Clients" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Clients</SelectItem>
                          {(customers || []).map((customer: any) => (
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

                {/* Status Filter */}
                <FormField
                  control={exportForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-export-status">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date From Filter */}
                <FormField
                  control={exportForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          data-testid="input-export-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date To Filter */}
                <FormField
                  control={exportForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          data-testid="input-export-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsExportDialogOpen(false);
                    exportForm.reset();
                    setFilteredQuotations([]);
                  }}
                  data-testid="button-export-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPreviewLoading}
                  data-testid="button-export-preview"
                >
                  {isPreviewLoading ? "Filtering..." : "Apply Filters"}
                </Button>
              </div>
            </form>
          </Form>

          {/* Preview Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">
              Filtered Quotations ({filteredQuotations.length})
            </h3>
            {filteredQuotations.length > 0 ? (
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                <DataTable
                  data={filteredQuotations}
                  columns={exportPreviewColumns}
                  searchable={false}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                {isPreviewLoading
                  ? "Loading..."
                  : "No quotations match the selected filters."}
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleExportAllSubmit}
              disabled={filteredQuotations.length === 0 || isPreviewLoading}
              data-testid="button-export-submit"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All ({filteredQuotations.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>All Outbound Quotations</span>
            {/* Export All Button */}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={handleExportAll}
              data-testid="button-export-all-main"
            >
              <Filter className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </CardTitle>
          <CardDescription>
            Company → Client quotations with workflow status management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Section */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold mb-4 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter Quotations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Customer Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Customer
                </label>
                <Select
                  value={mainFilters.customerId}
                  onValueChange={(value) =>
                    setMainFilters({ ...mainFilters, customerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Customers</SelectItem>
                    {(customers || []).map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={mainFilters.status}
                  onValueChange={(value) =>
                    setMainFilters({ ...mainFilters, status: value })
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

              {/* Start Date Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={mainFilters.startDate}
                  onChange={(e) =>
                    setMainFilters({
                      ...mainFilters,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={mainFilters.endDate}
                  onChange={(e) =>
                    setMainFilters({ ...mainFilters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={applyMainFilters}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button size="sm" variant="outline" onClick={clearMainFilters}>
                Clear Filters
              </Button>
              <div className="ml-auto text-sm text-muted-foreground flex items-center">
                Showing {displayedQuotations.length} of {quotations.length}{" "}
                quotation(s)
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            data={displayedQuotations || []}
            columns={columns}
            searchable={true}
            searchKey="quotationNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}
