import { apiRequest } from "./queryClient";

// Generic API functions for CRUD operations
export const api = {
  // Users
  users: {
    getAll: () => fetch("/api/users").then(res => res.json()),
    getById: (id: string) => fetch(`/api/users/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/users/${id}`, { method: "DELETE" }),
  },

  // Products
  products: {
    getAll: () => fetch("/api/products").then(res => res.json()),
    getById: (id: string) => fetch(`/api/products/${id}`).then(res => res.json()),
    getLowStock: () => fetch("/api/products/low-stock").then(res => res.json()),
    search: (query: string) => fetch(`/api/products/search?q=${encodeURIComponent(query)}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/products/${id}`, { method: "DELETE" }),
  },

  // Customers
  customers: {
    getAll: () => fetch("/api/customers").then(res => res.json()),
    getById: (id: string) => fetch(`/api/customers/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/customers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/customers/${id}`, { method: "DELETE" }),
  },

  // Orders
  orders: {
    getAll: () => fetch("/api/orders").then(res => res.json()),
    getById: (id: string) => fetch(`/api/orders/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/orders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
  },

  // Suppliers
  suppliers: {
    getAll: () => fetch("/api/suppliers").then(res => res.json()),
    getById: (id: string) => fetch(`/api/suppliers/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/suppliers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/suppliers/${id}`, { method: "DELETE" }),
  },

  // Shipments
  shipments: {
    getAll: () => fetch("/api/shipments").then(res => res.json()),
    getById: (id: string) => fetch(`/api/shipments/${id}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/shipments", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/shipments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/shipments/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    getAll: () => fetch("/api/tasks").then(res => res.json()),
    getById: (id: string) => fetch(`/api/tasks/${id}`).then(res => res.json()),
    getByUser: (userId: string) => fetch(`/api/tasks/user/${userId}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/api/tasks/${id}`, { method: "DELETE" }),
  },

  // Attendance
  attendance: {
    getByUser: (userId: string) => fetch(`/api/attendance/${userId}`).then(res => res.json()),
    create: (data: any) => apiRequest("/api/attendance", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/api/attendance/${id}`, { method: "PUT", body: JSON.stringify(data) }),
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
