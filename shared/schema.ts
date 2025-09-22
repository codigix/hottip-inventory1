// shared/schema.ts
import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";

// =====================
// USERS
// =====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 50 }).notNull(),
  lastName: varchar("lastName", { length: 50 }).notNull(),
  role: varchar("role", { length: 20 }).default("employee"),
  department: varchar("department", { length: 50 }).default("General"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// =====================
// LEADS
// =====================
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  companyName: varchar("company_name", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  status: varchar("status", { length: 20 }).default("new"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  followUpDate: timestamp("follow_up_date"),
  convertedAt: timestamp("converted_at"),
  estimatedBudget: numeric("estimated_budget"),
  requirementDescription: text("requirement_description"),
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
});

// =====================
// MARKETING TASKS
// =====================
export const marketingTasks = pgTable("marketing_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  assignedToUserId: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
});

// =====================
// MARKETING ATTENDANCE
// =====================
export const marketingAttendance = pgTable("marketingAttendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: timestamp("date").defaultNow(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  location: varchar("location", { length: 255 }),
  photoPath: varchar("photo_path", { length: 255 }),
  workDescription: text("work_description"),
  visitCount: integer("visit_count"),
  tasksCompleted: integer("tasks_completed"),
  outcome: text("outcome"),
  nextAction: text("next_action"),
  attendanceStatus: varchar("attendance_status", { length: 20 }).default(
    "present"
  ),
});

// =====================
// LEAVE REQUESTS (Marketing generic)
// =====================
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  leaveType: varchar("leave_type", { length: 50 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// FIELD VISITS
// =====================
export const fieldVisits = pgTable("field_visits", {
  id: serial("id").primaryKey(),
  visitNumber: varchar("visit_number", { length: 50 }).notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  plannedDate: timestamp("planned_date"),
  actualDate: timestamp("actual_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedBy: integer("assigned_by").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  visitAddress: varchar("visit_address", { length: 255 }),
  status: varchar("status", { length: 20 }).default("scheduled"),
});

// =====================
// DELIVERIES
// =====================
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => suppliers.id),
  date: timestamp("date").defaultNow(),
  volume: numeric("volume"),
  status: varchar("status", { length: 20 }).default("pending"),
});

// =====================
// OUTBOUND QUOTATIONS
// =====================
export const outboundQuotations = pgTable("outbound_quotations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  quotationNumber: varchar("quotation_number", { length: 50 }),
  totalAmount: numeric("total_amount"),
  status: varchar("status", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// INBOUND QUOTATIONS
// =====================
export const inboundQuotations = pgTable("inbound_quotations", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  quotationNumber: varchar("quotation_number", { length: 50 }),
  totalAmount: numeric("total_amount"),
  status: varchar("status", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// INVOICES
// =====================
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  totalAmount: numeric("total_amount"),
  status: varchar("status", { length: 20 }),
  issuedAt: timestamp("issued_at").defaultNow(),
});

// =====================
// PRODUCTS
// =====================
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 50 }),
  stock: integer("stock").default(0),
  price: numeric("price"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// SUPPLIERS
// =====================
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// CUSTOMERS
// =====================
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// VENDOR COMMUNICATIONS
// =====================
export const vendorCommunications = pgTable("vendor_communications", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => suppliers.id),
  message: text("message"),
  communicationDate: timestamp("communication_date").defaultNow(),
});

// =====================
// LOGISTICS SHIPMENTS
// =====================
export const logisticsShipments = pgTable("logistics_shipments", {
  id: serial("id").primaryKey(),
  consignmentNumber: varchar("consignment_number", { length: 50 }),
  source: varchar("source", { length: 100 }),
  destination: varchar("destination", { length: 100 }),
  currentStatus: varchar("current_status", { length: 50 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================
// LOGISTICS ATTENDANCE
// =====================
export const logisticsAttendance = pgTable("logistics_attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: timestamp("date").defaultNow(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLocation: varchar("check_in_location", { length: 255 }),
  checkOutLocation: varchar("check_out_location", { length: 255 }),
  checkInLatitude: numeric("check_in_latitude"),
  checkInLongitude: numeric("check_in_longitude"),
  checkOutLatitude: numeric("check_out_latitude"),
  checkOutLongitude: numeric("check_out_longitude"),
  checkInPhotoPath: varchar("check_in_photo_path", { length: 255 }),
  checkOutPhotoPath: varchar("check_out_photo_path", { length: 255 }),
  workDescription: text("work_description"),
  taskCount: integer("task_count"),
  deliveriesCompleted: integer("deliveries_completed"),
  status: varchar("status", { length: 20 }).default("checked_in"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================
// LOGISTICS LEAVE REQUESTS
// =====================
export const logisticsLeaveRequests = pgTable("logistics_leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  leaveType: varchar("leave_type", { length: 50 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================
// ZOD INSERT/VALIDATION SCHEMAS
// =====================
export const insertOutboundQuotationSchema = z.object({
  customerId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  price: z.number(),
  validUntil: z.string().optional(),
});

export const insertInboundQuotationSchema = z.object({
  supplierId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  price: z.number(),
  validUntil: z.string().optional(),
});

export const insertInvoiceSchema = z.object({
  customerId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
  ),
  totalAmount: z.number(),
  issuedAt: z.string().optional(),
});

export const insertCustomerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const insertSupplierSchema = z.object({
  name: z.string(),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const insertAccountsReceivableSchema = z.object({
  date: z.string(),
  amount: z.number(),
  customerId: z.string(),
});

export const insertAccountsPayableSchema = z.object({
  date: z.string(),
  amount: z.number(),
  supplierId: z.string(),
});

export const insertGstReturnSchema = z.object({
  returnPeriod: z.string(),
  gstAmount: z.number(),
  invoiceIds: z.array(z.string()),
});

export const insertBankAccountSchema = z.object({
  accountName: z.string(),
  accountNumber: z.string(),
  bankName: z.string(),
  ifscCode: z.string(),
});

export const insertBankTransactionSchema = z.object({
  transactionDate: z.string(),
  amount: z.number(),
  transactionType: z.enum(["credit", "debit"]),
  accountId: z.string(),
  description: z.string().optional(),
});

export const insertAccountReminderSchema = z.object({
  reminderDate: z.string(),
  accountId: z.string(),
  message: z.string(),
  status: z.enum(["pending", "sent"]).default("pending"),
});

export const insertAccountTaskSchema = z.object({
  taskId: z.string(),
  accountId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string(),
  status: z.enum(["pending", "completed"]).default("pending"),
});

export const insertAccountReportSchema = z.object({
  reportId: z.string(),
  accountId: z.string(),
  title: z.string(),
  generatedOn: z.string(),
  status: z.enum(["draft", "final"]).default("draft"),
  notes: z.string().optional(),
});

export const insertAttendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  status: z.enum(["present", "absent", "leave"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  remarks: z.string().optional(),
});

// Logistics Attendance validation
export const logisticsCheckInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  location: z.string().optional(),
  workDescription: z.string().optional(),
  accuracy: z.number().optional(),
});

export const logisticsCheckOutSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  location: z.string().optional(),
  workDescription: z.string().optional(),
  taskCount: z.number().optional(),
  deliveriesCompleted: z.number().optional(),
  accuracy: z.number().optional(),
});

export const attendancePhotoUploadSchema = z.object({
  attendanceId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  photoType: z.enum(["check-in", "check-out"]),
});

export const insertLogisticsLeaveRequestSchema = z.object({
  userId: z.coerce.number(),
  leaveType: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

// =====================
// LOGISTICS STATUS UTILS
// =====================
export const LOGISTICS_SHIPMENT_STATUSES = [
  "pending",
  "in_transit",
  "delivered",
  "cancelled",
  "returned",
];

export function getNextStatus(currentStatus: string): string | null {
  const index = LOGISTICS_SHIPMENT_STATUSES.indexOf(currentStatus);
  if (index === -1 || index === LOGISTICS_SHIPMENT_STATUSES.length - 1) {
    return null; // no next status
  }
  return LOGISTICS_SHIPMENT_STATUSES[index + 1];
}
export function isValidStatusTransition(
  currentStatus: string,
  nextStatus: string
): boolean {
  const next = getNextStatus(currentStatus);
  return next === nextStatus;
}
