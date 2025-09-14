import { apiRequest } from "./queryClient";

// Generic API functions for CRUD operations
export const api = {
  // Users
  users: {
    getAll: () => fetch("/api/users").then(res => res.json()),
    getById: (id: string) => fetch(`/api/users/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/users", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/users/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
  },

  // Products
  products: {
    getAll: () => fetch("/api/products").then(res => res.json()),
    getById: (id: string) => fetch(`/api/products/${id}`).then(res => res.json()),
    getLowStock: () => fetch("/api/products/low-stock").then(res => res.json()),
    search: (query: string) => fetch(`/api/products/search?q=${encodeURIComponent(query)}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/products", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/products/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
  },

  // Customers
  customers: {
    getAll: () => fetch("/api/customers").then(res => res.json()),
    getById: (id: string) => fetch(`/api/customers/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/customers", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/customers/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/customers/${id}`),
  },

  // Orders
  orders: {
    getAll: () => fetch("/api/orders").then(res => res.json()),
    getById: (id: string) => fetch(`/api/orders/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/orders", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/orders/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/orders/${id}`),
  },

  // Suppliers
  suppliers: {
    getAll: () => fetch("/api/suppliers").then(res => res.json()),
    getById: (id: string) => fetch(`/api/suppliers/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/suppliers", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/suppliers/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/suppliers/${id}`),
  },

  // Shipments
  shipments: {
    getAll: () => fetch("/api/shipments").then(res => res.json()),
    getById: (id: string) => fetch(`/api/shipments/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/shipments", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/shipments/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/shipments/${id}`),
  },

  // Tasks
  tasks: {
    getAll: () => fetch("/api/tasks").then(res => res.json()),
    getById: (id: string) => fetch(`/api/tasks/${id}`).then(res => res.json()),
    getByUser: (userId: string) => fetch(`/api/tasks/user/${userId}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/tasks", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/tasks/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
  },

  // Attendance
  attendance: {
    getByUser: (userId: string) => fetch(`/api/attendance/${userId}`).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/attendance", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/attendance/${id}`, data),
  },

  // Dashboard & Analytics
  dashboard: {
    getMetrics: () => fetch("/api/dashboard/metrics").then(res => res.json()),
    getActivities: (limit?: number) => fetch(`/api/activities${limit ? `?limit=${limit}` : ""}`).then(res => res.json()),
  },
};

// Export individual functions for convenience
export const {
  users,
  products,
  customers,
  orders,
  suppliers,
  shipments,
  tasks,
  attendance,
  dashboard,
} = api;
