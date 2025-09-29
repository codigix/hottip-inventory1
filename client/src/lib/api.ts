import { apiRequest } from "./queryClient";

// Generic API functions for CRUD operations
export const api = {
  // Users
  users: {
    getAll: () => fetch("/api/users").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/users/${id}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/users/${id}`, { method: "DELETE" }),
  },

  // Products
  products: {
    getAll: () => fetch("/api/products").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/products/${id}`).then((res) => res.json()),
    getLowStock: () =>
      fetch("/api/products/low-stock").then((res) => res.json()),
    search: (query: string) =>
      fetch(`/api/products/search?q=${encodeURIComponent(query)}`).then((res) =>
        res.json()
      ),
    create: (data: any) =>
      apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/products/${id}`, { method: "DELETE" }),
  },

  // Customers
  customers: {
    getAll: () => fetch("/api/customers").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/customers/${id}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/customers/${id}`, { method: "DELETE" }),
  },

  // Orders
  orders: {
    getAll: () => fetch("/api/orders").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/orders/${id}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/orders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
  },

  // Suppliers
  suppliers: {
    getAll: () => fetch("/api/suppliers").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/suppliers/${id}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/suppliers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/suppliers/${id}`, { method: "DELETE" }),
  },

  // Shipments
  shipments: {
    getAll: () => fetch("/api/shipments").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/shipments/${id}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/shipments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/shipments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/shipments/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    getAll: () => fetch("/api/tasks").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/tasks/${id}`).then((res) => res.json()),
    getByUser: (userId: string) =>
      fetch(`/api/tasks/user/${userId}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/tasks/${id}`, { method: "DELETE" }),
  },

  // Attendance
  attendance: {
    getByUser: (userId: string) =>
      fetch(`/api/attendance/${userId}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Marketing Attendance
  marketingAttendance: {
    getAll: () => fetch("/api/marketing-attendance").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/marketing-attendance/${id}`).then((res) => res.json()),
    getToday: () =>
      fetch("/api/marketing-attendance/today").then((res) => res.json()),
    getMetrics: () =>
      fetch("/api/marketing-attendance/metrics").then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/marketing-attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/marketing-attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/marketing-attendance/${id}`, { method: "DELETE" }),
    checkIn: (data: any) =>
      apiRequest("/api/marketing-attendance/check-in", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    checkOut: (data: any) =>
      apiRequest("/api/marketing-attendance/check-out", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Leave Requests
  leaveRequests: {
    getAll: () => fetch("/api/leave-requests").then((res) => res.json()),
    getById: (id: string) =>
      fetch(`/api/leave-requests/${id}`).then((res) => res.json()),
    getByStatus: (status: string) =>
      fetch(`/api/leave-requests/status/${status}`).then((res) => res.json()),
    create: (data: any) =>
      apiRequest("/api/leave-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/leave-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/leave-requests/${id}`, { method: "DELETE" }),
  },

  // Dashboard & Analytics
  dashboard: {
    getMetrics: () => fetch("/api/dashboard/metrics").then((res) => res.json()),
    getActivities: (limit?: number) =>
      fetch(`/api/activities${limit ? `?limit=${limit}` : ""}`).then((res) =>
        res.json()
      ),
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
