import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});


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

  const [, setLocation] = useLocation();
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      // Use AuthContext login to update state and localStorage
      await login(values.identifier.trim(), values.password);
      // Get user from localStorage (AuthContext will have set it)
      const user = JSON.parse(localStorage.getItem("auth_user") || "null");
      toast({ title: "Login successful!", description: `Welcome, ${user?.username || ""}` });
      // Navigate to department dashboard (match AppRouter routes)
      let dashboard = "/";
      switch ((user?.department || "").toLowerCase()) {
        case "marketing":
          dashboard = "/marketing";
          break;
        case "logistics":
          dashboard = "/logistics";
          break;
        case "accounts":
          dashboard = "/accounts";
          break;
        case "inventory":
          dashboard = "/inventory";
          break;
        case "sales":
          dashboard = "/sales";
          break;
        case "admin":
          dashboard = "/admin";
          break;
        case "employees":
          dashboard = "/employees";
          break;
        default:
          dashboard = "/";
      }
      setLocation(dashboard);
    } catch (err: any) {
      if (err?.details && Array.isArray(err.details)) {
        err.details.forEach((e: any) => {
          if (e.path && e.path[0]) {
            form.setError(e.path[0], { type: "server", message: e.message });
          }
        });
      }
      toast({ title: "Login failed", description: err?.error || "Invalid credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="identifier" render={({ field }) => (
            <FormItem>
              <FormLabel>Username or Email</FormLabel>
              <FormControl><Input {...field} placeholder="Enter username or email" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input {...field} placeholder="Enter password" type="password" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
