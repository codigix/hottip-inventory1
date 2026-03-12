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

const quotationFormSchema = insertOutboundQuotationSchema
  .extend({
    quotationNumber: z
      .string()
      .min(1, "⚠️ Quotation number is required"),
    customerId: z
      .string()
      .min(1, "⚠️ Please select a customer from the dropdown"),
    subtotalAmount: z
      .string()
      .min(1, "⚠️ Subtotal amount is required"),
    totalAmount: z
      .string()
      .min(1, "⚠️ Total amount is required"),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      status: "draft",
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
      companyEmail: "info@chennupatiplastics.com",
      companyPhone: "+91-9876543210",
      companyWebsite: "www.chennupatiplastics.com",
    },
  });

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
    }
  }, [isEdit, quotation, form]);

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
      const payload = {
        ...data,
        moldDetails,
        quotationItems,
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

  if (isEdit && isLoadingQuotation) {
    return <div className="p-8 text-center text-muted-foreground">Loading quotation details...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 py-4 -mt-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/sales/outbound-quotations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit" : "New"} Quotation</h1>
            <p className="text-xs text-muted-foreground">Professional Quotation Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setLocation("/sales/outbound-quotations")}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit((data) => mutation.mutate(data))} className="shadow-md px-8">
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Update" : "Save"} Quotation
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {/* 1. Basic Information */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b py-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quotation Details</CardTitle>
                  <CardDescription className="text-xs">Primary identification and status.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="quotationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider">Quotation No</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="" className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" />
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider">Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10"
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider">Customer / Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10">
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10">
                          <SelectValue placeholder="" />
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
            </CardContent>
          </Card>

          {/* 2. Mold & Item Details */}
          <Card className="border-none shadow-sm overflow-hidden">
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
              {!isAddingMold && (
                <Button type="button" size="sm" onClick={() => setIsAddingMold(true)} className="rounded-full shadow-sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Mold
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isAddingMold && (
                <div className="border-2 border-primary/20 rounded-xl p-6 bg-primary/5 space-y-4 mb-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add Mold Specification
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingMold(false)} className="h-8 hover:bg-white/50">Cancel</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Part Name</FormLabel>
                      <Input value={tempMold.partName} onChange={(e) => setTempMold({...tempMold, partName: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Mould No</FormLabel>
                      <Input value={tempMold.mouldNo} onChange={(e) => setTempMold({...tempMold, mouldNo: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Plastic Material</FormLabel>
                      <Input value={tempMold.plasticMaterial} onChange={(e) => setTempMold({...tempMold, plasticMaterial: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Color</FormLabel>
                      <Input value={tempMold.colourChange} onChange={(e) => setTempMold({...tempMold, colourChange: e.target.value})} placeholder="" className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">No. of Cavity</FormLabel>
                      <Input type="number" value={tempMold.noOfCavity} onChange={(e) => setTempMold({...tempMold, noOfCavity: parseInt(e.target.value)})} className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Part Weight (Gms)</FormLabel>
                      <Input type="number" value={tempMold.partWeight} onChange={(e) => setTempMold({...tempMold, partWeight: parseFloat(e.target.value)})} className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">MFI</FormLabel>
                      <Input value={tempMold.mfi} onChange={(e) => setTempMold({...tempMold, mfi: e.target.value})} className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs">Wall Thickness</FormLabel>
                      <Input value={tempMold.wallThickness} onChange={(e) => setTempMold({...tempMold, wallThickness: e.target.value})} className="bg-white border-slate-200 focus:border-primary transition-all h-10 shadow-sm" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={addMoldDetail} className="px-6 h-9">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Mold to List
                    </Button>
                  </div>
                </div>
              )}

              {moldDetails.length === 0 && !isAddingMold && (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700">No Molds Configured</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm mt-1">Add mold specifications first, then define items for your quotation.</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingMold(true)} className="mt-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Mold
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {moldDetails.map((mold, mIndex) => (
                  <div key={mold.id || mIndex} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all">
                    <div 
                      className={`p-4 border-b flex items-center justify-between cursor-pointer transition-colors ${editingMoldIndex === mIndex ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                      onClick={() => setEditingMoldIndex(editingMoldIndex === mIndex ? null : mIndex)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                          {mold.no}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{mold.partName || "Untitled Mold"}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                            <span>{mold.mouldNo || "No ID"}</span>
                            <Separator orientation="vertical" className="h-2" />
                            <span>{mold.plasticMaterial || "No Material"}</span>
                            <Separator orientation="vertical" className="h-2" />
                            <span>{mold.noOfCavity} Cavities</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeMoldDetail(mIndex); }} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="text-slate-400">
                          {editingMoldIndex === mIndex ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>

                    {editingMoldIndex === mIndex && (
                      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-200">
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
                              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{spec.label}</label>
                              <Input 
                                type={spec.type || "text"}
                                value={spec.value} 
                                onChange={(e) => updateMoldDetail(mIndex, spec.field, spec.type === "number" ? parseFloat(e.target.value) : e.target.value)} 
                                className="h-8 text-sm border-slate-200 bg-slate-50 focus:bg-white focus:border-primary transition-all shadow-sm"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                              <Settings className="h-4 w-4 text-primary" />
                              Quotation Items for this Mold
                            </h4>
                            <Button type="button" variant="outline" size="sm" onClick={() => addQuotationItem(mold.id)} className="h-8 border-primary/20 text-primary hover:bg-primary/5">
                              <Plus className="h-3 w-3 mr-1" /> Add Item
                            </Button>
                          </div>

                          <div className="border border-slate-100 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 w-12 uppercase tracking-tighter">No</th>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-tighter">Description</th>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 w-24 uppercase tracking-tighter text-center">UOM</th>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 w-20 uppercase tracking-tighter text-center">Qty</th>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 w-32 uppercase tracking-tighter text-right">Unit Price</th>
                                  <th className="px-4 py-3 text-left font-bold text-slate-500 w-32 uppercase tracking-tighter text-right">Amount</th>
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
                                    <td className="px-4 py-2 font-bold text-right text-slate-900">
                                      ₹{(parseFloat(String(item.amount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeQuotationItem(item.id)} className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
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
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b py-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Company & Banking</CardTitle>
                    <CardDescription className="text-xs">Your organization and payment details.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase">Company Name</FormLabel>
                      <FormControl><Input {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
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
                        <FormLabel className="text-xs font-semibold uppercase">Bank Name</FormLabel>
                        <FormControl><Input {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankAccountNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase">Account Number</FormLabel>
                        <FormControl><Input {...field} className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
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
                      <FormLabel className="text-xs font-semibold uppercase">Company Address</FormLabel>
                      <FormControl><Textarea {...field} className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-sm min-h-[80px] text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 4. Terms & Summary */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b py-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Financial Summary</CardTitle>
                    <CardDescription className="text-xs">Final terms and grand total calculation.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase">Payment Terms</FormLabel>
                        <FormControl><Input {...field} placeholder="" className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase">Delivery Terms</FormLabel>
                        <FormControl><Input {...field} placeholder="" className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase">GST %</FormLabel>
                        <FormControl><Input {...field} type="number" className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase">Discount (₹)</FormLabel>
                        <FormControl><Input {...field} type="number" className="bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3 shadow-inner">
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
                  <div className="flex justify-between font-bold text-xl pt-1">
                    <span className="text-slate-200">Total Amount</span>
                    <span className="text-primary-foreground">₹{parseFloat(form.watch("totalAmount") || "0").toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
