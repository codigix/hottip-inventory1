import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Eye, Edit, FileText, History } from "lucide-react";
import { insertSupplierSchema, type InsertSupplier } from "@shared/schema";
import { z } from "zod";

export default function VendorManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const vendorFormSchema = insertSupplierSchema.extend({
    name: z.string().min(1, "Vendor name is required"),
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    phone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
    gstNumber: z.string().optional(),
  });

  const form = useForm<z.infer<typeof vendorFormSchema>>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      gstNumber: "",
      panNumber: "",
      companyType: "company",
      contactPerson: "",
      website: "",
      creditLimit: "0",
      paymentTerms: 30,
      isActive: true,
      notes: "",
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: (data: InsertSupplier) => 
      apiRequest('POST', '/api/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Vendor created successfully.",
      });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Failed to create vendor:', error);
      toast({
        title: "Error",
        description: "Failed to create vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof vendorFormSchema>) => {
    createVendorMutation.mutate(values);
  };

  const columns = [
    {
      key: 'name',
      header: 'Vendor Name',
      cell: (supplier: any) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-xs text-muted-foreground">{supplier.companyType || 'Company'}</div>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      cell: (supplier: any) => (
        <div>
          <div className="text-sm">{supplier.contactPerson}</div>
          <div className="text-xs text-muted-foreground">{supplier.email}</div>
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      cell: (supplier: any) => (
        <div className="text-sm font-mono">
          {supplier.gstNumber || 'Not Provided'}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (supplier: any) => (
        <div className="text-sm">
          {supplier.city}, {supplier.state}
        </div>
      ),
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      cell: (supplier: any) => `${supplier.paymentTerms || 30} days`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (supplier: any) => (
        <Badge className={supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (supplier: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid={`button-view-vendor-${supplier.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-edit-vendor-${supplier.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-history-vendor-${supplier.id}`}>
            <History className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-vendor-management-title">
            Vendor Database
          </h1>
          <p className="text-muted-foreground">
            Supplier management with full history tracking
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-vendor">
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Vendor</DialogTitle>
              <DialogDescription>
                Add a new vendor/supplier to your database with complete details.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., ABC Technologies Pvt Ltd" 
                            {...field} 
                            data-testid="input-vendor-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., John Doe" 
                            {...field} 
                            data-testid="input-contact-person"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="vendor@example.com" 
                            {...field} 
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+91 98765 43210" 
                            {...field} 
                            data-testid="input-phone"
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
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="22AAAAA0000A1Z5" 
                            {...field} 
                            data-testid="input-gst-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="AAAAA0000A" 
                            {...field} 
                            data-testid="input-pan-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Complete business address..." 
                          {...field} 
                          data-testid="textarea-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mumbai" 
                            {...field} 
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Maharashtra" 
                            {...field} 
                            data-testid="input-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="400001" 
                            {...field} 
                            data-testid="input-zip-code"
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
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-company-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="company">Private Limited</SelectItem>
                            <SelectItem value="proprietorship">Proprietorship</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="llp">LLP</SelectItem>
                            <SelectItem value="public">Public Limited</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="30" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            data-testid="input-payment-terms"
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
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://vendor.com" 
                            {...field} 
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Limit</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="50000.00" 
                            {...field} 
                            data-testid="input-credit-limit"
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
                          placeholder="Any additional notes about this vendor..." 
                          {...field} 
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
                      setIsModalOpen(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createVendorMutation.isPending}
                    data-testid="button-create-vendor"
                  >
                    {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
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
            <Building2 className="h-5 w-5" />
            <span>All Vendors</span>
          </CardTitle>
          <CardDescription>
            Complete vendor database with GST details and transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(suppliers || [])}
            columns={columns}
            searchable={true}
            searchKey="name"
          />
        </CardContent>
      </Card>
    </div>
  );
}