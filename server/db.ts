import "dotenv/config"; // loads environment variables from .env
import pg from "pg";
const { Pool } = pg;
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema"; // adjust the path to your schema

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined. Please set it in your .env file (e.g., postgresql://username:password@localhost:5432/your_db)"
  );
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // AWS RDS requires SSL but allows skipping strict CA check
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Initialize Drizzle ORM with the pool and your schema
export const db = drizzle(pool, { schema });

// Optional: Test the connection at startup
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to PostgreSQL");

    // Ensure marketing_todays table exists with all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS "marketing_todays" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userid" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "date" timestamp NOT NULL,
        "checkintime" timestamp,
        "checkouttime" timestamp,
        "latitude" numeric(10, 7),
        "longitude" numeric(10, 7),
        "location" text,
        "photopath" text,
        "workdescription" text,
        "attendancestatus" text DEFAULT 'present',
        "visitcount" integer,
        "taskscompleted" integer,
        "outcome" text,
        "nextaction" text,
        "isonleave" boolean DEFAULT false,
        "breakstarttime" timestamp,
        "breakendtime" timestamp,
        "totalhours" numeric(5, 2),
        "leavetype" text
      )
    `);

    // Ensure missing columns are added to marketing_todays if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_todays' AND column_name = 'breakstarttime') THEN
          ALTER TABLE "marketing_todays" ADD COLUMN "breakstarttime" timestamp;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_todays' AND column_name = 'breakendtime') THEN
          ALTER TABLE "marketing_todays" ADD COLUMN "breakendtime" timestamp;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_todays' AND column_name = 'totalhours') THEN
          ALTER TABLE "marketing_todays" ADD COLUMN "totalhours" numeric(5, 2);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_todays' AND column_name = 'leavetype') THEN
          ALTER TABLE "marketing_todays" ADD COLUMN "leavetype" text;
        END IF;
      END $$;
    `);

    // Also check and add missing columns to marketing_attendance if it exists
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_attendance') THEN
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_attendance' AND column_name = 'breakstarttime') THEN
            ALTER TABLE "marketing_attendance" ADD COLUMN "breakstarttime" timestamp;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_attendance' AND column_name = 'breakendtime') THEN
            ALTER TABLE "marketing_attendance" ADD COLUMN "breakendtime" timestamp;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_attendance' AND column_name = 'totalhours') THEN
            ALTER TABLE "marketing_attendance" ADD COLUMN "totalhours" numeric(5, 2);
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'marketing_attendance' AND column_name = 'leavetype') THEN
            ALTER TABLE "marketing_attendance" ADD COLUMN "leavetype" text;
          END IF;
        END IF;
      END $$;
    `);

    // ✅ DROP foreign key constraint on inbound_quotations.senderId
    // Since senderId can be a customer, vendor, or supplier, it should not have a hard FK to the users table.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_name = 'inbound_quotations_senderId_fkey' 
          AND table_name = 'inbound_quotations'
        ) THEN
          ALTER TABLE "inbound_quotations" DROP CONSTRAINT "inbound_quotations_senderId_fkey";
        END IF;
      END $$;
    `);

    // ✅ DROP foreign key constraint on purchase_orders.supplierId
    // Since supplierId can come from customers or suppliers (vendors) through inbound quotations, 
    // it should not have a hard FK constraint.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_name = 'purchase_orders_supplierId_fkey' 
          AND table_name = 'purchase_orders'
        ) THEN
          ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplierId_fkey";
        END IF;
      END $$;
    `);

    // ✅ Ensure missing columns are added to inbound_quotations
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'inbound_quotations' AND column_name = 'quotationItems') THEN
          ALTER TABLE "inbound_quotations" ADD COLUMN "quotationItems" jsonb;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'inbound_quotations' AND column_name = 'moldDetails') THEN
          ALTER TABLE "inbound_quotations" ADD COLUMN "moldDetails" jsonb;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'inbound_quotations' AND column_name = 'financialBreakdown') THEN
          ALTER TABLE "inbound_quotations" ADD COLUMN "financialBreakdown" jsonb;
        END IF;
      END $$;
    `);

    // ✅ Ensure material_requests table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "material_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestNumber" text NOT NULL,
        "requesterId" uuid NOT NULL REFERENCES users(id),
        "department" text NOT NULL,
        "status" text NOT NULL DEFAULT 'DRAFT',
        "purpose" text NOT NULL DEFAULT 'Purchase Request',
        "requiredBy" timestamp,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // ✅ Ensure material_request_items table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "material_request_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" uuid NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
        "productId" uuid REFERENCES products(id),
        "sparePartId" uuid REFERENCES spare_parts(id),
        "quantity" numeric(10, 3) NOT NULL,
        "unit" text NOT NULL,
        "status" text DEFAULT 'pending',
        "notes" text
      )
    `);

    // ✅ Ensure vendor_quotations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "vendor_quotations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "quotationNumber" text NOT NULL,
        "quotationDate" timestamp NOT NULL,
        "validUntil" timestamp,
        "subject" text,
        "totalAmount" numeric,
        "status" text NOT NULL DEFAULT 'rfq',
        "notes" text,
        "attachmentPath" text,
        "attachmentName" text,
        "senderId" uuid NOT NULL,
        "userId" uuid NOT NULL REFERENCES users(id),
        "quotationItems" jsonb,
        "financialBreakdown" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // ✅ Insert dummy Material Request if none exist
    const mrCountRes = await client.query('SELECT count(*) FROM material_requests');
    if (parseInt(mrCountRes.rows[0].count) === 0) {
      const devUserId = '00000000-0000-0000-0000-000000000001';
      const requestId = '25b7b4a8-ecd4-45ae-ba3f-6b441f5fc307'; // Stable ID for testing
      
      await client.query(`
        INSERT INTO material_requests ("id", "requestNumber", "requesterId", "department", "status", "requiredBy", "notes")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [requestId, 'MR-20240315-001', devUserId, 'Production', 'DRAFT', new Date('2024-03-25'), 'Urgent requirement for assembly line']);

      // Get some product IDs to link
      const productRes = await client.query('SELECT id, unit FROM products LIMIT 2');
      for (const row of productRes.rows) {
        await client.query(`
          INSERT INTO material_request_items ("requestId", "productId", "quantity", "unit", "notes")
          VALUES ($1, $2, $3, $4, $5)
        `, [requestId, row.id, 50, row.unit || 'pcs', 'Testing item']);
      }
    }

    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL", err);
  }
})();
