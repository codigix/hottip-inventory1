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
        "quotationId" uuid REFERENCES outbound_quotations(id),
        "requiredBy" timestamp,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Ensure missing columns are added to material_requests if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'material_requests' AND column_name = 'quotationId') THEN
          ALTER TABLE "material_requests" ADD COLUMN "quotationId" uuid REFERENCES outbound_quotations(id);
        END IF;
      END $$;
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

    // ✅ Ensure logistics_shipments table exists with all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS "logistics_shipments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "consignmentNumber" text NOT NULL,
        "poNumber" text,
        "source" text NOT NULL,
        "destination" text NOT NULL,
        "clientId" uuid,
        "vendorId" uuid,
        "dispatchDate" timestamp,
        "expectedDeliveryDate" timestamp,
        "deliveredAt" timestamp,
        "closedAt" timestamp,
        "currentStatus" text NOT NULL DEFAULT 'created',
        "notes" text,
        "weight" numeric(10, 2),
        "createdBy" uuid,
        "assignedTo" uuid,
        "items" jsonb,
        "isApproved" boolean DEFAULT false,
        "approvalDate" timestamp,
        "approvalNotes" text,
        "approvedBy" uuid,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);

    // ✅ FORCE currentStatus to be text to avoid enum mismatch issues
    try {
      await client.query(`
        DO $$ 
        BEGIN 
          -- If it's an enum or anything else, convert it to text
          IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'logistics_shipments' 
            AND column_name = 'currentStatus' 
            AND data_type != 'text'
          ) THEN
            ALTER TABLE "logistics_shipments" ALTER COLUMN "currentStatus" TYPE text;
          END IF;
        END $$;
      `);
    } catch (err) {
      console.error("⚠️ Error ensuring currentStatus is text:", err.message);
    }

    // Ensure missing columns are added to logistics_shipments if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'createdAt') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "createdAt" timestamp DEFAULT now();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'updatedAt') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "updatedAt" timestamp DEFAULT now();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'createdBy') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "createdBy" uuid;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'assignedTo') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "assignedTo" uuid;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'items') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "items" jsonb;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'poNumber') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "poNumber" text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'isApproved') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "isApproved" boolean DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'approvalDate') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "approvalDate" timestamp;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'approvalNotes') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "approvalNotes" text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'logistics_shipments' AND column_name = 'approvedBy') THEN
          ALTER TABLE "logistics_shipments" ADD COLUMN "approvedBy" uuid;
        END IF;
      END $$;
    `);

    // ✅ Ensure accounts_receivables table exists with all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS "accounts_receivables" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceId" uuid REFERENCES invoices(id),
        "customerId" uuid NOT NULL REFERENCES customers(id),
        "amountDue" numeric(10, 2) NOT NULL,
        "amountPaid" numeric(10, 2) DEFAULT 0,
        "dueDate" timestamp NOT NULL,
        "notes" text,
        "status" text NOT NULL DEFAULT 'pending',
        "paymentMode" text,
        "paymentDate" timestamp,
        "paymentDetails" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Ensure missing columns are added to accounts_receivables if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_receivables' AND column_name = 'paymentMode') THEN
          ALTER TABLE "accounts_receivables" ADD COLUMN "paymentMode" text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_receivables' AND column_name = 'paymentDate') THEN
          ALTER TABLE "accounts_receivables" ADD COLUMN "paymentDate" timestamp;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_receivables' AND column_name = 'paymentDetails') THEN
          ALTER TABLE "accounts_receivables" ADD COLUMN "paymentDetails" jsonb;
        END IF;
      END $$;
    `);

    // ✅ Ensure accounts_payables table exists with all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS "accounts_payables" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "poId" uuid,
        "inboundQuotationId" uuid REFERENCES inbound_quotations(id),
        "supplierId" uuid NOT NULL,
        "amountDue" numeric(10, 2) NOT NULL,
        "amountPaid" numeric(10, 2) DEFAULT 0,
        "dueDate" timestamp NOT NULL,
        "notes" text,
        "status" text NOT NULL DEFAULT 'pending',
        "paymentMode" text,
        "paymentDate" timestamp,
        "paymentDetails" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Ensure missing columns are added to accounts_payables if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'paymentMode') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "paymentMode" text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'paymentDate') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "paymentDate" timestamp;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'paymentDetails') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "paymentDetails" jsonb;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'amountPaid') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "amountPaid" numeric(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'dueDate') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "dueDate" timestamp;
        END IF;
      END $$;
    `);

    // ✅ Ensure logistics_shipment_plans table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "logistics_shipment_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "shipmentId" uuid NOT NULL REFERENCES logistics_shipments(id) ON DELETE CASCADE,
        "planId" text NOT NULL UNIQUE,
        "shipmentType" text,
        "shipmentMode" text,
        "incoterms" text,
        "forwarderAgent" text,
        "plannedDispatch" timestamp,
        "expectedArrival" timestamp,
        "status" text DEFAULT 'Planned',
        "shippingLine" text,
        "vesselName" text,
        "voyageNumber" text,
        "containerNumber" text,
        "containerType" text,
        "sealNumber" text,
        "blNumber" text,
        "portOfLoading" text,
        "portOfDestination" text,
        "departureDate" timestamp,
        "etaArrival" timestamp,
        "airlineName" text,
        "flightNumber" text,
        "awbNumber" text,
        "departureAirport" text,
        "arrivalAirport" text,
        "flightDeparture" timestamp,
        "etaArrivalAir" timestamp,
        "cargoWeight" numeric(10, 2),
        "cargoVolume" numeric(10, 2),
        "transportCompany" text,
        "truckNumber" text,
        "driverName" text,
        "driverPhone" text,
        "pickupLocation" text,
        "deliveryLocation" text,
        "dispatchDateRoad" timestamp,
        "deliveryDateRoad" timestamp,
        "clearingAgent" text,
        "billOfEntry" text,
        "importDuty" numeric(12, 2),
        "gstPaid" numeric(12, 2),
        "customStatus" text,
        "clearanceDate" timestamp,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);

    // Update existing records to have a createdAt if null
    await client.query(`
      UPDATE "logistics_shipments" SET "createdAt" = now() WHERE "createdAt" IS NULL;
      UPDATE "logistics_shipments" SET "updatedAt" = now() WHERE "updatedAt" IS NULL;
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

    // ✅ DROP foreign key constraint on accounts_payables.supplierId
    // Since supplierId can come from customers or suppliers (vendors) through inbound quotations, 
    // it should not have a hard FK constraint.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE constraint_name = 'accounts_payables_supplierId_fkey' 
          AND table_name = 'accounts_payables'
        ) THEN
          ALTER TABLE "accounts_payables" DROP CONSTRAINT "accounts_payables_supplierId_fkey";
        END IF;
      END $$;
    `);

    // ✅ Ensure accounts_payables table exists with all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS "accounts_payables" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "poId" uuid,
        "inboundQuotationId" uuid,
        "supplierId" uuid NOT NULL,
        "amountDue" numeric(10, 2) NOT NULL,
        "amountPaid" numeric(10, 2) DEFAULT 0,
        "dueDate" timestamp NOT NULL,
        "notes" text,
        "status" text NOT NULL DEFAULT 'pending',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Ensure missing columns are added to accounts_payables if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'amountPaid') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "amountPaid" numeric(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'dueDate') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "dueDate" timestamp;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'poId') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "poId" uuid;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'inboundQuotationId') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "inboundQuotationId" uuid;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'notes') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "notes" text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'status') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "status" text NOT NULL DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'createdAt') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "createdAt" timestamp DEFAULT now();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts_payables' AND column_name = 'updatedAt') THEN
          ALTER TABLE "accounts_payables" ADD COLUMN "updatedAt" timestamp DEFAULT now();
        END IF;
      END $$;
    `);

    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL", err);
  }
})();
