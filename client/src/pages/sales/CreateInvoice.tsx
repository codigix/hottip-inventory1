import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  insertInvoiceSchema,
  type InsertInvoice,
  type Customer,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface InvoiceItem {
  id: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  amount: number;
}

type InvoiceItemTextField = "description" | "hsnSac" | "unit";
type InvoiceItemNumberField =
  | "quantity"
  | "unitPrice"
  | "cgstRate"
  | "sgstRate"
  | "igstRate"
  | "amount";

const generateLineItemId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

const createEmptyLineItem = (): InvoiceItem => ({
  id: generateLineItemId(),
  description: "",
  hsnSac: "",
  quantity: 1,
  unitPrice: 0,
  unit: "",
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
  amount: 0,
});

const safeParseNumber = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const recalculateItemAmount = (item: InvoiceItem): number => {
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  const baseAmount = quantity * unitPrice;
  const cgst = baseAmount * ((item.cgstRate ?? 0) / 100);
  const sgst = baseAmount * ((item.sgstRate ?? 0) / 100);
  const igst = baseAmount * ((item.igstRate ?? 0) / 100);
  return parseFloat((baseAmount + cgst + sgst + igst).toFixed(2));
};

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    createEmptyLineItem(),
  ]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ["/sales-orders"],
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/invoices"],
  });

  const form = useForm<z.infer<typeof insertInvoiceSchema>>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      status: "draft",
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotalAmount: 0,
      cgstRate: 9,
      cgstAmount: 0,
      sgstRate: 9,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      discountAmount: 0,
      packingFee: 0,
      shippingFee: 0,
      otherCharges: 0,
      totalAmount: 0,
      balanceAmount: 0,
      invoiceNumber: "",
      customerId: "",
      userId: "b34e3723-ba42-402d-b454-88cf96340573",
      billingAddress: "",
      shippingAddress: "",
      billingGstNumber: "",
      placeOfSupply: "",
      paymentTerms: "NET 30",
      deliveryTerms: "",
      transporterName: "",
      ewayBillNumber: "",
      amountInWords: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (invoices.length >= 0 && !form.getValues("invoiceNumber")) {
      const year = new Date().getFullYear();
      let nextCount = 1;
      
      const yearPrefix = `INV-${year}-`;
      const yearInvoices = invoices.filter(inv => 
        inv.invoiceNumber && 
        typeof inv.invoiceNumber === 'string' && 
        inv.invoiceNumber.startsWith(yearPrefix)
      );

      if (yearInvoices.length > 0) {
        const counts = yearInvoices.map(inv => {
          const parts = inv.invoiceNumber.split("-");
          return parseInt(parts[parts.length - 1]) || 0;
        });
        nextCount = Math.max(...counts) + 1;
      } else {
        nextCount = invoices.length + 1;
      }

      // Double check this specific number isn't already in the full invoices list
      // (in case of manual entries or mixed formats)
      let nextNumber = `INV-${year}-${nextCount.toString().padStart(3, "0")}`;
      while (invoices.some(inv => inv.invoiceNumber === nextNumber)) {
        nextCount++;
        nextNumber = `INV-${year}-${nextCount.toString().padStart(3, "0")}`;
      }

      form.setValue("invoiceNumber", nextNumber);
    }
  }, [invoices, form]);

  // Handle auto-fill from Sales Order when coming from URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get("orderId");
    
    if (orderId && salesOrders.length > 0) {
      const order = salesOrders.find((o: any) => o.id === orderId);
      if (order) {
        form.setValue("customerId", order.customerId);
        form.setValue("billingAddress", order.billingAddress || "");
        form.setValue("shippingAddress", order.shippingAddress || "");
        form.setValue("billingGstNumber", order.customer?.gstNumber || "");
        form.setValue("subtotalAmount", parseFloat(order.subtotalAmount) || 0);
        
        // Auto-generate invoice number based on sales order number if possible
        if (order.orderNumber && typeof order.orderNumber === 'string') {
          const parts = order.orderNumber.split("-");
          const suffix = parts[parts.length - 1];
          const year = parts.length > 2 ? parts[1] : new Date().getFullYear().toString();
          let baseNumber = `INV-${year}-${suffix}`;
          
          // Check for collision and add suffix if needed
          let finalNumber = baseNumber;
          let counter = 1;
          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          
          while (invoices.some(inv => inv.invoiceNumber === finalNumber)) {
            finalNumber = `${baseNumber}-${alphabet[counter-1] || counter}`;
            counter++;
          }
          
          form.setValue("invoiceNumber", finalNumber);
        }
        
        if (order.gstType === "IGST") {
          form.setValue("igstRate", parseFloat(order.gstPercentage) || 18);
          form.setValue("igstAmount", parseFloat(order.gstAmount) || 0);
          form.setValue("cgstRate", 0);
          form.setValue("cgstAmount", 0);
          form.setValue("sgstRate", 0);
          form.setValue("sgstAmount", 0);
        } else {
          form.setValue("cgstRate", (parseFloat(order.gstPercentage) / 2) || 9);
          form.setValue("cgstAmount", (parseFloat(order.gstAmount) / 2) || 0);
          form.setValue("sgstRate", (parseFloat(order.gstPercentage) / 2) || 9);
          form.setValue("sgstAmount", (parseFloat(order.gstAmount) / 2) || 0);
          form.setValue("igstRate", 0);
          form.setValue("igstAmount", 0);
        }

        form.setValue("totalAmount", parseFloat(order.totalAmount) || 0);
        form.setValue("balanceAmount", parseFloat(order.totalAmount) || 0);
        
        const city = order.customer?.city || "";
        const state = order.customer?.state || "";
        form.setValue("placeOfSupply", city && state ? `${city}, ${state}` : (city || state || ""));
        
        if (order.items && Array.isArray(order.items)) {
          const mappedLineItems = order.items.map((item: any) => {
            const baseAmount = parseFloat(item.amount) || (parseFloat(item.unitPrice) * item.quantity) || 0;
            let itemCgstRate = 0, itemSgstRate = 0, itemIgstRate = 0;
            
            if (order.gstType === "IGST") {
              itemIgstRate = parseFloat(order.gstPercentage) || 18;
            } else {
              itemCgstRate = (parseFloat(order.gstPercentage) / 2) || 9;
              itemSgstRate = (parseFloat(order.gstPercentage) / 2) || 9;
            }

            const itemName = item.itemName || item.partName || "";
            const itemDescription = item.description || item.partDescription || "";
            const displayDescription = itemName && itemDescription 
              ? `${itemName} - ${itemDescription}` 
              : (itemName || itemDescription || "N/A");

            return {
              id: generateLineItemId(),
              description: displayDescription,
              hsnSac: "",
              quantity: Number(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              unit: item.unit || "pcs",
              cgstRate: itemCgstRate,
              sgstRate: itemSgstRate,
              igstRate: itemIgstRate,
              amount: baseAmount + (baseAmount * (itemCgstRate + itemSgstRate + itemIgstRate) / 100)
            };
          });
          setLineItems(mappedLineItems);
        }
        
        // Clean up URL to prevent re-filling
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [salesOrders, form]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: z.infer<typeof insertInvoiceSchema>) => {
      return await apiRequest("POST", "/invoices", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setLocation("/sales/invoices");
    },
    onError: (error: any) => {
      console.error("Invoice creation error:", error);
      const issues = error?.data?.errors ?? error?.errors;
      if (Array.isArray(issues)) {
        issues.forEach((e: { path?: string[]; message: string }) => {
          const fieldName = e.path?.[0] as keyof InsertInvoice;
          if (fieldName) {
            form.setError(fieldName, { type: "server", message: e.message });
          }
        });
      }
      toast({
        title: "Validation Error",
        description: error?.message || "Please fix the highlighted fields and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertInvoiceSchema>) => {
    const sanitizedLineItems = lineItems
      .filter((item) => item.description.trim().length > 0)
      .map((item) => ({
        description: item.description,
        hsnSac: item.hsnSac || "",
        quantity: Number(item.quantity) || 0,
        unit: item.unit || "pcs",
        unitPrice: Number(item.unitPrice) || 0,
        cgstRate: Number(item.cgstRate) || 0,
        sgstRate: Number(item.sgstRate) || 0,
        igstRate: Number(item.igstRate) || 0,
        amount: Number(item.amount) || 0,
      }));

    createInvoiceMutation.mutate({
      ...data,
      lineItems: sanitizedLineItems,
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  };

  const handleItemChange = (itemId: string, field: InvoiceItemTextField, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const handleItemNumberChange = (itemId: string, field: InvoiceItemNumberField, value: string) => {
    const parsedValue = safeParseNumber(value);
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updatedItem = { ...item, [field]: parsedValue };
        if (field !== "amount") {
          updatedItem.amount = recalculateItemAmount(updatedItem);
        }
        return updatedItem;
      })
    );
  };

  const removeLineItem = (itemId: string) => {
    setLineItems((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== itemId) : prev
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/sales/invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl text-black">Create New Invoice</h1>
          <p className="text-gray-500 text-sm">Fill in the details for your new invoice</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem>
                  <FormLabel>Reference PO (Optional)</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      if (val === "none") return;
                      const order = salesOrders.find((o: any) => o.id === val);
                      if (order) {
                        form.setValue("customerId", order.customerId);
                        form.setValue("billingAddress", order.billingAddress || "");
                        form.setValue("shippingAddress", order.shippingAddress || "");
                        form.setValue("billingGstNumber", order.customer?.gstNumber || "");
                        form.setValue("subtotalAmount", parseFloat(order.subtotalAmount) || 0);
                        
                        // Auto-generate invoice number based on sales order number if possible
                        if (order.orderNumber && typeof order.orderNumber === 'string') {
                          const parts = order.orderNumber.split("-");
                          const suffix = parts[parts.length - 1];
                          const year = parts.length > 2 ? parts[1] : new Date().getFullYear().toString();
                          let baseNumber = `INV-${year}-${suffix}`;
                          
                          // Check for collision and add suffix if needed
                          let finalNumber = baseNumber;
                          let counter = 1;
                          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                          
                          while (invoices.some(inv => inv.invoiceNumber === finalNumber)) {
                            finalNumber = `${baseNumber}-${alphabet[counter-1] || counter}`;
                            counter++;
                          }
                          
                          form.setValue("invoiceNumber", finalNumber);
                        }

                        if (order.gstType === "IGST") {
                          form.setValue("igstRate", parseFloat(order.gstPercentage) || 18);
                          form.setValue("igstAmount", parseFloat(order.gstAmount) || 0);
                          form.setValue("cgstRate", 0);
                          form.setValue("cgstAmount", 0);
                          form.setValue("sgstRate", 0);
                          form.setValue("sgstAmount", 0);
                        } else {
                          form.setValue("cgstRate", (parseFloat(order.gstPercentage) / 2) || 9);
                          form.setValue("cgstAmount", (parseFloat(order.gstAmount) / 2) || 0);
                          form.setValue("sgstRate", (parseFloat(order.gstPercentage) / 2) || 9);
                          form.setValue("sgstAmount", (parseFloat(order.gstAmount) / 2) || 0);
                          form.setValue("igstRate", 0);
                          form.setValue("igstAmount", 0);
                        }

                        form.setValue("totalAmount", parseFloat(order.totalAmount) || 0);
                        form.setValue("balanceAmount", parseFloat(order.totalAmount) || 0);
                        
                        const city = order.customer?.city || "";
                        const state = order.customer?.state || "";
                        form.setValue("placeOfSupply", city && state ? `${city}, ${state}` : (city || state || ""));
                        
                        if (order.items && Array.isArray(order.items)) {
                          const mappedLineItems = order.items.map((item: any) => {
                            const baseAmount = parseFloat(item.amount) || (parseFloat(item.unitPrice) * item.quantity) || 0;
                            let itemCgstRate = 0, itemSgstRate = 0, itemIgstRate = 0;
                            
                            if (order.gstType === "IGST") {
                              itemIgstRate = parseFloat(order.gstPercentage) || 18;
                            } else {
                              itemCgstRate = (parseFloat(order.gstPercentage) / 2) || 9;
                              itemSgstRate = (parseFloat(order.gstPercentage) / 2) || 9;
                            }

                            const itemName = item.itemName || item.partName || "";
                            const itemDescription = item.description || item.partDescription || "";
                            const displayDescription = itemName && itemDescription 
                              ? `${itemName} - ${itemDescription}` 
                              : (itemName || itemDescription || "N/A");

                            return {
                              id: generateLineItemId(),
                              description: displayDescription,
                              hsnSac: "",
                              quantity: Number(item.quantity) || 1,
                              unitPrice: parseFloat(item.unitPrice) || 0,
                              unit: item.unit || "pcs",
                              cgstRate: itemCgstRate,
                              sgstRate: itemSgstRate,
                              igstRate: itemIgstRate,
                              amount: baseAmount + (baseAmount * (itemCgstRate + itemSgstRate + itemIgstRate) / 100)
                            };
                          });
                          setLineItems(mappedLineItems);
                        }
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Sales Order to auto-fill..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Manual)</SelectItem>
                      {salesOrders.map((order: any) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNumber} - {order.customer?.name} (₹{parseFloat(order.totalAmount).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-2025-001" {...field} />
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
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.hsnSac}
                            onChange={(e) => handleItemChange(item.id, "hsnSac", e.target.value)}
                            placeholder="HSN/SAC"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemNumberChange(item.id, "quantity", e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemNumberChange(item.id, "unitPrice", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="">
                          ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 bg-muted/20 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Totals Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4  border-t">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes / Additional Terms</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Add any special instructions or terms..." className="h-24" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/30 p-6 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="">₹{form.watch("subtotalAmount").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  {form.watch("cgstAmount") > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CGST ({form.watch("cgstRate")}%)</span>
                      <span>₹{form.watch("cgstAmount").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {form.watch("sgstAmount") > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">SGST ({form.watch("sgstRate")}%)</span>
                      <span>₹{form.watch("sgstAmount").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {form.watch("igstAmount") > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">IGST ({form.watch("igstRate")}%)</span>
                      <span>₹{form.watch("igstAmount").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t-2 border-border mt-3">
                    <span className="text-lg ">Total Amount</span>
                    <span className="text-2xl  text-primary">₹{form.watch("totalAmount").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => setLocation("/sales/invoices")}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={createInvoiceMutation.isPending}>
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
