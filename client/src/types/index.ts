// Re-export types from shared schema
export type {
  User,
  InsertUser,
  Product,
  InsertProduct,
  Customer,
  InsertCustomer,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Supplier,
  InsertSupplier,
  Shipment,
  InsertShipment,
  Task,
  InsertTask,
  Attendance,
  InsertAttendance,
  ActivityLog,
} from "@shared/schema";

// Additional frontend-specific types
export interface DashboardMetrics {
  totalRevenue: number;
  activeOrders: number;
  lowStockItems: number;
  totalEmployees: number;
}

export interface ActivityLogWithUser {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  userId: string | null;
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  customerId: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: string;
  taxAmount: string;
  discountAmount: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    product?: {
      id: string;
      name: string;
      sku: string;
      price: string;
    };
  }>;
}

export interface TaskWithAssignee {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string;
  assignedBy: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assigner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ShipmentWithOrder {
  id: string;
  shipmentNumber: string;
  orderId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  status: 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  shippingAddress: string;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    orderNumber: string;
  };
}

// Form schemas and validation types
export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  category: string;
  price: string;
  costPrice: string;
  stock: number;
  lowStockThreshold: number;
  unit: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}

export interface OrderFormData {
  customerId: string;
  userId: string;
  totalAmount: string;
  taxAmount: string;
  discountAmount: string;
  notes?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  role: 'admin' | 'manager' | 'employee';
}

export interface TaskFormData {
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

export interface ShipmentFormData {
  orderId?: string;
  trackingNumber?: string;
  carrier: string;
  shippingAddress: string;
  estimatedDelivery?: string;
  notes?: string;
}

// UI Component Props Types
export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  searchable?: boolean;
  searchKey?: keyof T;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Status Enums
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ShipmentStatus = 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'admin' | 'manager' | 'employee';

// Chart/Analytics Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface DepartmentPerformance {
  department: string;
  performance: number;
  color: string;
}
