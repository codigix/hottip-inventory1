import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  text,
  uuid,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

import { decimal } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";

// USERS table definition (inline, since ./users is missing)
// =====================
// USERS
export const userRole = pgEnum("user_role", ["employee", "admin"]);

// =====================
// MARKETING ENUMS
// =====================
export const marketingTaskType = pgEnum("marketing_task_type", [
  "demo",
  "email_campaign",
  "follow_up",
  "market_research",
  "other",
  "phone_call",
  "presentation",
  "proposal",
  "visit_client",
]);

export const marketingTaskStatus = pgEnum("marketing_task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const leadPriority = pgEnum("lead_priority", ["low", "medium", "high"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: userRole("role").default("employee").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  department: text("department"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`now()`)
    .notNull(),
});

// =====================
// FABRICATION ORDERS
// =====================

export const insertFabricationOrderSchema = z.object({
  partId: z.string().uuid(),
  quantity: z.coerce.number().min(1),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const spare_part_type = pgEnum("spare_part_type", [
  "component",
  "assembly",
]);
export const spare_part_status = pgEnum("spare_part_status", [
  "available",
  "unavailable",
]);

export const spareParts = pgTable("spare_parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  partNumber: text("partNumber").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  specifications: text("specifications"),
  type: spare_part_type("type").notNull().default("component"),
  status: spare_part_status("status").notNull().default("available"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("minStock").notNull().default(0),
  maxStock: integer("maxStock").notNull().default(100),
  unitCost: numeric("unitCost", 10, 2),
  location: text("location"),
  unit: text("unit"),
  fabricationtime: integer("fabricationtime"), // integer type now
});

// Enums
export const inventoryTaskStatus = pgEnum("inventory_task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
export const taskPriority = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const accountTaskStatus = pgEnum("account_task_status", [
  "open",
  "in_progress",
  "done",
]);
export const inventoryTaskType = pgEnum("inventory_task_type", [
  "Fabrication",
  "Maintenance",
  "Inspection",
]);

export const inventoryTasks = pgTable("inventory_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  type: inventoryTaskType("type").notNull(),
  status: inventoryTaskStatus("status").notNull().default("pending"),
  priority: taskPriority("priority").notNull().default("medium"),
  assignedTo: uuid("assignedTo").notNull(),
  assignedBy: uuid("assignedBy").notNull(),
  productId: uuid("productId"),
  sparePartId: uuid("sparePartId"),
  batchId: uuid("batchId"),
  fabricationOrderId: uuid("fabricationOrderId"),
  expectedQuantity: integer("expectedQuantity"),
  actualQuantity: integer("actualQuantity"),
  fromLocation: text("fromLocation"),
  toLocation: text("toLocation"),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  notes: text("notes"),
  attachmentPath: text("attachmentPath"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Enums
export const fabricationOrderStatus = pgEnum("fabrication_order_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const fabricationOrderPriority = pgEnum("fabrication_order_priority", [
  "low",
  "normal",
  "high",
]);

// Table definition
export const fabricationOrders = pgTable("fabrication_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("orderNumber").notNull(),
  sparePartId: uuid("sparePartId").notNull(),
  quantity: integer("quantity").notNull(),
  status: fabricationOrderStatus("status").notNull().default("pending"),
  priority: fabricationOrderPriority("priority").notNull().default("normal"),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// =====================
// ADMIN SETTINGS
// =====================
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  gstNumber: varchar("gst_number", { length: 32 }),
  taxRate: integer("tax_rate"),
  bankAccount: varchar("bank_account", { length: 128 }),
  paymentTerms: varchar("payment_terms", { length: 64 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminSettingsSchema = z.object({
  gstNumber: z.string().optional(),
  taxRate: z.coerce.number().optional(),
  bankAccount: z.string().optional(),
  paymentTerms: z.string().optional(),
});

// =====================
// ADMIN BACKUPS
// =====================
export const adminBackups = pgTable("admin_backups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
  size: integer("size"),
  filePath: varchar("file_path", { length: 256 }),
});

export const insertAdminBackupSchema = z.object({
  name: z.string(),
  size: z.coerce.number().optional(),
  filePath: z.string().optional(),
});
// shared/schema.ts
// =====================
// (Removed duplicate userRole and users exports)
// =====================
// LEADS

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  companyName: text("companyName"),
  email: text("email"),
  phone: text("phone"),
  alternatePhone: text("alternatePhone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zipCode"),
  country: text("country").default("India"),
  source: text("source").default("other"),
  sourceDetails: text("sourceDetails"),
  referredBy: text("referredBy"),
  requirementDescription: text("requirementDescription"),
  estimatedBudget: numeric("estimatedBudget"),
  assignedTo: uuid("assignedTo").references(() => users.id),
  status: text("status").default("new"),
  priority: text("priority").default("medium"),
  createdAt: timestamp("createdAt").defaultNow(),
  followUpDate: timestamp("followUpDate"), // matches your DB exactly
  budgetRange: text("budgetRange"),
  expectedClosingDate: timestamp("expectedClosingDate"),
  notes: text("notes"),
  assignedBy: uuid("assignedBy").references(() => users.id),
  createdBy: uuid("createdBy").references(() => users.id),
});

// =====================
// MARKETING TASKS
// =====================
export const marketingTasks = pgTable("marketing_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  type: marketingTaskType("type").notNull().default("follow_up"),
  assignedTo: uuid("assignedTo")
    .notNull()
    .references(() => users.id),
  assignedBy: uuid("assignedBy")
    .notNull()
    .references(() => users.id),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => users.id),
  priority: leadPriority("priority").notNull().default("medium"),
  status: marketingTaskStatus("status").notNull().default("pending"),
  dueDate: timestamp("dueDate"),
  startedDate: timestamp("startedDate"),
  completedDate: timestamp("completedDate"),
  leadId: uuid("leadId").references(() => leads.id),
  fieldVisitId: uuid("fieldVisitId").references(() => fieldVisits.id),
  customerId: uuid("customerId").references(() => customers.id),
  estimatedHours: numeric("estimatedHours", { precision: 5, scale: 2 }),
  tags: text("tags").array(),
  isRecurring: boolean("isRecurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completed_date: timestamp("completed_date"),
  is_recurring: boolean("is_recurring").default(false),
});

// =====================
// MARKETING ATTENDANCE (camelCase, matches actual DB)
// =====================
export const marketingAttendance = pgTable("marketing_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  date: timestamp("date").notNull(),
  checkInTime: timestamp("checkInTime"),
  checkOutTime: timestamp("checkOutTime"),
  checkInLocation: text("checkInLocation"),
  checkOutLocation: text("checkOutLocation"),
  checkInLatitude: numeric("checkInLatitude", { precision: 10, scale: 7 }),
  checkInLongitude: numeric("checkInLongitude", { precision: 10, scale: 7 }),
  checkOutLatitude: numeric("checkOutLatitude", { precision: 10, scale: 7 }),
  checkOutLongitude: numeric("checkOutLongitude", { precision: 10, scale: 7 }),
  // Additional fields used by storage methods
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  location: text("location"),
  photoPath: text("photoPath"),
  workDescription: text("workDescription"),
  attendanceStatus: text("attendanceStatus").default("present"),
  visitCount: integer("visitCount"),
  tasksCompleted: integer("tasksCompleted"),
  outcome: text("outcome"),
  nextAction: text("nextAction"),
  isOnLeave: boolean("isOnLeave").default(false),
});
export const marketingTodays = pgTable("marketing_todays", {
  id: uuid("id").primaryKey().defaultRandom(),
  userid: uuid("userid")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  checkintime: timestamp("checkintime"),
  checkouttime: timestamp("checkouttime"),
  latitude: numeric("latitude", 10, 7),
  longitude: numeric("longitude", 10, 7),
  location: text("location"),
  photopath: text("photopath"),
  workdescription: text("workdescription"),
  attendancestatus: text("attendancestatus").default("present"),
  visitcount: integer("visitcount"),
  taskscompleted: integer("taskscompleted"),
  outcome: text("outcome"),
  nextaction: text("nextaction"),
  isonleave: boolean("isonleave").default(false),
});

// New Table: Marketing_Metrics
export const marketingMetrics = pgTable("marketing_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  totalRecords: integer("totalRecords").default(0),
  presentCount: integer("presentCount").default(0),
  absentCount: integer("absentCount").default(0),
  leaveCount: integer("leaveCount").default(0),
  avgVisits: numeric("avgVisits", 10, 2).default(0),
  avgTasks: numeric("avgTasks", 10, 2).default(0),
  recordedAt: timestamp("recordedAt").defaultNow(),
});
// =====================
// LEAVE REQUESTS
// =====================
export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull(),
  leaveType: text("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  totalDays: integer("total_days"),
});

// =====================
// ACCOUNT TASKS
// =====================
export const accountTasks = pgTable("account_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type"),
  assignedTo: uuid("assignedTo")
    .notNull()
    .references(() => users.id),
  assignedBy: uuid("assignedBy")
    .notNull()
    .references(() => users.id),
  status: accountTaskStatus("status").notNull().default("open"),
  priority: taskPriority("priority").notNull().default("medium"),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  relatedType: text("relatedType"),
  relatedId: uuid("relatedId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Custom insert schema with UUID validation
export const insertAccountTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string().optional(),
  assignedTo: z.union([z.string().uuid(), z.literal("")]).refine(val => val !== "", "Assigned To is required"),
  assignedBy: z.string().uuid("Assigned By must be a valid UUID"),
  status: z.enum(["open", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().refine(val => val === "" || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), "Invalid UUID format").optional(),
  notes: z.string().optional(),
});
// =====================
// FIELD VISITS
// =====================
export const fieldVisits = pgTable("field_visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitNumber: varchar("visitNumber", { length: 50 }).notNull().unique(),
  leadId: uuid("leadId") // match exact DB column
    .references(() => leads.id)
    .notNull(),
  plannedDate: timestamp("plannedDate").notNull(),
  plannedStartTime: timestamp("plannedStartTime"),
  plannedEndTime: timestamp("plannedEndTime"),
  assignedTo: uuid("assignedTo")
    .references(() => users.id)
    .notNull(),
  visitAddress: varchar("visitAddress", { length: 255 }).notNull(),
  visitCity: varchar("visitCity", { length: 100 }),
  visitState: varchar("visitState", { length: 100 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  preVisitNotes: text("preVisitNotes"),
  purpose: varchar("purpose", { length: 100 }),
  travelExpense: numeric("travelExpense", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).default("Scheduled"),
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
// export const outboundQuotations = pgTable("outbound_quotations", {
//   id: serial("id").primaryKey(),
//   customerId: integer("customer_id").references(() => customers.id),
//   quotationNumber: varchar("quotation_number", { length: 50 }),
//   totalAmount: numeric("total_amount"),
//   status: varchar("status", { length: 20 }),
//   createdAt: timestamp("created_at").defaultNow(),
// });
// export const outboundQuotations = pgTable('outbound_quotations', {
//   id: serial('id').primaryKey(),
//   quotationNumber: text('quotationNumber').notNull(), // matches DB column
//   customerId: integer('customerId') // ✅ This is the FIX: explicitly use 'customerId' to match your DB
//     .references(() => customers.id)
//     .notNull(),
//   userId: uuid('userId').notNull(), // matches DB column
//   quotationDate: timestamp('quotationDate').notNull(), // matches DB column
//   validUntil: timestamp('validUntil'), // matches DB column
//   subtotalAmount: numeric('subtotalAmount').notNull(), // matches DB column
//   status: text('status'),
//   partNumber: text('partNumber'),
//   jobCardNumber: text('jobCardNumber'),
// });

export const gstTypeEnum = pgEnum("gst_type", ["IGST", "CGST_SGST"]);

export const quotationStatus = pgEnum("quotation_status", [
  "draft",
  "sent",
  "pending",
  "approved",
  "rejected",
  "received",
  "under_review",
]);

export const outboundQuotations = pgTable("outbound_quotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationNumber: text("quotationNumber").notNull(),
  customerId: uuid("customerId").references(() => customers.id),
  userId: uuid("userId").notNull().references(() => users.id),
  status: quotationStatus("status"),
  quotationDate: timestamp("quotationDate").notNull(),
  validUntil: timestamp("validUntil"),
  jobCardNumber: text("jobCardNumber"),
  partNumber: text("partNumber"),
  subtotalAmount: numeric("subtotalAmount").notNull(),
  taxAmount: numeric("taxAmount"),
  discountAmount: numeric("discountAmount"),
  totalAmount: numeric("totalAmount").notNull(),
  paymentTerms: text("paymentTerms"),
  deliveryTerms: text("deliveryTerms"),
  packaging: text("packaging"),
  notes: text("notes"),
  projectIncharge: text("projectIncharge"),
  moldDetails: jsonb("moldDetails"),
  quotationItems: jsonb("quotationItems"),
  termsConditions: text("termsConditions"),
  gstType: gstTypeEnum("gstType").default("IGST"),
  gstPercentage: numeric("gstPercentage", { precision: 5, scale: 2 }).default(
    "18"
  ),
  bankName: text("bankName"),
  bankAccountNo: text("bankAccountNo"),
  bankIfscCode: text("bankIfscCode"),
  bankBranch: text("bankBranch"),
  companyName: text("companyName"),
  companyAddress: text("companyAddress"),
  companyGstin: text("companyGstin"),
  companyEmail: text("companyEmail"),
  companyPhone: text("companyPhone"),
  companyWebsite: text("companyWebsite"),
});

// =====================
// INBOUND QUOTATIONS
// =====================
export const inboundQuotations = pgTable("inbound_quotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationNumber: text("quotationNumber").notNull(),
  quotationDate: timestamp("quotationDate").notNull(),
  validUntil: timestamp("validUntil"),
  subject: text("subject"),
  totalAmount: numeric("totalAmount"),
  status: quotationStatus("status").notNull().default("received"),
  notes: text("notes"),
  attachmentPath: text("attachmentPath"),
  attachmentName: text("attachmentName"),
  senderId: uuid("senderId").notNull().references(() => users.id),
  userId: uuid("userId").notNull().references(() => users.id),
  senderType: text("senderType").notNull().default("vendor"),
  quotationRef: text("quotationRef"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type InboundQuotation = typeof inboundQuotations.$inferSelect;
export type InsertInboundQuotation = typeof inboundQuotations.$inferInsert;

// =====================
// INVOICES
// =====================
export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoiceNumber").notNull(),
  quotationId: uuid("quotationId").references(() => outboundQuotations.id),
  customerId: uuid("customerId").references(() => customers.id),
  userId: uuid("userId").references(() => users.id),
  status: invoiceStatus("status").notNull().default("draft"),
  invoiceDate: timestamp("invoiceDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  subtotalAmount: numeric("subtotalAmount", { precision: 10, scale: 2 }),
  cgstRate: numeric("cgstRate", { precision: 5, scale: 2 }).default(0),
  cgstAmount: numeric("cgstAmount", { precision: 10, scale: 2 }).default(0),
  sgstRate: numeric("sgstRate", { precision: 5, scale: 2 }).default(0),
  sgstAmount: numeric("sgstAmount", { precision: 10, scale: 2 }).default(0),
  igstRate: numeric("igstRate", { precision: 5, scale: 2 }).default(0),
  igstAmount: numeric("igstAmount", { precision: 10, scale: 2 }).default(0),
  discountAmount: numeric("discountAmount", {
    precision: 10,
    scale: 2,
  }).default(0),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }),
  balanceAmount: numeric("balanceAmount", { precision: 10, scale: 2 }),
  billingAddress: text("billingAddress"),
  shippingAddress: text("shippingAddress"),
  billingGstNumber: text("billingGstNumber"),
  placeOfSupply: text("placeOfSupply"),
  paymentTerms: text("paymentTerms"),
  deliveryTerms: text("deliveryTerms"),
  transporterName: text("transporterName"),
  ewayBillNumber: text("ewayBillNumber"),
  amountInWords: text("amountInWords"),
  notes: text("notes"),
  packingFee: numeric("packingFee", { precision: 10, scale: 2 }).default(0),
  shippingFee: numeric("shippingFee", { precision: 10, scale: 2 }).default(0),
  otherCharges: numeric("otherCharges", { precision: 10, scale: 2 }).default(0),
});

// =====================
// PRODUCTS
// =====================
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default(0),
  stock: integer("stock").notNull().default(0),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).default(0),
  lowStockThreshold: integer("lowStockThreshold").default(0),
  unit: text("unit"),
});

// =====================
// SPARE PARTS
// =====================

// =====================
// SUPPLIERS
// =====================
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(), // ✅ Changed to uuid, matches DB
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zipCode"),
  country: text("country").default("India"),
  gstNumber: text("gstNumber"),
  panNumber: text("panNumber"),
  companyType: text("companyType").default("company"),
  contactPerson: text("contactPerson"),
  website: text("website"),
  creditLimit: numeric("creditLimit", { precision: 10, scale: 2 }),
  // createdAt is not a column in your DB table, so it's omitted
});

export const inventory_task_type = pgEnum("inventory_task_type", [
  "Fabrication",
  "Inspection",
  "Maintenance",
]);
export const inventory_task_status = pgEnum("inventory_task_status", [
  "pending",
  "in_progress",
  "completed",
]);
export const task_priority = pgEnum("task_priority", ["low", "medium", "high"]);

// =====================
// CUSTOMERS
// =====================
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  company: varchar("company", { length: 150 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  contactPerson: varchar("contactPerson", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("India"),
  gstNumber: varchar("gstNumber", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

// =====================
// ACCOUNTS RECEIVABLES
// =====================
export const accountsReceivableStatus = pgEnum("accounts_receivable_status", [
  "pending",
  "partial",
  "paid",
  "overdue",
]);

export const accountsReceivables = pgTable("accounts_receivables", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoiceId")
    .references(() => invoices.id)
    .default(null),
  customerId: uuid("customerId")
    .references(() => customers.id)
    .notNull(),
  amountDue: numeric("amountDue", { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric("amountPaid", { precision: 10, scale: 2 }).default(0),
  dueDate: timestamp("dueDate").notNull(),
  notes: text("notes"),
  status: accountsReceivableStatus("status").notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// =====================
// ACCOUNTS PAYABLES
// =====================
export const accountsPayables = pgTable("accounts_payables", {
  id: uuid("id").defaultRandom().primaryKey(),
  poId: uuid("poId"),
  inboundQuotationId: uuid("inboundQuotationId").references(
    () => inboundQuotations.id
  ),
  supplierId: uuid("supplierId")
    .notNull()
    .references(() => suppliers.id),
  amountDue: numeric("amountDue", { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric("amountpaid", { precision: 10, scale: 2 }).default(0),
  dueDate: timestamp("duedate").notNull(),
  notes: text("notes"),
  status: accountsReceivableStatus("status").notNull().default("pending"),
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
});

// =====================
// GST RETURNS
// =====================
export const gstReturnStatus = pgEnum("gst_return_status", [
  "draft",
  "filed",
  "paid",
  "reconciled",
]);

export const gstReturnFrequency = pgEnum("gst_return_frequency", [
  "monthly",
  "quarterly",
]);

export const gstReturns = pgTable("gst_returns", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  frequency: gstReturnFrequency("frequency").notNull().default("quarterly"),
  outputTax: numeric("outputTax", { precision: 10, scale: 2 }).notNull(),
  inputTax: numeric("inputTax", { precision: 10, scale: 2 }).notNull(),
  liability: numeric("liability", { precision: 10, scale: 2 }).notNull(),
  status: gstReturnStatus("status").notNull().default("draft"),
  notes: text("notes"),
  filedAt: timestamp("filedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// =====================
// PURCHASE ORDERS
// =====================
export const orderStatus = pgEnum("order_status", [
  "pending",
  "approved",
  "shipped",
  "delivered",
  "cancelled",
]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: text("poNumber").notNull().unique(),
  supplierId: uuid("supplierId")
    .notNull()
    .references(() => suppliers.id),
  quotationId: uuid("quotationId"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id),
  orderDate: timestamp("orderDate").notNull().defaultNow(),
  deliveryPeriod: text("deliveryPeriod"),
  status: orderStatus("status").notNull().default("pending"),
  subtotalAmount: numeric("subtotalAmount", { precision: 12, scale: 2 }),
  gstType: gstTypeEnum("gstType").default("IGST"),
  gstPercentage: numeric("gstPercentage", { precision: 5, scale: 2 }).default("18"),
  gstAmount: numeric("gstAmount", { precision: 12, scale: 2 }),
  totalAmount: numeric("totalAmount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchaseOrderId")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  itemName: text("itemName").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unit: text("unit").default("pcs"),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
});

export const purchaseOrderRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [purchaseOrders.userId],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemRelations = relations(
  purchaseOrderItems,
  ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
      fields: [purchaseOrderItems.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
  })
);

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

export const insertPurchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  supplierId: z.string().uuid("Invalid supplier ID"),
  quotationId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid("Invalid user ID"),
  orderDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
  deliveryPeriod: z.string().optional().nullable(),
  status: z
    .enum(["pending", "approved", "shipped", "delivered", "cancelled"])
    .optional()
    .default("pending"),
  subtotalAmount: z.coerce.number().min(0),
  gstType: z.enum(["IGST", "CGST_SGST"]).default("IGST"),
  gstPercentage: z.coerce.number().default(18),
  gstAmount: z.coerce.number().min(0),
  totalAmount: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        itemName: z.string().min(1, "Item name is required"),
        description: z.string().optional().nullable(),
        quantity: z.coerce.number().min(1),
        unit: z.string().optional().default("pcs"),
        unitPrice: z.coerce.number().min(0),
        amount: z.coerce.number().optional(),
      })
    )
    .min(1, "At least one item is required"),
});

// =====================
// VENDOR COMMUNICATIONS
export const communicationType = pgEnum("communication_type", [
  "general",
  "phone",
  "complaint",
  "follow_up",
]);
export const communicationStatus = pgEnum("communication_status", [
  "completed",
  "pending",
]);
// =====================
export const vendorCommunications = pgTable("vendor_communications", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplierId")
    .notNull()
    .references(() => suppliers.id),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id),
  type: communicationType("type").notNull(),
  status: communicationStatus("status").notNull().default("completed"),
  subject: text("subject").notNull(),
  notes: text("notes"),
  contactPerson: text("contactPerson"),
  scheduledDate: timestamp("scheduledDate").default(sql`now()`),
  completedDate: timestamp("completedDate"),
  followUpRequired: boolean("followUpRequired").default(false),
  followUpDate: timestamp("followUpDate"),
  createdAt: timestamp("createdAt")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`now()`)
    .notNull(),
});

// =====================
// LOGISTICS SHIPMENTS
// =====================
export const logisticsShipments = pgTable("logistics_shipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  consignmentNumber: text("consignmentNumber").notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  clientId: uuid("clientId"),
  vendorId: uuid("vendorId"),
  dispatchDate: timestamp("dispatchDate"),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  deliveredAt: timestamp("deliveredAt"),
  closedAt: timestamp("closedAt"),
  currentStatus: text("currentStatus").notNull().default("created"),
  notes: text("notes"),
  weight: numeric("weight", { precision: 10, scale: 2 }),
});

// =====================
// LOGISTICS TASKS
// =====================
export const logisticsTasks = pgTable("logistics_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: uuid("assignedTo").notNull(),
  assignedBy: uuid("assignedBy").notNull(),
  status: text("status").notNull().default("new"),
  dueDate: timestamp("dueDate"),
  startedDate: timestamp("startedDate"),
  completedDate: timestamp("completedDate"),
  shipmentId: uuid("shipmentId"),
  estimatedHours: numeric("estimatedHours", { precision: 5, scale: 2 }),
});

// =====================
// LOGISTICS ATTENDANCE
// =====================
export const logisticsAttendance = pgTable("logistics_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  date: timestamp("date").notNull(),
  checkInTime: timestamp("checkInTime"),
  checkOutTime: timestamp("checkOutTime"),
  checkInLocation: text("checkInLocation"),
  checkOutLocation: text("checkOutLocation"),
  checkInLatitude: numeric("checkInLatitude", { precision: 10, scale: 7 }),
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
// export const insertOutboundQuotationSchema = z.object({
//   customerId: z.string(),
//   productId: z.string(),
//   quantity: z.number(),
//   price: z.number(),
//   validUntil: z.date().optional(),
// });
export const insertOutboundQuotationSchema = z.object({
  quotationNumber: z.string().min(1, "Quotation number is required"),
  customerId: z.string().uuid().optional(), // Optional if not required
  userId: z.string().uuid(),
  quotationDate: z.string().or(z.date()),
  validUntil: z.string().or(z.date()).optional(),
  subtotalAmount: z.string().min(1, "Subtotal amount is required"),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  status: z
    .enum(["draft", "sent", "pending", "approved", "rejected"])
    .optional()
    .default("draft"),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  packaging: z.string().optional(),
  termsConditions: z.string().optional(),
  notes: z.string().optional(),
  jobCardNumber: z.string().optional(),
  partNumber: z.string().optional(),
  // New fields
  projectIncharge: z.string().optional(),
  // GST fields
  gstType: z.enum(["IGST", "CGST_SGST"]).optional().default("IGST"),
  gstPercentage: z.string().optional().default("18"),
  // Banking fields
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankBranch: z.string().optional(),
  // Company fields
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyGstin: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyWebsite: z.string().optional(),
  // Mold Details with quotationFor
  moldDetails: z
    .array(
      z.object({
        no: z.number(),
        partName: z.string(),
        mouldNo: z.string(),
        plasticMaterial: z.string(),
        colourChange: z.string(),
        mfi: z.string(),
        wallThickness: z.string(),
        noOfCavity: z.number(),
        gfPercent: z.string(),
        mfPercent: z.string(),
        partWeight: z.number(),
        systemSuggested: z.string(),
        noOfDrops: z.number(),
        trialDate: z.string().optional(),
        quotationFor: z.string().optional(),
      })
    )
    .optional(),
  quotationItems: z
    .array(
      z.object({
        no: z.number(),
        partName: z.string(),
        partDescription: z.string(),
        uom: z.string(),
        qty: z.number(),
        unitPrice: z.number(),
        amount: z.number(),
      })
    )
    .optional(),
});
export const insertInboundQuotationSchema = z.object({
  senderId: z.string().uuid("Sender ID must be a valid UUID").optional(),
  userId: z.string().uuid("User ID must be a valid UUID").optional(),
  quotationNumber: z.string().min(1, "Quotation number is required"),
  quotationDate: z.string().or(z.date()),
  validUntil: z.string().or(z.date()).optional(),
  subject: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  status: z
    .enum(["received", "under_review", "approved", "rejected"])
    .optional()
    .default("received"),
  notes: z.string().optional(),
  senderType: z.enum(["client", "vendor", "supplier"]).optional().default("vendor"),
  attachmentPath: z.string().optional(),
  attachmentName: z.string().optional(),
  quotationRef: z.string().optional(),
});
export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  quotationId: z.string().uuid().optional(),
  customerId: z.string().uuid("Customer is required"),
  userId: z.string().uuid("User is required"),
  status: z
    .enum(["draft", "sent", "paid", "overdue", "cancelled"])
    .optional()
    .default("draft"),
  invoiceDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
  dueDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
  subtotalAmount: z.coerce
    .number()
    .min(0, "Subtotal must be positive")
    .optional(),
  cgstRate: z.coerce.number().min(0).max(100).optional().default(0),
  cgstAmount: z.coerce.number().min(0).optional().default(0),
  sgstRate: z.coerce.number().min(0).max(100).optional().default(0),
  sgstAmount: z.coerce.number().min(0).optional().default(0),
  igstRate: z.coerce.number().min(0).max(100).optional().default(0),
  igstAmount: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  totalAmount: z.coerce.number().min(0, "Total amount is required"),
  balanceAmount: z.coerce.number().min(0).optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingGstNumber: z.string().optional(),
  placeOfSupply: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  transporterName: z.string().optional(),
  ewayBillNumber: z.string().optional(),
  amountInWords: z.string().optional(),
  notes: z.string().optional(),
  packingFee: z.coerce.number().min(0).optional().default(0),
  shippingFee: z.coerce.number().min(0).optional().default(0),
  otherCharges: z.coerce.number().min(0).optional().default(0),
  lineItems: z
    .array(
      z.object({
        productId: z.string().uuid().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        unit: z.string().optional(),
        unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
        hsnSac: z.string().optional(),
        cgstRate: z.coerce.number().min(0).max(100).optional(),
        sgstRate: z.coerce.number().min(0).max(100).optional(),
        igstRate: z.coerce.number().min(0).max(100).optional(),
        amount: z.coerce.number().min(0).optional(),
      })
    )
    .default([]),
});

// Invoice Items table definition
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoiceId")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  productId: uuid("productId").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull(),
  hsnSac: text("hsnSac"),
  cgstRate: numeric("cgstRate", { precision: 5, scale: 2 }),
  sgstRate: numeric("sgstRate", { precision: 5, scale: 2 }),
  igstRate: numeric("igstRate", { precision: 5, scale: 2 }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
});

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// =====================
// SALES ORDERS
// =====================
export const salesOrderStatus = pgEnum("sales_order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const salesOrders = pgTable("sales_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("orderNumber").notNull().unique(),
  customerId: uuid("customerId").references(() => customers.id).notNull(),
  quotationId: uuid("quotationId").references(() => outboundQuotations.id),
  purchaseOrderId: uuid("purchaseOrderId").references(() => purchaseOrders.id),
  userId: uuid("userId").references(() => users.id).notNull(),
  orderDate: timestamp("orderDate").notNull().defaultNow(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  deliveryPeriod: text("deliveryPeriod"),
  status: salesOrderStatus("status").notNull().default("pending"),
  subtotalAmount: numeric("subtotalAmount", { precision: 12, scale: 2 }).notNull(),
  gstType: gstTypeEnum("gstType").default("IGST"),
  gstPercentage: numeric("gstPercentage", { precision: 5, scale: 2 }).default("18"),
  gstAmount: numeric("gstAmount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("totalAmount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  shippingAddress: text("shippingAddress"),
  billingAddress: text("billingAddress"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const salesOrderItems = pgTable("sales_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  salesOrderId: uuid("salesOrderId")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  productId: uuid("productId").references(() => products.id),
  itemName: text("itemName"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
});

export const salesOrderRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [salesOrders.userId],
    references: [users.id],
  }),
  quotation: one(outboundQuotations, {
    fields: [salesOrders.quotationId],
    references: [outboundQuotations.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [salesOrders.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  items: many(salesOrderItems),
}));

export const salesOrderItemRelations = relations(
  salesOrderItems,
  ({ one }) => ({
    salesOrder: one(salesOrders, {
      fields: [salesOrderItems.salesOrderId],
      references: [salesOrders.id],
    }),
  })
);

export const insertSalesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  customerId: z.string().uuid("Customer is required"),
  quotationId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid("User is required"),
  orderDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
  expectedDeliveryDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  deliveryPeriod: z.string().optional(),
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .default("pending"),
  subtotalAmount: z.coerce.number().min(0),
  gstType: z.enum(["IGST", "CGST_SGST"]).default("IGST"),
  gstPercentage: z.coerce.number().default(18),
  gstAmount: z.coerce.number().min(0),
  totalAmount: z.coerce.number().min(0, "Total amount must be positive"),
  notes: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional(),
        itemName: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        unit: z.string().optional().default("pcs"),
        unitPrice: z.coerce.number().min(0),
        amount: z.coerce.number().optional(),
      })
    )
    .default([]),
});

// Invoice Item schema
export const insertInvoiceItemSchema = z.object({
  invoiceId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().default("pcs"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  hsnSac: z.string().optional(),
  cgstRate: z.coerce.number().min(0).max(100).optional(),
  sgstRate: z.coerce.number().min(0).max(100).optional(),
  igstRate: z.coerce.number().min(0).max(100).optional(),
  amount: z.coerce.number().min(0).optional(),
});

export const insertCustomerSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  company: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  contactPerson: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().default("India"),
  gstNumber: z.string().optional().or(z.literal("")),
});

// Customer schema

// Supplier schema
export const insertSupplierSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().default("India"),
  gstNumber: z.string().optional().or(z.literal("")),
  panNumber: z.string().optional().or(z.literal("")),
  companyType: z.string().optional().default("company"),
  contactPerson: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  creditLimit: z.string().optional().or(z.literal("0")),
  paymentTerms: z.number().int().optional().default(30),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional().or(z.literal("")),
});
export const insertAccountsReceivableSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  amountDue: z.number().positive("Amount due must be positive"),
  amountPaid: z
    .number()
    .min(0, "Amount paid cannot be negative")
    .optional()
    .default(0),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "partial", "paid", "overdue"])
    .optional()
    .default("pending"),
});

export type AccountsReceivable = typeof accountsReceivables.$inferSelect;
export type InsertAccountsReceivable = typeof accountsReceivables.$inferInsert;

export type AccountsPayable = typeof accountsPayables.$inferSelect;
export type InsertAccountsPayable = typeof accountsPayables.$inferInsert;

export type AccountTask = typeof accountTasks.$inferSelect;
export type InsertAccountTask = typeof accountTasks.$inferInsert;

export type GstReturn = typeof gstReturns.$inferSelect;
export type InsertGstReturn = typeof gstReturns.$inferInsert;

// GST Return schema
export const insertGstReturnSchema = z.object({
  periodStart: z.string().min(1, "Period start date is required"),
  periodEnd: z.string().min(1, "Period end date is required"),
  frequency: z.enum(["monthly", "quarterly"]).optional().default("quarterly"),
  outputTax: z.coerce.number().min(0, "Output tax must be non-negative"),
  inputTax: z.coerce.number().min(0, "Input tax must be non-negative"),
  liability: z.coerce.number().min(0, "Liability must be non-negative"),
  status: z
    .enum(["draft", "filed", "paid", "reconciled"])
    .optional()
    .default("draft"),
  notes: z.string().optional(),
});

// Accounts Payable schema
export const insertAccountsPayableSchema = z.object({
  poId: z.union([z.string().uuid(), z.literal("")]).optional(),
  inboundQuotationId: z.union([z.string().uuid(), z.literal("")]).optional(),
  supplierId: z.string().uuid(),
  amountDue: z.number().positive(),
  dueDate: z.string(),
  notes: z.string().optional(),
});
export const insertBankAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumberMasked: z.string().min(1, "Account number is required"),
  ifsc: z.string().min(1, "IFSC code is required"),
  upiId: z.string().optional(),
  openingBalance: z.coerce.number().optional(),
});
export const insertBankTransactionSchema = z.object({
  date: z.string(),
  amount: z.coerce.number(),
  type: z.enum(["credit", "debit"]),
  bankAccountId: z.string().uuid(),
  description: z.string().optional(),
  reference: z.string().optional(),
});
// export const insertAccountReminderSchema = z.object({
//   reminderDate: z.string(),
//   accountId: z.string(),
//   message: z.string(),
//   status: z.enum(["pending", "sent"]).default("pending"),
// });

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

// Placeholder for marketing-routes-registry.ts
export const convertLeadSchema = z.object({
  leadId: z.number(),
  convertedAt: z.string().optional(),
  notes: z.string().optional(),
});

// Placeholder for field visit check-in schema
export const fieldVisitCheckInSchema = z.object({
  visitId: z.number(),
  checkInTime: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

// Placeholder for field visit check-out schema
export const fieldVisitCheckOutSchema = z.object({
  visitId: z.number(),
  checkOutTime: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

// Insert missing schemas for registry imports
export const insertLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  alternatePhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().default("India"),
  source: z.string().optional().default("other"),
  sourceDetails: z.string().optional().or(z.literal("")),
  referredBy: z.string().optional().or(z.literal("")),
  requirementDescription: z.string().optional().or(z.literal("")),
  estimatedBudget: z.coerce.number().optional().default(0),
  budgetRange: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.string().optional().default("new"),
  priority: z.string().optional().default("medium"),
  assignedTo: z.preprocess((val) => (val === "" || val === "null" || val === undefined) ? null : val, z.string().uuid().nullable().optional()),
  followUpDate: z.preprocess((val) => (val === "" || val === "null" || val === undefined) ? null : (typeof val === 'string' ? new Date(val) : val), z.date().nullable().optional()),
  expectedClosingDate: z.preprocess((val) => (val === "" || val === "null" || val === undefined) ? null : (typeof val === 'string' ? new Date(val) : val), z.date().nullable().optional()),
  createdBy: z.string().uuid().optional(),
  assignedBy: z.string().uuid().optional(),
});

export const updateLeadSchema = insertLeadSchema.partial();

export const insertFieldVisitSchema = z.object({
  visitNumber: z.string(),
  leadId: z.any(),
  plannedDate: z.string().optional(),
  actualDate: z.string().optional(),
  assignedTo: z.any().optional(),
  assignedBy: z.any().optional(),
  createdBy: z.any().optional(),
  visitAddress: z.string().optional(),
  status: z.string().optional(),
});

export const insertMarketingTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum([
    "demo",
    "email_campaign",
    "follow_up",
    "market_research",
    "other",
    "phone_call",
    "presentation",
    "proposal",
    "visit_client",
  ]),
  assignedTo: z.string().uuid("assignedTo must be a valid UUID").optional(),
  // assignedBy and createdBy are server-side only - set in route handler from req.user
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  dueDate: z.string().datetime().optional().or(z.string().optional()),
  startedDate: z.string().datetime().optional().or(z.string().optional()),
  completedDate: z.string().datetime().optional().or(z.string().optional()),
  leadId: z.string().uuid().optional().or(z.null()),
  fieldVisitId: z.string().uuid().optional().or(z.null()),
  customerId: z.string().uuid().optional().or(z.null()),
  estimatedHours: z.number().optional().or(z.string().optional()),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
});

export const insertMarketingAttendanceSchema = z.object({
  userId: z.any(),
  date: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location: z.string().optional(),
  photoPath: z.string().optional(),
  workDescription: z.string().optional(),
  visitCount: z.number().optional(),
  tasksCompleted: z.number().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  attendanceStatus: z.string().optional(),
});

export const insertLeaveRequestSchema = z.object({
  userId: z.any(),
  leaveType: z.enum([
    "sick",
    "vacation",
    "personal",
    "emergency",
    "training",
    "other",
  ]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string(),
  totalDays: z.number().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export const updateFieldVisitStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export const updateMarketingTaskStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export const leadFilterSchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
});

export const fieldVisitFilterSchema = z.object({
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  leadId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const marketingTaskFilterSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  leadId: z.string().optional(),
});

// Logistics registry schemas
export const insertLogisticsStatusUpdateSchema = z.object({
  shipmentId: z.string(),
  status: z.string(),
  updatedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const updateLogisticsShipmentSchema = z.object({
  consignmentNumber: z.string().optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  dispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  deliveredAt: z.string().optional(),
  closedAt: z.string().optional(),
  currentStatus: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().optional(),
});

export const logisticsShipmentFilterSchema = z.object({
  status: z.string().optional(),
  employeeId: z.string().optional(),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateLogisticsShipmentStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export const insertLogisticsAttendanceSchema = z.object({
  userId: z.string(),
  date: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  checkInLocation: z.string().optional(),
  checkOutLocation: z.string().optional(),
  checkInLatitude: z.string().optional(),
  checkInLongitude: z.string().optional(),
  checkOutLatitude: z.string().optional(),
  checkOutLongitude: z.string().optional(),
  workDescription: z.string().optional(),
  status: z.string().optional(),
});

export const updateLogisticsAttendanceSchema =
  insertLogisticsAttendanceSchema.partial();

export const insertLogisticsTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string(),
  assignedBy: z.string(),
  status: z.string().optional(),
  dueDate: z.string().optional(),
  startedDate: z.string().optional(),
  completedDate: z.string().optional(),
  shipmentId: z.string().optional(),
  estimatedHours: z.number().optional(),
});

export const updateLogisticsTaskSchema = insertLogisticsTaskSchema.partial();

export const updateLogisticsTaskStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export const logisticsTaskFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  shipmentId: z.string().optional(),
});

// Placeholder for logistics shipment insert schema
export const insertLogisticsShipmentSchema = z.object({
  consignmentNumber: z.string(),
  source: z.string(),
  destination: z.string(),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  dispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  deliveredAt: z.string().optional(),
  closedAt: z.string().optional(),
  currentStatus: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().optional(),
});

// Placeholder for logistics checkpoint insert schema
export const insertLogisticsCheckpointSchema = z.object({
  shipmentId: z.string(),
  checkpoint: z.string(),
  timestamp: z.string().optional(),
  status: z.string().optional(),
});

// Placeholder for logistics-routes-registry.ts
export const closePodUploadSchema = z.object({
  shipmentId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  uploadedAt: z.string().optional(),
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
  "created",
  "packed",
  "dispatched",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "closed",
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

export const taskStatusEnum = pgEnum("task_status", [
  "new",
  "in_progress",
  "completed",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(), // use serial for auto-increment
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assignedTo")
    .notNull()
    .references(() => users.id),
  assignedBy: integer("assignedBy")
    .notNull()
    .references(() => users.id),
  status: taskStatusEnum("status").notNull().default("new"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  dueDate: timestamp("dueDate", { withTimezone: false }),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const stockTransactionType = ["in", "out"] as const;
export const stockTransactionReason = [
  "purchase",
  "sale",
  "adjustment",
] as const;
export const stockTransactions = pgTable("stock_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("productId"), // 👈 camelCase with quotes
  batchId: uuid("batchId"),
  type: text("type"),
  reason: text("reason"),
  quantity: integer("quantity"),
  unitCost: numeric("unitCost"),
  userId: uuid("userId"),
  referenceNumber: text("referenceNumber"),
  notes: text("notes"),
});
export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").notNull(),
  date: timestamp("date").notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  location: text("location"),
  status: text("status").notNull().default("present"),
  notes: text("notes"),
});

// =====================
// BANK ACCOUNTS
// =====================
export const bankTransactionType = pgEnum("bank_transaction_type", [
  "credit",
  "debit",
]);
export const bank_accounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  bankName: text("bankName").notNull(),
  accountNumberMasked: text("accountNumberMasked").notNull(),
  ifsc: text("ifsc").notNull(),
  upiId: text("upiId"),
  openingBalance: numeric("openingBalance", { precision: 10, scale: 2 }),
});
export const bank_transactions = pgTable("bank_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bankAccountId")
    .notNull()
    .references(() => bank_accounts.id),
  date: timestamp("date").notNull(),
  type: bankTransactionType("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
});
// =====================
// ACCOUNT REMINDERS
// =====================
// =====================
// ACCOUNT REMINDERS
// =====================
export const reminder_target_type = pgEnum("reminder_target_type", [
  "account",
  "payable",
  "receivable",
  "gst",
]);
export const reminder_channel = pgEnum("reminder_channel", ["email"]);
export const reminder_status = pgEnum("reminder_status", [
  "pending",
  "sent",
  "cancelled",
]);

export const account_reminders = pgTable("account_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: reminder_target_type("targetType").notNull(),
  targetId: varchar("targetId", { length: 255 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  nextReminderAt: timestamp("nextReminderAt").notNull(),
  lastSentAt: timestamp("lastSentAt"),
  channel: reminder_channel("channel").notNull(),
  status: reminder_status("status").default("pending").notNull(),
  template: text("template"),
  frequency: integer("frequency").default(7).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const insertAccountReminderSchema = z.object({
  targetType: z.enum(["account", "payable", "receivable", "gst"]),
  targetId: z.string(),
  dueDate: z.string().datetime(),
  nextReminderAt: z.string().datetime().optional(),
  lastSentAt: z.string().datetime().optional(),
  channel: z.enum(["email"]),
  status: z.enum(["pending", "sent", "cancelled"]).default("pending"),
  template: z.string().optional(),
  frequency: z.number().default(7),
});

// =====================
// ACTIVITIES
// =====================
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId").notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertActivitySchema = z.object({
  userId: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  details: z.string().optional(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// =====================
// ACCOUNT REPORTS
// =====================
export const reportStatus = pgEnum("report_status", [
  "generated",
  "processing",
  "failed",
]);

export const accountReports = pgTable("account_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportType: text("reportType").notNull(),
  title: text("title").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: reportStatus("status").default("generated").notNull(),
  fileUrl: text("fileUrl"),
  fileName: text("fileName"),
  fileSize: integer("fileSize"),
  generatedBy: uuid("generatedBy").references(() => users.id),
  downloadCount: integer("downloadCount").default(0).notNull(),
  parameters: text("parameters"),
  summary: text("summary"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const insertAccountReportSchema = z.object({
  reportType: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["generated", "processing", "failed"]).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  generatedBy: z.string().uuid().optional(),
  downloadCount: z.number().optional(),
  parameters: z.string().optional(),
  summary: z.string().optional(),
  expiresAt: z.string().optional(),
});
