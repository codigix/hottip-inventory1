import { useState } from "react";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

// Department to route mapping
const getDepartmentRoute = (department: string): string => {
  const deptLower = (department || "").toLowerCase().trim();

  const routeMap: Record<string, string> = {
    admin: "/admin",
    accounts: "/accounts",
    sales: "/sales",
    marketing: "/marketing",
    logistics: "/logistics",
    inventory: "/employees", // Inventory department goes to employees dashboard
    employees: "/employees",
  };

  return routeMap[deptLower] || "/admin"; // Default to admin dashboard
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
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      // Use AuthContext login to update state and localStorage
      await login(values.identifier.trim(), values.password);

      // Get user from localStorage (AuthContext will have set it)
      const user = JSON.parse(localStorage.getItem("auth_user") || "null");

      // Show success toast
      toast({
        title: "Login successful!",
        description: `Welcome, ${user?.username || ""}`,
      });

      // Get department-specific dashboard route
      const dashboard = getDepartmentRoute(user?.department);

      // Show redirecting animation
      setRedirecting(true);
      setRedirectMessage(
        `Redirecting to your ${user?.department || "Admin"} dashboard...`
      );

      // Navigate after a short delay for better UX
      setTimeout(() => {
        setLocation(dashboard);
      }, 800);
    } catch (err: any) {
      if (err?.details && Array.isArray(err.details)) {
        err.details.forEach((e: any) => {
          if (e.path && e.path[0]) {
            form.setError(e.path[0], { type: "server", message: e.message });
          }
        });
      }
      toast({
        title: "Login failed",
        description: err?.error || "Invalid credentials.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  // Show redirecting screen
  if (redirecting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="mb-6">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Login Successful!
          </h2>
          <p className="text-gray-600 animate-pulse">{redirectMessage}</p>
          <div className="mt-6 flex justify-center space-x-1">
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Username or Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter username or email"
                      className="h-11"
                      disabled={loading}
                    />
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
                  <FormLabel className="text-gray-700 font-medium">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter password"
                      type="password"
                      className="h-11"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={loading}
            >
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

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Don't have an account? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}
