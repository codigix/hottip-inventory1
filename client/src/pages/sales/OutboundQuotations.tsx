import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Eye, Edit, Send } from "lucide-react";
import { insertOutboundQuotationSchema, type InsertOutboundQuotation, type Customer, type OutboundQuotation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function OutboundQuotations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: quotations = [], isLoading } = useQuery<OutboundQuotation[]>({
    queryKey: ["/outbound-quotations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  // Use shared schema with enhanced validation messages
  const quotationFormSchema = insertOutboundQuotationSchema.extend({
    quotationNumber: z.string().min(1, "⚠️ Quotation number is required (e.g., QUO-2025-001)"),
    customerId: z.string().min(1, "⚠️ Please select a customer from the dropdown"),
    subtotalAmount: z.string().min(1, "⚠️ Subtotal amount is required (e.g., 1000.00)"),
    totalAmount: z.string().min(1, "⚠️ Total amount is required (e.g., 1180.00)"),
  });

  const form = useForm<InsertOutboundQuotation>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      status: 'draft',
      quotationDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotalAmount: '0.00',
      taxAmount: '0.00',
      discountAmount: '0.00',
      totalAmount: '0.00',
      quotationNumber: '',
      customerId: '',
      userId: '19b9aff1-55d8-42f8-bf1f-51f03c4361f3', // Real user ID from database
      deliveryTerms: '',
      paymentTerms: '',
      warrantyTerms: '',
      specialTerms: '',
      notes: '',
      jobCardNumber: '',
      partNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: InsertOutboundQuotation) =>
      apiRequest('POST', '/outbound-quotations', {
        ...data,
        userId: '19b9aff1-55d8-42f8-bf1f-51f03c4361f3' // Real user ID from database
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/outbound-quotations'] });
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Quotation creation error:', error);

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
        description: error?.message || "Please fix the highlighted fields and try again",
        variant: "destructive",
      });
    },
  });

  const columns = [
    {
      key: 'quotationNumber',
      header: 'Quotation #',
      cell: (quotation: any) => (
        <div className="font-light">{quotation.quotationNumber}</div>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      cell: (quotation: any) => (
        <div>
          <div className="font-light">{quotation.customer?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{quotation.customer?.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'quotationDate',
      header: 'Date',
      cell: (quotation: any) => new Date(quotation.quotationDate).toLocaleDateString(),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      cell: (quotation: any) => `₹${parseFloat(quotation.totalAmount).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (quotation: any) => {
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800',
          sent: 'bg-blue-100 text-blue-800',
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={statusColors[quotation.status as keyof typeof statusColors] || statusColors.draft}>
            {quotation.status?.toUpperCase() || 'DRAFT'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (quotation: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid={`button-view-${quotation.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-edit-${quotation.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-send-${quotation.id}`}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-outbound-quotations-title">
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
              <form onSubmit={form.handleSubmit(
                (data) => createQuotationMutation.mutate(data),
                // (errors) => {
                //   console.error('Form validation errors:', errors);
                //   toast({
                //     title: "Validation Error",
                //     description: "Please fill in all required fields correctly",
      
                //     variant: "destructive",
                //   });
                // }
              )} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="QUO-2024-001" data-testid="input-quotation-number" />
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
                        <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No client</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
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
                            value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-valid-until-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal Amount <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-subtotal" />
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
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-tax" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Amount</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-discount" />
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
                        <FormLabel>Total Amount <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="30 days" data-testid="input-payment-terms" />
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
                          <Input {...field} value={field.value || ''} placeholder="Ex-works" data-testid="input-delivery-terms" />
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
                        <Textarea {...field} value={field.value || ''} placeholder="Additional notes for the quotation" data-testid="textarea-notes" />
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
                    {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>All Outbound Quotations</span>
          </CardTitle>
          <CardDescription>
            Company → Client quotations with workflow status management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(quotations || [])}
            columns={columns}
            searchable={true}
            searchKey="quotationNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}