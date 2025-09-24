import { customers } from '@shared/schema';
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
// ...existing code...
import { db } from './db';
import { and, desc, eq, gte, lt, lte, sql, count, avg, isNotNull } from 'drizzle-orm';
import { users, products, marketingAttendance } from '@shared/schema';

// Minimal storage implementation providing only the methods used by the current routes

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type MarketingAttendance = typeof marketingAttendance.$inferSelect;
export type InsertMarketingAttendance = typeof marketingAttendance.$inferInsert;

import { suppliers,outboundQuotations } from '@shared/schema';

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type OutboundQuotation = typeof outboundQuotations.$inferSelect;
export type InsertOutboundQuotation = typeof outboundQuotations.$inferInsert;

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
  async getCustomers(): Promise < Customer[] > {
  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}
  // Clients CRUD
  async createCustomer(insertCustomer: InsertCustomer): Promise < Customer > {
  const [row] = await db.insert(customers).values(insertCustomer).returning();
  return row;
}
  // Suppliers CRUD
  async getSuppliers(): Promise < Supplier[] > {
  return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

  async createSupplier(insertSupplier: InsertSupplier): Promise < Supplier > {
  const [row] = await db.insert(suppliers).values(insertSupplier).returning();
  return row;
}

  async updateSupplier(id: string | number, update: Partial<InsertSupplier>): Promise < Supplier > {
  const [row] = await db.update(suppliers).set(update).where(eq(suppliers.id, id)).returning();
  return row;
}

  async deleteSupplier(id: string | number): Promise < void> {
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// async createOutboundQuotation(insertQuotation: InsertOutboundQuotation): Promise<OutboundQuotation> {
//     const [row] = await db.insert(outboundQuotations).values(insertQuotation).returning();
//     return row;
//   }

async createOutboundQuotation(insertQuotation: InsertOutboundQuotation): Promise<OutboundQuotation> {
  const [row] = await db.insert(outboundQuotations).values(insertQuotation).returning();
  return row;
}
 // In-memory fallbacks (used when DB is unavailable)
  private inMemoryProducts: any[] = [];

  // Users
  async getUser(id: string): Promise < User | undefined > {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u || undefined;
}

  async getUserByUsername(username: string): Promise < User | undefined > {
  const [u] = await db.select().from(users).where(eq(users.username, username));
  return u || undefined;
}

 async  createUser(data: {
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

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise < User > {
  const [u] = await db.update(users).set({ ...updateUser }).where(eq(users.id, id)).returning();
  return u;
}

  async deleteUser(id: string): Promise < void> {
  await db.delete(users).where(eq(users.id, id));
}

  async getUsers(): Promise < User[] > {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

  // Products
  async getProducts(): Promise < Product[] > {
  try {
    const rows = await db.select().from(products).orderBy(desc(products.createdAt));
    // Merge DB rows with any in-memory products (avoid duplicates by id/sku)
    if(this.inMemoryProducts.length === 0) return rows as any;
    const bySku = new Map<string, any>();
    for(const r of rows as any[]) {
      if (r.sku) bySku.set(String(r.sku), r);
    }
      const merged = [...rows as any[]];
    for(const p of this.inMemoryProducts) {
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
  const idx = this.inMemoryProducts.findIndex(x => x.id === record.id || (record.sku && x.sku === record.sku));
  if (idx >= 0) this.inMemoryProducts[idx] = record; else this.inMemoryProducts.push(record);
  return record;
}

updateProductFallback(id: string | number, patch: any) {
  const idx = this.inMemoryProducts.findIndex(x => String(x.id) === String(id));
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
  const idx = this.inMemoryProducts.findIndex(x => String(x.id) === String(id));
  if (idx >= 0) this.inMemoryProducts.splice(idx, 1);
}

  // Activity log (no-op minimal stub)
  async createActivity(_activity: any): Promise < any > {
  // No persistent activity log table is defined in the current schema.
  // Return a minimal object to satisfy callers that do not rely on the result.
  return { id: 'activity-stub', createdAt: new Date().toISOString(), ..._activity };
}

  // Marketing Attendance
  async getMarketingAttendance(id: string): Promise < any > {
  const [row] = await db
    .select()
    .from(marketingAttendance)
    .leftJoin(users, eq(marketingAttendance.userId, users.id))
    .where(eq(marketingAttendance.id, id));

  if(!row) return undefined;
  return {
    ...row.marketingAttendance,
    user: row.users,
  };
}

  async getMarketingAttendances(): Promise < any[] > {
  const rows = await db
    .select()
    .from(marketingAttendance)
    .leftJoin(users, eq(marketingAttendance.userId, users.id))
    .orderBy(desc(marketingAttendance.date));

  return rows.map(r => ({
    ...r.marketingAttendance,
    user: r.users,
  }));
}

  async createMarketingAttendance(insertAttendance: InsertMarketingAttendance): Promise < MarketingAttendance > {
  const [row] = await db.insert(marketingAttendance).values(insertAttendance).returning();
  return row;
}

  async updateMarketingAttendance(id: string, update: Partial<InsertMarketingAttendance>): Promise < MarketingAttendance > {
  const [row] = await db
    .update(marketingAttendance)
    .set({ ...update, date: update.date ?? undefined })
    .where(eq(marketingAttendance.id, id))
    .returning();
  return row;
}

  async deleteMarketingAttendance(id: string): Promise < void> {
  await db.delete(marketingAttendance).where(eq(marketingAttendance.id, id));
}

  async getMarketingAttendanceByEmployee(userId: string): Promise < any[] > {
  const rows = await db
    .select()
    .from(marketingAttendance)
    .leftJoin(users, eq(marketingAttendance.userId, users.id))
    .where(eq(marketingAttendance.userId, userId))
    .orderBy(desc(marketingAttendance.date));

  return rows.map(r => ({
    ...r.marketingAttendance,
    user: r.users,
  }));
}

  async getMarketingAttendanceByDateRange(startDate: Date, endDate: Date): Promise < any[] > {
  const rows = await db
    .select()
    .from(marketingAttendance)
    .leftJoin(users, eq(marketingAttendance.userId, users.id))
    .where(and(
      gte(marketingAttendance.date, startDate),
      lte(marketingAttendance.date, endDate)
    ))
    .orderBy(desc(marketingAttendance.date));

  return rows.map(r => ({
    ...r.marketingAttendance,
    user: r.users,
  }));
}

  async getTodayMarketingAttendance(): Promise < any[] > {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rows = await db
    .select()
    .from(marketingAttendance)
    .leftJoin(users, eq(marketingAttendance.userId, users.id))
    .where(and(
      gte(marketingAttendance.date, today),
      lt(marketingAttendance.date, tomorrow)
    ))
    .orderBy(desc(marketingAttendance.date));

  return rows.map(r => ({
    ...r.marketingAttendance,
    user: r.users,
  }));
}

  async checkInMarketingAttendance(userId: string, data: any): Promise < MarketingAttendance > {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check existing record for today
  const existing = await db
    .select()
    .from(marketingAttendance)
    .where(and(
      eq(marketingAttendance.userId, userId),
      gte(marketingAttendance.date, today)
    ));

  if(existing.length > 0) {
  const [row] = await db
    .update(marketingAttendance)
    .set({
      checkInTime: data.checkInTime ?? new Date(),
      latitude: data.latitude,
      longitude: data.longitude,
      location: data.location,
      photoPath: data.photoPath,
      workDescription: data.workDescription,
      attendanceStatus: data.attendanceStatus ?? 'present',
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
  attendanceStatus: data.attendanceStatus ?? 'present',
} as InsertMarketingAttendance;

const [row] = await db.insert(marketingAttendance).values(insert).returning();
return row;
  }

  async checkOutMarketingAttendance(userId: string, data: any): Promise < MarketingAttendance > {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db
    .select()
    .from(marketingAttendance)
    .where(and(
      eq(marketingAttendance.userId, userId),
      gte(marketingAttendance.date, today)
    ));

  if(existing.length === 0) {
  // If no check-in, create minimal record then update
  const base: InsertMarketingAttendance = {
    userId,
    date: new Date(),
    checkInTime: new Date(),
    attendanceStatus: 'present',
  } as InsertMarketingAttendance;
  const [created] = await db.insert(marketingAttendance).values(base).returning();
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

  async getMarketingAttendanceMetrics(): Promise < any > {
  const result = await db
    .select({
      total: sql`COUNT(*)::integer`,
      present: sql`COUNT(CASE WHEN ${marketingAttendance.attendanceStatus} = 'present' THEN 1 END)::integer`,
      absent: sql`COUNT(CASE WHEN ${marketingAttendance.attendanceStatus} = 'absent' THEN 1 END)::integer`,
      late: sql`COUNT(CASE WHEN ${marketingAttendance.attendanceStatus} = 'late' THEN 1 END)::integer`,
    })
    .from(marketingAttendance);

  const data = result[0] || { total: 0, present: 0, absent: 0, late: 0 } as any;
  return {
    totalEmployees: Number(data.total) || 0,
    presentToday: Number(data.present) || 0,
    absentToday: Number(data.absent) || 0,
    lateToday: Number(data.late) || 0,
    onLeaveToday: 0,
    attendanceRate: data.total > 0 ? (Number(data.present) / Number(data.total)) * 100 : 0,
    monthlyStats: {
      totalDays: 22,
      presentDays: 18,
      absentDays: 2,
      leaveDays: 2,
    }
  };


}
}

export const storage = new Storage();
