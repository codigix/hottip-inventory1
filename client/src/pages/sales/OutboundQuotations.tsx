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
  const [newItemForm, setNewItemForm] = useState<any>({
    partName: "",
    partDescription: "",
    uom: "NOS",
    qty: 1,
    unitPrice: 0,
  });
  const [editingMoldIndex, setEditingMoldIndex] = useState<number | null>(null);

  const { data: quotations = [], isLoading } = useQuery<OutboundQuotation[]>({
    queryKey: ["/outbound-quotations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  const { data: savedMoldDetails = [] } = useQuery<any[]>({
    queryKey: ["/mold-details"],
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
      userId: "b34e3723-ba42-402d-b454-88cf96340573", // Real user ID from database
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
    mutationFn: (data: z.infer<typeof quotationFormSchema>) => {
      // Calculate totalAmount from items if quotationItems exists
      let totalAmount = parseFloat(data.totalAmount) || 0;
      let subtotalAmount = parseFloat(data.subtotalAmount) || 0;
      
      // If there are quotation items and totalAmount is 0, calculate from items
      if (quotationItems.length > 0 && totalAmount === 0) {
        subtotalAmount = quotationItems.reduce((sum, item) => {
          return sum + (parseFloat(item.unitPrice || 0) * (item.qty || 0));
        }, 0);
        
        const taxAmount = parseFloat(data.taxAmount) || 0;
        const discountAmount = parseFloat(data.discountAmount) || 0;
        totalAmount = subtotalAmount + taxAmount - discountAmount;
      }
      
      return apiRequest("POST", "/outbound-quotations", {
        ...data,
        subtotalAmount: String(subtotalAmount),
        totalAmount: String(totalAmount),
        userId: "b34e3723-ba42-402d-b454-88cf96340573", // Real user ID from database
        moldDetails,
        quotationItems,
      });
    },
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
      userId: quotation.userId || "b34e3723-ba42-402d-b454-88cf96340573",
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
        userId: quotation.userId || "b34e3723-ba42-402d-b454-88cf96340573", // Default user ID
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

  // Handler for Delete action
  const handleDeleteQuotation = async (quotation: OutboundQuotation) => {
    if (!window.confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}?`)) {
      return;
    }

    try {
      await apiRequest("DELETE", `/outbound-quotations/${quotation.id}`);

      toast({
        title: "Success",
        description: "Quotation deleted successfully",
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
    const newIndex = moldDetails.length;
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
    setEditingMoldIndex(newIndex);
  };

  const removeMoldDetail = (index: number) => {
    const updated = moldDetails.filter((_, i) => i !== index);
    // Renumber the items
    const renumbered = updated.map((item, i) => ({ ...item, no: i + 1 }));
    setMoldDetails(renumbered);
  };

  const updateMoldDetail = (index: number, field: string, value: any) => {
    console.log(`📝 Updating mold[${index}].${field} from "${moldDetails[index]?.[field]}" to "${value}"`);
    const updated = [...moldDetails];
    updated[index] = { ...updated[index], [field]: value };
    setMoldDetails(updated);
    console.log(`✅ Updated state:`, updated[index]);
  };

  const saveMoldDetailMutation = useMutation({
    mutationFn: (moldData: any) =>
      apiRequest("POST", "/mold-details", moldData),
    onSuccess: () => {
      toast({
        title: "✅ Success",
        description: "Mold detail saved successfully",
      });
      setEditingMoldIndex(null);
      queryClient.invalidateQueries({ queryKey: ["/mold-details"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description:
          error?.message || "Failed to save mold detail",
        variant: "destructive",
      });
    },
  });

  const saveMoldDetail = (index: number) => {
    const moldDetail = moldDetails[index];
    console.log("🔍 Current moldDetails state:", moldDetails);
    console.log(`🔍 Saving moldDetails[${index}]:`, moldDetail);
    
    if (!moldDetail || !moldDetail.partName) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please fill in the Part Name field",
        variant: "destructive",
      });
      return;
    }

    console.log("📤 About to send mold detail:", moldDetail);

    saveMoldDetailMutation.mutate({
      partName: moldDetail.partName?.trim() || "",
      mouldNo: moldDetail.mouldNo?.trim() || "",
      plasticMaterial: moldDetail.plasticMaterial?.trim() || "",
      colourChange: moldDetail.colourChange?.trim() || "",
      mfi: moldDetail.mfi?.trim() || "",
      wallThickness: moldDetail.wallThickness?.trim() || "",
      noOfCavity: moldDetail.noOfCavity,
      gfPercent: moldDetail.gfPercent?.trim() || "",
      mfPercent: moldDetail.mfPercent?.trim() || "",
      partWeight: moldDetail.partWeight,
      systemSuggested: moldDetail.systemSuggested?.trim() || "",
      noOfDrops: moldDetail.noOfDrops,
      trialDate: moldDetail.trialDate?.trim() || "",
      quotationFor: moldDetail.quotationFor?.trim() || "",
    });
  };

  // Helper functions for Quotation Items
  const addQuotationItem = (moldIndex?: number) => {
    const amount = (newItemForm.qty || 0) * (newItemForm.unitPrice || 0);
    setQuotationItems([
      ...quotationItems,
      {
        no: quotationItems.length + 1,
        moldIndex: moldIndex !== undefined ? moldIndex : -1,
        partName: newItemForm.partName,
        partDescription: newItemForm.partDescription,
        uom: newItemForm.uom,
        qty: newItemForm.qty,
        unitPrice: newItemForm.unitPrice,
        amount: amount,
        tasks: [],
      },
    ]);
    setNewItemForm({
      partName: "",
      partDescription: "",
      uom: "NOS",
      qty: 1,
      unitPrice: 0,
    });
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

  const addItemTask = (itemIndex: number, taskName: string) => {
    if (!taskName.trim()) return;
    const updated = [...quotationItems];
    if (!updated[itemIndex].tasks) {
      updated[itemIndex].tasks = [];
    }
    updated[itemIndex].tasks.push({
      id: Date.now(),
      name: taskName,
      completed: false,
    });
    setQuotationItems(updated);
  };

  const completeItemTask = (itemIndex: number, taskId: number) => {
    const updated = [...quotationItems];
    if (updated[itemIndex].tasks) {
      updated[itemIndex].tasks = updated[itemIndex].tasks.map((task: any) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
    }
    setQuotationItems(updated);
  };

  const deleteItemTask = (itemIndex: number, taskId: number) => {
    const updated = [...quotationItems];
    if (updated[itemIndex].tasks) {
      updated[itemIndex].tasks = updated[itemIndex].tasks.filter(
        (task: any) => task.id !== taskId
      );
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
      cell: (quotation: any) => {
        let total = parseFloat(quotation.totalAmount) || 0;
        
        // If totalAmount is 0 but there is subtotalAmount, use that
        if (total === 0 && quotation.subtotalAmount) {
          total = parseFloat(quotation.subtotalAmount) || 0;
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
        <div className="flex items-center space-x-2" data-tour="sales-quotation-actions">
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

          {/* Delete Button */}
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-delete-${quotation.id}`}
            onClick={() => handleDeleteQuotation(quotation)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
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
      cell: (quotation: any) => {
        let total = parseFloat(quotation.totalAmount) || 0;
        
        // If totalAmount is 0 but there is subtotalAmount, use that
        if (total === 0 && quotation.subtotalAmount) {
          total = parseFloat(quotation.subtotalAmount) || 0;
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
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              setMoldDetails([]);
              setQuotationItems([]);
              setNewItemForm({
                partName: "",
                partDescription: "",
                uom: "NOS",
                qty: 1,
                unitPrice: 0,
              });
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-new-outbound-quotation" data-tour="sales-new-quotation-button">
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
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
                    <div className="space-y-6">
                      {moldDetails.map((mold, index) => {
                        const moldItems = quotationItems.filter(item => item.moldIndex === index);
                        const moldTotal = moldItems.reduce((sum, item) => sum + (item.amount || 0), 0);

                        return (
                        <div
                          key={index}
                          className="border-2 border-gray-300 rounded-lg p-6 bg-white"
                        >
                          <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-gray-200">
                            <h3 className="text-xl font-bold">
                              MODEL {mold.no} – {mold.partName || "New Model"} {mold.mouldNo && `(${mold.mouldNo})`}
                            </h3>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMoldIndex(editingMoldIndex === index ? null : index)}
                                style={{ display: !mold.partName ? 'none' : 'block' }}
                              >
                                {editingMoldIndex === index ? 'Close Edit' : 'Edit'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMoldDetail(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {/* Display Mode - Always Visible on Left, with Edit Form on Right when Editing */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Left: Display Mode - Show only if not editing and has data */}
                            {editingMoldIndex !== index && mold.partName && (
                            <div id={`mold-display-${index}`} className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Part Name:</span>
                                <span className="text-gray-900">{mold.partName || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Mould No:</span>
                                <span className="text-gray-900">{mold.mouldNo || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Plastic Material:</span>
                                <span className="text-gray-900">{mold.plasticMaterial || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Colour Change:</span>
                                <span className="text-gray-900">{mold.colourChange || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">MFI:</span>
                                <span className="text-gray-900">{mold.mfi || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Wall Thickness:</span>
                                <span className="text-gray-900">{mold.wallThickness || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">No. of Cavity:</span>
                                <span className="text-gray-900">{mold.noOfCavity || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">No. of Drops:</span>
                                <span className="text-gray-900">{mold.noOfDrops || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">System Suggested:</span>
                                <span className="text-gray-900">{mold.systemSuggested || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Trial Date:</span>
                                <span className="text-gray-900">{mold.trialDate || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-700">Part Weight:</span>
                                <span className="text-gray-900">{mold.partWeight ? `${mold.partWeight}g` : 'N/A'}</span>
                              </div>
                              {mold.gfPercent && (
                                <div className="flex justify-between border-b pb-2">
                                  <span className="font-medium text-gray-700">GF% + MP%:</span>
                                  <span className="text-gray-900">{mold.gfPercent} + {mold.mfPercent}</span>
                                </div>
                              )}
                            </div>
                            {mold.quotationFor && (
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <span className="font-medium text-gray-700">Quotation For:</span>
                                <p className="text-gray-900 mt-1">{mold.quotationFor}</p>
                              </div>
                            )}
                          </div>
                            )}
                          </div>

                          {/* Right: Edit Mode - Visible when editing or creating new */}
                          {(editingMoldIndex === index || !mold.partName) && (
                          <div id={`mold-edit-${index}`} className="pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Part Name
                                </label>
                              <Input
                                type="text"
                                value={mold.partName || ""}
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
                                type="text"
                                value={mold.mouldNo || ""}
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
                                type="text"
                                value={mold.plasticMaterial || ""}
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
                                type="text"
                                value={mold.colourChange || ""}
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
                                type="text"
                                value={mold.mfi || ""}
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
                                type="text"
                                value={mold.wallThickness || ""}
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
                                  type="text"
                                  value={mold.gfPercent || ""}
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
                                  type="text"
                                  value={mold.mfPercent || ""}
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
                                type="text"
                                value={mold.systemSuggested || ""}
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
                                value={mold.noOfDrops || 1}
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
                                value={mold.trialDate || ""}
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
                                type="text"
                                value={mold.quotationFor || ""}
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
                            )}

                          {/* Items Section */}
                          <div className="mt-6 mb-6">
                            <h5 className="font-semibold text-lg mb-4">Items for this Model</h5>
                            
                            {/* Add Item Form - Always at Top */}
                            <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div>
                                  <label className="text-sm font-medium block mb-1">Part Name</label>
                                  <Input
                                    placeholder="Hot Runner"
                                    value={newItemForm.partName}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, partName: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-1">Description</label>
                                  <Input
                                    placeholder="AMP-D15-26120"
                                    value={newItemForm.partDescription}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, partDescription: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-1">UOM</label>
                                  <select
                                    value={newItemForm.uom}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, uom: e.target.value })}
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                  >
                                    <option value="NOS">NOS</option>
                                    <option value="PCS">PCS</option>
                                    <option value="SET">SET</option>
                                    <option value="KG">KG</option>
                                    <option value="L">L</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-1">Qty</label>
                                  <Input
                                    type="number"
                                    placeholder="1"
                                    value={newItemForm.qty}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, qty: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-1">Rate</label>
                                  <Input
                                    type="number"
                                    placeholder="18000"
                                    value={newItemForm.unitPrice}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addQuotationItem(index)}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                              >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Item
                              </Button>
                            </div>
                            
                            {/* Items Table - Below */}
                            {moldItems.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-gray-300 p-2 text-left text-sm">No</th>
                                      <th className="border border-gray-300 p-2 text-left text-sm">Part Name</th>
                                      <th className="border border-gray-300 p-2 text-left text-sm">Description</th>
                                      <th className="border border-gray-300 p-2 text-left text-sm">UOM</th>
                                      <th className="border border-gray-300 p-2 text-right text-sm">Qty</th>
                                      <th className="border border-gray-300 p-2 text-right text-sm">Rate</th>
                                      <th className="border border-gray-300 p-2 text-right text-sm">Amount</th>
                                      <th className="border border-gray-300 p-2 text-center text-sm">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {moldItems.map((item, itemIndex) => {
                                      const actualIndex = quotationItems.findIndex(qi => qi === item);
                                      return (
                                        <tr key={actualIndex} className="border border-gray-300 hover:bg-gray-50">
                                          <td className="border border-gray-300 p-2 text-sm">{item.no}</td>
                                          <td className="border border-gray-300 p-2 text-sm">{item.partName}</td>
                                          <td className="border border-gray-300 p-2 text-sm">{item.partDescription}</td>
                                          <td className="border border-gray-300 p-2 text-sm">{item.uom}</td>
                                          <td className="border border-gray-300 p-2 text-right text-sm">{item.qty}</td>
                                          <td className="border border-gray-300 p-2 text-right text-sm">₹{item.unitPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                          <td className="border border-gray-300 p-2 text-right text-sm font-semibold">₹{item.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                          <td className="border border-gray-300 p-2 text-center">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => removeQuotationItem(actualIndex)}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No items added yet</p>
                            )}
                          </div>

                          {/* Model Subtotal */}
                          <div className="bg-blue-50 p-4 rounded border-2 border-blue-200 mb-6">
                            <div className="flex justify-end">
                              <div className="w-64">
                                <div className="flex justify-between text-lg font-bold">
                                  <span>Model {mold.no} Total:</span>
                                  <span>₹{moldTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-4 border-t-2 border-gray-200">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => saveMoldDetail(index)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              Save Mold Detail
                            </Button>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>

                {/* Calculation Summary Section */}
                {quotationItems.length > 0 && (
                  <div className="border-t pt-4 mt-6 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                    
                    <div className="space-y-2 max-w-md ml-auto">
                      {/* Subtotal */}
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>
                          ₹{quotationItems.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* GST */}
                      <div className="flex justify-between text-sm">
                        <span>GST ({form.watch("gstPercentage")}%):</span>
                        <span>
                          ₹{((quotationItems.reduce((sum, item) => sum + (item.amount || 0), 0) * (parseFloat(form.watch("gstPercentage")) || 18)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Discount */}
                      {parseFloat(form.watch("discountAmount")) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span>
                            -₹{parseFloat(form.watch("discountAmount") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Grand Total */}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                        <span>Grand Total:</span>
                        <span>
                          ₹{(
                            quotationItems.reduce((sum, item) => sum + (item.amount || 0), 0) +
                            ((quotationItems.reduce((sum, item) => sum + (item.amount || 0), 0) * (parseFloat(form.watch("gstPercentage")) || 18)) / 100) -
                            (parseFloat(form.watch("discountAmount")) || 0)
                          ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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

              {/* Quotation Items Table - Grouped by Mold */}
              {selectedQuotation.quotationItems &&
                selectedQuotation.quotationItems.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">
                      Quotation Items by Mold
                    </h3>
                    
                    {selectedQuotation.moldDetails &&
                      selectedQuotation.moldDetails.length > 0 ? (
                      selectedQuotation.moldDetails.map(
                        (mold: any, moldIndex: number) => {
                          const moldItems = selectedQuotation.quotationItems.filter(
                            (item: any) => item.moldIndex === moldIndex
                          );
                          const moldSubtotal = moldItems.reduce(
                            (sum: number, item: any) => sum + (item.amount || 0),
                            0
                          );

                          return (
                            <div key={moldIndex} className="mb-6">
                              <h4 className="font-semibold text-md mb-3 bg-gray-100 p-2 rounded">
                                Mold {mold.no}: {mold.partName || mold.mouldNo || `Mold #${mold.no}`}
                              </h4>
                              
                              {moldItems.length > 0 ? (
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
                                      {moldItems.map(
                                        (item: any, itemIndex: number) => (
                                          <tr key={itemIndex}>
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
                                      <tr className="bg-blue-50">
                                        <td
                                          colSpan={6}
                                          className="border border-gray-300 px-4 py-2 text-right font-bold"
                                        >
                                          Subtotal for {mold.partName || mold.mouldNo || `Mold #${mold.no}`}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">
                                          ₹{moldSubtotal.toLocaleString("en-IN")}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No items for this mold</p>
                              )}
                            </div>
                          );
                        }
                      )
                    ) : (
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
                    )}
                  </div>
                )}

              {/* Financial Summary */}
              <div className="text-right">
                <h3 className="font-bold text-lg mb-4">Financial Summary</h3>
                
                {(() => {
                  const basicAmount = selectedQuotation.quotationItems
                    ? selectedQuotation.quotationItems.reduce(
                        (sum: number, item: any) => sum + (item.amount || 0),
                        0
                      )
                    : parseFloat(selectedQuotation.subtotalAmount) || 0;
                  
                  const gstPercentage = parseFloat(selectedQuotation.gstPercentage) || 18;
                  const gstAmount = basicAmount * (gstPercentage / 100);
                  const discountAmount = parseFloat(selectedQuotation.discountAmount) || 0;
                  const grandTotal = basicAmount + gstAmount - discountAmount;

                  return (
                    <>
                      <p>
                        <strong>Basic Amount:</strong> ₹
                        {basicAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p>
                        <strong>IGST {gstPercentage}%:</strong> ₹
                        {gstAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {discountAmount > 0 && (
                        <p>
                          <strong>Discount:</strong> ₹
                          {discountAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                      <p className="font-bold text-xl mt-2 pt-2 border-t-2 border-gray-400">
                        <strong>Grand Total:</strong> ₹
                        {grandTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </>
                  );
                })()}
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
                    userId: "b34e3723-ba42-402d-b454-88cf96340573", // Real user ID from database
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
        <CardHeader data-tour="sales-quotation-header">
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
              data-tour="sales-quotation-export-button"
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
          <div className="mb-6 p-4 border rounded-lg bg-gray-50" data-tour="sales-quotation-filter-section">
            <h3 className="text-sm font-semibold mb-4 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter Quotations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Customer Filter */}
              <div data-tour="sales-quotation-customer-filter">
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
              <div data-tour="sales-quotation-status-filter">
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
          <div data-tour="sales-quotation-list">
            <DataTable
              data={displayedQuotations || []}
              columns={columns}
              searchable={true}
              searchKey="quotationNumber"
            />
          </div>
        </CardContent>
      </Card>

      {/* Saved Mold Details Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Saved Mold Details</CardTitle>
          <CardDescription>
            All mold details saved for reuse ({savedMoldDetails.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedMoldDetails && savedMoldDetails.length > 0 ? (
            <div className="space-y-4">
              {(savedMoldDetails as any[]).map((mold: any) => (
                <div
                  key={mold.id}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {mold.partName || "N/A"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Mould No: {mold.mouldNo || "N/A"} | Material: {mold.plasticMaterial || "N/A"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMoldDetails([
                          ...moldDetails,
                          {
                            no: moldDetails.length + 1,
                            partName: mold.partName,
                            mouldNo: mold.mouldNo,
                            plasticMaterial: mold.plasticMaterial,
                            colourChange: mold.colourChange,
                            mfi: mold.mfi,
                            wallThickness: mold.wallThickness,
                            noOfCavity: mold.noOfCavity,
                            gfPercent: mold.gfPercent,
                            mfPercent: mold.mfPercent,
                            partWeight: mold.partWeight,
                            systemSuggested: mold.systemSuggested,
                            noOfDrops: mold.noOfDrops,
                            trialDate: mold.trialDate,
                            quotationFor: mold.quotationFor,
                          },
                        ]);
                        toast({
                          title: "✅ Added",
                          description: `${mold.partName} added to form`,
                        });
                      }}
                    >
                      Use
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm mb-3">
                    <div>
                      <span className="font-medium">Wall Thickness:</span> {mold.wallThickness || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">No. of Cavity:</span> {mold.noOfCavity || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Part Weight:</span> {mold.partWeight ? `${mold.partWeight}g` : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Trial Date:</span> {mold.trialDate || "N/A"}
                    </div>
                  </div>

                  {mold.quotationFor && (
                    <div className="text-sm bg-blue-50 p-2 rounded mb-2">
                      <span className="font-medium">Quotation For:</span> {mold.quotationFor}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        apiRequest("DELETE", `/mold-details/${mold.id}`).then(
                          () => {
                            toast({
                              title: "✅ Deleted",
                              description: "Mold detail removed",
                            });
                            queryClient.invalidateQueries({ queryKey: ["/mold-details"] });
                          }
                        );
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                    <span className="text-xs text-gray-500 ml-auto flex items-center">
                      Created: {new Date(mold.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No saved mold details yet.</p>
              <p className="text-sm mt-2">
                Fill in the mold details above and click "Save Mold Detail" to add them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
