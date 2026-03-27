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

    // ✅ Ensure account_reports table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "account_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "reportType" text NOT NULL,
        "title" text NOT NULL,
        "startDate" timestamp NOT NULL,
        "endDate" timestamp NOT NULL,
        "status" text DEFAULT 'COMPLETED' NOT NULL,
        "fileUrl" text,
        "fileName" text,
        "fileSize" integer,
        "generatedBy" uuid REFERENCES users(id),
        "downloadCount" integer DEFAULT 0 NOT NULL,
        "parameters" text,
        "summary" text,
        "generatedAt" timestamp DEFAULT now() NOT NULL,
        "expiresAt" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // ✅ FORCE status to be text to avoid enum mismatch issues
    try {
      await client.query(`
        DO $$ 
        BEGIN 
          IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'account_reports' 
            AND column_name = 'status' 
            AND data_type != 'text'
          ) THEN
            ALTER TABLE "account_reports" ALTER COLUMN "status" TYPE text;
          END IF;
        END $$;
      `);
    } catch (err) {
      console.error("⚠️ Error ensuring status is text:", err.message);
    }

    // ✅ Ensure missing columns are added to invoices
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'createdAt') THEN
            ALTER TABLE "invoices" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'updatedAt') THEN
            ALTER TABLE "invoices" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;
          END IF;
        END IF;
      END $$;
    `);

    // ✅ Ensure missing columns are added to gst_returns
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gst_returns') THEN
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gst_returns' AND column_name = 'status') THEN
            ALTER TABLE "gst_returns" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gst_returns' AND column_name = 'filedAt') THEN
            ALTER TABLE "gst_returns" ADD COLUMN "filedAt" timestamp;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gst_returns' AND column_name = 'createdAt') THEN
            ALTER TABLE "gst_returns" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gst_returns' AND column_name = 'updatedAt') THEN
            ALTER TABLE "gst_returns" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;
          END IF;
        END IF;
      END $$;
    `);

    // ✅ Ensure missing columns are added to account_reports if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'account_reports' AND column_name = 'downloadCount') THEN
          ALTER TABLE "account_reports" ADD COLUMN "downloadCount" integer DEFAULT 0 NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'account_reports' AND column_name = 'parameters') THEN
          ALTER TABLE "account_reports" ADD COLUMN "parameters" text;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'account_reports' AND column_name = 'summary') THEN
          ALTER TABLE "account_reports" ADD COLUMN "summary" text;
        END IF;
      END $$;
    `);

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

    // ✅ Ensure missing columns are added to material_requests if it already existed
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'material_requests' AND column_name = 'quotationId') THEN
          ALTER TABLE "material_requests" ADD COLUMN "quotationId" uuid REFERENCES outbound_quotations(id);
        END IF;
      END $$;
    `);

    // ✅ Ensure field_visits has missing columns
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'field_visits') THEN
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'createdAt') THEN
            ALTER TABLE "field_visits" ADD COLUMN "createdAt" timestamp DEFAULT now();
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'updatedAt') THEN
            ALTER TABLE "field_visits" ADD COLUMN "updatedAt" timestamp DEFAULT now();
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkInLatitude') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkInLatitude" numeric(10, 7);
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkInLongitude') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkInLongitude" numeric(10, 7);
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkInLocation') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkInLocation" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkInPhotoPath') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkInPhotoPath" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkOutLatitude') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkOutLatitude" numeric(10, 7);
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkOutLongitude') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkOutLongitude" numeric(10, 7);
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkOutLocation') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkOutLocation" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'checkOutPhotoPath') THEN
            ALTER TABLE "field_visits" ADD COLUMN "checkOutPhotoPath" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'actualStartTime') THEN
            ALTER TABLE "field_visits" ADD COLUMN "actualStartTime" timestamp;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'actualEndTime') THEN
            ALTER TABLE "field_visits" ADD COLUMN "actualEndTime" timestamp;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'visitNotes') THEN
            ALTER TABLE "field_visits" ADD COLUMN "visitNotes" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'outcome') THEN
            ALTER TABLE "field_visits" ADD COLUMN "outcome" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'nextAction') THEN
            ALTER TABLE "field_visits" ADD COLUMN "nextAction" text;
          END IF;
          IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'field_visits' AND column_name = 'attachmentPaths') THEN
            ALTER TABLE "field_visits" ADD COLUMN "attachmentPaths" jsonb;
          END IF;
        END IF;
      END $$;
    `);

    // ✅ Ensure visit_purpose_logs table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "visit_purpose_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "visitId" uuid NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
        "purpose" varchar(100) NOT NULL,
        "visitDate" timestamp NOT NULL DEFAULT now(),
        "visitTime" timestamp NOT NULL DEFAULT now(),
        "status" varchar(20) DEFAULT 'DONE',
        "createdAt" timestamp NOT NULL DEFAULT now()
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

    // ✅ Ensure audit_logs table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid REFERENCES users(id),
        "user" text NOT NULL,
        "action" text NOT NULL,
        "details" text,
        "timestamp" timestamp NOT NULL DEFAULT now()
      )
    `);

    // ✅ Ensure admin_settings table exists and has at least one row
    await client.query(`
      CREATE TABLE IF NOT EXISTS "admin_settings" (
        "id" SERIAL PRIMARY KEY,
        "gst_number" varchar(32),
        "tax_rate" integer,
        "bank_account" varchar(128),
        "payment_terms" varchar(64),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    // ✅ Ensure admin_backups table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "admin_backups" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(64),
        "created_at" timestamp DEFAULT now(),
        "size" integer,
        "file_path" varchar(256)
      )
    `);

    // ✅ Ensure task tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "inventory_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "type" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "priority" text NOT NULL DEFAULT 'medium',
        "assignedTo" uuid NOT NULL,
        "assignedBy" uuid NOT NULL,
        "productId" uuid,
        "sparePartId" uuid,
        "batchId" uuid,
        "fabricationOrderId" uuid,
        "expectedQuantity" integer,
        "actualQuantity" integer,
        "fromLocation" text,
        "toLocation" text,
        "dueDate" timestamp,
        "completedDate" timestamp,
        "notes" text,
        "attachmentPath" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "marketing_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "type" text NOT NULL DEFAULT 'follow_up',
        "assignedTo" uuid NOT NULL REFERENCES users(id),
        "assignedBy" uuid NOT NULL REFERENCES users(id),
        "createdBy" uuid NOT NULL REFERENCES users(id),
        "priority" text NOT NULL DEFAULT 'medium',
        "status" text NOT NULL DEFAULT 'pending',
        "dueDate" timestamp,
        "startedDate" timestamp,
        "leadId" uuid REFERENCES leads(id) ON DELETE CASCADE,
        "fieldVisitId" uuid,
        "customerId" uuid REFERENCES customers(id),
        "estimatedHours" numeric(5, 2),
        "is_recurring" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "completed_date" timestamp
      )
    `);

    // Force marketing_tasks ID to be uuid if it was serial (to fix 500 errors)
    try {
      await client.query(`
        DO $$ 
        BEGIN 
          IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'marketing_tasks' 
            AND column_name = 'id' 
            AND data_type != 'uuid'
          ) THEN
            -- This is complex if data exists, but for dev we might need to drop and recreate or alter
            -- For now, let's try to just ensure the table exists with the right schema in the first place
            -- If it already exists with wrong type, we might still get errors
            NULL;
          END IF;
        END $$;
      `);
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS "account_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'open',
        "priority" text NOT NULL DEFAULT 'medium',
        "assignedTo" uuid NOT NULL REFERENCES users(id),
        "dueDate" timestamp,
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "logistics_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'pending',
        "priority" text NOT NULL DEFAULT 'medium',
        "assignedTo" uuid NOT NULL REFERENCES users(id),
        "dueDate" timestamp,
        "completedDate" timestamp
      )
    `);

    const settingsCount = await client.query('SELECT count(*) FROM admin_settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO admin_settings (gst_number, tax_rate, bank_account, payment_terms)
        VALUES ('GSTIN123456789', 18, 'Bank of America, 123456789', 'Net 30')
      `);
    }

    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL", err);
  }
})();
