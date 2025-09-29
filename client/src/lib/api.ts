import { apiRequest } from "./queryClient";

// Generic API functions for CRUD operations
export const api = {
  // Users
  users: {
    getAll: () => apiRequest("/users"),
    getById: (id: string) => apiRequest(`/users/${id}`),
    create: (data: any) =>
      apiRequest("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiRequest(`/users/${id}`, { method: "DELETE" }),
  },

  // Products
  products: {
    getAll: () => apiRequest("/products"),
    getById: (id: string) => apiRequest(`/products/${id}`),
    getLowStock: () => apiRequest("/products/low-stock"),
    search: (query: string) =>
      apiRequest(`/products/search?q=${encodeURIComponent(query)}`),
    create: (data: any) =>
      apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiRequest(`/products/${id}`, { method: "DELETE" }),
  },

  // Customers
  customers: {
    getAll: () => apiRequest("/customers"),
    getById: (id: string) => apiRequest(`/customers/${id}`),
    create: (data: any) =>
      apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/customers/${id}`, { method: "DELETE" }),
  },

  // Orders
  orders: {
    getAll: () => apiRequest("/orders"),
    getById: (id: string) => apiRequest(`/orders/${id}`),
    create: (data: any) =>
      apiRequest("/orders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiRequest(`/orders/${id}`, { method: "DELETE" }),
  },

  // Suppliers
  suppliers: {
    getAll: () => apiRequest("/suppliers"),
    getById: (id: string) => apiRequest(`/suppliers/${id}`),
    create: (data: any) =>
      apiRequest("/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/suppliers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/suppliers/${id}`, { method: "DELETE" }),
  },

  // Shipments
  shipments: {
    getAll: () => apiRequest("/shipments"),
    getById: (id: string) => apiRequest(`/shipments/${id}`),
    create: (data: any) =>
      apiRequest("/shipments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/shipments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/shipments/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    getAll: () => apiRequest("/tasks"),
    getById: (id: string) => apiRequest(`/tasks/${id}`),
    getByUser: (userId: string) => apiRequest(`/tasks/user/${userId}`),
    create: (data: any) =>
      apiRequest("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiRequest(`/tasks/${id}`, { method: "DELETE" }),
  },

  // Attendance
  attendance: {
    getByUser: (userId: string) => apiRequest(`/attendance/${userId}`),
    create: (data: any) =>
      apiRequest("/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Marketing Attendance
  marketingAttendance: {
    getAll: () => apiRequest("/marketing-attendance"),
    getById: (id: string) => apiRequest(`/marketing-attendance/${id}`),
    getToday: () => apiRequest("/marketing-attendance/today"),
    getMetrics: () => apiRequest("/marketing-attendance/metrics"),
    create: (data: any) =>
      apiRequest("/marketing-attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/marketing-attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/marketing-attendance/${id}`, { method: "DELETE" }),
    checkIn: (data: any) =>
      apiRequest("/marketing-attendance/check-in", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    checkOut: (data: any) =>
      apiRequest("/marketing-attendance/check-out", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Leave Requests
  leaveRequests: {
    getAll: () => apiRequest("/leave-requests"),
    getById: (id: string) => apiRequest(`/leave-requests/${id}`),
    getByStatus: (status: string) =>
      apiRequest(`/leave-requests/status/${status}`),
    create: (data: any) =>
      apiRequest("/leave-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/leave-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/leave-requests/${id}`, { method: "DELETE" }),
  },

  // Dashboard & Analytics
  dashboard: {
    getMetrics: () => apiRequest("/dashboard/metrics"),
    getActivities: (limit?: number) =>
      apiRequest(`/activities${limit ? `?limit=${limit}` : ""}`),
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
  marketingAttendance,
  leaveRequests,
  dashboard,
} = api;
