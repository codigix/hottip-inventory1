import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  ShoppingCart,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";

const orderFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  userId: z.string().default("temp-user-id"), // Default user ID for now
  totalAmount: z.string().min(1, "Total amount is required"),
  taxAmount: z.string().default("0"),
  discountAmount: z.string().default("0"),
  notes: z.string().optional(),
});

type OrderForm = z.infer<typeof orderFormSchema>;

export default function SalesDashboard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const { toast } = useToast();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/orders"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/customers"],
  });

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: "",
      userId: "temp-user-id",
      totalAmount: "",
      taxAmount: "0",
      discountAmount: "0",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderForm) => {
      const orderData = {
        ...data,
        totalAmount: data.totalAmount,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
      };
      return await apiRequest("POST", "/orders", orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/orders"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Order created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrderForm> }) => {
      return await apiRequest("PUT", `/orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/orders"] });
      setEditingOrder(null);
      form.reset();
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderForm) => {
    if (editingOrder) {
      updateOrderMutation.mutate({ id: editingOrder.id, data });
    } else {
      createOrderMutation.mutate(data);
    }
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    form.reset({
      customerId: order.customer?.id || "",
      userId: order.user?.id || "temp-user-id",
      totalAmount: order.totalAmount.toString(),
      taxAmount: order.taxAmount?.toString() || "0",
      discountAmount: order.discountAmount?.toString() || "0",
      notes: order.notes || "",
    });
  };

  const orderColumns = [
    {
      key: "orderNumber",
      header: "Order Number",
    },
    {
      key: "customer.name",
      header: "Customer",
    },
    {
      key: "totalAmount",
      header: "Amount",
      cell: (order: any) => `$${parseFloat(order.totalAmount).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (order: any) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          processing: "bg-blue-100 text-blue-800",
          shipped: "bg-purple-100 text-purple-800",
          delivered: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        
        return (
          <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {order.status}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (order: any) => new Date(order.createdAt).toLocaleDateString(),
    },
  ];

  // Calculate metrics
  const totalRevenue = (orders || []).reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0);
  const totalOrders = (orders || []).length;
  const pendingOrders = (orders || []).filter((order: any) => order.status === 'pending').length;
  const uniqueCustomers = new Set((orders || []).map((order: any) => order.customer?.id)).size;

  if (ordersLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-tour="sales-header">Sales Dashboard</h1>
          <p className="text-muted-foreground">Manage orders, customers, and sales performance</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingOrder} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingOrder(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-create-order">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
              <DialogDescription>
                {editingOrder ? "Update order details" : "Enter the details for the new order"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-total-amount" />
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
                        <FormLabel>Tax Amount ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-tax-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-discount-amount" />
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
                        <Input {...field} data-testid="input-notes" />
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
                      setIsAddDialogOpen(false);
                      setEditingOrder(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                    data-testid="button-save-order"
                  >
                    {editingOrder ? "Update" : "Create"} Order
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-tour="sales-dashboard">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold text-foreground">{uniqueCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Manage customer orders and track sales performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(orders || [])}
            columns={orderColumns}
            onEdit={handleEdit}
            searchable={true}
            searchKey="orderNumber"
          />
        </CardContent>
      </Card>
    </main>
  );
}
