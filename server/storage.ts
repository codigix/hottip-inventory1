import { customers } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
import { inArray } from "drizzle-orm";
// ...existing code...
import { db } from "./db";
import {
  and,
  or,
  desc,
  eq,
  gte,
  lt,
  lte,
  sql,
  count,
  avg,
  isNotNull,
  aliasedTable,
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
  visitPurposeLogs,
  marketingTasks,
  activities,
  stockTransactions,
  logisticsShipments,
  logisticsShipmentPlans,
} from "@shared/schema";

// Minimal storage implementation providing only the methods used by the current routes

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type MarketingAttendance = typeof marketingTodays.$inferSelect;
export type InsertMarketingAttendance = typeof marketingTodays.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type FieldVisit = typeof fieldVisits.$inferSelect;
export type InsertFieldVisit = typeof fieldVisits.$inferInsert;
export type MarketingTask = typeof marketingTasks.$inferSelect;
export type InsertMarketingTask = typeof marketingTasks.$inferInsert;
export type VisitPurposeLog = typeof visitPurposeLogs.$inferSelect;
export type InsertVisitPurposeLog = typeof visitPurposeLogs.$inferInsert;

import {
  suppliers,
  outboundQuotations,
  inboundQuotations,
  vendorQuotations,
  invoices,
  invoiceItems,
  purchaseOrders,
  purchaseOrderItems,
  customerPurchaseOrders,
  customerPurchaseOrderItems,
  salesOrders,
  salesOrderItems,
  accountsPayables,
} from "@shared/schema";

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type OutboundQuotation = typeof outboundQuotations.$inferSelect;
export type InsertOutboundQuotation = typeof outboundQuotations.$inferInsert;
export type InboundQuotation = typeof inboundQuotations.$inferSelect;
export type InsertInboundQuotation = typeof inboundQuotations.$inferInsert;
export type VendorQuotation = typeof vendorQuotations.$inferSelect;
export type InsertVendorQuotation = typeof vendorQuotations.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type CustomerPurchaseOrder = typeof customerPurchaseOrders.$inferSelect;
export type InsertCustomerPurchaseOrder = typeof customerPurchaseOrders.$inferInsert;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = typeof salesOrders.$inferInsert;
export type LogisticsShipmentPlan = typeof logisticsShipmentPlans.$inferSelect;
export type InsertLogisticsShipmentPlan = typeof logisticsShipmentPlans.$inferInsert;

class Storage {
  // Find user by username or email
  async findUserByUsernameOrEmail(username: string, email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`${users.username} = ${username} OR ${users.email} = ${email}`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  // Get all customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  // Get a single customer by ID
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [row] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return row;
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

    // If groupId is not set, it's the first version, set groupId to its own id
    if (!row.groupId) {
      const [updatedRow] = await db
        .update(outboundQuotations)
        .set({ groupId: row.id })
        .where(eq(outboundQuotations.id, row.id))
        .returning();
      return updatedRow;
    }
    return row;
  }

  async getQuotationVersions(groupId: string): Promise<OutboundQuotation[]> {
    return await db
      .select()
      .from(outboundQuotations)
      .where(eq(outboundQuotations.groupId, groupId))
      .orderBy(desc(outboundQuotations.version));
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
            address: customers.address,
            gstNumber: customers.gstNumber,
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

  async getInboundQuotations(): Promise<(InboundQuotation & { sender: { name: string; email?: string | null } | null })[]> {
    const result = await db
      .select({
        quotation: inboundQuotations,
        customer: {
          name: customers.name,
          email: customers.email,
          address: customers.address,
          gstNumber: customers.gstNumber,
        },
        supplier: {
          name: suppliers.name,
          email: suppliers.email,
          address: suppliers.address,
          gstNumber: suppliers.gstNumber,
        },
      })
      .from(inboundQuotations)
      .leftJoin(customers, eq(inboundQuotations.senderId, customers.id))
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id));

    return result.map((row) => ({
      ...row.quotation,
      sender: row.customer?.name ? row.customer : (row.supplier?.name ? row.supplier : null),
    }));
  }

  async getInboundQuotation(id: string): Promise<InboundQuotation | undefined> {
    const [row] = await db
      .select()
      .from(inboundQuotations)
      .where(eq(inboundQuotations.id, id))
      .limit(1);
    return row;
  }

  async deleteInboundQuotation(id: string): Promise<void> {
    await db.delete(inboundQuotations).where(eq(inboundQuotations.id, id));
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

  // Vendor Quotations CRUD
  async createVendorQuotation(
    insertQuotation: InsertVendorQuotation
  ): Promise<VendorQuotation> {
    const [row] = await db
      .insert(vendorQuotations)
      .values(insertQuotation)
      .returning();
    return row;
  }

  async getVendorQuotations(): Promise<VendorQuotation[]> {
    return await db
      .select()
      .from(vendorQuotations)
      .orderBy(desc(vendorQuotations.createdAt));
  }

  async deleteVendorQuotation(id: string): Promise<void> {
    await db.delete(vendorQuotations).where(eq(vendorQuotations.id, id));
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
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
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
      .leftJoin(customers, eq(purchaseOrders.supplierId, customers.id))
      .leftJoin(users, eq(purchaseOrders.userId, users.id))
      .orderBy(desc(purchaseOrders.createdAt));

    // Fetch items and unify sender for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, order.id));
        
        // Unify supplier/customer into a single supplier object for the frontend
        const unifiedSupplier = order.supplier?.name ? order.supplier : (order.customer?.name ? order.customer : null);
        
        return { 
          ...order, 
          items,
          supplier: unifiedSupplier
        };
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
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
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
      .leftJoin(customers, eq(purchaseOrders.supplierId, customers.id))
      .leftJoin(users, eq(purchaseOrders.userId, users.id))
      .where(eq(purchaseOrders.id, id));

    if (!order) return undefined;

    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, order.id));

    // Unify supplier/customer into a single supplier object for the frontend
    const unifiedSupplier = order.supplier?.name ? order.supplier : (order.customer?.name ? order.customer : null);
    
    return { ...order, items, supplier: unifiedSupplier };
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
        let productId = item.productId;
        
        // Fallback: Link by name if productId is missing
        if (!productId && item.itemName) {
          console.log(`🔍 [STORAGE] item.productId is null for "${item.itemName}". Attempting fallback lookup...`);
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
          }
        }

        if (productId) {
          console.log(`📦 [STORAGE] Processing item: ${item.itemName} (ID: ${productId})`);
          await db.transaction(async (tx) => {
            // Create stock transaction
            const transactionData = {
              userId: purchaseOrder.userId,
              productId: productId,
              type: "in" as const,
              reason: "purchase",
              quantity: item.quantity,
              unitCost: item.unitPrice,
              referenceNumber: purchaseOrder.poNumber,
              notes: `Received from PO: ${purchaseOrder.poNumber}`,
            };
            console.log(`📦 [STORAGE] Creating stock transaction:`, JSON.stringify(transactionData, null, 2));
            await tx.insert(stockTransactions).values(transactionData);

            // Update product stock
            console.log(`📦 [STORAGE] Updating product stock for: ${productId}`);
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, productId));
            
            console.log(`✅ [STORAGE] Updated stock for product ${productId} (+${item.quantity})`);
          });
        } else {
          console.log(`⚠️ [STORAGE] Skipping item ${item.itemName} as it has no productId and fallback failed`);
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
    // Manually delete or update dependent records first to handle cases where 
    // foreign key constraints might block deletion
    
    // 1. Delete associated line items (though schema has onDelete: cascade, manual is safer)
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    
    // 2. Delete associated accounts payable records as they are directly tied to this PO
    await db.delete(accountsPayables).where(eq(accountsPayables.poId, id));
    
    // 3. Nullify the reference in sales orders (don't delete the sales order itself)
    await db.update(salesOrders)
      .set({ purchaseOrderId: null })
      .where(eq(salesOrders.purchaseOrderId, id));
    
    // 4. Finally delete the purchase order itself
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  // Customer Purchase Orders CRUD
  async getCustomerPurchaseOrders(): Promise<any[]> {
    const orders = await db
      .select({
        id: customerPurchaseOrders.id,
        poNumber: customerPurchaseOrders.poNumber,
        customerId: customerPurchaseOrders.customerId,
        quotationId: customerPurchaseOrders.quotationId,
        userId: customerPurchaseOrders.userId,
        orderDate: customerPurchaseOrders.orderDate,
        deliveryPeriod: customerPurchaseOrders.deliveryPeriod,
        status: customerPurchaseOrders.status,
        subtotalAmount: customerPurchaseOrders.subtotalAmount,
        gstType: customerPurchaseOrders.gstType,
        gstPercentage: customerPurchaseOrders.gstPercentage,
        gstAmount: customerPurchaseOrders.gstAmount,
        totalAmount: customerPurchaseOrders.totalAmount,
        notes: customerPurchaseOrders.notes,
        createdAt: customerPurchaseOrders.createdAt,
        updatedAt: customerPurchaseOrders.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(customerPurchaseOrders)
      .leftJoin(customers, eq(customerPurchaseOrders.customerId, customers.id))
      .leftJoin(users, eq(customerPurchaseOrders.userId, users.id))
      .orderBy(desc(customerPurchaseOrders.createdAt));

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(customerPurchaseOrderItems)
          .where(eq(customerPurchaseOrderItems.customerPurchaseOrderId, order.id));
        
        return { 
          ...order, 
          items
        };
      })
    );

    return ordersWithItems;
  }

  async getCustomerPurchaseOrder(id: string): Promise<any | undefined> {
    const [order] = await db
      .select({
        id: customerPurchaseOrders.id,
        poNumber: customerPurchaseOrders.poNumber,
        customerId: customerPurchaseOrders.customerId,
        quotationId: customerPurchaseOrders.quotationId,
        userId: customerPurchaseOrders.userId,
        orderDate: customerPurchaseOrders.orderDate,
        deliveryPeriod: customerPurchaseOrders.deliveryPeriod,
        status: customerPurchaseOrders.status,
        subtotalAmount: customerPurchaseOrders.subtotalAmount,
        gstType: customerPurchaseOrders.gstType,
        gstPercentage: customerPurchaseOrders.gstPercentage,
        gstAmount: customerPurchaseOrders.gstAmount,
        totalAmount: customerPurchaseOrders.totalAmount,
        notes: customerPurchaseOrders.notes,
        createdAt: customerPurchaseOrders.createdAt,
        updatedAt: customerPurchaseOrders.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
        },
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(customerPurchaseOrders)
      .leftJoin(customers, eq(customerPurchaseOrders.customerId, customers.id))
      .leftJoin(users, eq(customerPurchaseOrders.userId, users.id))
      .where(eq(customerPurchaseOrders.id, id));

    if (!order) return undefined;

    const items = await db
      .select()
      .from(customerPurchaseOrderItems)
      .where(eq(customerPurchaseOrderItems.customerPurchaseOrderId, order.id));
    
    return { ...order, items };
  }

  async createCustomerPurchaseOrder(
    insertPO: any
  ): Promise<any> {
    try {
      console.log("💾 [STORAGE] createCustomerPurchaseOrder - Input:", JSON.stringify(insertPO, null, 2));
      const { items, ...poData } = insertPO;
      
      const [row] = await db.insert(customerPurchaseOrders).values(poData).returning();
      console.log("💾 [STORAGE] createCustomerPurchaseOrder - Row created:", row.id);
      
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          ...item,
          customerPurchaseOrderId: row.id,
        }));
        await db.insert(customerPurchaseOrderItems).values(itemsToInsert);
        console.log(`💾 [STORAGE] createCustomerPurchaseOrder - ${items.length} items created`);
      }
      
      return await this.getCustomerPurchaseOrder(row.id);
    } catch (error) {
      console.error("💥 [STORAGE] createCustomerPurchaseOrder - Error:", error);
      throw error;
    }
  }

  async updateCustomerPurchaseOrder(
    id: string,
    update: any
  ): Promise<any> {
    try {
      console.log(`💾 [STORAGE] Updating customer PO ${id}:`, update);
      const { items, ...poData } = update;
      
      if (Object.keys(poData).length > 0) {
        await db
          .update(customerPurchaseOrders)
          .set({ ...poData, updatedAt: new Date() })
          .where(eq(customerPurchaseOrders.id, id));
      }
      
      if (items) {
        await db
          .delete(customerPurchaseOrderItems)
          .where(eq(customerPurchaseOrderItems.customerPurchaseOrderId, id));
          
        if (items.length > 0) {
          const itemsToInsert = items.map((item: any) => ({
            ...item,
            customerPurchaseOrderId: id,
          }));
          await db.insert(customerPurchaseOrderItems).values(itemsToInsert);
        }
      }
      
      return await this.getCustomerPurchaseOrder(id);
    } catch (error) {
      console.error("💥 [STORAGE] updateCustomerPurchaseOrder Error:", error);
      throw error;
    }
  }

  async deleteCustomerPurchaseOrder(id: string): Promise<void> {
    await db.delete(customerPurchaseOrders).where(eq(customerPurchaseOrders.id, id));
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

  // Activity log
  async createActivity(activityData: any): Promise<any> {
    const [row] = await db
      .insert(activities)
      .values({
        userId: activityData.userId,
        action: activityData.action,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        details: activityData.details,
      })
      .returning();
    return row;
  }

  async getActivitiesByEntity(entityType: string, entityId: string): Promise<any[]> {
    return db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityId)
        )
      )
      .orderBy(desc(activities.createdAt));
  }

  // Marketing Attendance
  async getMarketingAttendance(id: string): Promise<any> {
    const [row] = await db
      .select()
      .from(marketingTodays)
      .leftJoin(users, eq(marketingTodays.userid, users.id))
      .where(eq(marketingTodays.id, id));

    if (!row) return undefined;
    return {
      id: row.marketing_todays.id,
      userId: row.marketing_todays.userid,
      date: row.marketing_todays.date,
      checkInTime: row.marketing_todays.checkintime,
      checkOutTime: row.marketing_todays.checkouttime,
      latitude: row.marketing_todays.latitude,
      longitude: row.marketing_todays.longitude,
      location: row.marketing_todays.location,
      photoPath: row.marketing_todays.photopath,
      workDescription: row.marketing_todays.workdescription,
      attendanceStatus: row.marketing_todays.attendancestatus,
      visitCount: row.marketing_todays.visitcount,
      tasksCompleted: row.marketing_todays.taskscompleted,
      outcome: row.marketing_todays.outcome,
      nextAction: row.marketing_todays.nextaction,
      isOnLeave: row.marketing_todays.isonleave,
      breakStartTime: row.marketing_todays.breakStartTime,
      breakEndTime: row.marketing_todays.breakEndTime,
      totalHours: row.marketing_todays.totalHours,
      leaveType: row.marketing_todays.leaveType,
      user: row.users,
    };
  }

  async getMarketingAttendances(filters?: any): Promise<any[]> {
    let query = db
      .select()
      .from(marketingTodays)
      .leftJoin(users, eq(marketingTodays.userid, users.id));

    const conditions = [];

    if (filters?.userId && filters.userId !== "all") {
      conditions.push(eq(marketingTodays.userid, filters.userId));
    }

    if (filters?.startDate && filters.endDate) {
      conditions.push(gte(marketingTodays.date, new Date(filters.startDate)));
      conditions.push(lte(marketingTodays.date, new Date(filters.endDate)));
    }

    if (filters?.userScope?.showOnlyUserAttendance) {
      conditions.push(eq(marketingTodays.userid, filters.userScope.userId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const rows = await query.orderBy(desc(marketingTodays.date));

    return rows.map((r) => ({
      id: r.marketing_todays.id,
      userId: r.marketing_todays.userid,
      date: r.marketing_todays.date,
      checkInTime: r.marketing_todays.checkintime,
      checkOutTime: r.marketing_todays.checkouttime,
      latitude: r.marketing_todays.latitude,
      longitude: r.marketing_todays.longitude,
      location: r.marketing_todays.location,
      photoPath: r.marketing_todays.photopath,
      workDescription: r.marketing_todays.workdescription,
      attendanceStatus: r.marketing_todays.attendancestatus,
      visitCount: r.marketing_todays.visitcount,
      tasksCompleted: r.marketing_todays.taskscompleted,
      outcome: r.marketing_todays.outcome,
      nextAction: r.marketing_todays.nextaction,
      isOnLeave: r.marketing_todays.isonleave,
      breakStartTime: r.marketing_todays.breakstarttime,
      breakEndTime: r.marketing_todays.breakendtime,
      totalHours: r.marketing_todays.totalhours,
      leaveType: r.marketing_todays.leavetype,
      user: r.users ? {
        id: r.users.id,
        firstName: r.users.firstName,
        lastName: r.users.lastName,
        email: r.users.email,
        role: r.users.role,
        department: r.users.department
      } : null,
    }));
  }

  async createMarketingAttendance(
    insertAttendance: InsertMarketingAttendance
  ): Promise<MarketingAttendance> {
    const [row] = await db
      .insert(marketingTodays)
      .values(insertAttendance)
      .returning();
    return row;
  }

  async updateMarketingAttendance(
    id: string,
    update: Partial<InsertMarketingAttendance>
  ): Promise<MarketingAttendance> {
    const [row] = await db
      .update(marketingTodays)
      .set({ ...update, date: update.date ?? undefined })
      .where(eq(marketingTodays.id, id))
      .returning();
    return row;
  }

  async deleteMarketingAttendance(id: string): Promise<void> {
    await db.delete(marketingTodays).where(eq(marketingTodays.id, id));
  }

  async getMarketingAttendanceByEmployee(userId: string): Promise<any[]> {
    const rows = await db
      .select()
      .from(marketingTodays)
      .leftJoin(users, eq(marketingTodays.userid, users.id))
      .where(eq(marketingTodays.userid, userId))
      .orderBy(desc(marketingTodays.date));

    return rows.map((r) => ({
      id: r.marketing_todays.id,
      userId: r.marketing_todays.userid,
      date: r.marketing_todays.date,
      checkInTime: r.marketing_todays.checkintime,
      checkOutTime: r.marketing_todays.checkouttime,
      latitude: r.marketing_todays.latitude,
      longitude: r.marketing_todays.longitude,
      location: r.marketing_todays.location,
      photoPath: r.marketing_todays.photopath,
      workDescription: r.marketing_todays.workdescription,
      attendanceStatus: r.marketing_todays.attendancestatus,
      visitCount: r.marketing_todays.visitcount,
      tasksCompleted: r.marketing_todays.taskscompleted,
      outcome: r.marketing_todays.outcome,
      nextAction: r.marketing_todays.nextaction,
      isOnLeave: r.marketing_todays.isonleave,
      user: r.users,
    }));
  }

  async getMarketingAttendanceByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const rows = await db
      .select()
      .from(marketingTodays)
      .leftJoin(users, eq(marketingTodays.userid, users.id))
      .where(
        and(
          gte(marketingTodays.date, startDate),
          lte(marketingTodays.date, endDate)
        )
      )
      .orderBy(desc(marketingTodays.date));

    return rows.map((r) => ({
      id: r.marketing_todays.id,
      userId: r.marketing_todays.userid,
      date: r.marketing_todays.date,
      checkInTime: r.marketing_todays.checkintime,
      checkOutTime: r.marketing_todays.checkouttime,
      latitude: r.marketing_todays.latitude,
      longitude: r.marketing_todays.longitude,
      location: r.marketing_todays.location,
      photoPath: r.marketing_todays.photopath,
      workDescription: r.marketing_todays.workdescription,
      attendanceStatus: r.marketing_todays.attendancestatus,
      visitCount: r.marketing_todays.visitcount,
      tasksCompleted: r.marketing_todays.taskscompleted,
      outcome: r.marketing_todays.outcome,
      nextAction: r.marketing_todays.nextaction,
      isOnLeave: r.marketing_todays.isonleave,
      breakStartTime: r.marketing_todays.breakStartTime,
      breakEndTime: r.marketing_todays.breakEndTime,
      totalHours: r.marketing_todays.totalHours,
      leaveType: r.marketing_todays.leaveType,
      user: r.users,
    }));
  }
  async getTodayMarketingAttendance(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const rows = await db
      .select()
      .from(marketingTodays)
      .leftJoin(users, eq(marketingTodays.userid, users.id))
      .where(
        and(
          gte(marketingTodays.date, today),
          lt(marketingTodays.date, tomorrow)
        )
      )
      .orderBy(desc(marketingTodays.date));

    return rows.map((r) => ({
      id: r.marketing_todays.id,
      userId: r.marketing_todays.userid,
      date: r.marketing_todays.date,
      checkInTime: r.marketing_todays.checkintime,
      checkOutTime: r.marketing_todays.checkouttime,
      latitude: r.marketing_todays.latitude,
      longitude: r.marketing_todays.longitude,
      location: r.marketing_todays.location,
      photoPath: r.marketing_todays.photopath,
      workDescription: r.marketing_todays.workdescription,
      attendanceStatus: r.marketing_todays.attendancestatus,
      visitCount: r.marketing_todays.visitcount,
      tasksCompleted: r.marketing_todays.taskscompleted,
      outcome: r.marketing_todays.outcome,
      nextAction: r.marketing_todays.nextaction,
      isOnLeave: r.marketing_todays.isonleave,
      breakStartTime: r.marketing_todays.breakStartTime,
      breakEndTime: r.marketing_todays.breakEndTime,
      totalHours: r.marketing_todays.totalHours,
      leaveType: r.marketing_todays.leaveType,
      user: r.users,
    }));
  }

  async getMarketingAttendanceForUserToday(userId: string): Promise<any | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [row] = await db
      .select()
      .from(marketingTodays)
      .where(
        and(
          eq(marketingTodays.userid, userId),
          gte(marketingTodays.date, today),
          lt(marketingTodays.date, tomorrow)
        )
      );
    
    return row;
  }

  async checkInMarketingAttendance(
    userId: string,
    data: any
  ): Promise<MarketingAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use marketingTodays unified table
    const existing = await db
      .select()
      .from(marketingTodays)
      .where(
        and(
          eq(marketingTodays.userid, userId),
          gte(marketingTodays.date, today)
        )
      );

    if (existing.length > 0) {
      const [row] = await db
        .update(marketingTodays)
        .set({
          checkintime: data.checkInTime ?? new Date(),
          latitude: data.latitude?.toString(),
          location: data.location,
          attendancestatus: "present",
        })
        .where(eq(marketingTodays.id, existing[0].id))
        .returning();
      return row;
    }

    const insert = {
      userid: userId,
      date: data.date ?? new Date(),
      checkintime: data.checkInTime ?? new Date(),
      latitude: data.latitude?.toString(),
      location: data.location,
      attendancestatus: "present",
    };

    const [row] = await db
      .insert(marketingTodays)
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
      .from(marketingTodays)
      .where(
        and(
          eq(marketingTodays.userid, userId),
          gte(marketingTodays.date, today)
        )
      );

    if (existing.length === 0) {
      const insert = {
        userid: userId,
        date: new Date(),
        checkintime: new Date(),
        checkouttime: data.checkOutTime ?? new Date(),
        location: data.location,
        attendancestatus: "present",
      };
      const [created] = await db
        .insert(marketingTodays)
        .values(insert)
        .returning();
      return created;
    }

    const [row] = await db
      .update(marketingTodays)
      .set({
        checkouttime: data.checkOutTime ?? new Date(),
        location: data.location || existing[0].location,
        attendancestatus: "present",
        workdescription: data.workDescription || existing[0].workdescription,
        visitcount: data.visitCount !== undefined ? data.visitCount : existing[0].visitcount,
        taskscompleted: data.tasksCompleted !== undefined ? data.tasksCompleted : existing[0].taskscompleted,
        outcome: data.outcome || existing[0].outcome,
        nextaction: data.nextAction || existing[0].nextaction,
      })
      .where(eq(marketingTodays.userid, userId))
      .returning();

    return row;
  }

  async checkOutMarketingAttendanceById(
    attendanceId: string,
    data: any
  ): Promise<MarketingAttendance> {
    const [row] = await db
      .update(marketingTodays)
      .set({
        checkouttime: data.checkOutTime ?? new Date(),
        location: data.checkOutLocation || data.location,
        workdescription: data.workDescription,
        visitcount: data.visitCount,
        taskscompleted: data.tasksCompleted,
        outcome: data.outcome,
        nextaction: data.nextAction,
      })
      .where(eq(marketingTodays.id, attendanceId))
      .returning();

    return row;
  }
  async getMarketingAttendanceMetrics(): Promise<any> {
    try {
      const rows = await db.execute(sql`
      SELECT 
        COUNT(*) AS total_records,
        COUNT(CASE WHEN ma.attendancestatus = 'present' THEN 1 END) AS present_count,
        COUNT(CASE WHEN ma.attendancestatus = 'absent' THEN 1 END) AS absent_count,
        COUNT(CASE WHEN ma.isonleave = true THEN 1 END) AS leave_count,
        COALESCE(AVG(NULLIF(ma.visitcount, 0)), 0) AS avg_visits,
        COALESCE(AVG(NULLIF(ma.taskscompleted, 0)), 0) AS avg_tasks
      FROM marketing_todays ma
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
  async getLeaveRequests(): Promise<any[]> {
    const rows = await db
      .select({
        leaveRequest: leaveRequests,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(leaveRequests)
      .leftJoin(users, eq(leaveRequests.userId, users.id))
      .orderBy(desc(leaveRequests.startDate));
    
    return rows.map(r => ({
      ...r.leaveRequest,
      user: r.user
    }));
  }

  async getLeaveRequestsByUser(userId: string): Promise<any[]> {
    const rows = await db
      .select({
        leaveRequest: leaveRequests,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(leaveRequests)
      .leftJoin(users, eq(leaveRequests.userId, users.id))
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.startDate));

    return rows.map(r => ({
      ...r.leaveRequest,
      user: r.user
    }));
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

  async getLeaveRequestsByStatus(status: string): Promise<any[]> {
    const rows = await db
      .select({
        leaveRequest: leaveRequests,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(leaveRequests)
      .leftJoin(users, eq(leaveRequests.userId, users.id))
      .where(eq(leaveRequests.status, status))
      .orderBy(desc(leaveRequests.startDate));

    return rows.map(r => ({
      ...r.leaveRequest,
      user: r.user
    }));
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
  async getMarketingTasks(filters?: any): Promise<any[]> {
    let query = db
      .select({
        task: marketingTasks,
        assignedToUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        lead: {
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          companyName: leads.companyName,
        }
      })
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id));

    const conditions = [];

    console.log("🔍 [STORAGE] getMarketingTasks - Filters:", JSON.stringify(filters, null, 2));

    if (filters?.status && filters.status !== "all") {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(marketingTasks.status, filters.status));
      } else {
        conditions.push(eq(marketingTasks.status, filters.status));
      }
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(eq(marketingTasks.type, filters.type));
    }

    if (filters?.priority && filters.priority !== "all") {
      conditions.push(eq(marketingTasks.priority, filters.priority));
    }

    if (filters?.assignedTo && filters.assignedTo !== "all") {
      conditions.push(eq(marketingTasks.assignedTo, filters.assignedTo));
    }

    if (filters?.id) {
      conditions.push(eq(marketingTasks.id, filters.id));
    }

    if (filters?.leadId) {
      conditions.push(eq(marketingTasks.leadId, filters.leadId));
    }

    if (filters?.userScope?.showOnlyUserTasks) {
      conditions.push(
        sql`(${marketingTasks.createdBy} = ${filters.userScope.userId} OR 
             ${marketingTasks.assignedTo} = ${filters.userScope.userId})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    try {
      const rows = await query.orderBy(desc(marketingTasks.createdAt));
      console.log(`📋 [STORAGE] getMarketingTasks returned ${rows.length} results`);
      if (rows.length > 0) {
        console.log("🔍 [STORAGE] First task sample:", JSON.stringify({
          id: rows[0].task.id,
          title: rows[0].task.title,
          assignedTo: rows[0].task.assignedTo,
          assignedToUser: rows[0].assignedToUser
        }, null, 2));
      }
      return rows.map(r => ({
        ...r.task,
        assignedToUser: r.assignedToUser,
        lead: r.lead
      }));
    } catch (error) {
      console.error("❌ [STORAGE] getMarketingTasks Error:", error);
      throw error;
    }
  }

  async getMarketingTask(id: string): Promise<any | undefined> {
    const [row] = await db
      .select({
        task: marketingTasks,
        lead: {
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          companyName: leads.companyName,
          email: leads.email,
          phone: leads.phone,
        }
      })
      .from(marketingTasks)
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(eq(marketingTasks.id, id));
    
    if (!row) return undefined;

    return {
      ...row.task,
      lead: row.lead
    };
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

  async completePreviousFollowUps(leadId: string): Promise<void> {
    await db
      .update(marketingTasks)
      .set({ 
        status: "completed",
        completedDate: new Date()
      })
      .where(
        and(
          eq(marketingTasks.leadId, leadId),
          eq(marketingTasks.type, "follow_up"),
          or(
            eq(marketingTasks.status, "pending"),
            eq(marketingTasks.status, "in_progress")
          )
        )
      );
  }

  // =====================
  // LEADS CRUD
  // =====================
  async getLeads(filters?: any): Promise<any[]> {
    let query = db
      .select({
        lead: leads,
        assignedToUser: {
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
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(leads.status, filters.status));
      } else {
        conditions.push(eq(leads.status, filters.status));
      }
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
      assignedToUser: row.assignedToUser,
    }));
  }

  async getLead(id: string): Promise<any | undefined> {
    const [row] = await db
      .select({
        lead: leads,
        assignedToUser: {
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
      assignedToUser: row.assignedToUser,
    };
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [row] = await db.insert(leads).values(insertLead).returning();

    // Auto-create a marketing task when a lead is created
    try {
      const mapPriority = (p: string | null | undefined): "low" | "medium" | "high" => {
        if (!p) return "medium";
        const normalized = p.toLowerCase();
        if (normalized === "high" || normalized === "medium" || normalized === "low") {
          return normalized as any;
        }
        return "medium";
      };

      const taskTitle = `Initial Follow-up: ${row.firstName} ${row.lastName} ${row.companyName ? "(" + row.companyName + ")" : ""}`;
      const taskDescription = `New lead created. Follow up to understand requirements.
Contact: ${row.phone || "No phone"} | ${row.email || "No email"}
Requirements: ${row.requirementDescription || "Not specified"}`;

      const taskData = {
        title: taskTitle,
        description: taskDescription,
        type: "follow_up" as const,
        status: "pending" as const,
        priority: mapPriority(row.priority),
        assignedTo: row.assignedTo || row.createdBy!,
        assignedBy: row.assignedBy || row.createdBy!,
        createdBy: row.createdBy!,
        leadId: row.id,
        dueDate: row.followUpDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
      };

      console.log(`💾 [STORAGE] Attempting to auto-create marketing task for lead:`, JSON.stringify(taskData, null, 2));
      await db.insert(marketingTasks).values(taskData);
      console.log(`✅ [STORAGE] Auto-created marketing task for lead ${row.firstName} ${row.lastName}`);
    } catch (error) {
      console.error("❌ [STORAGE] Failed to auto-create marketing task for lead:", error);
      // We don't throw here to avoid failing the lead creation if task creation fails
    }

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
    // Manually delete dependent records first to handle cases where 
    // ON DELETE CASCADE might not be active in the DB schema
    await db.delete(fieldVisits).where(eq(fieldVisits.leadId, id));
    await db.delete(marketingTasks).where(eq(marketingTasks.leadId, id));
    
    // Now delete the lead
    await db.delete(leads).where(eq(leads.id, id));
  }

  async convertLeadToCustomer(leadId: string): Promise<Customer> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead with ID '${leadId}' not found for conversion.`);
    }

    const existingCustomers = await this.getCustomers();
    
    // Check if customer already exists by email, phone, or name
    const existing = existingCustomers.find(c => 
      (c.email === lead.email && lead.email !== null && lead.email !== "") || 
      (c.phone === lead.phone && lead.phone !== null && lead.phone !== "") ||
      c.name === `${lead.firstName} ${lead.lastName}`
    );

    if (existing) {
      if (lead.status !== "WON" && lead.status !== "converted") {
        await this.updateLead(leadId, { status: "WON" });
      }
      return existing;
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
    await this.updateLead(leadId, { status: "WON" });
    return customer;
  }

  async getLeadsConversionMetrics(options?: any): Promise<any> {
    const allLeads = await this.getLeads(options);
    const totalLeads = allLeads.length;
    const newLeads = allLeads.filter((l) => l.status === "new").length;
    const contactedLeads = allLeads.filter((l) => l.status === "contacted").length;
    const qualifiedLeads = allLeads.filter((l) => l.status === "qualified").length;
    const convertedLeads = allLeads.filter((l) => l.status === "WON" || l.status === "converted").length;
    const lostLeads = allLeads.filter((l) => l.status === "lost").length;

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      averageTimeToConversion: 0, // Placeholder
    };
  }

  async searchLeads(options: { query: string; userScope?: any }): Promise<any[]> {
    const allLeads = await this.getLeads({ userScope: options.userScope });
    const query = options.query.toLowerCase();
    return allLeads.filter(
      (l) =>
        l.firstName.toLowerCase().includes(query) ||
        l.lastName.toLowerCase().includes(query) ||
        (l.companyName && l.companyName.toLowerCase().includes(query)) ||
        (l.email && l.email.toLowerCase().includes(query))
    );
  }

  async getTaskMetrics(options?: any): Promise<any> {
    const allTasks = await this.getMarketingTasks();
    // Simplified filtering for metrics
    const tasks = options?.userScope?.showOnlyUserTasks 
      ? allTasks.filter(t => t.assignedTo === options.userScope.userId)
      : allTasks;

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      cancelledTasks: tasks.filter(t => t.status === 'cancelled').length,
    };
  }

  async getTodayMarketingTasks(options?: any): Promise<any[]> {
    const allTasks = await this.getMarketingTasks();
    const today = new Date().toISOString().split('T')[0];
    return allTasks.filter(t => {
      const isToday = t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] === today;
      const matchesUser = !options?.userScope?.showOnlyUserTasks || t.assignedTo === options.userScope.userId;
      return isToday && matchesUser;
    });
  }

  // =====================
  // ACTIVITIES CRUD
  // =====================
  // =====================
  // FIELD VISITS CRUD
  // =====================
  async getFieldVisits(filters?: any): Promise<any[]> {
    let query = db
      .select({
        visit: fieldVisits,
        assignedToUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        lead: {
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          companyName: leads.companyName,
          status: leads.status,
          estimatedBudget: leads.estimatedBudget,
        }
      })
      .from(fieldVisits)
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id));

    const conditions = [];

    if (filters?.status && filters.status !== "all") {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(fieldVisits.status, filters.status));
      } else {
        conditions.push(eq(fieldVisits.status, filters.status));
      }
    }

    if (filters?.assignedTo && filters.assignedTo !== "all") {
      conditions.push(eq(fieldVisits.assignedTo, filters.assignedTo));
    }

    if (filters?.leadId) {
      conditions.push(eq(fieldVisits.leadId, filters.leadId));
    }

    if (filters?.startDate && filters.endDate) {
      conditions.push(
        and(
          gte(fieldVisits.plannedDate, new Date(filters.startDate)),
          lte(fieldVisits.plannedDate, new Date(filters.endDate))
        )
      );
    }

    if (filters?.userScope?.showOnlyUserVisits) {
      conditions.push(
        or(
          eq(fieldVisits.createdBy, filters.userScope.userId),
          eq(fieldVisits.assignedTo, filters.userScope.userId)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const rows = await query.orderBy(desc(fieldVisits.createdAt));

    return rows.map(r => ({
      ...r.visit,
      assignedToUser: r.assignedToUser,
      lead: r.lead
    }));
  }

  async getVisitsByLead(leadId: string): Promise<any[]> {
    return this.getFieldVisits({ leadId });
  }

  async getFieldVisit(id: string): Promise<any | undefined> {
    const [row] = await db
      .select({
        visit: fieldVisits,
        assignedToUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        lead: {
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          companyName: leads.companyName,
          status: leads.status,
          estimatedBudget: leads.estimatedBudget,
        }
      })
      .from(fieldVisits)
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .where(eq(fieldVisits.id, id));
    
    if (!row) return undefined;

    return {
      ...row.visit,
      assignedToUser: row.assignedToUser,
      lead: row.lead
    };
  }

  async getVisitPurposeLogs(visitId: string): Promise<VisitPurposeLog[]> {
    return await db
      .select()
      .from(visitPurposeLogs)
      .where(eq(visitPurposeLogs.visitId, visitId))
      .orderBy(desc(visitPurposeLogs.createdAt));
  }

  async createVisitPurposeLog(insertLog: InsertVisitPurposeLog): Promise<VisitPurposeLog> {
    const [row] = await db.insert(visitPurposeLogs).values(insertLog).returning();
    return row;
  }

  async createFieldVisit(insertVisit: InsertFieldVisit): Promise<FieldVisit> {
    // Generate visit number if missing
    if (!insertVisit.visitNumber) {
      insertVisit.visitNumber = `VISIT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    }

    const [row] = await db.insert(fieldVisits).values(insertVisit).returning();

    // Auto-create a marketing task when a field visit is scheduled
    try {
      const mapPriority = (p: string | null | undefined): "low" | "medium" | "high" => {
        if (!p) return "medium";
        const normalized = p.toLowerCase();
        if (normalized === "high" || normalized === "medium" || normalized === "low") {
          return normalized as any;
        }
        return "medium";
      };

      const [lead] = await db.select().from(leads).where(eq(leads.id, row.leadId));

      const taskTitle = `Field Visit: ${row.visitNumber} - ${lead?.firstName || ""} ${lead?.lastName || ""}`;
      const taskDescription = `Field visit scheduled at ${row.visitAddress}${row.visitCity ? ", " + row.visitCity : ""}. 
Purpose: ${row.purpose || "Not specified"}
Notes: ${row.preVisitNotes || "No pre-visit notes"}`;

      const taskData = {
        title: taskTitle,
        description: taskDescription,
        type: "visit_client" as const,
        status: "pending" as const,
        priority: mapPriority(lead?.priority),
        assignedTo: row.assignedTo,
        assignedBy: row.assignedBy,
        createdBy: row.createdBy,
        leadId: row.leadId,
        fieldVisitId: row.id,
        dueDate: row.plannedDate,
      };

      console.log(`💾 [STORAGE] Attempting to auto-create marketing task for field visit:`, JSON.stringify(taskData, null, 2));
      await db.insert(marketingTasks).values(taskData);
      console.log(`✅ [STORAGE] Auto-created marketing task for field visit ${row.visitNumber}`);
    } catch (error) {
      console.error("❌ [STORAGE] Failed to auto-create marketing task for field visit:", error);
      // We don't throw here to avoid failing the field visit creation if task creation fails
    }

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

    if (update.status?.toLowerCase() === "completed") {
      await this.handleVisitCompletion(row);
    }

    return row;
  }

  async updateVisitStatus(id: string, status: string): Promise<FieldVisit> {
    const [row] = await db
      .update(fieldVisits)
      .set({ status })
      .where(eq(fieldVisits.id, id))
      .returning();
    if (!row) {
      throw new Error(
        `Field visit with ID '${id}' not found for status update.`
      );
    }

    if (status.toLowerCase() === "completed") {
      await this.handleVisitCompletion(row);
    }

    return row;
  }

  async checkInFieldVisit(id: string, update: any): Promise<FieldVisit> {
    const [row] = await db
      .update(fieldVisits)
      .set({
        ...update,
        status: update.status || "in_progress",
      })
      .where(eq(fieldVisits.id, id))
      .returning();
    if (!row) {
      throw new Error(`Field visit with ID '${id}' not found for check-in.`);
    }
    return row;
  }

  async checkOutFieldVisit(id: string, update: any): Promise<FieldVisit> {
    const [row] = await db
      .update(fieldVisits)
      .set({
        ...update,
        status: "Completed",
      })
      .where(eq(fieldVisits.id, id))
      .returning();
    if (!row) {
      throw new Error(`Field visit with ID '${id}' not found for check-out.`);
    }

    await this.handleVisitCompletion(row);

    return row;
  }

  private async handleVisitCompletion(visit: FieldVisit): Promise<void> {
    if (!visit.leadId) return;

    // 1. Convert Lead to Customer
    try {
      await this.convertLeadToCustomer(visit.leadId);
    } catch (error) {
      console.error("❌ [STORAGE] Failed to auto-convert lead to customer:", error);
      // Fallback to just updating status if conversion fails (e.g. already converted)
      await this.updateLead(visit.leadId, { status: "WON" });
    }

    // 2. Complete associated Marketing Tasks
    try {
      await db
        .update(marketingTasks)
        .set({ status: "completed", completedDate: new Date() })
        .where(eq(marketingTasks.fieldVisitId, visit.id));
    } catch (error) {
      console.error("❌ [STORAGE] Failed to auto-complete marketing tasks:", error);
    }

    // 3. Update Attendance Metrics (visitcount and taskscompleted)
    try {
      const attendance = await this.getMarketingAttendanceForUserToday(visit.assignedTo);
      if (attendance) {
        await db
          .update(marketingTodays)
          .set({
            visitcount: (attendance.visitcount || 0) + 1,
            taskscompleted: (attendance.taskscompleted || 0) + 1,
          })
          .where(eq(marketingTodays.id, attendance.id));
      }
    } catch (error) {
      console.error("❌ [STORAGE] Failed to update attendance metrics:", error);
    }
  }

  async deleteFieldVisit(id: string): Promise<void> {
    await db.delete(fieldVisits).where(eq(fieldVisits.id, id));
  }

  // Sales Order Methods
  async generateSalesOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SO-${year}-`;
    
    const latestOrder = await db
      .select({ orderNumber: salesOrders.orderNumber })
      .from(salesOrders)
      .where(sql`${salesOrders.orderNumber} LIKE ${prefix + "%"}`)
      .orderBy(desc(salesOrders.orderNumber))
      .limit(1);

    let nextCount = 1;
    if (latestOrder.length > 0 && latestOrder[0].orderNumber) {
      const parts = latestOrder[0].orderNumber.split("-");
      const lastPart = parts[parts.length - 1];
      nextCount = parseInt(lastPart) + 1;
    }

    return `${prefix}${String(nextCount).padStart(3, "0")}`;
  }

  async getSalesOrders(): Promise<any[]> {
    const result = await db
      .select({
        order: salesOrders,
        customer: customers,
        quotation: outboundQuotations,
        purchaseOrder: customerPurchaseOrders,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(outboundQuotations, eq(salesOrders.quotationId, outboundQuotations.id))
      .leftJoin(customerPurchaseOrders, eq(salesOrders.purchaseOrderId, customerPurchaseOrders.id))
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
        purchaseOrder: customerPurchaseOrders,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(outboundQuotations, eq(salesOrders.quotationId, outboundQuotations.id))
      .leftJoin(customerPurchaseOrders, eq(salesOrders.purchaseOrderId, customerPurchaseOrders.id))
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
      // Robust order number check/generation
      let finalOrderNumber = orderData.orderNumber;
      
      // Check if orderNumber already exists
      const existing = await tx
        .select({ id: salesOrders.id })
        .from(salesOrders)
        .where(eq(salesOrders.orderNumber, finalOrderNumber))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⚠️ [STORAGE] Order number ${finalOrderNumber} already exists. Generating new one.`);
        finalOrderNumber = await this.generateSalesOrderNumber();
        console.log(`✅ [STORAGE] New order number generated: ${finalOrderNumber}`);
      }

      const [newOrder] = await tx
        .insert(salesOrders)
        .values({
          ...orderData,
          orderNumber: finalOrderNumber
        })
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

      // Update Purchase Order status if linked
      if (orderData.purchaseOrderId) {
        console.log(`🔄 [STORAGE] Updating linked Customer PO ${orderData.purchaseOrderId} status to 'po approved'`);
        await tx
          .update(customerPurchaseOrders)
          .set({ status: "po approved", updatedAt: new Date() })
          .where(eq(customerPurchaseOrders.id, orderData.purchaseOrderId));
      }

      return {
        ...newOrder,
        items: createdItems,
      };
    });
  }

  async updateSalesOrderStatus(id: string, status: string, userId?: string): Promise<any> {
    console.log(`💾 [STORAGE] updateSalesOrderStatus hit for ID: ${id}, status: ${status}, userId: ${userId}`);
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
          poNumber: updatedOrder.orderNumber, // Crucial: use SO number as PO link
          source: updatedOrder.source || 'Warehouse',
          destination: updatedOrder.destination || (updatedOrder.customer?.address || 'To Be Determined'),
          clientId: updatedOrder.customerId,
          dispatchDate: new Date().toISOString(),
          currentStatus: 'packed',
          isApproved: false,
          notes: `Auto-created for Sales Order: ${updatedOrder.orderNumber}`,
          createdBy: userId || updatedOrder.userId,
          assignedTo: userId || updatedOrder.userId,
          items: updatedOrder.items?.map((item: any) => ({
            materialName: item.itemName,
            qty: item.quantity,
            unit: item.unit,
            type: item.description
          })) || []
        };
        await this.createLogisticsShipment(shipmentData);
        console.log(`✅ [STORAGE] Shipment created successfully for SO: ${updatedOrder.orderNumber}`);
      } catch (shipmentError) {
        console.error(`❌ [STORAGE] Failed to create shipment for SO: ${updatedOrder.orderNumber}`, shipmentError);
      }
    }

    return updatedOrder;
  }

  async deleteSalesOrder(id: string): Promise<void> {
    await db.delete(salesOrders).where(eq(salesOrders.id, id));
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
      console.log(`📦 [STORAGE] Creating logistics shipment with data:`, JSON.stringify(shipmentData, null, 2));
      
      const insertData: any = { ...shipmentData, createdAt: new Date(), updatedAt: new Date() };
      
      // Ensure items is handled correctly
      if (insertData.items && typeof insertData.items === 'string') {
        try {
          insertData.items = JSON.parse(insertData.items);
        } catch (e) {
          console.error("❌ [STORAGE] Error parsing items JSON:", e);
        }
      }

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
        .onConflictDoUpdate({
          target: logisticsShipments.consignmentNumber,
          set: {
            ...insertData,
            items: insertData.items, // Ensure items are updated
            updatedAt: new Date()
          }
        })
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

  private async getVendorNameById(id: string | null): Promise<string | null> {
    if (!id) return null;
    try {
      const [s] = await db.select().from(suppliers).where(eq(suppliers.id, id));
      return s?.name || null;
    } catch (e) {
      return null;
    }
  }

  private async getClientNameById(id: string | null): Promise<string | null> {
    if (!id) return null;
    try {
      const [c] = await db.select().from(customers).where(eq(customers.id, id));
      return c?.name || null;
    } catch (e) {
      return null;
    }
  }

  // Helper to map database rows to Shipment objects with joined data
  private mapShipmentRow(row: any) {
    const vendor = row.vendor || row.directVendor || row.poVendor || null;
    const client = row.client || row.directClient || row.soCustomer || null;
    
    // Explicitly determine vendor name
    let vendorName = row.vendorName || vendor?.name || row.poVendor?.name || row.directVendor?.name || null;
    
    // Explicitly determine client name
    let clientName = row.clientName || client?.name || row.soCustomer?.name || row.directClient?.name || null;

    const shipmentPoNumber = Array.isArray(row.shipment.poNumber) 
      ? row.shipment.poNumber[0] 
      : row.shipment.poNumber;

    return {
      ...row.shipment,
      poNumber: shipmentPoNumber || row.po?.poNumber || row.so?.orderNumber || null,
      client: client,
      vendor: vendor,
      supplier: vendor, // Alias vendor as supplier for consistency
      clientName: clientName,
      vendorName: vendorName,
      currentStatus: row.shipment.currentStatus?.toLowerCase() || 'created',
    };
  }

  async getLogisticsShipments(): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments:`, error);
      return [];
    }
  }

  async getLogisticsShipment(id: string): Promise<any> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");

      const [row] = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(eq(logisticsShipments.id, id));

      if (row) {
        let shipmentData = {
          ...this.mapShipmentRow({
            ...row,
            vendor: row.vendor || row.directVendor || row.poVendor,
            client: row.client || row.directClient || row.soCustomer
          }),
          plan: row.plan
        };
        
        // If items are empty but we have a PO, fetch PO items
        if ((!shipmentData.items || (Array.isArray(shipmentData.items) && shipmentData.items.length === 0)) && row.po) {
          const poItems = await db
            .select()
            .from(purchaseOrderItems)
            .where(eq(purchaseOrderItems.purchaseOrderId, row.po.id));
          
          if (poItems.length > 0) {
            shipmentData.items = poItems.map(item => ({
              materialName: item.itemName,
              type: item.description || "",
              qty: item.quantity,
              unit: item.unit
            }));
          }
        }
        
        // If items are empty but we have a SO, fetch SO items
        if ((!shipmentData.items || (Array.isArray(shipmentData.items) && shipmentData.items.length === 0)) && row.so) {
          const soItems = await db
            .select()
            .from(salesOrderItems)
            .where(eq(salesOrderItems.salesOrderId, row.so.id));
          
          if (soItems.length > 0) {
            shipmentData.items = soItems.map(item => ({
              materialName: item.itemName,
              type: item.description || "",
              qty: item.quantity,
              unit: item.unit || "pcs"
            }));
          }
        }
        
        return shipmentData;
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
      // Manually handle tables that don't have cascade delete
      await db.update(logisticsTasks)
        .set({ shipmentId: null })
        .where(eq(logisticsTasks.shipmentId, id));
        
      await db.delete(logisticsShipments).where(eq(logisticsShipments.id, id));
    } catch (error) {
      console.error(`❌ [STORAGE] Error deleting shipment:`, error);
      throw error;
    }
  }

  async getLogisticsShipmentsByStatus(status: string): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(eq(logisticsShipments.currentStatus, status.toLowerCase()))
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by status:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByEmployee(employeeId: string): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(
          or(
            eq(logisticsShipments.assignedTo, employeeId),
            eq(logisticsShipments.createdBy, employeeId)
          )
        )
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by employee:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByClient(clientId: string): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(eq(logisticsShipments.clientId, clientId))
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by client:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByApprovedStatus(isApproved: boolean): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(eq(logisticsShipments.isApproved, isApproved))
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching approved/unapproved shipments:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByVendor(vendorId: string): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(eq(logisticsShipments.vendorId, vendorId))
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipments by vendor:`, error);
      return [];
    }
  }

  async getLogisticsShipmentsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const soCustomers = aliasedTable(customers, "so_customers");
      const directSuppliers = aliasedTable(suppliers, "direct_suppliers");
      const directCustomers = aliasedTable(customers, "direct_customers");
      
      const results = await db
        .select({
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
          so: salesOrders,
          soCustomer: soCustomers,
          directVendor: directSuppliers,
          directClient: directCustomers,
          plan: logisticsShipmentPlans,
        })
        .from(logisticsShipments)
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${purchaseOrders.poNumber} AS TEXT)))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .leftJoin(salesOrders, sql`TRIM(LOWER(CAST(${logisticsShipments.poNumber} AS TEXT))) = TRIM(LOWER(CAST(${salesOrders.orderNumber} AS TEXT)))`)
        .leftJoin(soCustomers, eq(salesOrders.customerId, soCustomers.id))
        .leftJoin(directSuppliers, eq(logisticsShipments.vendorId, directSuppliers.id))
        .leftJoin(directCustomers, eq(logisticsShipments.clientId, directCustomers.id))
        .leftJoin(logisticsShipmentPlans, eq(logisticsShipments.id, logisticsShipmentPlans.shipmentId))
        .where(
          and(
            gte(logisticsShipments.dispatchDate, new Date(startDate)),
            lte(logisticsShipments.dispatchDate, new Date(endDate))
          )
        )
        .orderBy(desc(logisticsShipments.createdAt));

      return results.map(row => ({
        ...this.mapShipmentRow({
          ...row,
          vendor: row.vendor || row.directVendor || row.poVendor,
          client: row.client || row.directClient || row.soCustomer
        }),
        plan: row.plan
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

  async getLogisticsDashboardMetrics(): Promise<any> {
    try {
      const shipments = await db.select().from(logisticsShipments);
      
      const metrics = {
        totalShipments: shipments.length,
        activeShipments: shipments.filter(s => 
          ['packed', 'dispatched', 'in_transit', 'out_for_delivery', 'picked_up', 'at_hub', 'custom_clearance', 'import_customs'].includes(s.currentStatus?.toLowerCase() || '')
        ).length,
        deliveredShipments: shipments.filter(s => 
          s.currentStatus?.toLowerCase() === 'delivered'
        ).length,
        pendingShipments: shipments.filter(s => 
          ['created', 'planned', 'scheduled'].includes(s.currentStatus?.toLowerCase() || '')
        ).length,
        averageDeliveryTime: 0,
        onTimeDeliveryRate: 0
      };

      return metrics;
    } catch (error) {
      console.error("❌ [STORAGE] Error fetching dashboard metrics:", error);
      return {
        totalShipments: 0,
        activeShipments: 0,
        deliveredShipments: 0,
        pendingShipments: 0,
        averageDeliveryTime: 0,
        onTimeDeliveryRate: 0
      };
    }
  }

  async getShipmentVolumeMetrics(): Promise<any[]> {
    try {
      // Mock daily volume data for the last 7 days
      const results = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        results.push({
          date: date.toISOString().split('T')[0],
          volume: Math.floor(Math.random() * 50) + 10
        });
      }
      return results;
    } catch (error) {
      return [];
    }
  }

  async getDeliveryPerformanceMetrics(): Promise<any> {
    return {
      onTime: 85,
      delayed: 10,
      cancelled: 5
    };
  }

  async getDailyShipmentsReport(date: Date): Promise<any> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const shipments = await db.select()
        .from(logisticsShipments)
        .where(and(
          gte(logisticsShipments.createdAt, startOfDay),
          lte(logisticsShipments.createdAt, endOfDay)
        ));

      return {
        date: date.toISOString().split('T')[0],
        total: shipments.length,
        delivered: shipments.filter(s => s.currentStatus === 'delivered').length,
        pending: shipments.filter(s => s.currentStatus !== 'delivered').length,
        shipments: shipments
      };
    } catch (error) {
      return { date: date.toISOString().split('T')[0], total: 0, delivered: 0, pending: 0, shipments: [] };
    }
  }

  async getAverageDeliveryTime(dateRange?: { start: Date; end: Date }): Promise<any> {
    return { averageDays: 3.5 };
  }

  async getVendorPerformanceReport(vendorId?: string): Promise<any[]> {
    return [];
  }

  async getLogisticsHealth(): Promise<any> {
    return { status: "healthy", timestamp: new Date().toISOString() };
  }

  async approveShipment(id: string, approvalData: { approvedBy: string; notes?: string }): Promise<any> {
    try {
      const [shipment] = await db
        .update(logisticsShipments)
        .set({
          isApproved: true,
          approvalDate: new Date(),
          approvalNotes: approvalData.notes,
          approvedBy: approvalData.approvedBy,
          updatedAt: new Date(),
        })
        .where(eq(logisticsShipments.id, id))
        .returning();
      return {
        ...shipment,
        currentStatus: shipment.currentStatus?.toLowerCase() || 'created'
      };
    } catch (error) {
      console.error(`❌ [STORAGE] Error approving shipment:`, error);
      throw error;
    }
  }

  async getShipmentPlans(): Promise<any[]> {
    try {
      const poSuppliers = aliasedTable(suppliers, "po_suppliers");
      const results = await db
        .select({
          plan: logisticsShipmentPlans,
          shipment: logisticsShipments,
          client: customers,
          vendor: suppliers,
          po: purchaseOrders,
          poVendor: poSuppliers,
        })
        .from(logisticsShipmentPlans)
        .leftJoin(logisticsShipments, eq(logisticsShipmentPlans.shipmentId, logisticsShipments.id))
        .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
        .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
        .leftJoin(purchaseOrders, sql`TRIM(LOWER(${logisticsShipments.poNumber})) = TRIM(LOWER(${purchaseOrders.poNumber}))`)
        .leftJoin(poSuppliers, eq(purchaseOrders.supplierId, poSuppliers.id))
        .orderBy(desc(logisticsShipmentPlans.createdAt));

      return results.map(row => ({
        ...row.plan,
        shipment: this.mapShipmentRow({
          shipment: row.shipment,
          client: row.client,
          vendor: row.vendor,
          po: row.po,
          poVendor: row.poVendor
        })
      }));
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipment plans:`, error);
      return [];
    }
  }

  async getShipmentPlanByShipmentId(shipmentId: string): Promise<any> {
    try {
      const [plan] = await db
        .select()
        .from(logisticsShipmentPlans)
        .where(eq(logisticsShipmentPlans.shipmentId, shipmentId));
      return plan || null;
    } catch (error) {
      console.error(`❌ [STORAGE] Error fetching shipment plan:`, error);
      return null;
    }
  }

  private sanitizePlanData(planData: any) {
    const sanitized = { ...planData };
    const dateFields = [
      'plannedDispatch',
      'expectedArrival',
      'departureDate',
      'etaArrival',
      'flightDeparture',
      'etaArrivalAir',
      'dispatchDateRoad',
      'deliveryDateRoad',
      'clearanceDate'
    ];

    dateFields.forEach(field => {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        const date = new Date(sanitized[field]);
        if (!isNaN(date.getTime())) {
          sanitized[field] = date;
        }
      }
    });

    return sanitized;
  }

  async createShipmentPlan(planData: InsertLogisticsShipmentPlan): Promise<any> {
    try {
      const sanitized = this.sanitizePlanData(planData);
      const [plan] = await db
        .insert(logisticsShipmentPlans)
        .values({
          ...sanitized,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Also update the shipment status to 'planned'
      if (plan.shipmentId) {
        await this.updateShipmentStatus(plan.shipmentId, { status: 'planned' });
      }
      
      return plan;
    } catch (error) {
      console.error(`❌ [STORAGE] Error creating shipment plan:`, error);
      throw error;
    }
  }

  async updateShipmentPlan(id: string, planData: Partial<InsertLogisticsShipmentPlan>): Promise<any> {
    try {
      const sanitized = this.sanitizePlanData(planData);
      const [plan] = await db
        .update(logisticsShipmentPlans)
        .set({
          ...sanitized,
          updatedAt: new Date(),
        })
        .where(eq(logisticsShipmentPlans.id, id))
        .returning();
      
      // Also ensure the shipment status is 'planned' if it's currently earlier in the flow
      if (plan.shipmentId) {
        const shipment = await this.getLogisticsShipment(plan.shipmentId);
        if (shipment && (shipment.currentStatus === 'created' || shipment.currentStatus === 'packed')) {
          await this.updateShipmentStatus(plan.shipmentId, { status: 'planned' });
        }
      }
      
      return plan;
    } catch (error) {
      console.error(`❌ [STORAGE] Error updating shipment plan:`, error);
      throw error;
    }
  }
}

export const storage = new Storage();
