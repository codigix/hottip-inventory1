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
import { Switch } from "@/components/ui/switch";
import { Plus, Users, Eye, Edit, FileText, History } from "lucide-react";
import { insertCustomerSchema, type InsertCustomer, type Customer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClientManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/customers"],
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      gstNumber: '',
      panNumber: '',
      companyType: 'individual',
      website: '',
      creditLimit: '0.00',
      paymentTerms: 30,
      isActive: true,
      notes: '',
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: InsertCustomer) => 
      apiRequest('POST', 'api/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/customers'] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Client creation error:', error);
      
      // Parse server validation errors and set field errors
      const issues = error?.data?.errors ?? error?.errors;
      if (Array.isArray(issues)) {
        issues.forEach((e: { path?: string[]; message: string }) => {
          const fieldName = e.path?.[0] as keyof InsertCustomer;
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
      key: 'name',
      header: 'Client Name',
      cell: (customer: any) => (
        <div>
          <div className="font-light">{customer.name}</div>
          <div className="text-xs text-muted-foreground">{customer.companyType || 'Individual'}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      cell: (customer: any) => (
        <div>
          <div className="text-sm">{customer.email}</div>
          <div className="text-xs text-muted-foreground">{customer.phone}</div>
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      cell: (customer: any) => (
        <div className="text-sm font-mono">
          {customer.gstNumber || 'Not Provided'}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (customer: any) => (
        <div className="text-sm">
          {customer.city}, {customer.state}
        </div>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      cell: (customer: any) => `₹${parseFloat(customer.creditLimit || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (customer: any) => (
        <Badge className={customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {customer.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (customer: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid={`button-view-client-${customer.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-edit-client-${customer.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-history-client-${customer.id}`}>
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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-client-management-title">
            Client Database
          </h1>
          <p className="text-muted-foreground">
            Customer management with full history tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-client">
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client with complete GST and business details
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ABC Company Ltd" data-testid="input-client-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} type="email" placeholder="contact@abc.com" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} placeholder="+91 9876543210" data-testid="input-phone" />
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
                            <Input {...field} value={field.value ?? ''} placeholder="John Doe" data-testid="input-contact-person" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light">Business Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger data-testid="select-company-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="company">Private Limited Company</SelectItem>
                              <SelectItem value="public">Public Company</SelectItem>
                              <SelectItem value="proprietorship">Sole Proprietorship</SelectItem>
                              <SelectItem value="llp">Limited Liability Partnership</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} placeholder="https://www.abc.com" data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* GST & Tax Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light">GST & Tax Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} placeholder="22AAAAA0000A1Z5" data-testid="input-gst-number" />
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
                            <Input {...field} value={field.value ?? ''} placeholder="AAAAA0000A" data-testid="input-pan-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light">Address Information</h3>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ''} placeholder="123 Business Street, Sector 1" data-testid="textarea-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} placeholder="Mumbai" data-testid="input-city" />
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
                            <Input {...field} value={field.value ?? ''} placeholder="Maharashtra" data-testid="input-state" />
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
                            <Input {...field} value={field.value ?? ''} placeholder="400001" data-testid="input-zip-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light">Financial Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01" 
                              placeholder="100000.00" 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              data-testid="input-credit-limit" 
                            />
                          </FormControl>
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
                              {...field} 
                              type="number" 
                              placeholder="30" 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 30)}
                              data-testid="input-payment-terms" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light">Additional Information</h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ''} placeholder="Additional notes about the client" data-testid="textarea-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Client</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Enable this client for new transactions
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

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
                    disabled={createCustomerMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createCustomerMutation.isPending ? "Creating..." : "Create Client"}
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
            <Users className="h-5 w-5" />
            <span>All Clients</span>
          </CardTitle>
          <CardDescription>
            Complete client database with GST details and transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(customers || [])}
            columns={columns}
            searchable={true}
            searchKey="name"
          />
        </CardContent>
      </Card>
    </div>
  );
}