import { QueryClient, QueryFunction } from "@tanstack/react-query";
// Backend base URL
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ;

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
// Overloaded apiRequest supporting both (url, options) and (method, url, body, options)
export async function apiRequest<T = any>(
  arg1: string,
  arg2?:
    | string
    | {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
        responseType?: string;
      },
  arg3?: any,
  arg4?: { responseType?: string }
): Promise<T> {
  let method = "GET";
  let url: string;
  let body: any;
  let headers: Record<string, string> = {};
  let responseType: string | undefined;

  if (typeof arg2 === "string") {
    // Legacy style: apiRequest("POST", "/path", data, options)
    method = arg1.toUpperCase();
    url = arg2;
    body = arg3;
    if (arg4) {
      responseType = arg4.responseType;
    }
  } else {
    // Modern style: apiRequest("/path", { method, body, headers, responseType })
    url = arg1;
    const options = arg2 || {};
    method = (options.method || "GET").toUpperCase();
    body = options.body;
    headers = options.headers || {};
    responseType = options.responseType;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  if (responseType === "blob") {
    return res.blob() as any;
  }

  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";

// React Query generic query function
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    const params = queryKey[1] as any;

    if (params) {
      if (typeof params === "string") {
        const s = params.trim();
        // If the string looks like query params (contains '=' or starts with '?'), append as query string
        if (s.startsWith("?") || s.includes("=")) {
          if (s.startsWith("?")) {
            url += s;
          } else {
            url += (url.includes("?") ? "&" : "?") + s;
          }
        } else {
          // Otherwise treat as a path suffix segment
          url += `/${s}`;
        }
      } else {
        const queryString = new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>)
        ).toString();
        if (queryString) url += `?${queryString}`;
      }
    }

    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {},
      credentials: "include",
    });

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
