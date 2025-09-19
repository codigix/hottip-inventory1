import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ✅ Base API URL (from .env or fallback)
const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:5000";

// 🔹 Helper: Throw if response not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    // Handle unauthorized (401) globally
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }

    throw new Error(`${res.status}: ${text}`);
  }
}

// 🔹 Generic API request wrapper
export async function apiRequest(
  path: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const { method = "GET", body, headers = {} } = options || {};

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// 🔹 Query function factory for React Query
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Join queryKey into endpoint string
    const endpoint = queryKey.join("/");

    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: {},
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// 🔹 QueryClient instance (global for app)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
