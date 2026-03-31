import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Trash2,
  PlusCircle,
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Building2,
  CreditCard,
  FileText,
  FileEdit,
  Settings,
  LayoutGrid,
} from "lucide-react";
import {
  insertOutboundQuotationSchema,
  type Customer,
  type OutboundQuotation,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  History, 
  ArrowRight, 
  MinusCircle, 
  CheckCircle2, 
  Clock, 
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Equal,
  Calendar
} from "lucide-react";

// Version History & Comparison Component
function VersionHistorySidebar({ 
  quotations, 
  currentQuotation, 
  reviseFromId
}: { 
  quotations: OutboundQuotation[], 
  currentQuotation: any,
  reviseFromId: string | null;
}) {
  const sortedQuotations = [...quotations].sort((a, b) => 
    new Date(a.quotationDate).getTime() - new Date(b.quotationDate).getTime()
  );

  const prevQuotation = quotations.find(q => q.id === reviseFromId);
  const currentTotal = parseFloat(currentQuotation.totalAmount || "0");
  const prevTotal = prevQuotation ? parseFloat(prevQuotation.totalAmount || "0") : 0;
  const totalChange = currentTotal - prevTotal;

  return (
    <div className="flex flex-col h-full bg-white border-l shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Version History & Comparison
        </h2>
        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[10px]">
          Revised
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Version List */}
        <div className="p-4 space-y-3 border-b">
          {sortedQuotations.map((q, idx) => (
            <div 
              key={q.id} 
              className={`p-3 rounded-lg border transition-all ${
                q.id === reviseFromId 
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" 
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold text-slate-800">
                  Quotation v{idx + 1}
                  {q.id === reviseFromId && (
                    <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 text-[9px] h-4">
                      PREVIOUS
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  ₹{parseFloat(q.totalAmount).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Calendar className="h-3 w-3" />
                {format(new Date(q.quotationDate), "dd MMMM yyyy")}
                <Separator orientation="vertical" className="h-2" />
                <span className="capitalize">{q.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Details */}
        {prevQuotation && (
          <div className="p-4 space-y-4 bg-slate-50/30">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              Compare Quotation v{sortedQuotations.length} → v{sortedQuotations.length + 1}
            </h3>

            {/* Total Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 mb-1">Previous Total</div>
                <div className="text-sm font-bold text-slate-700">₹{prevTotal.toLocaleString("en-IN")}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-200 relative overflow-hidden">
                <div className="text-[10px] text-orange-400 mb-1">Revised Total</div>
                <div className="text-sm font-bold text-orange-700">₹{currentTotal.toLocaleString("en-IN")}</div>
                <div className="absolute top-1 right-2">
                  {totalChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : totalChange < 0 ? (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Equal className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Item Changes */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-600">Item Breakdown</div>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Item</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentQuotation.quotationItems.map((item: any) => {
                      const prevItem = prevQuotation.quotationItems?.find((pi: any) => pi.partDescription === item.partDescription);
                      const currentPrice = parseFloat(item.unitPrice || "0");
                      const prevPrice = prevItem ? parseFloat(prevItem.unitPrice || "0") : 0;
                      const priceDiff = currentPrice - prevPrice;

                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-slate-700 truncate max-w-[120px] text-xs">{item.partDescription}</td>
                          <td className="px-3 py-2 text-right">
                            {priceDiff !== 0 ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400 line-through">₹{prevPrice}</span>
                                <ArrowRight className="h-2 w-2 text-slate-400" />
                                <span className={priceDiff > 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                                  ₹{currentPrice}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">₹{currentPrice} (No Change)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Change Summary */}
            <div className="p-3 bg-white border rounded-lg flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Total Change:</span>
              <span className={`text-sm font-bold ${totalChange > 0 ? "text-red-600" : totalChange < 0 ? "text-emerald-600" : "text-slate-600"}`}>
                {totalChange > 0 ? "+" : ""}{totalChange.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Revision Reasons / Notes */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-600">Revision Reasons</div>
              <div className="p-3 bg-white border rounded-lg italic text-[11px] text-slate-500 min-h-[60px]">
                {currentQuotation.revisionReasons || "No significant reasons provided."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const quotationFormSchema = insertOutboundQuotationSchema
  .extend({
    quotationNumber: z
      .string()
      .optional(),
    customerId: z
      .string()
      .min(1, "⚠️ Please select a customer from the dropdown"),
    subtotalAmount: z
      .string()
      .min(1, "⚠️ Subtotal amount is required"),
    totalAmount: z
      .string()
      .min(1, "⚠️ Total amount is required"),
    revisionReasons: z
      .string()
      .optional(),
  })
  .omit({
    warrantyTerms: true,
    specialTerms: true,
  });

type FormValues = z.infer<typeof quotationFormSchema>;

export default function QuotationFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const reviseFromId = searchParams.get("reviseFromId");
  const isRevision = !!reviseFromId;

  const [moldDetails, setMoldDetails] = useState<any[]>([]);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [editingMoldIndex, setEditingMoldIndex] = useState<number | null>(null);
  const [isAddingMold, setIsAddingMold] = useState(false);
  const [tempMold, setTempMold] = useState<any>({
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
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  const { data: quotation, isLoading: isLoadingQuotation } = useQuery<OutboundQuotation>({
    queryKey: [`/outbound-quotations/${id}`],
    enabled: isEdit,
  });

  const { data: sourceQuotation, isLoading: isLoadingSource } = useQuery<OutboundQuotation>({
    queryKey: [`/outbound-quotations/${reviseFromId}`],
    enabled: isRevision,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      status: isRevision ? "revised" : "draft",
      quotationDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotalAmount: "0.00",
      taxAmount: "0.00",
      discountAmount: "0.00",
      totalAmount: "0.00",
      quotationNumber: "",
      customerId: "",
      deliveryTerms: "",
      paymentTerms: "",
      bankingDetails: "",
      termsConditions: "",
      notes: "",
      revisionReasons: "",
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
      companyAddress: "123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra",
      companyGstin: "27AAAAA0000A1Z5",
      companyEmail: "info@chenpupatiplastics.com",
      companyPhone: "+91-9876543210",
      companyWebsite: "www.chenpupatiplastics.com",
    },
  });

  const customerId = form.watch("customerId");

  const { data: customerQuotations = [] } = useQuery<OutboundQuotation[]>({
    queryKey: [`/api/outbound-quotations?customerId=${customerId}`],
    enabled: !!customerId,
    queryFn: () => apiRequest(`/api/outbound-quotations?customerId=${customerId}`),
  });

  useEffect(() => {
    // Check for customerId in URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const customerIdParam = searchParams.get("customerId");
    
    if (customerIdParam && !isEdit && customers.length > 0) {
      const customer = customers.find(c => c.id === customerIdParam);
      if (customer) {
        // Reset form to default values first to avoid keeping old state
        form.reset({
          ...form.getValues(),
          customerId: customer.id,
          companyName: customer.company || customer.name,
          companyAddress: customer.address || "",
          companyEmail: customer.email || "",
          companyPhone: customer.phone || "",
        });

        // Set specific values again to be sure
        form.setValue("customerId", customer.id);
        form.setValue("companyName", customer.company || customer.name);
        form.setValue("companyAddress", customer.address || "");
        form.setValue("companyEmail", customer.email || "");
        form.setValue("companyPhone", customer.phone || "");
        
        // Also update the gst number if available in customer record
        if (customer.gstNumber) {
          form.setValue("companyGstin", customer.gstNumber);
        }
      }
    }
  }, [isEdit, customers, form]);

  useEffect(() => {
    if (!isEdit && !form.getValues("quotationNumber")) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      form.setValue("quotationNumber", `QTN-${timestamp}-${random}`);
    }
  }, [isEdit, form]);

  useEffect(() => {
    if (isEdit && quotation) {
      setMoldDetails(quotation.moldDetails || []);
      setQuotationItems(quotation.quotationItems || []);
      
      form.reset({
        ...quotation,
        quotationDate: new Date(quotation.quotationDate),
        validUntil: quotation.validUntil ? new Date(quotation.validUntil) : undefined,
        subtotalAmount: String(quotation.subtotalAmount),
        taxAmount: String(quotation.taxAmount),
        discountAmount: String(quotation.discountAmount),
        totalAmount: String(quotation.totalAmount),
        customerId: quotation.customerId || "",
        status: (quotation.status as any) || "draft",
        projectIncharge: quotation.projectIncharge || "",
        bankingDetails: quotation.bankingDetails || "",
        termsConditions: quotation.termsConditions || "",
        moldDetails: quotation.moldDetails || [],
        quotationItems: quotation.quotationItems || [],
      });
    } else if (isRevision && sourceQuotation) {
      setMoldDetails(sourceQuotation.moldDetails || []);
      setQuotationItems(sourceQuotation.quotationItems || []);
      
      // Reset form with source data but for a NEW quotation
      form.reset({
        ...sourceQuotation,
        quotationDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotalAmount: String(sourceQuotation.subtotalAmount),
        taxAmount: String(sourceQuotation.taxAmount),
        discountAmount: String(sourceQuotation.discountAmount),
        totalAmount: String(sourceQuotation.totalAmount),
        customerId: sourceQuotation.customerId || "",
        status: "draft", // Always draft for a new revision
        quotationNumber: "", // Will be auto-generated by the next useEffect
        projectIncharge: sourceQuotation.projectIncharge || "",
        bankingDetails: sourceQuotation.bankingDetails || "",
        termsConditions: sourceQuotation.termsConditions || "",
        moldDetails: sourceQuotation.moldDetails || [],
        quotationItems: sourceQuotation.quotationItems || [],
      });
      
      toast({
        title: "Revised Quotation",
        description: "Form has been pre-filled with data from the previous quotation.",
      });
    }
  }, [isEdit, isRevision, quotation, sourceQuotation, form, toast]);

  useEffect(() => {
    const subtotal = quotationItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const gstPercent = parseFloat(form.getValues("gstPercentage")) || 18;
    const tax = subtotal * (gstPercent / 100);
    const discount = parseFloat(form.getValues("discountAmount")) || 0;
    const total = subtotal + tax - discount;

    form.setValue("subtotalAmount", subtotal.toFixed(2));
    form.setValue("taxAmount", tax.toFixed(2));
    form.setValue("totalAmount", total.toFixed(2));
  }, [quotationItems, form.watch("gstPercentage"), form.watch("discountAmount")]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      // Enrich quotationItems with mold info for easier PDF generation
      const enrichedItems = quotationItems.map(item => {
        const mold = moldDetails.find(m => m.id === item.moldId);
        return {
          ...item,
          partName: mold?.partName || "",
          mouldNo: mold?.mouldNo || ""
        };
      });

      const payload = {
        ...data,
        moldDetails,
        quotationItems: enrichedItems,
      };
      return isEdit
        ? apiRequest("PUT", `/outbound-quotations/${id}`, payload)
        : apiRequest("POST", "/outbound-quotations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/outbound-quotations"] });
      toast({
        title: "Success",
        description: `Quotation ${isEdit ? "updated" : "created"} successfully`,
      });
      setLocation("/sales/outbound-quotations");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const addMoldDetail = () => {
    const moldId = uuidv4();
    const newMold = {
      ...tempMold,
      id: moldId,
      no: moldDetails.length + 1,
    };
    const updatedMolds = [...moldDetails, newMold];
    setMoldDetails(updatedMolds);
    setEditingMoldIndex(updatedMolds.length - 1); // Auto-expand new mold
    setIsAddingMold(false);
    setTempMold({
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
    });
    toast({
      title: "Mold Added",
      description: "You can now add items to this mold below.",
    });
  };

  const removeMoldDetail = (index: number) => {
    const moldToRemove = moldDetails[index];
    const updated = moldDetails.filter((_, i) => i !== index);
    setMoldDetails(updated.map((m, i) => ({ ...m, no: i + 1 })));
    if (moldToRemove?.id) {
      setQuotationItems(quotationItems.filter(item => item.moldId !== moldToRemove.id));
    }
  };

  const updateMoldDetail = (index: number, field: string, value: any) => {
    const updated = [...moldDetails];
    updated[index] = { ...updated[index], [field]: value };
    setMoldDetails(updated);
  };

  const addQuotationItem = (moldId: string) => {
    const newItem = {
      id: uuidv4(),
      moldId,
      no: quotationItems.filter(i => i.moldId === moldId).length + 1,
      partDescription: "",
      uom: "NOS",
      qty: 1,
      unitPrice: 0,
      amount: 0,
    };
    setQuotationItems([...quotationItems, newItem]);
  };

  const updateQuotationItem = (itemId: string, field: string, value: any) => {
    setQuotationItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === "qty" || field === "unitPrice") {
          updatedItem.amount = (parseFloat(String(updatedItem.qty)) || 0) * (parseFloat(String(updatedItem.unitPrice)) || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeQuotationItem = (itemId: string) => {
    setQuotationItems(prev => prev.filter(item => item.id !== itemId));
  };

  const status = form.watch("status");
  const isLocked = status === "approved" || status === "rejected";

  if ((isEdit && isLoadingQuotation) || (isRevision && isLoadingSource)) {
    return <div className="p-4 text-center text-gray-500">Loading quotation details...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <div className={`flex-1 p-2 mx-auto space-y-3 ${isRevision ? "lg:max-w-[calc(100%-350px)]" : "max-w-5xl"}`}>
        <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 py-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/sales/outbound-quotations")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl  ">{isEdit ? "Edit" : isRevision ? "Revised" : "New"} Quotation</h1>
              <p className="text-xs text-gray-500">Professional Quotation Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/sales/outbound-quotations")}>
              Cancel
            </Button>
            
            {!isLocked && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => {
                    form.setValue("status", "draft");
                    form.handleSubmit((data) => mutation.mutate(data))();
                  }}
                  className="border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button 
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.setValue("status", "rejected");
                    form.handleSubmit((data) => mutation.mutate(data))();
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                >
                  <MinusCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.setValue("status", "approved");
                    form.handleSubmit((data) => mutation.mutate(data))();
                  }}
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={form.handleSubmit((data) => mutation.mutate(data))} className="shadow-md px-8 bg-primary">
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Update" : isRevision ? "Save Revised" : "Save"} Quotation
                </Button>
              </div>
            )}
            {isLocked && (
               <div className="flex items-center gap-3">
                 <Badge variant="outline" className={`px-4 py-2 ${status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                   {status === 'approved' ? 'Approved & Locked' : 'Rejected'}
                 </Badge>
                 <Button 
                   onClick={() => setLocation(`/sales/outbound-quotations/new?reviseFromId=${id}`)}
                   className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                 >
                   <FileEdit className="h-4 w-4 mr-2" />
                   Revise Quotation
                 </Button>
               </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-2">
            <fieldset disabled={isLocked} className="space-y-2">
            {/* 1. Basic Information */}
            <Card className="border-none overflow-hidden shadow-sm">
            <CardHeader className="bg-white border-b py-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">Quotation Details</CardTitle>
                  <CardDescription className="text-xs">Primary identification and status.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
              <FormField
                control={form.control}
                name="quotationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs  ">Quotation No</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="" className="bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quotationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs  ">Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all  "
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
                    <FormLabel className="text-xs  ">Customer / Client</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const customer = customers.find(c => c.id === value);
                        if (customer) {
                          form.setValue("companyName", customer.company || customer.name);
                          const fullAddress = [
                            customer.address,
                            customer.city,
                            customer.state,
                            customer.zipCode,
                            customer.country
                          ].filter(Boolean).join(", ");
                          form.setValue("companyAddress", fullAddress);
                          if (customer.email) form.setValue("companyEmail", customer.email);
                          if (customer.phone) form.setValue("companyPhone", customer.phone);
                          if (customer.gstNumber) form.setValue("companyGstin", customer.gstNumber);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 text-xs border-slate-200 focus:bg-white transition-all  ">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
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
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs  ">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white transition-all  ">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="revised">Revised</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRevision && (
                <FormField
                  control={form.control}
                  name="revisionReasons"
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel className="text-xs">Revision Reasons</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Explain why this quotation is being revised..." 
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-all min-h-[80px]" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* 2. Mold & Item Details */}
          <Card className="border-none  overflow-hidden">
            <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mold & Item Configuration</CardTitle>
                  <CardDescription className="text-xs">Add molds and define specific quotation items for each.</CardDescription>
                </div>
              </div>
              {!isAddingMold && !isLocked && (
                <Button type="button" size="sm" onClick={() => setIsAddingMold(true)} className="rounded ">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Mold
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-2 space-y-3">
              {isAddingMold && (
                <div className="border-2 border-primary/20 rounded-xl p-2 bg-primary/5 space-y-2 mb-2 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className=" text-primary flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add Mold Specification
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingMold(false)} className="h-8 hover:bg-white/50">Cancel</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Part Name</FormLabel>
                      <Input value={tempMold.partName} onChange={(e) => setTempMold({...tempMold, partName: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Mould No</FormLabel>
                      <Input value={tempMold.mouldNo} onChange={(e) => setTempMold({...tempMold, mouldNo: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Plastic Material</FormLabel>
                      <Input value={tempMold.plasticMaterial} onChange={(e) => setTempMold({...tempMold, plasticMaterial: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Color</FormLabel>
                      <Input value={tempMold.colourChange} onChange={(e) => setTempMold({...tempMold, colourChange: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">No. of Cavity</FormLabel>
                      <Input type="number" value={tempMold.noOfCavity} onChange={(e) => setTempMold({...tempMold, noOfCavity: parseInt(e.target.value)})} className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Part Weight (Gms)</FormLabel>
                      <Input type="number" value={tempMold.partWeight} onChange={(e) => setTempMold({...tempMold, partWeight: parseFloat(e.target.value)})} className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">MFI</FormLabel>
                      <Input value={tempMold.mfi} onChange={(e) => setTempMold({...tempMold, mfi: e.target.value})} className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Wall Thickness</FormLabel>
                      <Input value={tempMold.wallThickness} onChange={(e) => setTempMold({...tempMold, wallThickness: e.target.value})} className="bg-white border-slate-200 focus:border-primary transition-all  " />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={addMoldDetail} className="p-2 rounded">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Mold to List
                    </Button>
                  </div>
                </div>
              )}

              {moldDetails.length === 0 && !isAddingMold && (
                <div className="text-center p-2 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <div className="bg-white w-16 h-16 rounded flex items-center justify-center mx-auto mb-2 ">
                    <Package className="h-8 w-8 text-gray-500/30" />
                  </div>
                  <h3 className="text-sm  text-slate-700">No Molds Configured</h3>
                  <p className="text-gray-500 max-w-xs mx-auto text-xs mt-1">Add mold specifications first, then define items for your quotation.</p>
                  {!isLocked && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingMold(true)} className="mt-6">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Mold
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {moldDetails.map((mold, mIndex) => (
                  <div key={mold.id || mIndex} className="border border-slate-200 rounded-xl bg-white overflow-hidden  transition-all">
                    <div 
                      className={`p-4 border-b flex items-center justify-between cursor-pointer transition-colors ${editingMoldIndex === mIndex ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                      onClick={() => setEditingMoldIndex(editingMoldIndex === mIndex ? null : mIndex)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-200 text-slate-600 w-8 h-8 rounded flex items-center justify-center  text-xs">
                          {mold.no}
                        </div>
                        <div>
                          <div className=" text-slate-800">{mold.partName || "Untitled Mold"}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{mold.mouldNo || "No ID"}</span>
                            <Separator orientation="vertical" className="h-2" />
                            <span>{mold.plasticMaterial || "No Material"}</span>
                            <Separator orientation="vertical" className="h-2" />
                            <span>{mold.noOfCavity} Cavities</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isLocked && (
                          <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeMoldDetail(mIndex); }} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="text-slate-400">
                          {editingMoldIndex === mIndex ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>

                    {editingMoldIndex === mIndex && (
                      <div className="p-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Mold Specifications */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
                          {[
                            { label: "Part Name", value: mold.partName, field: "partName" },
                            { label: "Mould No", value: mold.mouldNo, field: "mouldNo" },
                            { label: "Material", value: mold.plasticMaterial, field: "plasticMaterial" },
                            { label: "Color", value: mold.colourChange, field: "colourChange" },
                            { label: "MFI", value: mold.mfi, field: "mfi" },
                            { label: "Wall (mm)", value: mold.wallThickness, field: "wallThickness" },
                            { label: "Cavities", value: mold.noOfCavity, field: "noOfCavity", type: "number" },
                            { label: "Weight (g)", value: mold.partWeight, field: "partWeight", type: "number" },
                          ].map((spec) => (
                            <div key={spec.field} className="space-y-1">
                              <label className="text-xs   text-slate-400 ">{spec.label}</label>
                              <Input 
                                type={spec.type || "text"}
                                value={spec.value} 
                                onChange={(e) => updateMoldDetail(mIndex, spec.field, spec.type === "number" ? parseFloat(e.target.value) : e.target.value)} 
                                className="h-8 text-sm border-slate-200 bg-slate-50 focus:bg-white focus:border-primary transition-all "
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className=" text-sm text-slate-700 flex items-center gap-2">
                              <Settings className="h-4 w-4 text-primary" />
                              Quotation Items for this Mold
                            </h4>
                            {!isLocked && (
                              <Button type="button" variant="outline" size="sm" onClick={() => addQuotationItem(mold.id)} className="h-8 border-primary/20 text-primary hover:bg-primary/5">
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                              </Button>
                            )}
                          </div>

                          <div className="border border-slate-100 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  <th className="px-4 py-3 text-left  text-slate-500 w-12  er">No</th>
                                  <th className="px-4 py-3 text-left  text-slate-500  er">Description</th>
                                  <th className="px-4 py-3 text-left  text-slate-500 w-24  er text-center">UOM</th>
                                  <th className="px-4 py-3 text-left  text-slate-500 w-20  er text-center">Qty</th>
                                  <th className="px-4 py-3 text-left  text-slate-500 w-32  er text-right">Unit Price</th>
                                  <th className="px-4 py-3 text-left  text-slate-500 w-32  er text-right">Amount</th>
                                  <th className="px-2 py-3 text-right w-10"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {quotationItems.filter(item => item.moldId === mold.id).map((item, qIndex) => (
                                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-2 font-mono text-slate-400">{qIndex + 1}</td>
                                    <td className="px-4 py-2">
                                      <Input 
                                        value={item.partDescription} 
                                        onChange={(e) => updateQuotationItem(item.id, "partDescription", e.target.value)}
                                        placeholder=""
                                        className="border-none bg-transparent h-8 focus:bg-white focus:ring-1 focus:ring-slate-200 px-2 transition-all shadow-none text-slate-800"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <Select value={item.uom} onValueChange={(val) => updateQuotationItem(item.id, "uom", val)}>
                                        <SelectTrigger className="border-none bg-transparent h-8 focus:ring-0 shadow-none text-center">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="NOS">NOS</SelectItem>
                                          <SelectItem value="SET">SET</SelectItem>
                                          <SelectItem value="KGS">KGS</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      <input 
                                        type="number"
                                        value={item.qty} 
                                        onChange={(e) => updateQuotationItem(item.id, "qty", e.target.value)}
                                        className="w-12 text-center bg-transparent border-none focus:bg-white focus:ring-1 focus:ring-slate-200 px-1 rounded transition-all"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      <input 
                                        type="number"
                                        value={item.unitPrice} 
                                        onChange={(e) => updateQuotationItem(item.id, "unitPrice", e.target.value)}
                                        className="w-24 text-right bg-transparent border-none focus:bg-white focus:ring-1 focus:ring-slate-200 px-1 rounded transition-all"
                                      />
                                    </td>
                                    <td className="px-4 py-2  text-right text-slate-900">
                                      ₹{(parseFloat(String(item.amount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                      {!isLocked && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeQuotationItem(item.id)} className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {quotationItems.filter(item => item.moldId === mold.id).length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400 italic">
                                      No items added for this mold yet. Click "Add Item" to start.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Company & Banking */}
            <Card className="border-none  overflow-hidden">
              <CardHeader className="bg-white border-b py-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Company & Banking</CardTitle>
                    <CardDescription className="text-xs">Your organization and payment details.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs  ">Company Name</FormLabel>
                      <FormControl><Input {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs  ">Bank Name</FormLabel>
                        <FormControl><Input {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankAccountNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs  ">Account Number</FormLabel>
                        <FormControl><Input {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs  ">Company Address</FormLabel>
                      <FormControl><Textarea {...field} className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all  min-h-[80px] text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 4. Terms & Summary */}
            <Card className="border-none  overflow-hidden">
              <CardHeader className="bg-white border-b py-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xs">Financial Summary</CardTitle>
                    <CardDescription className="text-xs">Final terms and grand total calculation.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs  ">Payment Terms</FormLabel>
                        <FormControl><Input {...field} placeholder="" className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs  ">Delivery Terms</FormLabel>
                        <FormControl><Input {...field} placeholder="" className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs  ">GST %</FormLabel>
                        <FormControl><Input {...field} type="number" className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs  ">Discount (₹)</FormLabel>
                        <FormControl><Input {...field} type="number" className="bg-slate-50 border-slate-200 focus:bg-white transition-all  " /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-primary text-white p-2 rounded space-y-2 shadow-inner">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{parseFloat(form.watch("subtotalAmount") || "0").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>GST ({form.watch("gstPercentage")}%)</span>
                    <span>₹{parseFloat(form.watch("taxAmount") || "0").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-400">
                    <span>Discount</span>
                    <span>-₹{parseFloat(form.watch("discountAmount") || "0").toLocaleString()}</span>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex justify-between  text-xl pt-1">
                    <span className="text-slate-200 text-sm">Total Amount</span>
                    <span className="text-primary-foreground text-sm">₹{parseFloat(form.watch("totalAmount") || "0").toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
            </fieldset>
          </form>
        </Form>
      </div>
      
      {isRevision && (
        <div className="w-[350px] shrink-0 sticky top-0 h-screen overflow-hidden">
          <VersionHistorySidebar 
            quotations={customerQuotations}
            currentQuotation={{
              ...form.getValues(),
              quotationItems
            }}
            reviseFromId={reviseFromId}
          />
        </div>
      )}
    </div>
  );
}
