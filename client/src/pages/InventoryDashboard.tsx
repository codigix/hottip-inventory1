import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Boxes,
  LayoutGrid,
  ClipboardList,
  History,
  ShieldCheck,
  Building2,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  costPrice: z.string().min(1, "Cost price is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  lowStockThreshold: z.number().min(0, "Threshold cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
});

type ProductForm = z.infer<typeof productFormSchema>;

export default function InventoryDashboard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => apiRequest("GET", "/api/products"),
  });

  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : (Array.isArray(productsResponse) ? productsResponse : []);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      category: "",
      costPrice: "",
      stock: 0,
      lowStockThreshold: 10,
      unit: "pcs",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Product created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create product", variant: "destructive" });
    },
  });

  const onAddProductSubmit = (data: ProductForm) => {
    createProductMutation.mutate(data);
  };

  const productName = form.watch("name");
  useEffect(() => {
    const currentSku = form.getValues("sku");
    if (isAddDialogOpen && productName && !currentSku && products) {
      let nextNumber = 1;
      if (products.length > 0) {
        const skuNumbers = products
          .map((p: any) => {
            const match = p.sku?.match(/SKU-(\d+)/i);
            return match ? parseInt(match[1]) : 0;
          })
          .filter((n: number) => n > 0);
        if (skuNumbers.length > 0) {
          nextNumber = Math.max(...skuNumbers) + 1;
        }
      }
      const generatedSku = `SKU-${nextNumber.toString().padStart(3, '0')}`;
      form.setValue("sku", generatedSku, { shouldValidate: true });
    }
  }, [productName, products, form, isAddDialogOpen]);

  const productColumns = [
    {
      key: "name",
      header: "Product Information",
      cell: (product: any) => (
        <div className="flex items-center gap-3">
          
          <div className="flex flex-col">
            <span className="text-xs text-slate-900">{product.name}</span>
            <span className="text-xs text-slate-500 uppercase tracking-tight">{product.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (product: any) => (
        <Badge variant="outline" className="text-xs p-1 bg-slate-50 text-slate-600 border-slate-200">
          {product.category}
        </Badge>
      ),
    },
    {
      key: "stock",
      header: "Inventory",
      cell: (product: any) => {
        const isLow = product.stock <= product.lowStockThreshold;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs ", isLow ? "text-red-600" : "text-slate-900")}>
                {product.stock} {product.unit}
              </span>
              {isLow && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
            <span className="text-xs text-slate-400  ">Threshold: {product.lowStockThreshold}</span>
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Pricing",
      cell: (product: any) => (
        <div className="flex flex-col">
          <span className="text-xs  text-slate-900">₹{parseFloat(product.costPrice || 0).toLocaleString()}</span>
          <span className="text-xs text-slate-400 ">Cost Price</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (product: any) => {
        const isLowStock = product.stock <= product.lowStockThreshold;
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "capitalize p-1",
              isLowStock ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}
          >
            {isLowStock ? "Critical Level" : "Optimal Stock"}
          </Badge>
        );
      },
    },
  ];

  const totalValue = products.reduce((sum: number, p: any) => sum + (parseFloat(p.costPrice || 0) * (parseInt(p.stock) || 0)), 0);
  const lowStockCount = products.filter((p: any) => p.stock <= p.lowStockThreshold).length;

  const metrics = [
    { label: "Total Inventory", value: products.length, icon: Boxes, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Critical Stock", value: lowStockCount, icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Valuation", value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Monthly Growth", value: "+12.5%", icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-2 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Inventory Overview</h1>
          <p className="text-xs text-slate-500">Real-time monitoring of stock levels, procurement cycles, and logistics health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory/stock">
            <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50">
              <History className="h-4 w-4 mr-1 text-slate-400" />
              Stock Ledger
            </Button>
          </Link>
          <Button className="bg-primary hover:bg-primary text-white" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-2 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", metric.bg)}>
                <metric.icon className={cn("h-5 w-5", metric.color)} />
              </div>
              <div>
                <p className="text-xs  text-slate-500 ">{metric.label}</p>
                <p className="text-xl  text-slate-900 mt-0.5">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2">
          <div className="p-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-800 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-slate-400" />
                Product Registry
              </CardTitle>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600  px-2 py-0.5 border-none">
                {products.length} Items Listed
              </Badge>
            </div>
          </div>
          <div className="p-0 mt-2">
            <DataTable
              data={products}
              columns={productColumns}
              isLoading={productsLoading}
              searchKey="name"
              searchPlaceholder="Search product name, SKU or category..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm  text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Quality Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-500">Last QC Audit</span>
                <span className=" text-slate-900">21 Mar 2026</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-500">Batch Compliance</span>
                <span className=" text-emerald-600">98.2%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pending Inspections</span>
                <span className=" text-amber-600">3 Batches</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-white overflow-hidden">
            <CardContent className="p-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm">Logistics Hub</h3>
              </div>
              <p className="text-xs text-white/60 mb-6 leading-relaxed">
                Connect your warehouse with site locations and manage active shipments efficiently.
              </p>
              <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white hover:text-white border-none">
                View Shipment Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-xs text-slate-900">New Asset Registration</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddProductSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Rotor Assembly" {...field} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated" {...field} className="border-slate-200 font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Spare Part">Spare Part</SelectItem>
                          <SelectItem value="Fabrication">Fabrication</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Mechanical Spares">Mechanical Spares</SelectItem>
                          <SelectItem value="Electrical Spares">Electrical Spares</SelectItem>
                          <SelectItem value="Consumable">Consumable</SelectItem>
                          <SelectItem value="Raw Material">Raw Material</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure</FormLabel>
                      <FormControl>
                        <Input placeholder="PCS, KGS, MTRS" {...field} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Alert Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Technical specifications or storage instructions..." {...field} className="border-slate-200 min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="text-slate-600">Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary text-white text-xs px-8" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? "Saving..." : "Register Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
