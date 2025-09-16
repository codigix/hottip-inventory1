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

// Marketing Lead Types
export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'dropped';
export type LeadSource = 'website' | 'referral' | 'advertisement' | 'social_media' | 'trade_show' | 'cold_call' | 'email_campaign' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  source: LeadSource;
  sourceDetails?: string;
  referredBy?: string;
  requirementDescription?: string;
  estimatedBudget?: string;
  budgetRange?: string;
  priority: LeadPriority;
  status: LeadStatus;
  assignedTo?: string;
  assignedBy?: string;
  assignedDate?: Date;
  lastContactedDate?: Date;
  followUpDate?: Date;
  conversionDate?: Date;
  expectedClosingDate?: Date;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadWithAssignee extends Lead {
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

export interface LeadFormData {
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  source: LeadSource;
  sourceDetails?: string;
  referredBy?: string;
  requirementDescription?: string;
  estimatedBudget?: string;
  budgetRange?: string;
  priority: LeadPriority;
  assignedTo?: string;
  followUpDate?: string;
  expectedClosingDate?: string;
  notes?: string;
  tags?: string[];
}

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  inProgressLeads: number;
  convertedLeads: number;
  droppedLeads: number;
  conversionRate: number;
  averageTimeToConversion: number;
}

export interface LeadSearchFilters {
  search?: string;
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assignedTo?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

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

// Lead Status Workflow Configuration
export const LEAD_STATUS_WORKFLOW: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'dropped'],
  contacted: ['in_progress', 'dropped'],
  in_progress: ['converted', 'dropped'],
  converted: [], // Final state
  dropped: ['new', 'contacted'] // Allow revival
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  dropped: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export const LEAD_PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

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
