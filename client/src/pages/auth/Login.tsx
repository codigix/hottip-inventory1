import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Shield, TrendingUp, Package, Calculator, Megaphone, Truck, Users, UserPlus } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const demoUsers = [
  { name: "Admin", subtitle: "Full Access", icon: Shield, id: "admin", color: "text-blue-600", bg: "bg-blue-50" },
  { name: "Sales", subtitle: "Sales Module", icon: TrendingUp, id: "sales", color: "text-green-600", bg: "bg-green-50" },
  { name: "Inventory", subtitle: "Stock & Production", icon: Package, id: "inventory", color: "text-orange-600", bg: "bg-orange-50" },
  { name: "Accounts", subtitle: "Finance & Billing", icon: Calculator, id: "accounts", color: "text-purple-600", bg: "bg-purple-50" },
  { name: "Marketing", subtitle: "Leads & Deals", icon: Megaphone, id: "marketing", color: "text-pink-600", bg: "bg-pink-50" },
  { name: "Logistics", subtitle: "Shipment & Dispatch", icon: Truck, id: "logistics", color: "text-cyan-600", bg: "bg-cyan-50" },
];

const getDepartmentRoute = (department: string): string => {
  const deptLower = (department || "").toLowerCase().trim();
  const routeMap: Record<string, string> = {
    admin: "/admin",
    administration: "/admin",
    accounts: "/accounts",
    sales: "/sales",
    marketing: "/marketing",
    logistics: "/logistics",
    inventory: "/inventory",
    employees: "/employees",
  };
  return routeMap[deptLower] || "/admin";
};

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const [, setLocation] = useLocation();

  async function handleLogin(identifier: string, pass: string) {
    setLoading(true);
    try {
      await login(identifier, pass);
      const user = JSON.parse(localStorage.getItem("auth_user") || "null");
      
      toast({
        title: "Login successful!",
        description: `Welcome, ${user?.username || ""}`,
      });

      const dashboard = getDepartmentRoute(user?.department);
      setRedirecting(true);
      setRedirectMessage(`Redirecting to your ${user?.department || "Admin"} dashboard...`);

      setTimeout(() => {
        setLocation(dashboard);
      }, 800);
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.error || "Invalid credentials. Try using 'admin' / 'admin123'",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  async function onSubmit(values: any) {
    await handleLogin(values.identifier.trim(), values.password);
  }

  const handleDemoLogin = (id: string) => {
    handleLogin(id, "password123"); 
  };

  if (redirecting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-4 max-w-md w-full mx-4 text-center border border-white/20">
          <div className="mb-6">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
          </div>
          <h2 className="text-2xl  text-gray-800 mb-2">Login Successful!</h2>
          <p className="text-gray-600 animate-pulse">{redirectMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row items-center justify-center p-4 gap-4">
      {/* Login Form */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-border p-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl  text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to your BusinessOps account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700  text-sm">Username or Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter username or email" className="h-11 border-gray-200 focus:ring-blue-500" disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700  text-sm">Password</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter password" type="password" className="h-11 border-gray-200 focus:ring-blue-500" disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white   transition-all" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
        
        <div className="mt-8  border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-blue-600  hover:underline cursor-pointer inline-flex items-center">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Create an account
                </span>
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400  tracking-widest">
          © 2026 BusinessOps ERP
        </p>
      </div>

      {/* Demo Credentials Section */}
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg  text-gray-800">Demo Credentials:</h3>
              <p className="text-xs text-gray-500">Quick login to preview department modules</p>
            </div>
            <div className="hidden sm:block">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs  rounded ">Auto-Setup Enabled</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {demoUsers.map((user) => {
                const Icon = user.icon;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleDemoLogin(user.id)}
                    className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group text-left bg-white"
                    disabled={loading}
                  >
                    <div className={`p-3 rounded-lg ${user.bg} ${user.color} mr-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className=" text-gray-800 text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-6 py-3 bg-blue-50/50 border-t border-blue-100">
            <p className="text-xs text-blue-600 text-center  italic">
              * Demo accounts are automatically generated on first login for evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
