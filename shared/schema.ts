import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and Roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'employee']);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('employee'),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Products and Inventory
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  unit: text("unit").notNull().default('pcs'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers (Enhanced for Sales Module)
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull().default('India'),
  // GST and Tax Details
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  // Business Details
  companyType: text("company_type").default('individual'), // individual, partnership, company, etc.
  contactPerson: text("contact_person"),
  website: text("website"),
  // Financial Details
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default('0'),
  paymentTerms: integer("payment_terms").default(30), // days
  // Status
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: orderStatusEnum("status").notNull().default('pending'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Suppliers/Vendors (Enhanced for Sales Module)
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull().default('India'),
  // GST and Tax Details
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  // Business Details  
  companyType: text("company_type").default('company'),
  contactPerson: text("contact_person"),
  website: text("website"),
  // Financial Details
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default('0'),
  paymentTerms: integer("payment_terms").default(30), // days
  // Status
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: text("po_number").notNull().unique(),
  supplierId: uuid("supplier_id").references(() => suppliers.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: orderStatusEnum("status").notNull().default('pending'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  expectedDelivery: timestamp("expected_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Shipments
export const shipmentStatusEnum = pgEnum('shipment_status', ['preparing', 'in_transit', 'delivered', 'cancelled']);

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentNumber: text("shipment_number").notNull().unique(),
  orderId: uuid("order_id").references(() => orders.id),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  status: shipmentStatusEnum("status").notNull().default('preparing'),
  shippingAddress: text("shipping_address").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Quotations Status (for both outbound and inbound)
export const quotationStatusEnum = pgEnum('quotation_status', ['draft', 'sent', 'pending', 'approved', 'rejected', 'received', 'under_review']);

export const outboundQuotations = pgTable("outbound_quotations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationNumber: text("quotation_number").notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: quotationStatusEnum("status").notNull().default('draft'),
  
  // PDF Fields
  quotationDate: timestamp("quotation_date").notNull().defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
  jobCardNumber: text("job_card_number"),
  partNumber: text("part_number"),
  
  // Financial Details
  subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Terms and Conditions
  deliveryTerms: text("delivery_terms"),
  paymentTerms: text("payment_terms"),
  warrantyTerms: text("warranty_terms"),
  specialTerms: text("special_terms"),
  
  // Bank Details
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  
  // Additional Info
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Quotation Items
export const quotationItems = pgTable("quotation_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: uuid("quotation_id").references(() => outboundQuotations.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default('pcs'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  hsnSacCode: text("hsn_sac_code"), // HSN/SAC Code for tax classification
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('18.00'), // GST rate in percentage
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
});

// Inbound Quotations (Clients/Vendors → Company)
export const inboundQuotations = pgTable("inbound_quotations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationNumber: text("quotation_number").notNull(),
  quotationRef: text("quotation_ref"), // Their reference number
  senderId: uuid("sender_id").references(() => suppliers.id).notNull(), // Can be customer or supplier
  senderType: text("sender_type").notNull().default('supplier'), // 'customer' or 'supplier'
  userId: uuid("user_id").references(() => users.id).notNull(), // Who received/reviewed it
  status: quotationStatusEnum("status").notNull().default('received'),
  
  // Basic Details
  quotationDate: timestamp("quotation_date").notNull(),
  validUntil: timestamp("valid_until"),
  subject: text("subject"),
  
  // Financial Details
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('INR'),
  
  // Terms
  paymentTerms: text("payment_terms"),
  deliveryTerms: text("delivery_terms"),
  
  // File Upload
  attachmentPath: text("attachment_path"), // Path to uploaded document
  attachmentName: text("attachment_name"), // Original filename
  
  // Additional Info
  notes: text("notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inbound Quotation Items
export const inboundQuotationItems = pgTable("inbound_quotation_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: uuid("quotation_id").references(() => inboundQuotations.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default('pcs'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Invoices (Generated from Approved Outbound Quotations)
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  quotationId: uuid("quotation_id").references(() => outboundQuotations.id),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: invoiceStatusEnum("status").notNull().default('draft'),
  
  // Dates
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  
  // Financial Details
  subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 }).notNull(),
  cgstAmount: decimal("cgst_amount", { precision: 10, scale: 2 }).default('0'), // Central GST
  sgstAmount: decimal("sgst_amount", { precision: 10, scale: 2 }).default('0'), // State GST
  igstAmount: decimal("igst_amount", { precision: 10, scale: 2 }).default('0'), // Integrated GST
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment Details
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Terms and Bank Details
  paymentTerms: text("payment_terms"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  
  // Additional Info
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default('pcs'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  hsnSacCode: text("hsn_sac_code"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('18.00'),
  cgstRate: decimal("cgst_rate", { precision: 5, scale: 2 }).default('9.00'),
  sgstRate: decimal("sgst_rate", { precision: 5, scale: 2 }).default('9.00'),
  igstRate: decimal("igst_rate", { precision: 5, scale: 2 }).default('0.00'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
});

// Employee Attendance
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  location: text("location"),
  status: text("status").notNull().default('present'),
  notes: text("notes"),
});

// Tasks
export const taskStatusEnum = pgEnum('task_status', ['new', 'in_progress', 'completed', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: uuid("assigned_to").references(() => users.id).notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id).notNull(),
  status: taskStatusEnum("status").notNull().default('new'),
  priority: taskPriorityEnum("priority").notNull().default('medium'),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity Log
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stock Transactions - Track all stock movements (in/out)
export const stockTransactionTypeEnum = pgEnum('stock_transaction_type', ['in', 'out', 'adjustment', 'transfer']);
export const stockTransactionReasonEnum = pgEnum('stock_transaction_reason', ['purchase', 'sale', 'adjustment', 'damage', 'return', 'transfer']);

export const stockTransactions = pgTable("stock_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").references(() => products.id).notNull(),
  batchId: uuid("batch_id").references(() => batches.id),
  type: stockTransactionTypeEnum("type").notNull(),
  reason: stockTransactionReasonEnum("reason").notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  referenceNumber: text("reference_number"), // PO number, invoice number, etc.
  notes: text("notes"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Spare Parts - Track fabrication parts separately
export const sparePartStatusEnum = pgEnum('spare_part_status', ['available', 'in_fabrication', 'quality_check', 'ready', 'shipped', 'damaged']);
export const sparePartTypeEnum = pgEnum('spare_part_type', ['raw_material', 'component', 'finished_part', 'tool']);

export const spareParts = pgTable("spare_parts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partNumber: text("part_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: sparePartTypeEnum("type").notNull().default('component'),
  status: sparePartStatusEnum("status").notNull().default('available'),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  maxStock: integer("max_stock").notNull().default(100),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  location: text("location"), // Storage location
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  // Fabrication details
  fabricationTime: integer("fabrication_time"), // hours
  qualityCheckRequired: boolean("quality_check_required").default(true),
  specifications: text("specifications"), // JSON or text
  drawingPath: text("drawing_path"), // Path to technical drawing
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Batches/Lots - For batch tracking
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: text("batch_number").notNull().unique(),
  productId: uuid("product_id").references(() => products.id),
  sparePartId: uuid("spare_part_id").references(() => spareParts.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  quantity: integer("quantity").notNull(),
  remainingQuantity: integer("remaining_quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  manufactureDate: timestamp("manufacture_date"),
  expiryDate: timestamp("expiry_date"),
  location: text("location"),
  qualityStatus: text("quality_status").default('pending'), // pending, approved, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Barcodes/QR Codes - For scanning support
export const barcodes = pgTable("barcodes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  barcode: text("barcode").notNull().unique(),
  type: text("type").notNull().default('QR'), // QR, Code128, EAN13, etc.
  entityType: text("entity_type").notNull(), // product, spare_part, batch
  entityId: uuid("entity_id").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  generatedBy: uuid("generated_by").references(() => users.id),
});

// Vendor Communications - Track communication history
export const communicationTypeEnum = pgEnum('communication_type', ['email', 'phone', 'meeting', 'quote_request', 'order', 'complaint', 'follow_up']);
export const communicationStatusEnum = pgEnum('communication_status', ['pending', 'completed', 'cancelled']);

export const vendorCommunications = pgTable("vendor_communications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id).notNull(),
  type: communicationTypeEnum("type").notNull(),
  status: communicationStatusEnum("status").notNull().default('completed'),
  subject: text("subject").notNull(),
  notes: text("notes"),
  contactPerson: text("contact_person"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Reorder Points - Automated reorder planning
export const reorderPoints = pgTable("reorder_points", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").references(() => products.id),
  sparePartId: uuid("spare_part_id").references(() => spareParts.id),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity").notNull(),
  reorderQuantity: integer("reorder_quantity").notNull(),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Fabrication Orders - For custom fabrication workflow
export const fabricationOrderStatusEnum = pgEnum('fabrication_order_status', ['pending', 'in_progress', 'quality_check', 'completed', 'cancelled']);
export const fabricationOrderPriorityEnum = pgEnum('fabrication_order_priority', ['low', 'normal', 'high', 'urgent']);

export const fabricationOrders = pgTable("fabrication_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  sparePartId: uuid("spare_part_id").references(() => spareParts.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  quantity: integer("quantity").notNull(),
  status: fabricationOrderStatusEnum("status").notNull().default('pending'),
  priority: fabricationOrderPriorityEnum("priority").notNull().default('normal'),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  specifications: text("specifications"),
  notes: text("notes"),
  qualityCheckPassed: boolean("quality_check_passed"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inventory Tasks - For task assignment to inventory staff
export const inventoryTaskTypeEnum = pgEnum('inventory_task_type', ['stock_count', 'reorder', 'quality_check', 'location_move', 'maintenance', 'fabrication']);
export const inventoryTaskStatusEnum = pgEnum('inventory_task_status', ['pending', 'in_progress', 'completed', 'cancelled']);

export const inventoryTasks = pgTable("inventory_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: inventoryTaskTypeEnum("type").notNull(),
  status: inventoryTaskStatusEnum("status").notNull().default('pending'),
  priority: taskPriorityEnum("priority").notNull().default('medium'),
  assignedTo: uuid("assigned_to").references(() => users.id).notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id).notNull(),
  // Related entities
  productId: uuid("product_id").references(() => products.id),
  sparePartId: uuid("spare_part_id").references(() => spareParts.id),
  batchId: uuid("batch_id").references(() => batches.id),
  fabricationOrderId: uuid("fabrication_order_id").references(() => fabricationOrders.id),
  // Task details
  expectedQuantity: integer("expected_quantity"),
  actualQuantity: integer("actual_quantity"),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  attachmentPath: text("attachment_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  tasks: many(tasks),
  attendance: many(attendance),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  outboundQuotations: many(outboundQuotations),
  invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  shipments: many(shipments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  inboundQuotations: many(inboundQuotations),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [purchaseOrders.userId],
    references: [users.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

// New Sales Relations
export const outboundQuotationsRelations = relations(outboundQuotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [outboundQuotations.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [outboundQuotations.userId],
    references: [users.id],
  }),
  quotationItems: many(quotationItems),
  invoice: many(invoices),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(outboundQuotations, {
    fields: [quotationItems.quotationId],
    references: [outboundQuotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
}));

export const inboundQuotationsRelations = relations(inboundQuotations, ({ one, many }) => ({
  sender: one(suppliers, {
    fields: [inboundQuotations.senderId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [inboundQuotations.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [inboundQuotations.reviewedBy],
    references: [users.id],
  }),
  quotationItems: many(inboundQuotationItems),
}));

export const inboundQuotationItemsRelations = relations(inboundQuotationItems, ({ one }) => ({
  quotation: one(inboundQuotations, {
    fields: [inboundQuotationItems.quotationId],
    references: [inboundQuotations.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  quotation: one(outboundQuotations, {
    fields: [invoices.quotationId],
    references: [outboundQuotations.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// New Inventory Relations
export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  product: one(products, {
    fields: [stockTransactions.productId],
    references: [products.id],
  }),
  batch: one(batches, {
    fields: [stockTransactions.batchId],
    references: [batches.id],
  }),
  user: one(users, {
    fields: [stockTransactions.userId],
    references: [users.id],
  }),
}));

export const sparePartsRelations = relations(spareParts, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [spareParts.supplierId],
    references: [suppliers.id],
  }),
  batches: many(batches),
  barcodes: many(barcodes),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  product: one(products, {
    fields: [batches.productId],
    references: [products.id],
  }),
  sparePart: one(spareParts, {
    fields: [batches.sparePartId],
    references: [spareParts.id],
  }),
  supplier: one(suppliers, {
    fields: [batches.supplierId],
    references: [suppliers.id],
  }),
  stockTransactions: many(stockTransactions),
  barcodes: many(barcodes),
}));

export const barcodesRelations = relations(barcodes, ({ one }) => ({
  generatedByUser: one(users, {
    fields: [barcodes.generatedBy],
    references: [users.id],
  }),
}));

export const vendorCommunicationsRelations = relations(vendorCommunications, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [vendorCommunications.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [vendorCommunications.userId],
    references: [users.id],
  }),
}));

export const reorderPointsRelations = relations(reorderPoints, ({ one }) => ({
  product: one(products, {
    fields: [reorderPoints.productId],
    references: [products.id],
  }),
  sparePart: one(spareParts, {
    fields: [reorderPoints.sparePartId],
    references: [spareParts.id],
  }),
  supplier: one(suppliers, {
    fields: [reorderPoints.supplierId],
    references: [suppliers.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

// New Sales Insert Schemas
export const insertOutboundQuotationSchema = createInsertSchema(outboundQuotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  quotationDate: z.coerce.date(), // Accept ISO strings and coerce to Date
  validUntil: z.coerce.date(), // Accept ISO strings and coerce to Date
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
});

export const insertInboundQuotationSchema = createInsertSchema(inboundQuotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInboundQuotationItemSchema = createInsertSchema(inboundQuotationItems).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

// New Inventory Insert Schemas
export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertSparePartSchema = createInsertSchema(spareParts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBarcodeSchema = createInsertSchema(barcodes).omit({
  id: true,
  generatedAt: true,
});

export const insertVendorCommunicationSchema = createInsertSchema(vendorCommunications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReorderPointSchema = createInsertSchema(reorderPoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFabricationOrderSchema = createInsertSchema(fabricationOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryTaskSchema = createInsertSchema(inventoryTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = z.infer<typeof insertSparePartSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Barcode = typeof barcodes.$inferSelect;
export type InsertBarcode = z.infer<typeof insertBarcodeSchema>;

export type VendorCommunication = typeof vendorCommunications.$inferSelect;
export type InsertVendorCommunication = z.infer<typeof insertVendorCommunicationSchema>;

export type ReorderPoint = typeof reorderPoints.$inferSelect;
export type InsertReorderPoint = z.infer<typeof insertReorderPointSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;

// New Sales Types
export type OutboundQuotation = typeof outboundQuotations.$inferSelect;
export type InsertOutboundQuotation = z.infer<typeof insertOutboundQuotationSchema>;

export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;

export type InboundQuotation = typeof inboundQuotations.$inferSelect;
export type InsertInboundQuotation = z.infer<typeof insertInboundQuotationSchema>;

export type InboundQuotationItem = typeof inboundQuotationItems.$inferSelect;
export type InsertInboundQuotationItem = z.infer<typeof insertInboundQuotationItemSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type FabricationOrder = typeof fabricationOrders.$inferSelect;
export type InsertFabricationOrder = z.infer<typeof insertFabricationOrderSchema>;

export type InventoryTask = typeof inventoryTasks.$inferSelect;
export type InsertInventoryTask = z.infer<typeof insertInventoryTaskSchema>;
