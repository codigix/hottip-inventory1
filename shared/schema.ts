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
  id: text("id").primaryKey(),
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
  assignedTo: text("assignedTo").references(() => users.id),
  status: text("status").default("new"),
  priority: text("priority").default("medium"),
  createdAt: timestamp("createdAt").defaultNow(),
  followUpDate: timestamp("followUpDate"), // matches your DB exactly
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

export const outboundQuotations = pgTable("outbound_quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotationNumber").notNull(),
  // Change this line:
  customerId: uuid("customerId").references(() => customers.id), // Use uuid, not integer
  userId: uuid("userId").notNull(),
  status: text("status"),
  quotationDate: timestamp("quotationDate").notNull(),
  validUntil: timestamp("validUntil"),
  jobCardNumber: text("jobCardNumber"),
  partNumber: text("partNumber"),
  subtotalAmount: numeric("subtotalAmount").notNull(),
  taxAmount: numeric("taxamount"),
  discountAmount: numeric("discountamount"),
  totalAmount: numeric("totalamount").notNull(),
  paymentTerms: text("paymentterms"),
  deliveryTerms: text("deliveryterms"),
  notes: text("notes"),
  // New fields for detailed quotation
  projectIncharge: text("projectincharge"),
  moldDetails: jsonb("molddetails"), // Array of mold/part details
  quotationItems: jsonb("quotationitems"), // Array of quotation line items
  bankingDetails: text("bankingdetails"),
  termsConditions: text("termsconditions"),
});

// =====================
// INBOUND QUOTATIONS
// =====================
// export const inboundQuotations = pgTable("inbound_quotations", {
//   id: serial("id").primaryKey(),
//   supplierId: integer("supplier_id").references(() => suppliers.id),
//   quotationNumber: varchar("quotation_number", { length: 50 }),
//   totalAmount: numeric("total_amount"),
//   status: varchar("status", { length: 20 }),
//   createdAt: timestamp("created_at").defaultNow(),
// });
const quotationStatus = pgEnum("quotation_status", [
  "received",
  "under_review",
  "approved",
  "rejected",
]);
export const inboundQuotations = pgTable("inbound_quotations", {
  id: uuid("id").defaultRandom().primaryKey(), // ✅ Matches DB: uuid, default gen_random_uuid()
  quotationNumber: text("quotationNumber").notNull(), // ✅ Matches DB: text
  quotationRef: text("quotationRef"), // ✅ Matches DB: text
  senderId: uuid("senderId")
    .notNull()
    .references(() => suppliers.id), // ✅ Matches DB: uuid, references suppliers
  senderType: text("senderType").notNull().default("supplier"), // ✅ Matches DB: text
  userId: uuid("userId")
    .notNull()
    .references(() => users.id), // ✅ Matches DB: uuid, references users
  status: quotationStatus("status").notNull().default("received"), // ✅ Matches DB: enum type
  quotationDate: timestamp("quotationDate").notNull(), // ✅ Matches DB: timestamp without time zone
  validUntil: timestamp("validUntil"), // ✅ Matches DB: timestamp without time zone
  subject: text("subject"), // ✅ Matches DB: text
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }), // ✅ Matches DB: numeric(10,2)
});

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
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default(0),
  lowStockThreshold: integer("low_stock_threshold").default(0),
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
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
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
  bankingDetails: z.string().optional(),
  termsConditions: z.string().optional(),
  notes: z.string().optional(),
  jobCardNumber: z.string().optional(),
  partNumber: z.string().optional(),
  // New fields
  projectIncharge: z.string().optional(),
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
  // ✅ Use UUID for senderId
  senderId: z.string().uuid("Sender ID must be a valid UUID"),
  // ✅ Add all required fields
  quotationNumber: z.string().min(1, "Quotation number is required"),
  quotationDate: z.string().or(z.date()), // Accept string or Date
  validUntil: z.string().or(z.date()).optional(), // Accept string or Date
  subject: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  status: z
    .enum(["received", "under_review", "approved", "rejected"])
    .default("received"),
  notes: z.string().optional(),
  senderType: z.enum(["client", "vendor", "supplier"]).default("vendor"),
  // ✅ Add attachment fields
  attachmentPath: z.string().optional(),
  attachmentName: z.string().optional(),
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

  subtotalAmount: z.number().min(0, "Subtotal must be positive").optional(),
  cgstRate: z.number().min(0).max(100).optional().default(0),
  cgstAmount: z.number().min(0).optional().default(0),
  sgstRate: z.number().min(0).max(100).optional().default(0),
  sgstAmount: z.number().min(0).optional().default(0),
  igstRate: z.number().min(0).max(100).optional().default(0),
  igstAmount: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0, "Total amount is required"),
  balanceAmount: z.number().min(0).optional(),
});

export const insertCustomerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
});

// Customer schema

// Supplier schema
export const insertSupplierSchema = z.object({
  name: z.string(),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
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
// Outbound Quotation schema
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
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.any().optional(),
  createdBy: z.any().optional(),
  assignedBy: z.any().optional(),
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
  title: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedToUserId: z.any().optional(),
  createdAt: z.string().optional(),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  leadId: z.any().optional(),
  fieldVisitId: z.any().optional(),
  assignedBy: z.any().optional(),
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
