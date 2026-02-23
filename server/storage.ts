import { customers } from "@shared/schema";
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
// ...existing code...
import { db } from "./db";
import {
  and,
  desc,
  eq,
  gte,
  lt,
  lte,
  sql,
  count,
  avg,
  isNotNull,
} from "drizzle-orm";
import {
  users,
  products,
  marketingAttendance,
  marketingTodays,
  marketingMetrics,
  leaveRequests,
  leads,
  fieldVisits,
  marketingTasks,
  activities,
  stockTransactions,
  logisticsShipments,
} from "@shared/schema";

// Minimal storage implementation providing only the methods used by the current routes

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type MarketingAttendance = typeof marketingAttendance.$inferSelect;
export type InsertMarketingAttendance = typeof marketingAttendance.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type FieldVisit = typeof fieldVisits.$inferSelect;
export type InsertFieldVisit = typeof fieldVisits.$inferInsert;
export type MarketingTask = typeof marketingTasks.$inferSelect;
export type InsertMarketingTask = typeof marketingTasks.$inferInsert;

import {
  suppliers,
  outboundQuotations,
  inboundQuotations,
  invoices,
  invoiceItems,
  purchaseOrders,
  purchaseOrderItems,
  salesOrders,
  salesOrderItems,
} from "@shared/schema";

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type OutboundQuotation = typeof outboundQuotations.$inferSelect;
export type InsertOutboundQuotation = typeof outboundQuotations.$inferInsert;
export type InboundQuotation = typeof inboundQuotations.$inferSelect;
export type InsertInboundQuotation = typeof inboundQuotations.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = typeof salesOrders.$inferInsert;

class Storage {
  // Find user by username or email
  async findUserByUsernameOrEmail(username: string, email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`${users.username} = ${username} OR ${users.email} = ${email}`);
    return user;
  }
  // Get all customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }
  // Clients CRUD
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [row] = await db.insert(customers).values(insertCustomer).returning();
    return row;
  }

  async updateCustomer(
    id: string,
    update: Partial<InsertCustomer>
  ): Promise<Customer> {
    const [row] = await db
      .update(customers)
      .set(update)
      .where(eq(customers.id, id))
      .returning();
    if (!row) {
      throw new Error(`Customer with ID '${id}' not found for update.`);
    }
    return row;
  }

  async deleteCustomer(id: string): Promise<void> {
    const deleted = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning({ id: customers.id });

    if (deleted.length === 0) {
      throw new Error(`Customer with ID '${id}' not found for deletion.`);
    }
  }

  // Suppliers CRUD
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [row] = await db.insert(suppliers).values(insertSupplier).returning();
    return row;
  }

  async updateSupplier(
    id: string | number,
    update: Partial<InsertSupplier>
  ): Promise<Supplier> {
    const [row] = await db
      .update(suppliers)
      .set(update)
      .where(eq(suppliers.id, id))
      .returning();
    return row;
  }

  async deleteSupplier(id: string | number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // async createOutboundQuotation(insertQuotation: InsertOutboundQuotation): Promise<OutboundQuotation> {
  //     const [row] = await db.insert(outboundQuotations).values(insertQuotation).returning();
  //     return row;
  //   }

  async createOutboundQuotation(
    insertQuotation: InsertOutboundQuotation
  ): Promise<OutboundQuotation> {
    const [row] = await db
      .insert(outboundQuotations)
      .values(insertQuotation)
      .returning();
    return row;
  }
  async getOutboundQuotations(filters?: {
    customerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<(OutboundQuotation & { customer: Customer | null })[]> {
    // Explicit return type
    try {
      console.log(
        "💾 [STORAGE] getOutboundQuotations - Fetching quotations with customer data",
        filters
      );

      // --- STEP 1: Perform LEFT JOIN using Drizzle's select syntax ---
      // Select all fields from outboundQuotations and specific fields from customers.
      let query = db
        .select({
          // Shorthand to select all fields from outboundQuotations table
          quotation: outboundQuotations,
          // Explicitly select fields from the joined customers table
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
            // Add other customer fields here if needed by the frontend later
            // address: customers.address,
            // city: customers.city,
            // ...
          },
        })
        .from(outboundQuotations)
        .leftJoin(customers, eq(outboundQuotations.customerId, customers.id)); // Join condition

      // --- STEP 1.5: Apply filters if provided ---
      const conditions = [];

      if (filters?.customerId) {
        conditions.push(eq(outboundQuotations.customerId, filters.customerId));
        console.log(
          "💾 [STORAGE] Filtering by customerId:",
          filters.customerId
        );
      }

      if (filters?.status) {
        conditions.push(eq(outboundQuotations.status, filters.status));
        console.log("💾 [STORAGE] Filtering by status:", filters.status);
      }

      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        conditions.push(gte(outboundQuotations.quotationDate, startDate));
        console.log("💾 [STORAGE] Filtering by startDate:", startDate);
      }

      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(outboundQuotations.quotationDate, endDate));
        console.log("💾 [STORAGE] Filtering by endDate:", endDate);
      }

      // Apply all conditions with AND logic
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const result = await query;

      console.log(
        `💾 [STORAGE] getOutboundQuotations - Fetched ${result.length} raw rows with join`
      );

      // --- STEP 2: Transform the Result ---
      // Drizzle returns an array like [{ quotation: {...}, customer: {...} }, ...].
      // We need to flatten this to match OutboundQuotation type with a nested 'customer' property.
      const transformedQuotations = result.map((row) => ({
        // Spread all fields from the 'quotation' object (outboundQuotations fields)
        ...row.quotation,
        // Add the 'customer' object. If no customer matched (LEFT JOIN), row.customer will be null.
        customer: row.customer || null, // Ensure it's explicitly null if no join
      }));

      console.log(
        `💾 [STORAGE] getOutboundQuotations - Transformed ${transformedQuotations.length} quotations`
      );
      // Return the correctly structured array
      return transformedQuotations;
    } catch (error) {
      // --- STEP 3: Handle Errors ---
      console.error(
        "💥 [STORAGE] getOutboundQuotations - Error fetching quotations with customers:",
        error
      );
      // Re-throw the error so the calling route can handle it (e.g., send a 500 response).
      throw error;
    }
  }
  async updateOutboundQuotation(
    id: string, // Assuming ID is a string (UUID) based on your schema
    update: Partial<InsertOutboundQuotation>
  ): Promise<OutboundQuotation> {
    try {
      console.log(
        `💾 [STORAGE] updateOutboundQuotation - Updating quotation ID: ${id}`,
        update
      );

      // --- Perform the database update ---
      const [updatedRow] = await db
        .update(outboundQuotations)
        .set(update) // Apply the partial update data
        .where(eq(outboundQuotations.id, id)) // Target the specific quotation by ID
        .returning(); // Get the updated row back

      // --- Check if the update was successful ---
      if (!updatedRow) {
        // If no row is returned, it means no quotation existed with that ID
        const errorMessage = `Outbound quotation with ID '${id}' not found for update.`;
        console.warn(`💾 [STORAGE] updateOutboundQuotation - ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(
        `💾 [STORAGE] updateOutboundQuotation - Successfully updated quotation ID: ${id}`
      );
      return updatedRow; // Return the updated quotation object
    } catch (error) {
      // --- Handle errors ---
      console.error(
        "💥 [STORAGE] updateOutboundQuotation - Error updating quotation:",
        error
      );
      // Re-throw the error so the calling route can handle it appropriately
      throw error;
    }
  }

  async getOutboundQuotation(
    id: string
  ): Promise<OutboundQuotation | undefined> {
    const [row] = await db
      .select()
      .from(outboundQuotations)
      .where(eq(outboundQuotations.id, id));
    return row;
  }

  async deleteOutboundQuotation(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.quotationId, id));
    await db.delete(salesOrders).where(eq(salesOrders.quotationId, id));
    await db.delete(outboundQuotations).where(eq(outboundQuotations.id, id));
  }

  // In-memory fallbacks (used when DB is unavailable)
  private inMemoryProducts: any[] = [];

  // Inbound Quotations CRUD////////////////////////////////////////////////////
  async createInboundQuotation(
    insertQuotation: InsertInboundQuotation
  ): Promise<InboundQuotation> {
    const [row] = await db
      .insert(inboundQuotations)
      .values(insertQuotation)
      .returning();
    return row;
  }

  // Add other CRUD methods if needed
  async getInboundQuotations(): Promise<InboundQuotation[]> {
    return await db
      .select({
        id: inboundQuotations.id,
        quotationNumber: inboundQuotations.quotationNumber,
        senderId: inboundQuotations.senderId,
        senderType: inboundQuotations.senderType,
        status: inboundQuotations.status,
        quotationDate: inboundQuotations.quotationDate,
        validUntil: inboundQuotations.validUntil,
        subject: inboundQuotations.subject,
        totalAmount: inboundQuotations.totalAmount,
        notes: inboundQuotations.notes,
        attachmentPath: inboundQuotations.attachmentPath,
        attachmentName: inboundQuotations.attachmentName,
        createdAt: inboundQuotations.createdAt,
      })
      .from(inboundQuotations);
  }

  async getInboundQuotation(id: string): Promise<InboundQuotation | undefined> {
    const [row] = await db
      .select({
        id: inboundQuotations.id,
        quotationNumber: inboundQuotations.quotationNumber,
        quotationDate: inboundQuotations.quotationDate,
        validUntil: inboundQuotations.validUntil,
        subject: inboundQuotations.subject,
        totalAmount: inboundQuotations.totalAmount,
        status: inboundQuotations.status,
        notes: inboundQuotations.notes,
        senderId: inboundQuotations.senderId,
        senderType: inboundQuotations.senderType,
        attachmentPath: inboundQuotations.attachmentPath,
        attachmentName: inboundQuotations.attachmentName,
        userId: inboundQuotations.userId,
        createdAt: inboundQuotations.createdAt,
      })
      .from(inboundQuotations)
      .where(eq(inboundQuotations.id, id))
      .limit(1);
    return row;
  }

  // async updateInboundQuotation(id: string, update: Partial<InsertInboundQuotation>): Promise<InboundQuotation> {
  //   const [row] = await db.update(inboundQuotations).set(update).where(eq(inboundQuotations.id, id)).returning();
  //   return row;
  // }
  async updateInboundQuotation(
    id: string | number,
    update: Partial<InsertInboundQuotation>
  ): Promise<InboundQuotation> {
    const [row] = await db
      .update(inboundQuotations)
      .set(update)
      .where(eq(inboundQuotations.id, id)) // Use the correct ID column name if it's not 'id'
      .returning();
    if (!row) {
      throw new Error("Inbound quotation not found for update"); // Or return undefined if preferred
    }
    return row;
  }

  // Purchase Orders CRUD
  async getPurchaseOrders(): Promise<any[]> {
    const orders = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        quotationId: purchaseOrders.quotationId,
        userId: purchaseOrders.userId,
        orderDate: purchaseOrders.orderDate,
        deliveryPeriod: purchaseOrders.deliveryPeriod,
        status: purchaseOrders.status,
        subtotalAmount: purchaseOrders.subtotalAmount,
        gstType: purchaseOrders.gstType,
        gstPercentage: purchaseOrders.gstPercentage,
        gstAmount: purchaseOrders.gstAmount,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          email: suppliers.email,
          phone: suppliers.phone,
        },
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(users, eq(purchaseOrders.userId, users.id))
      .orderBy(desc(purchaseOrders.createdAt));

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, order.id));
        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  async getPurchaseOrder(id: string): Promise<any | undefined> {
    const [order] = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        quotationId: purchaseOrders.quotationId,
        userId: purchaseOrders.userId,
        orderDate: purchaseOrders.orderDate,
        deliveryPeriod: purchaseOrders.deliveryPeriod,
        status: purchaseOrders.status,
        subtotalAmount: purchaseOrders.subtotalAmount,
        gstType: purchaseOrders.gstType,
        gstPercentage: purchaseOrders.gstPercentage,
        gstAmount: purchaseOrders.gstAmount,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          email: suppliers.email,
          phone: suppliers.phone,
          address: suppliers.address,
        },
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(users, eq(purchaseOrders.userId, users.id))
      .where(eq(purchaseOrders.id, id));

    if (!order) return undefined;

    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, order.id));

    return { ...order, items };
  }

  async createPurchaseOrder(
    insertPO: any
  ): Promise<any> {
    try {
      console.log("💾 [STORAGE] createPurchaseOrder - Input:", JSON.stringify(insertPO, null, 2));
      const { items, ...poData } = insertPO;
      
      const [row] = await db.insert(purchaseOrders).values(poData).returning();
      console.log("💾 [STORAGE] createPurchaseOrder - PO Row created:", row.id);
      
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          ...item,
          purchaseOrderId: row.id,
        }));
        await db.insert(purchaseOrderItems).values(itemsToInsert);
        console.log(`💾 [STORAGE] createPurchaseOrder - ${items.length} items created`);
      }
      
      const purchaseOrder = await this.getPurchaseOrder(row.id);

      // Stock update logic: if created with 'delivered' status
      if (purchaseOrder.status === "delivered") {
        await this.updateStockFromPo(purchaseOrder);
      }
      
      return purchaseOrder;
    } catch (error) {
      console.error("💥 [STORAGE] createPurchaseOrder - Error:", error);
      throw error;
    }
  }

  private async updateStockFromPo(purchaseOrder: any) {
    try {
      console.log(`📦 [STORAGE] PO ${purchaseOrder.poNumber} marked as delivered. Updating stock...`);
      for (const item of purchaseOrder.items) {
        if (item.productId) {
          console.log(`📦 [STORAGE] Processing item: ${item.itemName} (ID: ${item.productId})`);
          await db.transaction(async (tx) => {
            // Create stock transaction
            const transactionData = {
              userId: purchaseOrder.userId,
              productId: item.productId,
              type: "in" as const,
              reason: "Purchase Order Receipt",
              quantity: item.quantity,
              unitCost: item.unitPrice,
              referenceNumber: purchaseOrder.poNumber,
              notes: `Received from PO: ${purchaseOrder.poNumber}`,
            };
            console.log(`📦 [STORAGE] Creating stock transaction:`, JSON.stringify(transactionData, null, 2));
            await tx.insert(stockTransactions).values(transactionData);

            // Update product stock
            console.log(`📦 [STORAGE] Updating product stock for: ${item.productId}`);
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
            
            console.log(`✅ [STORAGE] Updated stock for product ${item.productId} (+${item.quantity})`);
          });
        } else {
          console.log(`⚠️ [STORAGE] Skipping item ${item.itemName} as it has no productId`);
        }
      }
    } catch (error) {
      console.error("💥 [STORAGE] Error in updateStockFromPo:", error);
      throw error;
    }
  }

  async updatePurchaseOrder(
    id: string,
    update: any
  ): Promise<any> {
    const oldPo = await this.getPurchaseOrder(id);
    if (!oldPo) throw new Error("Purchase order not found");

    const { items, ...poData } = update;
    
    console.log(`💾 [STORAGE] Updating PO ${id} with poData:`, JSON.stringify(poData, null, 2));
    if (Object.keys(poData).length > 0) {
      try {
        await db
          .update(purchaseOrders)
          .set({ ...poData, updatedAt: new Date() })
          .where(eq(purchaseOrders.id, id));
      } catch (e) {
        console.error(`❌ [STORAGE] Error updating PO ${id}:`, e);
        throw e;
      }
    }
    
    if (items) {
      console.log(`💾 [STORAGE] Updating PO ${id} with ${items.length} items`);
      try {
        // Simple strategy: delete and re-insert items
        await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
        if (items.length > 0) {
          const itemsToInsert = items.map((item: any) => ({
            ...item,
            purchaseOrderId: id,
          }));
          await db.insert(purchaseOrderItems).values(itemsToInsert);
        }
      } catch (e) {
        console.error(`❌ [STORAGE] Error updating items for PO ${id}:`, e);
        throw e;
      }
    }
    
    const updatedPo = await this.getPurchaseOrder(id);

    // Stock update logic: if status changed to 'delivered'
    if (oldPo.status !== "delivered" && updatedPo.status === "delivered") {
      try {
        await this.updateStockFromPo(updatedPo);
      } catch (e) {
        console.error("❌ [STORAGE] Error updating stock from PO:", e);
        throw e;
      }
    }
    
    return updatedPo;
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return u || undefined;
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string | null;
    role?: "employee" | "admin";
  }) {
    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        password: data.password, // hashed already!
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department ?? null,
        role: data.role ?? "employee",
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [u] = await db
      .update(users)
      .set({ ...updateUser })
      .where(eq(users.id, id))
      .returning();
    return u;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const rows = await db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt));
      // Merge DB rows with any in-memory products (avoid duplicates by id/sku)
      if (this.inMemoryProducts.length === 0) return rows as any;
      const bySku = new Map<string, any>();
      for (const r of rows as any[]) {
        if (r.sku) bySku.set(String(r.sku), r);
      }
      const merged = [...(rows as any[])];
      for (const p of this.inMemoryProducts) {
        // If DB already has same SKU, skip in-memory entry
        if (p.sku && bySku.has(String(p.sku))) continue;
        merged.push(p);
      }
      return merged as any;
    } catch (_e) {
      // DB unavailable; serve in-memory list
      return this.inMemoryProducts as any;
    }
  }

  addProductFallback(p: any) {
    // ensure it has id
    const id = p.id || String(Date.now());
    const record = { id, createdAt: new Date().toISOString(), ...p };
    // replace if same id or same sku exists
    const idx = this.inMemoryProducts.findIndex(
      (x) => x.id === record.id || (record.sku && x.sku === record.sku)
    );
    if (idx >= 0) this.inMemoryProducts[idx] = record;
    else this.inMemoryProducts.push(record);
    return record;
  }

  updateProductFallback(id: string | number, patch: any) {
    const idx = this.inMemoryProducts.findIndex(
      (x) => String(x.id) === String(id)
    );
    if (idx >= 0) {
      this.inMemoryProducts[idx] = { ...this.inMemoryProducts[idx], ...patch };
      return this.inMemoryProducts[idx];
    }
    // if not found, create
    const created = { id: String(id), ...patch };
    this.inMemoryProducts.push(created);
    return created;
  }

  deleteProductFallback(id: string | number) {
    const idx = this.inMemoryProducts.findIndex(
      (x) => String(x.id) === String(id)
    );
    if (idx >= 0) this.inMemoryProducts.splice(idx, 1);
  }

  // Activity log (no-op minimal stub)
  async createActivity(_activity: any): Promise<any> {
    // No persistent activity log table is defined in the current schema.
    // Return a minimal object to satisfy callers that do not rely on the result.
    return {
      id: "activity-stub",
      createdAt: new Date().toISOString(),
      ..._activity,
    };
  }

  // Marketing Attendance
  async getMarketingAttendance(id: string): Promise<any> {
    const [row] = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(eq(marketingAttendance.id, id));

    if (!row) return undefined;
    return {
      ...row.marketingAttendance,
      user: row.users,
    };
  }

  async getMarketingAttendances(): Promise<any[]> {
    const rows = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .orderBy(desc(marketingAttendance.date));

    return rows.map((r) => ({
      ...r.marketingAttendance,
      user: r.users,
    }));
  }

  async createMarketingAttendance(
    insertAttendance: InsertMarketingAttendance
  ): Promise<MarketingAttendance> {
    const [row] = await db
      .insert(marketingAttendance)
      .values(insertAttendance)
      .returning();
    return row;
  }

  async updateMarketingAttendance(
    id: string,
    update: Partial<InsertMarketingAttendance>
  ): Promise<MarketingAttendance> {
    const [row] = await db
      .update(marketingAttendance)
      .set({ ...update, date: update.date ?? undefined })
      .where(eq(marketingAttendance.id, id))
      .returning();
    return row;
  }

  async deleteMarketingAttendance(id: string): Promise<void> {
    await db.delete(marketingAttendance).where(eq(marketingAttendance.id, id));
  }

  async getMarketingAttendanceByEmployee(userId: string): Promise<any[]> {
    const rows = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(eq(marketingAttendance.userId, userId))
      .orderBy(desc(marketingAttendance.date));

    return rows.map((r) => ({
      ...r.marketingAttendance,
      user: r.users,
    }));
  }

  async getMarketingAttendanceByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const rows = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(
        and(
          gte(marketingAttendance.date, startDate),
          lte(marketingAttendance.date, endDate)
        )
      )
      .orderBy(desc(marketingAttendance.date));

    return rows.map((r) => ({
      ...r.marketingAttendance,
      user: r.users,
    }));
  }
  async getTodayMarketingAttendance(): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
      SELECT ma.*,
             u.id   AS user_id,
             CONCAT(u."firstName", ' ', u."lastName") AS user_name,
             u.email AS user_email
      FROM marketing_Todays ma
      LEFT JOIN users u ON ma."userId" = u.id
      WHERE DATE(ma.date) = CURRENT_DATE
      ORDER BY ma.date DESC
    `);

      return rows.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        date: r.date,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        checkInLocation: r.checkInLocation,
        checkOutLocation: r.checkOutLocation,
        latitude: r.latitude,
        longitude: r.longitude,
        location: r.location,
        photoPath: r.photoPath,
        workDescription: r.workDescription,
        attendanceStatus: r.attendanceStatus,
        visitCount: r.visitCount,
        tasksCompleted: r.tasksCompleted,
        outcome: r.outcome,
        nextAction: r.nextAction,
        isOnLeave: r.isOnLeave,
        user: {
          id: r.user_id,
          name: r.user_name,
          email: r.user_email,
        },
      }));
    } catch (error: any) {
      console.error("❌ Error in getTodayMarketingAttendance:", error);
      throw new Error("Failed to fetch attendance record");
    }
  }

  async checkInMarketingAttendance(
    userId: string,
    data: any
  ): Promise<MarketingAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check existing record for today
    const existing = await db
      .select()
      .from(marketingAttendance)
      .where(
        and(
          eq(marketingAttendance.userId, userId),
          gte(marketingAttendance.date, today)
        )
      );

    if (existing.length > 0) {
      const [row] = await db
        .update(marketingAttendance)
        .set({
          checkInTime: data.checkInTime ?? new Date(),
          checkInLatitude: data.latitude,
          checkInLocation: data.location,
        })
        .where(eq(marketingAttendance.id, (existing[0] as any).id))
        .returning();
      return row;
    }

    const insert: InsertMarketingAttendance = {
      userId,
      date: data.date ?? new Date(),
      checkInTime: data.checkInTime ?? new Date(),
      checkInLatitude: data.latitude,
      checkInLocation: data.location,
    } as InsertMarketingAttendance;

    const [row] = await db
      .insert(marketingAttendance)
      .values(insert)
      .returning();
    return row;
  }

  async checkOutMarketingAttendance(
    userId: string,
    data: any
  ): Promise<MarketingAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db
      .select()
      .from(marketingAttendance)
      .where(
        and(
          eq(marketingAttendance.userId, userId),
          gte(marketingAttendance.date, today)
        )
      );

    if (existing.length === 0) {
      // If no check-in, create minimal record then update
      const base: InsertMarketingAttendance = {
        userId,
        date: new Date(),
        checkInTime: new Date(),
      } as InsertMarketingAttendance;
      const [created] = await db
        .insert(marketingAttendance)
        .values(base)
        .returning();
      existing.push(created as any);
    }

    const [row] = await db
      .update(marketingAttendance)
      .set({
        checkOutTime: data.checkOutTime ?? new Date(),
        checkOutLocation: data.location,
      })
      .where(eq(marketingAttendance.userId, userId))
      .returning();

    return row;
  }

  async checkOutMarketingAttendanceById(
    attendanceId: string,
    data: any
  ): Promise<MarketingAttendance> {
    const [row] = await db
      .update(marketingAttendance)
      .set({
        checkOutTime: data.checkOutTime ?? new Date(),
        checkOutLocation: data.checkOutLocation,
      })
      .where(eq(marketingAttendance.id, attendanceId))
      .returning();

    return row;
  }
  async getMarketingAttendanceMetrics(): Promise<any> {
    try {
      const rows = await db.execute(sql`
      SELECT 
        COUNT(*) AS total_records,
        COUNT(CASE WHEN ma."attendanceStatus" = 'present' THEN 1 END) AS present_count,
        COUNT(CASE WHEN ma."attendanceStatus" = 'absent' THEN 1 END) AS absent_count,
        COUNT(CASE WHEN ma."isOnLeave" = true THEN 1 END) AS leave_count,
        COALESCE(AVG(NULLIF(ma."visitCount", 0)), 0) AS avg_visits,
        COALESCE(AVG(NULLIF(ma."tasksCompleted", 0)), 0) AS avg_tasks
      FROM marketing_Todays ma
    `);

      const r = rows[0];

      return {
        totalRecords: Number(r.total_records ?? 0),
        presentCount: Number(r.present_count ?? 0),
        absentCount: Number(r.absent_count ?? 0),
        leaveCount: Number(r.leave_count ?? 0),
        avgVisits: Number(r.avg_visits ?? 0),
        avgTasks: Number(r.avg_tasks ?? 0),
      };
    } catch (error: any) {
      console.error("❌ Error in getMarketingAttendanceMetrics:", error);
      throw new Error("Failed to fetch attendance metrics");
    }
  }

  // Leave Request Methods
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const rows = await db.execute(sql`
    SELECT 
      *,
      EXTRACT(DAY FROM (end_date - start_date)) + 1 AS total_days
    FROM leave_requests
    ORDER BY start_date DESC
  `);
    return rows;
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [row] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));
    return row;
  }

  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.startDate));
  }

  async createLeaveRequest(
    insertLeaveRequest: InsertLeaveRequest
  ): Promise<LeaveRequest> {
    const [row] = await db
      .insert(leaveRequests)
      .values(insertLeaveRequest)
      .returning();
    return row;
  }

  async updateLeaveRequest(
    id: string,
    update: Partial<InsertLeaveRequest>
  ): Promise<LeaveRequest> {
    const [row] = await db
      .update(leaveRequests)
      .set(update)
      .where(eq(leaveRequests.id, id))
      .returning();
    return row;
  }

  async deleteLeaveRequest(id: string): Promise<void> {
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
  }

  async getLeaveRequestsByStatus(status: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.status, status))
      .orderBy(desc(leaveRequests.startDate));
  }

  async getLeaveRequestsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          gte(leaveRequests.startDate, startDate),
          lte(leaveRequests.endDate, endDate)
        )
      )
      .orderBy(desc(leaveRequests.startDate));
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        quotationId: invoices.quotationId,
        customerId: invoices.customerId,
        userId: invoices.userId,
        status: invoices.status,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        subtotalAmount: invoices.subtotalAmount,
        // GST fields - will be null if columns don't exist yet
        cgstRate: sql<number>`${invoices.cgstRate}`.as("cgstRate"),
        cgstAmount: sql<number>`${invoices.cgstAmount}`.as("cgstAmount"),
        sgstRate: sql<number>`${invoices.sgstRate}`.as("sgstRate"),
        sgstAmount: sql<number>`${invoices.sgstAmount}`.as("sgstAmount"),
        igstRate: sql<number>`${invoices.igstRate}`.as("igstRate"),
        igstAmount: sql<number>`${invoices.igstAmount}`.as("igstAmount"),
        discountAmount: sql<number>`${invoices.discountAmount}`.as(
          "discountAmount"
        ),
        totalAmount: sql<number>`${invoices.totalAmount}`.as("totalAmount"),
        balanceAmount: sql<number>`${invoices.balanceAmount}`.as(
          "balanceAmount"
        ),
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          gstNumber: customers.gstNumber,
        },
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.invoiceDate));
  }

  async getInvoice(id: string | number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [row] = await db.insert(invoices).values(insertInvoice).returning();
    return row;
  }

  async updateInvoice(
    id: string | number,
    update: Partial<InsertInvoice>
  ): Promise<Invoice> {
    const [row] = await db
      .update(invoices)
      .set(update)
      .where(eq(invoices.id, id))
      .returning();
    return row;
  }

  async deleteInvoice(id: string | number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // =====================
  // MARKETING TASKS CRUD
  // =====================
  async getMarketingTasks(): Promise<MarketingTask[]> {
    return await db
      .select()
      .from(marketingTasks)
      .orderBy(desc(marketingTasks.createdAt));
  }

  async getMarketingTask(id: string): Promise<MarketingTask | undefined> {
    const [row] = await db
      .select()
      .from(marketingTasks)
      .where(eq(marketingTasks.id, id));
    return row;
  }

  async createMarketingTask(
    insertTask: InsertMarketingTask
  ): Promise<MarketingTask> {
    const [row] = await db
      .insert(marketingTasks)
      .values(insertTask)
      .returning();
    return row;
  }

  async updateMarketingTask(
    id: string,
    update: Partial<InsertMarketingTask>
  ): Promise<MarketingTask> {
    const [row] = await db
      .update(marketingTasks)
      .set(update)
      .where(eq(marketingTasks.id, id))
      .returning();
    if (!row) {
      throw new Error(`Marketing task with ID '${id}' not found for update.`);
    }
    return row;
  }

  async deleteMarketingTask(id: string): Promise<void> {
    await db.delete(marketingTasks).where(eq(marketingTasks.id, id));
  }

  // =====================
  // LEADS CRUD
  // =====================
  async getLeads(filters?: any): Promise<any[]> {
    let query = db
      .select({
        lead: leads,
        assignee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id));

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }

    if (filters?.source) {
      conditions.push(eq(leads.source, filters.source));
    }

    if (filters?.priority) {
      conditions.push(eq(leads.priority, filters.priority));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(leads.assignedTo, filters.assignedTo));
    }

    if (filters?.search) {
      conditions.push(
        sql`(${leads.firstName} ILIKE ${`%${filters.search}%`} OR 
             ${leads.lastName} ILIKE ${`%${filters.search}%`} OR 
             ${leads.companyName} ILIKE ${`%${filters.search}%`} OR 
             ${leads.email} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (filters?.userScope?.showOnlyUserLeads) {
      conditions.push(
        sql`(${leads.createdBy} = ${filters.userScope.userId} OR 
             ${leads.assignedTo} = ${filters.userScope.userId})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.orderBy(desc(leads.createdAt));

    return result.map((row) => ({
      ...row.lead,
      assignee: row.assignee,
    }));
  }

  async getLead(id: string): Promise<any | undefined> {
    const [row] = await db
      .select({
        lead: leads,
        assignee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.id, id));
    
    if (!row) return undefined;

    return {
      ...row.lead,
      assignee: row.assignee,
    };
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [row] = await db.insert(leads).values(insertLead).returning();
    return row;
  }

  async updateLead(id: string, update: Partial<InsertLead>): Promise<Lead> {
    const [row] = await db
      .update(leads)
      .set(update)
      .where(eq(leads.id, id))
      .returning();
    if (!row) {
      throw new Error(`Lead with ID '${id}' not found for update.`);
    }
    return row;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async convertLeadToCustomer(leadId: string): Promise<Customer> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead with ID '${leadId}' not found for conversion.`);
    }

    const insertCustomer: InsertCustomer = {
      name: `${lead.firstName} ${lead.lastName}`,
      company: lead.companyName,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zipCode: lead.zipCode,
      country: lead.country || "India",
    };

    const customer = await this.createCustomer(insertCustomer);
    await this.updateLead(leadId, { status: "converted" });
    return customer;
  }

  // =====================
  // ACTIVITIES CRUD
  // =====================
  async createActivity(insertActivity: any): Promise<any> {
    const [row] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return row;
  }

  // =====================
  // FIELD VISITS CRUD
  // =====================
  async getFieldVisits(): Promise<FieldVisit[]> {
    return await db
      .select()
      .from(fieldVisits)
      .orderBy(desc(fieldVisits.createdAt));
  }

  async getFieldVisit(id: string): Promise<FieldVisit | undefined> {
    const [row] = await db
      .select()
      .from(fieldVisits)
      .where(eq(fieldVisits.id, id));
    return row;
  }

  async createFieldVisit(insertVisit: InsertFieldVisit): Promise<FieldVisit> {
    const [row] = await db.insert(fieldVisits).values(insertVisit).returning();
    return row;
  }

  async updateFieldVisit(
    id: string,
    update: Partial<InsertFieldVisit>
  ): Promise<FieldVisit> {
    const [row] = await db
      .update(fieldVisits)
      .set(update)
      .where(eq(fieldVisits.id, id))
      .returning();
    if (!row) {
      throw new Error(`Field visit with ID '${id}' not found for update.`);
    }
    return row;
  }

  async deleteFieldVisit(id: string): Promise<void> {
    await db.delete(fieldVisits).where(eq(fieldVisits.id, id));
  }

  // Sales Order Methods
  async getSalesOrders(): Promise<any[]> {
    const result = await db
      .select({
        order: salesOrders,
        customer: customers,
        quotation: outboundQuotations,
        purchaseOrder: purchaseOrders,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(outboundQuotations, eq(salesOrders.quotationId, outboundQuotations.id))
      .leftJoin(purchaseOrders, eq(salesOrders.purchaseOrderId, purchaseOrders.id))
      .orderBy(desc(salesOrders.createdAt));

    const ordersWithItems = await Promise.all(
      result.map(async (row) => {
        const items = await db
          .select()
          .from(salesOrderItems)
          .where(eq(salesOrderItems.salesOrderId, row.order.id));

        return {
          ...row.order,
          customer: row.customer,
          quotation: row.quotation,
          purchaseOrder: row.purchaseOrder,
          items: items,
        };
      })
    );

    return ordersWithItems;
  }

  async getSalesOrder(id: string): Promise<any | undefined> {
    const [row] = await db
      .select({
        order: salesOrders,
        customer: customers,
        quotation: outboundQuotations,
        purchaseOrder: purchaseOrders,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(outboundQuotations, eq(salesOrders.quotationId, outboundQuotations.id))
      .leftJoin(purchaseOrders, eq(salesOrders.purchaseOrderId, purchaseOrders.id))
      .where(eq(salesOrders.id, id));

    if (!row) return undefined;

    const items = await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, id));

    return {
      ...row.order,
      customer: row.customer,
      quotation: row.quotation,
      purchaseOrder: row.purchaseOrder,
      items: items,
    };
  }

  async createSalesOrder(order: any): Promise<any> {
    const { items, ...orderData } = order;

    return await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(salesOrders)
        .values(orderData)
        .returning();

      let createdItems = [];
      if (items && items.length > 0) {
        createdItems = await tx.insert(salesOrderItems).values(
          items.map((item: any) => ({
            ...item,
            salesOrderId: newOrder.id,
          }))
        ).returning();
      }

      return {
        ...newOrder,
        items: createdItems,
      };
    });
  }

  async updateSalesOrderStatus(id: string, status: string): Promise<any> {
    console.log(`💾 [STORAGE] updateSalesOrderStatus hit for ID: ${id}, status: ${status}`);
    const oldOrder = await this.getSalesOrder(id);
    if (!oldOrder) throw new Error(`Sales order with ID '${id}' not found.`);

    console.log(`💾 [STORAGE] Old Order Status: ${oldOrder.status}, materialReleased: ${oldOrder.materialReleased}`);

    let dbStatus = status;
    let materialReleasedUpdate = false;

    // Handle the virtual 'material_released' status
    if (status === "material_released") {
      dbStatus = "confirmed"; // Map back to valid DB enum
      materialReleasedUpdate = true;
    }

    console.log(`💾 [STORAGE] Updating DB with status: ${dbStatus}, materialReleased: ${materialReleasedUpdate || oldOrder.materialReleased}`);

    const [row] = await db
      .update(salesOrders)
      .set({ 
        status: dbStatus as any, 
        materialReleased: materialReleasedUpdate ? true : oldOrder.materialReleased,
        updatedAt: new Date() 
      })
      .where(eq(salesOrders.id, id))
      .returning();

    if (!row) {
      throw new Error(`Sales order with ID '${id}' not found for update.`);
    }

    const updatedOrder = await this.getSalesOrder(id);
    console.log(`💾 [STORAGE] Updated Order Status: ${updatedOrder.status}, materialReleased: ${updatedOrder.materialReleased}`);

    // Stock deduction logic: trigger if materialReleased just became true, OR if status changed from pending to confirmed/processing
    const becameReleased = !oldOrder.materialReleased && updatedOrder.materialReleased;
    const statusDeductionTriggers = ["confirmed", "processing"];
    const statusJustTriggered = oldOrder.status === "pending" && statusDeductionTriggers.includes(updatedOrder.status);

    console.log(`💾 [STORAGE] Stock deduction trigger check - becameReleased: ${becameReleased}, statusJustTriggered: ${statusJustTriggered}, alreadyDeducted: ${oldOrder.stockDeducted}`);

    if ((becameReleased || statusJustTriggered) && !oldOrder.stockDeducted) {
      await this.deductStockFromSalesOrder(updatedOrder);
      // Mark as deducted
      await db.update(salesOrders).set({ stockDeducted: true }).where(eq(salesOrders.id, id));
    }

    // Auto-create shipment when status changes to 'shipped'
    if (status === 'shipped' && oldOrder.status !== 'shipped') {
      console.log(`📦 [STORAGE] Creating shipment for SO: ${updatedOrder.orderNumber}`);
      try {
        const shipmentData = {
          consignmentNumber: `SHP-${updatedOrder.orderNumber}-${Date.now()}`,
          source: updatedOrder.source || 'Warehouse',
          destination: updatedOrder.destination || (updatedOrder.customer?.address || 'To Be Determined'),
          clientId: updatedOrder.customerId,
          dispatchDate: new Date().toISOString(),
          currentStatus: 'packed',
          notes: `Auto-created for Sales Order: ${updatedOrder.orderNumber}`,
        };
        await this.createLogisticsShipment(shipmentData);
        console.log(`✅ [STORAGE] Shipment created successfully for SO: ${updatedOrder.orderNumber}`);
      } catch (shipmentError) {
        console.error(`❌ [STORAGE] Failed to create shipment for SO: ${updatedOrder.orderNumber}`, shipmentError);
        // Don't fail the status update if shipment creation fails
      }
    }

    return updatedOrder;
  }

  private async deductStockFromSalesOrder(order: any) {
    try {
      console.log(`📦 [STORAGE] Sales Order ${order.orderNumber} confirmed. Deducting stock...`);
      
      // Ensure we have items
      if (!order.items || order.items.length === 0) {
        console.warn(`⚠️ [STORAGE] Sales Order ${order.orderNumber} has no items. Nothing to deduct.`);
        return;
      }

      for (const item of order.items) {
        let productId = item.productId;
        
        // If productId is missing, try to find product by name or SKU as a fallback
        if (!productId) {
          console.log(`🔍 [STORAGE] item.productId is null for "${item.itemName}". Attempting fallback lookup...`);
          
          // Debug: log all products to see if they exist
          const allProds = await db.select().from(products);
          console.log(`🔍 [STORAGE] Debug: Total products in DB: ${allProds.length}`);
          allProds.forEach(p => console.log(`   - Product: "${p.name}", SKU: "${p.sku}"`));

          const [matchedProduct] = await db
            .select()
            .from(products)
            .where(
              sql`LOWER(TRIM(${products.name})) = LOWER(TRIM(${item.itemName})) OR LOWER(TRIM(${products.sku})) = LOWER(TRIM(${item.itemName}))`
            )
            .limit(1);
          
          if (matchedProduct) {
            productId = matchedProduct.id;
            console.log(`✅ [STORAGE] Fallback match found for "${item.itemName}": ${productId}`);
          } else {
            console.log(`❌ [STORAGE] No fallback match found for "${item.itemName}"`);
          }
        }

        if (productId) {
          console.log(`📦 [STORAGE] Processing item: ${item.itemName} (ID: ${productId})`);
          await db.transaction(async (tx) => {
            // Create stock transaction (Stock Out)
            const transactionData = {
              userId: order.userId,
              productId: productId,
              type: "out" as const,
              reason: "sale",
              quantity: item.quantity,
              unitCost: item.unitPrice,
              referenceNumber: order.orderNumber,
              notes: `Deducted for SO: ${order.orderNumber}`,
            };
            console.log(`📦 [STORAGE] Creating stock transaction (OUT):`, JSON.stringify(transactionData, null, 2));
            await tx.insert(stockTransactions).values(transactionData);

            // Update product stock (decrease)
            console.log(`📦 [STORAGE] Updating product stock for: ${productId} (-${item.quantity})`);
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} - ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, productId));
            
            console.log(`✅ [STORAGE] Deducted stock for product ${productId} (-${item.quantity})`);
          });
        } else {
          console.warn(`⚠️ [STORAGE] Skipping item "${item.itemName}" as it has no productId linked and no matching product found by name/SKU`);
        }
      }
    } catch (error) {
      console.error("💥 [STORAGE] Error in deductStockFromSalesOrder:", error);
      throw error;
    }
  }

  async createLogisticsShipment(shipmentData: any): Promise<any> {
    try {
      console.log(`📦 [STORAGE] Creating logistics shipment:`, shipmentData);
      
      const insertData: any = { ...shipmentData, createdAt: new Date(), updatedAt: new Date() };
      
      if (shipmentData.dispatchDate && typeof shipmentData.dispatchDate === 'string') {
        insertData.dispatchDate = new Date(shipmentData.dispatchDate);
      }
      if (shipmentData.expectedDeliveryDate && typeof shipmentData.expectedDeliveryDate === 'string') {
        insertData.expectedDeliveryDate = new Date(shipmentData.expectedDeliveryDate);
      }
      if (shipmentData.deliveredAt && typeof shipmentData.deliveredAt === 'string') {
        insertData.deliveredAt = new Date(shipmentData.deliveredAt);
      }
      if (shipmentData.closedAt && typeof shipmentData.closedAt === 'string') {
        insertData.closedAt = new Date(shipmentData.closedAt);
      }
      
      const [shipment] = await db
        .insert(logisticsShipments)
        .values(insertData)
        .returning();
      
      console.log(`✅ [STORAGE] Shipment created:`, shipment.id);
      return {
        ...shipment,
        currentStatus: shipment.currentStatus?.toLowerCase() || 'created'
      };
    } catch (error) {
      console.error(`❌ [STORAGE] Error creating shipment:`, error);
      throw error;
    }
  }

  async getLogisticsShipments(): Promise<any[]> {
    try {
      const shipments = await db.select().from(logisticsShipments);
      return shipments.map(s => ({
        ...s,
        currentStatus: s.currentStatus?.toLowerCase() || 'created'
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments:`, error);
      return [];
    }
  }

  async getLogisticsShipment(id: string): Promise<any> {
    try {
      const [shipment] = await db
        .select()
        .from(logisticsShipments)
        .where(eq(logisticsShipments.id, id));
      if (shipment) {
        return {
          ...shipment,
          currentStatus: shipment.currentStatus?.toLowerCase() || 'created'
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipment:`, error);
      return null;
    }
  }

  async updateLogisticsShipment(id: string, data: any): Promise<any> {
    try {
      console.log(`📦 [STORAGE] Updating shipment ${id}:`, data);
      
      const updateData: any = { ...data, updatedAt: new Date() };
      
      if (data.dispatchDate && typeof data.dispatchDate === 'string') {
        updateData.dispatchDate = new Date(data.dispatchDate);
      }
      if (data.expectedDeliveryDate && typeof data.expectedDeliveryDate === 'string') {
        updateData.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
      }
      if (data.deliveredAt && typeof data.deliveredAt === 'string') {
        updateData.deliveredAt = new Date(data.deliveredAt);
      }
      if (data.closedAt && typeof data.closedAt === 'string') {
        updateData.closedAt = new Date(data.closedAt);
      }
      
      const [shipment] = await db
        .update(logisticsShipments)
        .set(updateData)
        .where(eq(logisticsShipments.id, id))
        .returning();
      
      return {
        ...shipment,
        currentStatus: shipment.currentStatus?.toLowerCase() || 'created'
      };
    } catch (error) {
      console.error(`❌ [STORAGE] Error updating shipment:`, error);
      throw error;
    }
  }

  async deleteLogisticsShipment(id: string): Promise<void> {
    try {
      console.log(`📦 [STORAGE] Deleting shipment ${id}`);
      await db.delete(logisticsShipments).where(eq(logisticsShipments.id, id));
    } catch (error) {
      console.error(`❌ [STORAGE] Error deleting shipment:`, error);
      throw error;
    }
  }

  async getLogisticsShipmentsByStatus(status: string): Promise<any[]> {
    try {
      const shipments = await db.select().from(logisticsShipments);
      return shipments
        .filter(s => s.currentStatus?.toLowerCase() === status.toLowerCase())
        .map(s => ({
          ...s,
          currentStatus: s.currentStatus?.toLowerCase() || 'created'
        }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by status:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByEmployee(employeeId: string): Promise<any[]> {
    try {
      const shipments = await db
        .select()
        .from(logisticsShipments)
        .where(eq(logisticsShipments.assignedTo, employeeId));
      return shipments.map(s => ({
        ...s,
        currentStatus: s.currentStatus?.toLowerCase() || 'created'
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by employee:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByClient(clientId: string): Promise<any[]> {
    try {
      const shipments = await db
        .select()
        .from(logisticsShipments)
        .where(eq(logisticsShipments.clientId, clientId));
      return shipments.map(s => ({
        ...s,
        currentStatus: s.currentStatus?.toLowerCase() || 'created'
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by client:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByVendor(vendorId: string): Promise<any[]> {
    try {
      const shipments = await db
        .select()
        .from(logisticsShipments)
        .where(eq(logisticsShipments.vendorId, vendorId));
      return shipments.map(s => ({
        ...s,
        currentStatus: s.currentStatus?.toLowerCase() || 'created'
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by vendor:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const shipments = await db
        .select()
        .from(logisticsShipments)
        .where(
          and(
            gte(logisticsShipments.dispatchDate, startDate),
            lte(logisticsShipments.dispatchDate, endDate)
          )
        );
      return shipments.map(s => ({
        ...s,
        currentStatus: s.currentStatus?.toLowerCase() || 'created'
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by date range:`, error);
      return [];
    }
  }

  async updateShipmentStatus(id: string, statusData: any): Promise<any> {
    try {
      const updateSet: any = {
        currentStatus: statusData.status || statusData,
        updatedAt: new Date(),
      };
      
      if (statusData.currentLocation) {
        updateSet.currentLocation = statusData.currentLocation;
      }
      if (statusData.notes) {
        updateSet.notes = statusData.notes;
      }
      
      const [shipment] = await db
        .update(logisticsShipments)
        .set(updateSet)
        .where(eq(logisticsShipments.id, id))
        .returning();
      return {
        ...shipment,
        currentStatus: shipment.currentStatus?.toLowerCase() || 'created'
      };
    } catch (error) {
      console.error(`❌ [STORAGE] Error updating shipment status:`, error);
      throw error;
    }
  }

  async getShipmentTimeline(id: string): Promise<any[]> {
    try {
      // For now, return empty array - timeline would need a separate table
      return [];
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipment timeline:`, error);
      return [];
    }
  }

  async closeShipment(id: string, podData: any): Promise<any> {
    try {
      const [shipment] = await db
        .update(logisticsShipments)
        .set({
          currentStatus: 'closed',
          closedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(logisticsShipments.id, id))
        .returning();
      return {
        ...shipment,
        currentStatus: shipment.currentStatus?.toLowerCase() || 'created'
      };
    } catch (error) {
      console.error(`❌ [STORAGE] Error closing shipment:`, error);
      throw error;
    }
  }

  async getActiveShipments(): Promise<any[]> {
    try {
      const shipments = await db.select().from(logisticsShipments);
      return shipments
        .filter(s => {
          const status = s.currentStatus?.toLowerCase();
          return status !== 'closed' && status !== 'delivered';
        })
        .map(s => ({
          ...s,
          currentStatus: s.currentStatus?.toLowerCase() || 'created'
        }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching active shipments:`, error);
      return [];
    }
  }

  async getOverdueShipments(): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const shipments = await db.select().from(logisticsShipments);
      return shipments
        .filter(s => {
          const status = s.currentStatus?.toLowerCase();
          return s.expectedDeliveryDate && s.expectedDeliveryDate < today && status !== 'delivered';
        })
        .map(s => ({
          ...s,
          currentStatus: s.currentStatus?.toLowerCase() || 'created'
        }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching overdue shipments:`, error);
      return [];
    }
  }

  async searchShipments(query: string): Promise<any[]> {
    try {
      const shipments = await db.select().from(logisticsShipments);
      const lowerQuery = query.toLowerCase();
      return shipments
        .filter(s => 
          s.consignmentNumber?.toLowerCase().includes(lowerQuery) ||
          s.source?.toLowerCase().includes(lowerQuery) ||
          s.destination?.toLowerCase().includes(lowerQuery)
        )
        .map(s => ({
          ...s,
          currentStatus: s.currentStatus?.toLowerCase() || 'created'
        }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error searching shipments:`, error);
      return [];
    }
  }

  async getLogisticsStatusUpdates(): Promise<any[]> {
    try {
      // Placeholder - would need a separate table for status updates
      return [];
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching status updates:`, error);
      return [];
    }
  }

  async createLogisticsStatusUpdate(data: any): Promise<any> {
    try {
      // Placeholder - would need a separate table for status updates
      return data;
    } catch (error) {
      console.error(`❌ [STORAGE] Error creating status update:`, error);
      throw error;
    }
  }

  async createActivity(data: any): Promise<void> {
    try {
      // Placeholder for activity logging
      console.log(`📋 [STORAGE] Activity: ${data.action} - ${data.details}`);
    } catch (error) {
      console.error(`❌ [STORAGE] Error creating activity:`, error);
    }
  }
}

export const storage = new Storage();
