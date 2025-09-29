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
  marketing_Todays,
  marketing_metrics,
  leaveRequests,
} from "@shared/schema";

// Minimal storage implementation providing only the methods used by the current routes

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type MarketingAttendance = typeof marketingAttendance.$inferSelect;
export type InsertMarketingAttendance = typeof marketingAttendance.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

import {
  suppliers,
  outboundQuotations,
  inboundQuotations,
} from "@shared/schema";

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type OutboundQuotation = typeof outboundQuotations.$inferSelect;
export type InsertOutboundQuotation = typeof outboundQuotations.$inferInsert;
export type InboundQuotation = typeof inboundQuotations.$inferSelect;
export type InsertInboundQuotation = typeof inboundQuotations.$inferInsert;

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
  async getOutboundQuotations(): Promise<
    (OutboundQuotation & { customer: Customer | null })[]
  > {
    // Explicit return type
    try {
      console.log(
        "💾 [STORAGE] getOutboundQuotations - Fetching quotations with customer data"
      );

      // --- STEP 1: Perform LEFT JOIN using Drizzle's select syntax ---
      // Select all fields from outboundQuotations and specific fields from customers.
      const result = await db
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
    return await db.select().from(inboundQuotations); // ✅ Remove orderBy clause
  }

  async getInboundQuotation(id: string): Promise<InboundQuotation | undefined> {
    const [row] = await db
      .select()
      .from(inboundQuotations)
      .where(eq(inboundQuotations.id, id));
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
          latitude: data.latitude,
          longitude: data.longitude,
          location: data.location,
          photoPath: data.photoPath,
          workDescription: data.workDescription,
          attendanceStatus: data.attendanceStatus ?? "present",
        })
        .where(eq(marketingAttendance.id, (existing[0] as any).id))
        .returning();
      return row;
    }

    const insert: InsertMarketingAttendance = {
      userId,
      date: data.date ?? new Date(),
      checkInTime: data.checkInTime ?? new Date(),
      latitude: data.latitude,
      longitude: data.longitude,
      location: data.location,
      photoPath: data.photoPath,
      workDescription: data.workDescription,
      attendanceStatus: data.attendanceStatus ?? "present",
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
        attendanceStatus: "present",
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
        latitude: data.latitude,
        longitude: data.longitude,
        location: data.location,
        photoPath: data.photoPath,
        workDescription: data.workDescription,
        visitCount: data.visitCount,
        tasksCompleted: data.tasksCompleted,
        outcome: data.outcome,
        nextAction: data.nextAction,
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
        checkOutLatitude: data.checkOutLatitude,
        checkOutLongitude: data.checkOutLongitude,
        checkOutLocation: data.checkOutLocation,
        checkOutPhotoPath: data.checkOutPhotoPath,
        workDescription: data.workDescription,
        visitCount: data.visitCount,
        tasksCompleted: data.tasksCompleted,
        outcome: data.outcome,
        nextAction: data.nextAction,
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
}

export const storage = new Storage();
