import { useState } from "react";
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

  const { data: quotations = [], isLoading } = useQuery<OutboundQuotation[]>({
    queryKey: ["/outbound-quotations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  // Use shared schema with enhanced validation messages
  const quotationFormSchema = insertOutboundQuotationSchema.extend({
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
      warrantyTerms: "",
      specialTerms: "",
      notes: "",
      jobCardNumber: "",
      partNumber: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: z.infer<typeof quotationFormSchema>) =>
      apiRequest("POST", "/outbound-quotations", {
        ...data,
        userId: "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Real user ID from database
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outbound-quotations"] });
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
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
      status: quotation.status || "draft", // Ensure status is set
    };
    console.log("Resetting form with data:", resetData); // Debug log
    form.reset(resetData);
  };

  // Handler for Send action (updates status to 'sent')
  const handleSendQuotation = async (quotation: OutboundQuotation) => {
    try {
      // Update the status to "sent"
      await apiRequest("PUT", `/api/outbound-quotations/${quotation.id}`, {
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
  const handleDownloadQuotationPDF = async (quotation: OutboundQuotation) => {
    try {
      console.log(
        `🐛 [FRONTEND] handleDownloadQuotationPDF - Requesting PDF for quotation ID: ${quotation.id}`
      );

      // Make API request to get the PDF as a Blob
      const response = await apiRequest<Blob>(
        "GET",
        `/api/outbound-quotations/${quotation.id}/pdf`,
        undefined, // No body for GET request
        { responseType: "blob" } // Important: Expect a binary file (Blob)
      );

      console.log(
        `🐛 [FRONTEND] handleDownloadQuotationPDF - Received PDF blob for ID: ${quotation.id}`
      );

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(response); // Use response directly as it's already a Blob

      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      // Suggest a filename based on the quotation number
      link.setAttribute(
        "download",
        `Quotation_${quotation.quotationNumber}.pdf`
      );

      // Append to the body, click, and remove
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      // Clean up the object URL to free up memory
      window.URL.revokeObjectURL(url);

      console.log(
        `🐛 [FRONTEND] handleDownloadQuotationPDF - PDF download triggered for ID: ${quotation.id}`
      );

      toast({
        title: "Success",
        description: `Quotation ${quotation.quotationNumber} PDF downloaded successfully.`,
      });
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
      toast({
        title: "Error",
        description:
          error?.message ||
          `Failed to download PDF for quotation ${quotation.quotationNumber}.`,
        variant: "destructive",
      });
    }
  };

  // --- EXPORT ALL FUNCTIONALITY ---
  // Export filter schema
  const exportFilterSchema = z.object({
    customerId: z.string().optional(), // Optional for "All Customers"
    status: z
      .enum(["draft", "sent", "pending", "approved", "rejected"])
      .optional(),
    startDate: z.string().optional(), // Keep as string for form handling
    endDate: z.string().optional(), // Keep as string for form handling
  });

  // Export form
  const exportForm = useForm<z.infer<typeof exportFilterSchema>>({
    resolver: zodResolver(exportFilterSchema),
    defaultValues: {
      customerId: "", // Default to empty string (all customers)
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

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

      // Check if any filter is applied
      const hasCustomerId = data.customerId && data.customerId !== "";
      const hasStatus = !!data.status;
      const hasStartDate = !!data.startDate;
      const hasEndDate = !!data.endDate;

      // Validate date range if both dates are provided
      if (hasStartDate && hasEndDate) {
        const start = new Date(data.startDate!);
        const end = new Date(data.endDate!);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          toast({
            title: "Invalid Date Format",
            description: "Please enter dates in YYYY-MM-DD format",
            variant: "destructive",
          });
          setIsPreviewLoading(false);
          return;
        }

        if (start > end) {
          toast({
            title: "Invalid Date Range",
            description: "Start date must be before end date",
            variant: "destructive",
          });
          setIsPreviewLoading(false);
          return;
        }
      }

      // Check if at least one filter is applied
      const hasAnyFilter =
        hasCustomerId || hasStatus || hasStartDate || hasEndDate;

      if (!hasAnyFilter) {
        toast({
          title: "No Filters Applied",
          description: "Please select at least one filter criteria",
          variant: "secondary",
        });
        setIsPreviewLoading(false);
        setFilteredQuotations([]);
        return;
      }

      // Build query params for the GET request
      const queryParams = new URLSearchParams();

      // Only add parameters that have values
      if (hasCustomerId) {
        queryParams.append("customerId", data.customerId!);
      }

      if (hasStatus) {
        queryParams.append("status", data.status!);
      }

      if (hasStartDate) {
        queryParams.append("startDate", data.startDate!);
      }

      if (hasEndDate) {
        queryParams.append("endDate", data.endDate!);
      }

      // Fetch filtered quotations from the backend
      const response = await apiRequest<OutboundQuotation[]>(
        "GET",
        `/outbound-quotations?${queryParams.toString()}`
      );

      console.log("🐛 [EXPORT] Filtered quotations received:", response);

      // Update state with filtered results
      setFilteredQuotations(response || []);

      // Show success message with count
      if (response?.length > 0) {
        toast({
          title: "Filter Applied",
          description: `Found ${response.length} quotations matching your criteria.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Matching Records",
          description:
            "No quotations match your filter criteria. Try adjusting your filters.",
          variant: "secondary",
        });
      }
    } catch (error: any) {
      console.error("Failed to filter quotations:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to filter quotations",
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
      // Verify we have quotations to export
      if (filteredQuotations.length === 0) {
        toast({
          title: "No Data to Export",
          description: "Please apply filters to find quotations for export.",
          variant: "secondary",
        });
        return;
      }

      // Show loading toast
      toast({
        title: "Preparing Export",
        description: "Generating export file...",
      });

      // Prepare the query parameters for the export API based on current export form values
      const formData = exportForm.getValues();
      const queryParams = new URLSearchParams();

      // Check if any filter is applied
      const hasCustomerId = formData.customerId && formData.customerId !== "";
      const hasStatus = !!formData.status;
      const hasStartDate = !!formData.startDate;
      const hasEndDate = !!formData.endDate;

      // Verify at least one filter is applied
      const hasAnyFilter =
        hasCustomerId || hasStatus || hasStartDate || hasEndDate;

      if (!hasAnyFilter) {
        toast({
          title: "No Filters Applied",
          description:
            "Please select at least one filter criteria before exporting",
          variant: "secondary",
        });
        return;
      }

      // Only add parameters that have values
      if (hasCustomerId) {
        queryParams.append("customerId", formData.customerId);
      }

      if (hasStatus) {
        queryParams.append("status", formData.status!);
      }

      if (hasStartDate) {
        queryParams.append("startDate", formData.startDate!);
      }

      if (hasEndDate) {
        queryParams.append("endDate", formData.endDate!);
      }

      console.log(
        "🐛 [EXPORT] Exporting with params:",
        Object.fromEntries(queryParams.entries())
      );

      // Call the API to generate the export file
      const response = await apiRequest<Blob>(
        "GET",
        `/outbound-quotations/export?${queryParams.toString()}`,
        undefined,
        { responseType: "blob" } // Important: Expect a binary file (Blob)
      );

      // Generate a meaningful filename with date
      const today = new Date().toISOString().split("T")[0];
      const filename = `HotTip_Quotations_Export_${today}.xlsx`;

      // Create a download link for the blob
      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${filteredQuotations.length} quotations exported successfully.`,
      });

      // Close dialog and reset state
      setIsExportDialogOpen(false);
      setFilteredQuotations([]);
    } catch (error: any) {
      console.error("Failed to export quotations:", error);
      toast({
        title: "Export Failed",
        description:
          error?.message || "Failed to generate export file. Please try again.",
        variant: "destructive",
      });
    }
  };
  // --- END OF EXPORT ALL FUNCTIONALITY ---

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
            disabled={quotation.status === "sent"} // Optional: disable if already sent
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* Download PDF Button */}
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-download-${quotation.id}`}
            onClick={() => handleDownloadQuotationPDF(quotation)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
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
                onSubmit={form.handleSubmit((data) =>
                  createQuotationMutation.mutate(data)
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
                            <SelectItem value="">Select a customer</SelectItem>
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
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                    }}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              View Quotation: {selectedQuotation?.quotationNumber}
            </DialogTitle>
            <DialogDescription>
              Details of the selected quotation
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Quotation Number:</strong>{" "}
                  {selectedQuotation.quotationNumber}
                </div>
                <div>
                  <strong>Customer:</strong>{" "}
                  {selectedQuotation.customer?.name || "N/A"}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Quotation Date:</strong>{" "}
                  {new Date(
                    selectedQuotation.quotationDate
                  ).toLocaleDateString()}
                </div>
                <div>
                  <strong>Valid Until:</strong>{" "}
                  {selectedQuotation.validUntil
                    ? new Date(
                        selectedQuotation.validUntil
                      ).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Subtotal Amount:</strong> ₹
                  {parseFloat(selectedQuotation.subtotalAmount).toLocaleString(
                    "en-IN"
                  )}
                </div>
                <div>
                  <strong>Tax Amount:</strong> ₹
                  {parseFloat(selectedQuotation.taxAmount).toLocaleString(
                    "en-IN"
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Discount Amount:</strong> ₹
                  {parseFloat(selectedQuotation.discountAmount).toLocaleString(
                    "en-IN"
                  )}
                </div>
                <div>
                  <strong>Total Amount:</strong> ₹
                  {parseFloat(selectedQuotation.totalAmount).toLocaleString(
                    "en-IN"
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Payment Terms:</strong>{" "}
                  {selectedQuotation.paymentTerms || "N/A"}
                </div>
                <div>
                  <strong>Delivery Terms:</strong>{" "}
                  {selectedQuotation.deliveryTerms || "N/A"}
                </div>
              </div>
              <div>
                <strong>Notes:</strong> {selectedQuotation.notes || "N/A"}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {selectedQuotation.status?.toUpperCase() || "DRAFT"}
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
                // Prepare data for update
                // Ensure dates are Date objects or ISO strings if needed by backend
                // Let Drizzle handle Date objects
                const updateData = {
                  ...data,
                  quotationDate:
                    data.quotationDate instanceof Date
                      ? data.quotationDate
                      : new Date(data.quotationDate),
                  validUntil: data.validUntil
                    ? data.validUntil instanceof Date
                      ? data.validUntil
                      : new Date(data.validUntil)
                    : null,
                  updatedAt: new Date(), // Set updated timestamp
                };

                console.log("Sending update data:", updateData); // Debug log

                // Create PUT request to update existing quotation
                apiRequest(
                  "PUT",
                  `/api/outbound-quotations/${selectedQuotation.id}`,
                  updateData
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
                          <SelectItem value="">Select a customer</SelectItem>
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

              {/* --- ADD STATUS FIELD HERE --- */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "draft"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
              {/* --- END OF STATUS FIELD --- */}

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
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    form.reset(); // Optional: reset form on cancel
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  // Use a flag specific to the edit mutation if you add one
                  disabled={createQuotationMutation.isPending} // Or a separate edit mutation flag
                  data-testid="button-submit"
                >
                  Update Quotation
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Export All Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export All Quotations
            </DialogTitle>
            <DialogDescription>
              Filter quotations by client, status, and date range before
              exporting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filter Form - Left Column */}
            <div className="md:col-span-1 bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                FILTER OPTIONS
              </h3>

              <Form {...exportForm}>
                <form
                  onSubmit={exportForm.handleSubmit(handleExportFilterSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={exportForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-export-customer">
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

                  <FormField
                    control={exportForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full"
                            data-testid="input-export-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={exportForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full"
                            data-testid="input-export-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPreviewLoading}
                    data-testid="button-submit-export"
                  >
                    {isPreviewLoading ? "Filtering..." : "Apply Filters"}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Preview Section - Right Column */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  PREVIEW RESULTS
                </h3>
                <span className="text-sm bg-secondary px-2 py-1 rounded-md">
                  {filteredQuotations.length} quotation
                  {filteredQuotations.length !== 1 ? "s" : ""} found
                </span>
              </div>

              {filteredQuotations.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[350px] overflow-y-auto">
                    <DataTable
                      data={filteredQuotations || []}
                      columns={columns}
                      searchable={false}
                      searchKey="quotationNumber"
                    />
                  </div>

                  {/* Export Button */}
                  <div className="bg-muted/20 p-3 flex justify-end">
                    <Button
                      onClick={handleExportAllSubmit}
                      disabled={
                        filteredQuotations.length === 0 || isPreviewLoading
                      }
                      data-testid="button-export-all-submit"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All ({filteredQuotations.length} Quotation
                      {filteredQuotations.length !== 1 ? "s" : ""})
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg flex flex-col items-center justify-center p-8 h-[350px] text-center bg-muted/10">
                  <Filter className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground mb-2">
                    {isPreviewLoading
                      ? "Loading quotations..."
                      : "No quotations match the selected filters."}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {!isPreviewLoading &&
                      "Try adjusting your filter criteria or click 'Apply Filters' to see all available quotations."}
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExportDialogOpen(false)}
                  data-testid="button-cancel-export"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                <span>All Outbound Quotations</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Company → Client quotations with workflow status management
              </CardDescription>
            </div>

            {/* Export All Button */}
            <Button
              variant="outline"
              className="flex items-center gap-1"
              onClick={handleExportAll}
              data-testid="button-export-all-main"
            >
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={quotations || []}
            columns={columns}
            searchable={true}
            searchKey="quotationNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// import { useState } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/ui/data-table";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Plus, FileText, Eye, Edit, Send, Download, Filter } from "lucide-react";
// import { insertOutboundQuotationSchema, type InsertOutboundQuotation, type Customer, type OutboundQuotation } from "@shared/schema";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";
// import { z } from "zod";

// export default function OutboundQuotations() {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [selectedQuotation, setSelectedQuotation] = useState<OutboundQuotation | null>(null);
//   const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isExportDialogOpen, setIsExportDialogOpen] = useState(false); // For Export All
//   const [filteredQuotations, setFilteredQuotations] = useState<OutboundQuotation[]>([]);
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);
//   const { toast } = useToast();

//   const { data: quotations = [], isLoading } = useQuery<OutboundQuotation[]>({
//     queryKey: ["/outbound-quotations"],
//   });

//   const { data: customers = [] } = useQuery<Customer[]>({
//     queryKey: ["/customers"],
//   });

//   // Use shared schema with enhanced validation messages
//   const quotationFormSchema = insertOutboundQuotationSchema.extend({
//     quotationNumber: z.string().min(1, "⚠️ Quotation number is required (e.g., QUO-2025-001)"),
//     customerId: z.string().min(1, "⚠️ Please select a customer from the dropdown"),
//     subtotalAmount: z.string().min(1, "⚠️ Subtotal amount is required (e.g., 1000.00)"),
//     totalAmount: z.string().min(1, "⚠️ Total amount is required (e.g., 1180.00)"),
//   });

//   const form = useForm<z.infer<typeof quotationFormSchema>>({
//     resolver: zodResolver(quotationFormSchema),
//     defaultValues: {
//       status: 'draft',
//       quotationDate: new Date(),
//       validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
//       subtotalAmount: '0.00',
//       taxAmount: '0.00',
//       discountAmount: '0.00',
//       totalAmount: '0.00',
//       quotationNumber: '',
//       customerId: '',
//       userId: '79c36f2b-237a-4ba6-a4b3-a12fc8a18446', // Real user ID from database
//       deliveryTerms: '',
//       paymentTerms: '',
//       warrantyTerms: '',
//       specialTerms: '',
//       notes: '',
//       jobCardNumber: '',
//       partNumber: '',
//       bankName: '',
//       accountNumber: '',
//       ifscCode: ''
//     },
//   });

//   // --- EXPORT FILTER SCHEMA ---
//   const exportFilterSchema = z.object({
//     customerId: z.string().optional(),
//     status: z.enum(["draft", "sent", "pending", "approved", "rejected"]).optional(),
//     startDate: z.string().optional(), // Keep as string for form handling
//     endDate: z.string().optional(),   // Keep as string for form handling
//   });

//   const exportForm = useForm<z.infer<typeof exportFilterSchema>>({
//     resolver: zodResolver(exportFilterSchema),
//     defaultValues: {
//       customerId: "",
//       status: undefined,
//       startDate: "",
//       endDate: "",
//     },
//   });

//   const createQuotationMutation = useMutation({
//     mutationFn: (data: z.infer<typeof quotationFormSchema>) =>
//       apiRequest('POST', '/outbound-quotations', {
//         ...data,
//         userId: '79c36f2b-237a-4ba6-a4b3-a12fc8a18446' // Real user ID from database
//       }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['/api/outbound-quotations'] });
//       toast({
//         title: "Success",
//         description: "Quotation created successfully",
//       });
//       setIsDialogOpen(false);
//       form.reset();
//     },
//     onError: (error: any) => {
//       console.error('Quotation creation error:', error);

//       // Parse server validation errors and set field errors
//       const issues = error?.data?.errors ?? error?.errors;
//       if (Array.isArray(issues)) {
//         issues.forEach((e: { path?: string[]; message: string }) => {
//           const fieldName = e.path?.[0] as keyof InsertOutboundQuotation;
//           if (fieldName) {
//             form.setError(fieldName, { type: "server", message: e.message });
//           }
//         });
//       }

//       toast({
//         title: "Validation Error",
//         description: error?.message || "Please fix the highlighted fields and try again",
//         variant: "destructive",
//       });
//     },
//   });

//   // Handler for View action
//   const handleViewQuotation = (quotation: OutboundQuotation) => {
//     setSelectedQuotation(quotation);
//     setIsViewDialogOpen(true);
//   };

//   // Handler for Edit action
//   const handleEditQuotation = (quotation: OutboundQuotation) => {
//     setSelectedQuotation(quotation);
//     setIsEditDialogOpen(true);
//     // Reset form with quotation data
//     // Ensure dates are Date objects for the form controls
//     const resetData = {
//       ...quotation,
//       quotationDate: new Date(quotation.quotationDate),
//       validUntil: quotation.validUntil ? new Date(quotation.validUntil) : undefined,
//       subtotalAmount: String(quotation.subtotalAmount),
//       taxAmount: String(quotation.taxAmount),
//       discountAmount: String(quotation.discountAmount),
//       totalAmount: String(quotation.totalAmount),
//       customerId: quotation.customerId || '',
//       userId: quotation.userId || '79c36f2b-237a-4ba6-a4b3-a12fc8a18446',
//       status: quotation.status || 'draft',
//     };
//     console.log("Resetting form with data:", resetData); // Debug log
//     form.reset(resetData);
//   };

//   // Handler for Send action (updates status to 'sent')
//   const handleSendQuotation = async (quotation: OutboundQuotation) => {
//     try {
//       // Update the status to "sent"
//       await apiRequest('PUT', `/outbound-quotations/${quotation.id}`, {
//         status: 'sent', // Only send the status field to update
//       });

//       toast({
//         title: "Success",
//         description: "Quotation sent successfully",
//       });

//       // Refresh the list
//       queryClient.invalidateQueries({ queryKey: ['/api/outbound-quotations'] });
//     } catch (error: any) {
//       console.error('Failed to send quotation:', error);
//       toast({
//         title: "Error",
//         description: error?.data?.error || "Failed to send quotation",
//         variant: "destructive",
//       });
//     }
//   };

//   // Handler for Download PDF action
//   const handleDownloadPDF = async (quotation: OutboundQuotation) => {
//     try {
//       // Assuming you have an API endpoint that generates and returns a PDF file
//       const response = await apiRequest(
//         'GET',
//         `/outbound-quotations/${quotation.id}/pdf`,
//         undefined, // No body needed for GET
//         { responseType: 'blob' } // Important: Tell fetch/Axios to expect a binary blob
//       );

//       // Create a temporary anchor element to trigger the download
//       const url = window.URL.createObjectURL(new Blob([response]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `Quotation_${quotation.quotationNumber}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode?.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       toast({
//         title: "Success",
//         description: "Quotation PDF downloaded successfully",
//       });
//     } catch (error: any) {
//       console.error('Failed to download PDF:', error);
//       toast({
//         title: "Error",
//         description: "Failed to download quotation PDF",
//         variant: "destructive",
//       });
//     }
//   };

//   // --- EXPORT ALL FUNCTIONALITY ---
//   // Handler for Export All action (opens dialog)
//   const handleExportAll = () => {
//     setIsExportDialogOpen(true);
//     exportForm.reset(); // Reset the export form when opening
//     setFilteredQuotations([]); // Clear previous filtered results
//   };

//   // Handler for Export Filter Submit (preview filtered results)
//   const handleExportFilterSubmit = async (data: z.infer<typeof exportFilterSchema>) => {
//     try {
//       setIsPreviewLoading(true);
//       console.log("🐛 [EXPORT] Applying filters:", data);

//       // Build query params for the GET request
//       const queryParams = new URLSearchParams();
//       if (data.customerId && data.customerId !== "") {
//         queryParams.append("customerId", data.customerId);
//       }
//       if (data.status) {
//         queryParams.append("status", data.status);
//       }
//       if (data.startDate) {
//         queryParams.append("startDate", data.startDate);
//       }
//       if (data.endDate) {
//         queryParams.append("endDate", data.endDate);
//       }

//       // Fetch filtered quotations from the backend
//       // This assumes your backend supports query parameters for filtering
//       const response = await apiRequest<OutboundQuotation[]>(
//         'GET',
//         `/outbound-quotations?${queryParams.toString()}`
//       );

//       console.log("🐛 [EXPORT] Filtered quotations received:", response);
//       setFilteredQuotations(response || []);
//       toast({
//         title: "Success",
//         description: `Found ${response?.length || 0} quotations matching your filters.`,
//       });
//     } catch (error: any) {
//       console.error('Failed to filter quotations:', error);
//       toast({
//         title: "Error",
//         description: error?.data?.error || "Failed to filter quotations",
//         variant: "destructive",
//       });
//       setFilteredQuotations([]);
//     } finally {
//       setIsPreviewLoading(false);
//     }
//   };

//   // Handler for Export All Submit (download filtered results)
//   const handleExportAllSubmit = async () => {
//     try {
//       if (filteredQuotations.length === 0) {
//         toast({
//           title: "Info",
//           description: "No quotations to export. Please apply filters first.",
//           variant: "default",
//         });
//         return;
//       }

//       // Prepare the query parameters for the export API based on current export form values
//       const formData = exportForm.getValues();
//       const queryParams = new URLSearchParams();
//       if (formData.customerId && formData.customerId !== "") {
//         queryParams.append("customerId", formData.customerId);
//       }
//       if (formData.status) {
//         queryParams.append("status", formData.status);
//       }
//       if (formData.startDate) {
//         queryParams.append("startDate", formData.startDate);
//       }
//       if (formData.endDate) {
//         queryParams.append("endDate", formData.endDate);
//       }

//       // Call the API to generate the export (e.g., CSV, Excel, or PDF of all matching quotations)
//       // This assumes your backend has an endpoint like `/outbound-quotations/export`
//       const response = await apiRequest(
//         'GET',
//         `/outbound-quotations/export?${queryParams.toString()}`,
//         undefined,
//         { responseType: 'blob' } // Expect a binary file
//       );

//       // Trigger download of the exported file
//       const filename = `Outbound_Quotations_Export_${new Date().toISOString().split('T')[0]}.xlsx`; // Adjust extension based on your backend's output
//       const url = window.URL.createObjectURL(new Blob([response]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode?.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       toast({
//         title: "Success",
//         description: "Quotations exported successfully",
//       });

//       setIsExportDialogOpen(false); // Close the dialog after successful export
//       setFilteredQuotations([]); // Clear the preview
//     } catch (error: any) {
//       console.error('Failed to export quotations:', error);
//       toast({
//         title: "Error",
//         description: error?.data?.error || "Failed to export quotations",
//         variant: "destructive",
//       });
//     }
//   };

//   const columns = [
//     {
//       key: 'quotationNumber',
//       header: 'Quotation #',
//       cell: (quotation: any) => (
//         <div className="font-light">{quotation.quotationNumber}</div>
//       ),
//     },
//     {
//       key: 'customer',
//       header: 'Client',
//       cell: (quotation: any) => (
//         <div>
//           <div className="font-light">{quotation.customer?.name || 'N/A'}</div>
//           <div className="text-xs text-muted-foreground">{quotation.customer?.email || ''}</div>
//         </div>
//       ),
//     },
//     {
//       key: 'quotationDate',
//       header: 'Date',
//       cell: (quotation: any) => new Date(quotation.quotationDate).toLocaleDateString(),
//     },
//     {
//       key: 'totalAmount',
//       header: 'Total Amount',
//       cell: (quotation: any) => `₹${parseFloat(quotation.totalAmount).toLocaleString('en-IN')}`,
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       cell: (quotation: any) => {
//         const statusColors = {
//           draft: 'bg-gray-100 text-gray-800',
//           sent: 'bg-blue-100 text-blue-800',
//           pending: 'bg-yellow-100 text-yellow-800',
//           approved: 'bg-green-100 text-green-800',
//           rejected: 'bg-red-100 text-red-800'
//         };
//         return (
//           <Badge className={statusColors[quotation.status as keyof typeof statusColors] || statusColors.draft}>
//             {quotation.status?.toUpperCase() || 'DRAFT'}
//           </Badge>
//         );
//       },
//     },
//     {
//       key: 'actions',
//       header: 'Actions',
//       cell: (quotation: any) => (
//         <div className="flex items-center space-x-2">
//           {/* View Button */}
//           <Button size="sm" variant="ghost" data-testid={`button-view-${quotation.id}`}>
//             <Eye className="h-4 w-4" />
//           </Button>

//           {/* Edit Button */}
//           <Button size="sm" variant="ghost" data-testid={`button-edit-${quotation.id}`}>
//             <Edit className="h-4 w-4" />
//           </Button>

//           {/* Send Button */}
//           <Button size="sm" variant="ghost" data-testid={`button-send-${quotation.id}`}>
//             <Send className="h-4 w-4" />
//           </Button>

//           {/* Download PDF Button */}
//           <Button size="sm" variant="ghost" data-testid={`button-download-${quotation.id}`} onClick={() => handleDownloadPDF(quotation)}>
//             <Download className="h-4 w-4" />
//           </Button>
//         </div>
//       ),
//     }
//   ];

//   // Columns for the filtered preview table in the export dialog
//   const exportPreviewColumns = [
//     {
//       key: 'quotationNumber',
//       header: 'Quotation #',
//       cell: (quotation: any) => (
//         <div className="font-light">{quotation.quotationNumber}</div>
//       ),
//     },
//     {
//       key: 'customer',
//       header: 'Client',
//       cell: (quotation: any) => (
//         <div>
//           <div className="font-light">{quotation.customer?.name || 'N/A'}</div>
//         </div>
//       ),
//     },
//     {
//       key: 'quotationDate',
//       header: 'Date',
//       cell: (quotation: any) => new Date(quotation.quotationDate).toLocaleDateString(),
//     },
//     {
//       key: 'totalAmount',
//       header: 'Total Amount',
//       cell: (quotation: any) => `₹${parseFloat(quotation.totalAmount).toLocaleString('en-IN')}`,
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       cell: (quotation: any) => {
//         const statusColors = {
//           draft: 'bg-gray-100 text-gray-800',
//           sent: 'bg-blue-100 text-blue-800',
//           pending: 'bg-yellow-100 text-yellow-800',
//           approved: 'bg-green-100 text-green-800',
//           rejected: 'bg-red-100 text-red-800'
//         };
//         return (
//           <Badge className={statusColors[quotation.status as keyof typeof statusColors] || statusColors.draft}>
//             {quotation.status?.toUpperCase() || 'DRAFT'}
//           </Badge>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-8">
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight" data-testid="text-outbound-quotations-title">
//             Outbound Quotations
//           </h1>
//           <p className="text-muted-foreground">
//             Manage quotations sent to clients with full PDF field support
//           </p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button data-testid="button-new-outbound-quotation">
//               <Plus className="h-4 w-4 mr-2" />
//               New Quotation
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>Create New Quotation</DialogTitle>
//               <DialogDescription>
//                 Create a new outbound quotation for your client
//               </DialogDescription>
//             </DialogHeader>

//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(
//                 (data) => createQuotationMutation.mutate(data),
//                 // (errors) => {
//                 //   console.error('Form validation errors:', errors);
//                 //   toast({
//                 //     title: "Validation Error",
//                 //     description: "Please fix the highlighted fields and try again",

//                 //     variant: "destructive",
//                 //   });
//                 // }
//               )} className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="quotationNumber"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Quotation Number <span className="text-red-500">*</span></FormLabel>
//                         <FormControl>
//                           <Input {...field} placeholder="QUO-2024-001" data-testid="input-quotation-number" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="customerId"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
//                         <Select onValueChange={field.onChange} value={field.value || ""}>
//                           <FormControl>
//                             <SelectTrigger data-testid="select-customer">
//                               <SelectValue placeholder="Select customer" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="">No client</SelectItem>
//                             {(customers || []).map((customer: any) => (
//                               <SelectItem key={customer.id} value={customer.id}>
//                                 {customer.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="quotationDate"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Quotation Date</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="date"
//                             value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
//                             onChange={(e) => field.onChange(new Date(e.target.value))}
//                             data-testid="input-quotation-date"
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="validUntil"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Valid Until</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="date"
//                             value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
//                             onChange={(e) => field.onChange(new Date(e.target.value))}
//                             data-testid="input-valid-until-date"
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="subtotalAmount"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Subtotal Amount <span className="text-red-500">*</span></FormLabel>
//                         <FormControl>
//                           <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-subtotal" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="taxAmount"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Tax Amount</FormLabel>
//                         <FormControl>
//                           <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-tax" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="discountAmount"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Discount Amount</FormLabel>
//                         <FormControl>
//                           <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-discount" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="totalAmount"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Total Amount <span className="text-red-500">*</span></FormLabel>
//                         <FormControl>
//                           <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-total" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="paymentTerms"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Payment Terms</FormLabel>
//                         <FormControl>
//                           <Input {...field} value={field.value || ''} placeholder="30 days" data-testid="input-payment-terms" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="deliveryTerms"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Delivery Terms</FormLabel>
//                         <FormControl>
//                           <Input {...field} value={field.value || ''} placeholder="Ex-works" data-testid="input-delivery-terms" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <FormField
//                   control={form.control}
//                   name="notes"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Notes</FormLabel>
//                       <FormControl>
//                         <Textarea {...field} value={field.value || ''} placeholder="Additional notes for the quotation" data-testid="textarea-notes" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <div className="flex justify-end space-x-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setIsDialogOpen(false)}
//                     data-testid="button-cancel"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={createQuotationMutation.isPending}
//                     data-testid="button-submit"
//                   >
//                     {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
//                   </Button>
//                 </div>
//               </form>
//             </Form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* View Quotation Dialog */}
//       <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>View Quotation: {selectedQuotation?.quotationNumber}</DialogTitle>
//             <DialogDescription>
//               Details of the selected quotation
//             </DialogDescription>
//           </DialogHeader>

//           {selectedQuotation && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <strong>Quotation Number:</strong> {selectedQuotation.quotationNumber}
//                 </div>
//                 <div>
//                   <strong>Customer:</strong> {selectedQuotation.customer?.name || 'N/A'}
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <strong>Quotation Date:</strong> {new Date(selectedQuotation.quotationDate).toLocaleDateString()}
//                 </div>
//                 <div>
//                   <strong>Valid Until:</strong> {selectedQuotation.validUntil ? new Date(selectedQuotation.validUntil).toLocaleDateString() : 'N/A'}
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <strong>Subtotal Amount:</strong> ₹{parseFloat(selectedQuotation.subtotalAmount).toLocaleString('en-IN')}
//                 </div>
//                 <div>
//                   <strong>Tax Amount:</strong> ₹{parseFloat(selectedQuotation.taxAmount).toLocaleString('en-IN')}
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <strong>Discount Amount:</strong> ₹{parseFloat(selectedQuotation.discountAmount).toLocaleString('en-IN')}
//                 </div>
//                 <div>
//                   <strong>Total Amount:</strong> ₹{parseFloat(selectedQuotation.totalAmount).toLocaleString('en-IN')}
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <strong>Payment Terms:</strong> {selectedQuotation.paymentTerms || 'N/A'}
//                 </div>
//                 <div>
//                   <strong>Delivery Terms:</strong> {selectedQuotation.deliveryTerms || 'N/A'}
//                 </div>
//               </div>
//               <div>
//                 <strong>Notes:</strong> {selectedQuotation.notes || 'N/A'}
//               </div>
//               <div>
//                 <strong>Status:</strong> {selectedQuotation.status?.toUpperCase() || 'DRAFT'}
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Edit Quotation Dialog */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Edit Quotation: {selectedQuotation?.quotationNumber}</DialogTitle>
//             <DialogDescription>
//               Update the details of this quotation
//             </DialogDescription>
//           </DialogHeader>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(
//               (data) => {
//                 if (!selectedQuotation) return;
//                 // Create PUT request to update existing quotation
//                 apiRequest('PUT', `/outbound-quotations/${selectedQuotation.id}`, {
//                   ...data,
//                   userId: '79c36f2b-237a-4ba6-a4b3-a12fc8a18446' // Real user ID from database
//                 })
//                 .then(() => {
//                   toast({
//                     title: "Success",
//                     description: "Quotation updated successfully",
//                   });
//                   setIsEditDialogOpen(false);
//                   queryClient.invalidateQueries({ queryKey: ['/api/outbound-quotations'] });
//                 })
//                 .catch((error: any) => {
//                   console.error('Failed to update quotation:', error);
//                   toast({
//                     title: "Error",
//                     description: error?.data?.error || "Failed to update quotation",
//                     variant: "destructive",
//                   });
//                 });
//               }
//             )} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="quotationNumber"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Quotation Number <span className="text-red-500">*</span></FormLabel>
//                       <FormControl>
//                         <Input {...field} placeholder="QUO-2024-001" data-testid="input-quotation-number" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="customerId"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
//                       <Select onValueChange={field.onChange} value={field.value || ""}>
//                         <FormControl>
//                           <SelectTrigger data-testid="select-customer">
//                             <SelectValue placeholder="Select customer" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="">No client</SelectItem>
//                           {(customers || []).map((customer: any) => (
//                             <SelectItem key={customer.id} value={customer.id}>
//                               {customer.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="quotationDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Quotation Date</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="date"
//                           value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
//                           onChange={(e) => field.onChange(new Date(e.target.value))}
//                           data-testid="input-quotation-date"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="validUntil"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Valid Until</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="date"
//                           value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
//                           onChange={(e) => field.onChange(new Date(e.target.value))}
//                           data-testid="input-valid-until-date"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="subtotalAmount"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Subtotal Amount <span className="text-red-500">*</span></FormLabel>
//                       <FormControl>
//                         <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-subtotal" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="taxAmount"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Tax Amount</FormLabel>
//                       <FormControl>
//                         <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-tax" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="discountAmount"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Discount Amount</FormLabel>
//                       <FormControl>
//                         <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-discount" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="totalAmount"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Total Amount <span className="text-red-500">*</span></FormLabel>
//                       <FormControl>
//                         <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-total" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="paymentTerms"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Payment Terms</FormLabel>
//                       <FormControl>
//                         <Input {...field} value={field.value || ''} placeholder="30 days" data-testid="input-payment-terms" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="deliveryTerms"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Delivery Terms</FormLabel>
//                       <FormControl>
//                         <Input {...field} value={field.value || ''} placeholder="Ex-works" data-testid="input-delivery-terms" />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <FormField
//                 control={form.control}
//                 name="notes"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Notes</FormLabel>
//                     <FormControl>
//                       <Textarea {...field} value={field.value || ''} placeholder="Additional notes for the quotation" data-testid="textarea-notes" />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="flex justify-end space-x-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setIsEditDialogOpen(false)}
//                   data-testid="button-cancel"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={createQuotationMutation.isPending}
//                   data-testid="button-submit"
//                 >
//                   {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* Export All Dialog */}
//       <Dialog open={isExportDialogOpen} onOpenChange={(open) => {
//         setIsExportDialogOpen(open);
//         if (!open) {
//           setFilteredQuotations([]); // Clear preview when closing
//         }
//       }}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Export All Quotations</DialogTitle>
//             <DialogDescription>
//               Filter quotations and export them to a file.
//             </DialogDescription>
//           </DialogHeader>

//           <Form {...exportForm}>
//             <form onSubmit={exportForm.handleSubmit(handleExportFilterSubmit)} className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Client Name Filter */}
//                 <FormField
//                   control={exportForm.control}
//                   name="customerId"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Client Name</FormLabel>
//                       <Select onValueChange={field.onChange} value={field.value || ""}>
//                         <FormControl>
//                           <SelectTrigger data-testid="select-export-client">
//                             <SelectValue placeholder="All Clients" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="">All Clients</SelectItem>
//                           {(customers || []).map((customer: any) => (
//                             <SelectItem key={customer.id} value={customer.id}>
//                               {customer.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {/* Status Filter */}
//                 <FormField
//                   control={exportForm.control}
//                   name="status"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Select Status</FormLabel>
//                       <Select onValueChange={field.onChange} value={field.value || ""}>
//                         <FormControl>
//                           <SelectTrigger data-testid="select-export-status">
//                             <SelectValue placeholder="All Statuses" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="">All Statuses</SelectItem>
//                           <SelectItem value="draft">Draft</SelectItem>
//                           <SelectItem value="sent">Sent</SelectItem>
//                           <SelectItem value="pending">Pending</SelectItem>
//                           <SelectItem value="approved">Approved</SelectItem>
//                           <SelectItem value="rejected">Rejected</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Date From Filter */}
//                 <FormField
//                   control={exportForm.control}
//                   name="startDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>From Date</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="date"
//                           value={field.value || ""}
//                           onChange={(e) => field.onChange(e.target.value)}
//                           data-testid="input-export-start-date"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {/* Date To Filter */}
//                 <FormField
//                   control={exportForm.control}
//                   name="endDate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>To Date</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="date"
//                           value={field.value || ""}
//                           onChange={(e) => field.onChange(e.target.value)}
//                           data-testid="input-export-end-date"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <div className="flex justify-end space-x-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => {
//                     setIsExportDialogOpen(false);
//                     exportForm.reset();
//                     setFilteredQuotations([]);
//                   }}
//                   data-testid="button-export-cancel"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={isPreviewLoading}
//                   data-testid="button-export-preview"
//                 >
//                   {isPreviewLoading ? "Filtering..." : "Apply Filters"}
//                 </Button>
//               </div>
//             </form>
//           </Form>

//           {/* Preview Section */}
//           <div className="mt-6">
//             <h3 className="text-lg font-semibold mb-2">Filtered Quotations ({filteredQuotations.length})</h3>
//             {filteredQuotations.length > 0 ? (
//               <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
//                 <DataTable
//                   data={filteredQuotations}
//                   columns={exportPreviewColumns}
//                   searchable={false}
//                 />
//               </div>
//             ) : (
//               <div className="text-center text-muted-foreground py-4">
//                 {isPreviewLoading ? "Loading..." : "No quotations match the selected filters."}
//               </div>
//             )}
//           </div>

//           {/* Export Button */}
//           <div className="flex justify-end mt-4">
//             <Button
//               onClick={handleExportAllSubmit}
//               disabled={filteredQuotations.length === 0 || isPreviewLoading}
//               data-testid="button-export-submit"
//             >
//               <Download className="h-4 w-4 mr-2" />
//               Export All ({filteredQuotations.length})
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2">
//             <FileText className="h-5 w-5" />
//             <span>All Outbound Quotations</span>
//             {/* Export All Button */}
//             <Button
//               size="sm"
//               variant="outline"
//               className="ml-auto"
//               onClick={handleExportAll}
//               data-testid="button-export-all-main"
//             >
//               <Filter className="h-4 w-4 mr-2" />
//               Export All
//             </Button>
//           </CardTitle>
//           <CardDescription>
//             Company → Client quotations with workflow status management
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <DataTable
//             data={(quotations || [])}
//             columns={columns}
//             searchable={true}
//             searchKey="quotationNumber"
//           />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
