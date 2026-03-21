import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  price: z.string().min(1, "Price is required"),
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
      price: "",
      costPrice: "",
      stock: 0,
      lowStockThreshold: 10,
      unit: "pcs",
    },
  });

  const productColumns = [
    {
      key: "name",
      header: "Product Information",
      cell: (product: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className=" text-slate-900">{product.name}</span>
            <span className="text-xs text-slate-500 uppercase tracking-tight">{product.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (product: any) => (
        <Badge variant="outline" className="font-normal bg-slate-50 text-slate-600 border-slate-200">
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
              <span className={cn("text-sm font-semibold", isLow ? "text-red-600" : "text-slate-900")}>
                {product.stock} {product.unit}
              </span>
              {isLow && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
            <span className="text-[10px] text-slate-400  uppercase">Threshold: {product.lowStockThreshold}</span>
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Pricing",
      cell: (product: any) => (
        <div className="flex flex-col">
          <span className="text-sm  text-slate-900">₹{parseFloat(product.price).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 uppercase">Cost: ₹{parseFloat(product.costPrice).toLocaleString()}</span>
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
              "capitalize font-normal px-2.5 py-0.5",
              isLowStock ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}
          >
            {isLowStock ? "Critical Level" : "Optimal Stock"}
          </Badge>
        );
      },
    },
  ];

  const totalValue = products.reduce((sum: number, p: any) => sum + (parseFloat(p.price) * parseInt(p.stock)), 0);
  const lowStockCount = products.filter((p: any) => p.stock <= p.lowStockThreshold).length;

  const metrics = [
    { label: "Total Inventory", value: products.length, icon: Boxes, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Critical Stock", value: lowStockCount, icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Valuation", value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Monthly Growth", value: "+12.5%", icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-2 space-y-6 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 ">Inventory Overview</h1>
          <p className="text-xs text-slate-500">Real-time monitoring of stock levels, procurement cycles, and logistics health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50 h-10 px-4">
            <History className="h-4 w-4 mr-2 text-slate-400" />
            Stock Ledger
          </Button>
          <Button className="bg-primary hover:bg-primary text-white shadow-sm h-10 px-4" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
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
          <div className="p-0 mt-4">
            <DataTable
              data={products}
              columns={productColumns}
              loading={productsLoading}
              searchPlaceholder="Search product name, SKU or category..."
            />
          </div>
        </div>

        <div className="space-y-6">
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
    </div>
  );
}
