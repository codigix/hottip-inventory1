import { 
  users, products, customers, orders, orderItems, suppliers, 
  purchaseOrders, shipments, tasks, attendance, activityLog,
  outboundQuotations, quotationItems, inboundQuotations, inboundQuotationItems,
  invoices, invoiceItems,
  type User, type InsertUser, type Product, type InsertProduct,
  type Customer, type InsertCustomer, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Supplier, type InsertSupplier,
  type Shipment, type InsertShipment, type Task, type InsertTask,
  type Attendance, type InsertAttendance, type ActivityLog,
  type OutboundQuotation, type InsertOutboundQuotation,
  type QuotationItem, type InsertQuotationItem,
  type InboundQuotation, type InsertInboundQuotation,
  type InboundQuotationItem, type InsertInboundQuotationItem,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Orders
  getOrder(id: string): Promise<any>;
  getOrders(): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  getOrdersByCustomer(customerId: string): Promise<any[]>;

  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<any[]>;
  deleteOrderItems(orderId: string): Promise<void>;

  // Suppliers
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Shipments
  getShipment(id: string): Promise<any>;
  getShipments(): Promise<any[]>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment>;
  deleteShipment(id: string): Promise<void>;

  // Tasks
  getTask(id: string): Promise<any>;
  getTasks(): Promise<any[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTasksByUser(userId: string): Promise<any[]>;

  // Attendance
  getAttendance(userId: string, date: Date): Promise<Attendance | undefined>;
  getAttendanceByUser(userId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;

  // Activity Log
  createActivity(activity: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  getRecentActivities(limit?: number): Promise<any[]>;

  // Analytics/Dashboard
  getDashboardMetrics(): Promise<any>;

  // Outbound Quotations (Company → Clients)
  getOutboundQuotation(id: string): Promise<any>;
  getOutboundQuotations(): Promise<any[]>;
  createOutboundQuotation(quotation: InsertOutboundQuotation): Promise<OutboundQuotation>;
  updateOutboundQuotation(id: string, quotation: Partial<InsertOutboundQuotation>): Promise<OutboundQuotation>;
  deleteOutboundQuotation(id: string): Promise<void>;
  getOutboundQuotationsByStatus(status: string): Promise<any[]>;
  convertQuotationToInvoice(quotationId: string): Promise<Invoice>;

  // Quotation Items
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: string): Promise<any[]>;
  deleteQuotationItems(quotationId: string): Promise<void>;
  updateQuotationItem(id: string, item: Partial<InsertQuotationItem>): Promise<QuotationItem>;

  // Inbound Quotations (Clients/Vendors → Company)
  getInboundQuotation(id: string): Promise<any>;
  getInboundQuotations(): Promise<any[]>;
  createInboundQuotation(quotation: InsertInboundQuotation): Promise<InboundQuotation>;
  updateInboundQuotation(id: string, quotation: Partial<InsertInboundQuotation>): Promise<InboundQuotation>;
  deleteInboundQuotation(id: string): Promise<void>;
  getInboundQuotationsByStatus(status: string): Promise<any[]>;

  // Inbound Quotation Items
  createInboundQuotationItem(item: InsertInboundQuotationItem): Promise<InboundQuotationItem>;
  getInboundQuotationItems(quotationId: string): Promise<any[]>;
  deleteInboundQuotationItems(quotationId: string): Promise<void>;

  // Invoices
  getInvoice(id: string): Promise<any>;
  getInvoices(): Promise<any[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getInvoicesByStatus(status: string): Promise<any[]>;
  getInvoicesByCustomer(customerId: string): Promise<any[]>;

  // Invoice Items
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: string): Promise<any[]>;
  deleteInvoiceItems(invoiceId: string): Promise<void>;
  updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updateProduct, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.name} ILIKE ${`%${query}%`} OR ${products.sku} ILIKE ${`%${query}%`}`
      );
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updateCustomer: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updateCustomer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Orders
  async getOrder(id: string): Promise<any> {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        taxAmount: orders.taxAmount,
        discountAmount: orders.discountAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id));
    
    return order || undefined;
  }

  async getOrders(): Promise<any[]> {
    return await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}`;
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();
    return order;
  }

  async updateOrder(id: string, updateOrder: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...updateOrder, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrdersByCustomer(customerId: string): Promise<any[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  // Order Items
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertOrderItem).returning();
    return item;
  }

  async getOrderItems(orderId: string): Promise<any[]> {
    return await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
          price: products.price,
        },
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async deleteOrderItems(orderId: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Suppliers
  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(insertSupplier).returning();
    return supplier;
  }

  async updateSupplier(id: string, updateSupplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db
      .update(suppliers)
      .set({ ...updateSupplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Shipments
  async getShipment(id: string): Promise<any> {
    const [shipment] = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        trackingNumber: shipments.trackingNumber,
        carrier: shipments.carrier,
        status: shipments.status,
        shippingAddress: shipments.shippingAddress,
        estimatedDelivery: shipments.estimatedDelivery,
        actualDelivery: shipments.actualDelivery,
        notes: shipments.notes,
        createdAt: shipments.createdAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
        },
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .where(eq(shipments.id, id));
    
    return shipment || undefined;
  }

  async getShipments(): Promise<any[]> {
    return await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        trackingNumber: shipments.trackingNumber,
        carrier: shipments.carrier,
        status: shipments.status,
        estimatedDelivery: shipments.estimatedDelivery,
        createdAt: shipments.createdAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
        },
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .orderBy(desc(shipments.createdAt));
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const shipmentNumber = `SH-${Date.now()}`;
    const [shipment] = await db
      .insert(shipments)
      .values({ ...insertShipment, shipmentNumber })
      .returning();
    return shipment;
  }

  async updateShipment(id: string, updateShipment: Partial<InsertShipment>): Promise<Shipment> {
    const [shipment] = await db
      .update(shipments)
      .set({ ...updateShipment, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return shipment;
  }

  async deleteShipment(id: string): Promise<void> {
    await db.delete(shipments).where(eq(shipments.id, id));
  }

  // Tasks
  async getTask(id: string): Promise<any> {
    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        assignee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        assigner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));
    
    return task || undefined;
  }

  async getTasks(): Promise<any[]> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        assignee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updateTask: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...updateTask, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  // Attendance
  async getAttendance(userId: string, date: Date): Promise<Attendance | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [record] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );
    
    return record || undefined;
  }

  async getAttendanceByUser(userId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(insertAttendance).returning();
    return record;
  }

  async updateAttendance(id: string, updateAttendance: Partial<InsertAttendance>): Promise<Attendance> {
    const [record] = await db
      .update(attendance)
      .set(updateAttendance)
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  // Activity Log
  async createActivity(activity: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const [log] = await db.insert(activityLog).values(activity).returning();
    return log;
  }

  async getRecentActivities(limit: number = 20): Promise<any[]> {
    return await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  // Dashboard Analytics
  async getDashboardMetrics(): Promise<any> {
    const totalRevenue = await db
      .select({ sum: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    const activeOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} IN ('pending', 'processing', 'shipped')`);

    const lowStockCount = await db
      .select({ count: count() })
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`);

    const totalEmployees = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      totalRevenue: totalRevenue[0]?.sum || 0,
      activeOrders: activeOrders[0]?.count || 0,
      lowStockItems: lowStockCount[0]?.count || 0,
      totalEmployees: totalEmployees[0]?.count || 0,
    };
  }

  // Outbound Quotations (Company → Clients)
  async getOutboundQuotation(id: string): Promise<any> {
    const [quotation] = await db
      .select()
      .from(outboundQuotations)
      .leftJoin(customers, eq(outboundQuotations.customerId, customers.id))
      .leftJoin(users, eq(outboundQuotations.userId, users.id))
      .where(eq(outboundQuotations.id, id));
    
    if (!quotation) return undefined;

    const items = await this.getQuotationItems(id);
    return {
      ...quotation.outbound_quotations,
      customer: quotation.customers,
      user: quotation.users,
      items
    };
  }

  async getOutboundQuotations(): Promise<any[]> {
    const quotations = await db
      .select()
      .from(outboundQuotations)
      .leftJoin(customers, eq(outboundQuotations.customerId, customers.id))
      .leftJoin(users, eq(outboundQuotations.userId, users.id))
      .orderBy(desc(outboundQuotations.createdAt));

    return quotations.map(q => ({
      ...q.outbound_quotations,
      customer: q.customers,
      user: q.users
    }));
  }

  async createOutboundQuotation(insertQuotation: InsertOutboundQuotation): Promise<OutboundQuotation> {
    const [quotation] = await db.insert(outboundQuotations).values(insertQuotation).returning();
    return quotation;
  }

  async updateOutboundQuotation(id: string, updateQuotation: Partial<InsertOutboundQuotation>): Promise<OutboundQuotation> {
    const [quotation] = await db
      .update(outboundQuotations)
      .set({ ...updateQuotation, updatedAt: new Date() })
      .where(eq(outboundQuotations.id, id))
      .returning();
    return quotation;
  }

  async deleteOutboundQuotation(id: string): Promise<void> {
    await this.deleteQuotationItems(id);
    await db.delete(outboundQuotations).where(eq(outboundQuotations.id, id));
  }

  async getOutboundQuotationsByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(outboundQuotations)
      .leftJoin(customers, eq(outboundQuotations.customerId, customers.id))
      .where(eq(outboundQuotations.status, status as any))
      .orderBy(desc(outboundQuotations.createdAt));
  }

  async convertQuotationToInvoice(quotationId: string): Promise<Invoice> {
    const quotation = await this.getOutboundQuotation(quotationId);
    if (!quotation) throw new Error('Quotation not found');
    
    // Generate invoice number
    const invoiceCount = await db.select({ count: count() }).from(invoices);
    const invoiceNumber = `INV${String(invoiceCount[0].count + 1).padStart(6, '0')}`;
    
    // Create invoice from quotation
    const invoiceData: InsertInvoice = {
      invoiceNumber,
      quotationId,
      customerId: quotation.customerId,
      userId: quotation.userId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotalAmount: quotation.subtotalAmount,
      totalAmount: quotation.totalAmount,
      balanceAmount: quotation.totalAmount,
      paymentTerms: quotation.paymentTerms,
      bankName: quotation.bankName,
      accountNumber: quotation.accountNumber,
      ifscCode: quotation.ifscCode
    };

    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    
    // Copy quotation items to invoice items
    const quotationItems = await this.getQuotationItems(quotationId);
    for (const item of quotationItems) {
      await this.createInvoiceItem({
        invoiceId: invoice.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        hsnSacCode: item.hsnSacCode,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount
      });
    }

    // Update quotation status to approved
    await this.updateOutboundQuotation(quotationId, { status: 'approved' });

    return invoice;
  }

  // Quotation Items
  async createQuotationItem(insertItem: InsertQuotationItem): Promise<QuotationItem> {
    const [item] = await db.insert(quotationItems).values(insertItem).returning();
    return item;
  }

  async getQuotationItems(quotationId: string): Promise<any[]> {
    return await db
      .select()
      .from(quotationItems)
      .leftJoin(products, eq(quotationItems.productId, products.id))
      .where(eq(quotationItems.quotationId, quotationId));
  }

  async deleteQuotationItems(quotationId: string): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }

  async updateQuotationItem(id: string, updateItem: Partial<InsertQuotationItem>): Promise<QuotationItem> {
    const [item] = await db
      .update(quotationItems)
      .set(updateItem)
      .where(eq(quotationItems.id, id))
      .returning();
    return item;
  }

  // Inbound Quotations (Clients/Vendors → Company)
  async getInboundQuotation(id: string): Promise<any> {
    const [quotation] = await db
      .select()
      .from(inboundQuotations)
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id))
      .leftJoin(users, eq(inboundQuotations.userId, users.id))
      .where(eq(inboundQuotations.id, id));
    
    if (!quotation) return undefined;

    const items = await this.getInboundQuotationItems(id);
    return {
      ...quotation.inbound_quotations,
      sender: quotation.suppliers,
      user: quotation.users,
      items
    };
  }

  async getInboundQuotations(): Promise<any[]> {
    const quotations = await db
      .select()
      .from(inboundQuotations)
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id))
      .leftJoin(users, eq(inboundQuotations.userId, users.id))
      .orderBy(desc(inboundQuotations.createdAt));

    return quotations.map(q => ({
      ...q.inbound_quotations,
      sender: q.suppliers,
      user: q.users
    }));
  }

  async createInboundQuotation(insertQuotation: InsertInboundQuotation): Promise<InboundQuotation> {
    const [quotation] = await db.insert(inboundQuotations).values(insertQuotation).returning();
    return quotation;
  }

  async updateInboundQuotation(id: string, updateQuotation: Partial<InsertInboundQuotation>): Promise<InboundQuotation> {
    const [quotation] = await db
      .update(inboundQuotations)
      .set({ ...updateQuotation, updatedAt: new Date() })
      .where(eq(inboundQuotations.id, id))
      .returning();
    return quotation;
  }

  async deleteInboundQuotation(id: string): Promise<void> {
    await this.deleteInboundQuotationItems(id);
    await db.delete(inboundQuotations).where(eq(inboundQuotations.id, id));
  }

  async getInboundQuotationsByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(inboundQuotations)
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id))
      .where(eq(inboundQuotations.status, status as any))
      .orderBy(desc(inboundQuotations.createdAt));
  }

  // Inbound Quotation Items
  async createInboundQuotationItem(insertItem: InsertInboundQuotationItem): Promise<InboundQuotationItem> {
    const [item] = await db.insert(inboundQuotationItems).values(insertItem).returning();
    return item;
  }

  async getInboundQuotationItems(quotationId: string): Promise<any[]> {
    return await db
      .select()
      .from(inboundQuotationItems)
      .where(eq(inboundQuotationItems.quotationId, quotationId));
  }

  async deleteInboundQuotationItems(quotationId: string): Promise<void> {
    await db.delete(inboundQuotationItems).where(eq(inboundQuotationItems.quotationId, quotationId));
  }

  // Invoices
  async getInvoice(id: string): Promise<any> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .leftJoin(outboundQuotations, eq(invoices.quotationId, outboundQuotations.id))
      .where(eq(invoices.id, id));
    
    if (!invoice) return undefined;

    const items = await this.getInvoiceItems(id);
    return {
      ...invoice.invoices,
      customer: invoice.customers,
      user: invoice.users,
      quotation: invoice.outbound_quotations,
      items
    };
  }

  async getInvoices(): Promise<any[]> {
    const invoices_data = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.createdAt));

    return invoices_data.map(inv => ({
      ...inv.invoices,
      customer: inv.customers,
      user: inv.users
    }));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: string, updateInvoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updateInvoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.deleteInvoiceItems(id);
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getInvoicesByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.status, status as any))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByCustomer(customerId: string): Promise<any[]> {
    return await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.createdAt));
  }

  // Invoice Items
  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(insertItem).returning();
    return item;
  }

  async getInvoiceItems(invoiceId: string): Promise<any[]> {
    return await db
      .select()
      .from(invoiceItems)
      .leftJoin(products, eq(invoiceItems.productId, products.id))
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async updateInvoiceItem(id: string, updateItem: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [item] = await db
      .update(invoiceItems)
      .set(updateItem)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  }
}

export const storage = new DatabaseStorage();
