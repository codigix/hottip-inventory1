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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Customer | null>(null);
  const [deleteClient, setDeleteClient] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/clients"],
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: '', // Client Name
      phone: '', // Contact
      gstNumber: '', // GST Number
      address: '', // Location
      creditLimit: '0.00', // Credit Limit
      isActive: true, // Status
    },
  });

  // Edit form for updating client (keep as is or update as needed)

  const createCustomerMutation = useMutation({
    mutationFn: (data: InsertCustomer) => 
      apiRequest('POST', '/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/clients'] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Client creation error:', error);
      // Try to parse server validation errors and set field errors
      const issues = error?.data?.errors ?? error?.errors;
      let fieldErrorShown = false;
      if (Array.isArray(issues) && issues.length > 0) {
        issues.forEach((e: { path?: string[]; message: string }) => {
          const fieldName = e.path?.[0] as keyof InsertCustomer;
          if (fieldName) {
            form.setError(fieldName, { type: "server", message: e.message });
            fieldErrorShown = true;
          }
        });
      } else if (typeof error?.message === 'string') {
        // If no field errors, show as a general error on the name field
        form.setError('name', { type: 'server', message: error.message });
        fieldErrorShown = true;
      }
      toast({
        title: "Validation Error",
        description: (fieldErrorShown ? "Please fix the highlighted fields and try again" : (error?.message || "Unknown error")),
        variant: "destructive",
      });
    },
  });

  // Update (PUT) mutation
  const updateCustomerMutation = useMutation({
    mutationFn: (data: { id: number; values: InsertCustomer }) =>
      apiRequest('PUT', `/clients/${data.id}`, data.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/clients'] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditClient(null);
    },
    onError: (error: any) => {
      const issues = error?.data?.errors ?? error?.errors;
      if (Array.isArray(issues)) {
        issues.forEach((e: { path?: string[]; message: string }) => {
          const fieldName = e.path?.[0] as keyof InsertCustomer;
          if (fieldName) {
            editForm.setError(fieldName, { type: "server", message: e.message });
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

  // Delete (DELETE) mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/clients'] });
      toast({
        title: "Deleted",
        description: "Client deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete client",
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
          <Button size="sm" variant="ghost" data-testid={`button-edit-client-${customer.id}`} onClick={() => handleEditClient(customer)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-history-client-${customer.id}`}>
            <History className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" data-testid={`button-delete-client-${customer.id}`} onClick={() => handleDeleteClient(customer)}>
            Delete
          </Button>
        </div>
      ),
    }
  ];
  // Handlers for edit and delete actions
  function handleEditClient(customer: Customer) {
    setEditClient(customer);
    // Pre-fill edit form
    editForm.reset({
      ...customer,
      creditLimit: customer.creditLimit || '0.00',
      paymentTerms: customer.paymentTerms || 30,
      isActive: customer.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  }

  function handleDeleteClient(customer: Customer) {
    setDeleteClient(customer);
    setIsDeleteDialogOpen(true);
  }

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
              <Plus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the client details below. All required fields must be filled.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gstNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter GST number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location/address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="creditLimit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter credit limit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={val => field.onChange(val === 'true')} value={field.value ? 'true' : 'false'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-submit-client" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? 'Creating...' : 'Create Client'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent>
          <DataTable
            data={customers || []}
            columns={columns}
            searchable={true}
            searchKey="name"
          />
        </CardContent>
      </Card>
    </div>
  );
}