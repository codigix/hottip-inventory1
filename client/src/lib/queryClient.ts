import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Backend base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper function to get auth token (optional for dev)
function getAuthToken(): string | null {
  return null; // disable authentication for dev
}

// Throw error if fetch response is not ok
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }

    throw new Error(`${res.status}: ${text}`);
  }
}

// Generic API request
export async function apiRequest<T = any>(
  url: string,
  options?: { method?: string; body?: any; headers?: Record<string, string> }
): Promise<T> {
  const { method = "GET", body, headers = {} } = options || {};

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json(); // <-- Always return parsed JSON
}

type UnauthorizedBehavior = "returnNull" | "throw";

// React Query generic query function
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    const params = queryKey[1] as Record<string, any> | undefined;

    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      url += `?${queryString}`;
    }

    const res = await fetch(`${BASE_URL}${url}`, { headers: {}, credentials: "include" });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

// React Query client with defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});
