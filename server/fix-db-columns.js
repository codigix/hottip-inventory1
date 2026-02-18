
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixColumns() {
  const client = await pool.connect();
  try {
    console.log("Checking and fixing database columns...");

    // Customers table
    await client.query(`
      ALTER TABLE IF EXISTS customers 
      ADD COLUMN IF NOT EXISTS company VARCHAR(150),
      ADD COLUMN IF NOT EXISTS "gstNumber" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
    `);
    console.log("✅ Customers table columns checked");

    // Outbound Quotations table
    await client.query(`
      ALTER TABLE IF EXISTS outbound_quotations
      ADD COLUMN IF NOT EXISTS "taxAmount" NUMERIC,
      ADD COLUMN IF NOT EXISTS "discountAmount" NUMERIC,
      ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT,
      ADD COLUMN IF NOT EXISTS "deliveryTerms" TEXT,
      ADD COLUMN IF NOT EXISTS packaging TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS "projectIncharge" TEXT,
      ADD COLUMN IF NOT EXISTS "moldDetails" JSONB,
      ADD COLUMN IF NOT EXISTS "quotationItems" JSONB,
      ADD COLUMN IF NOT EXISTS "termsConditions" TEXT,
      ADD COLUMN IF NOT EXISTS "gstType" TEXT DEFAULT 'IGST',
      ADD COLUMN IF NOT EXISTS "gstPercentage" NUMERIC DEFAULT 18,
      ADD COLUMN IF NOT EXISTS "bankName" TEXT,
      ADD COLUMN IF NOT EXISTS "bankAccountNo" TEXT,
      ADD COLUMN IF NOT EXISTS "bankIfscCode" TEXT,
      ADD COLUMN IF NOT EXISTS "bankBranch" TEXT,
      ADD COLUMN IF NOT EXISTS "companyName" TEXT,
      ADD COLUMN IF NOT EXISTS "companyAddress" TEXT,
      ADD COLUMN IF NOT EXISTS "companyGstin" TEXT,
      ADD COLUMN IF NOT EXISTS "companyEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "companyPhone" TEXT,
      ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT;
    `);
    console.log("✅ Outbound Quotations table columns checked");

    // Ensure sales_order_status enum exists
    try {
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE sales_order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log("✅ sales_order_status enum checked");
    } catch (e) {
      console.log("⚠️ sales_order_status enum might already exist or failed to create");
    }

    // Ensure gst_type enum exists
    try {
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE gst_type AS ENUM ('CGST_SGST', 'IGST');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log("✅ gst_type enum checked");
    } catch (e) {
      console.log("⚠️ gst_type enum might already exist or failed to create");
    }

    // Sales Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" TEXT NOT NULL UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "quotationId" UUID REFERENCES outbound_quotations(id),
        "userId" UUID NOT NULL REFERENCES users(id),
        "orderDate" TIMESTAMP NOT NULL DEFAULT now(),
        "expectedDeliveryDate" TIMESTAMP,
        "deliveryPeriod" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "subtotalAmount" NUMERIC NOT NULL,
        "gstType" TEXT DEFAULT 'IGST',
        "gstPercentage" NUMERIC DEFAULT 18,
        "gstAmount" NUMERIC NOT NULL,
        "totalAmount" NUMERIC NOT NULL,
        "notes" TEXT,
        "shippingAddress" TEXT,
        "billingAddress" TEXT,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now()
      );
    `);
    console.log("✅ Sales Orders table checked");

    // Sales Order Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "salesOrderId" UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
        "productId" UUID REFERENCES products(id),
        "itemName" TEXT,
        "description" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unit" TEXT NOT NULL DEFAULT 'pcs',
        "unitPrice" NUMERIC NOT NULL,
        "amount" NUMERIC
      );
    `);
    console.log("✅ Sales Order Items table checked");

    // Inbound Quotations table
    await client.query(`
      ALTER TABLE IF EXISTS inbound_quotations
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS "attachmentPath" TEXT,
      ADD COLUMN IF NOT EXISTS "attachmentName" TEXT,
      ADD COLUMN IF NOT EXISTS "senderType" TEXT DEFAULT 'vendor',
      ADD COLUMN IF NOT EXISTS "quotationRef" TEXT;
    `);
    console.log("✅ Inbound Quotations table columns checked");

    // Invoices table
    await client.query(`
      ALTER TABLE IF EXISTS invoices
      ADD COLUMN IF NOT EXISTS "billingGstNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "placeOfSupply" TEXT,
      ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT,
      ADD COLUMN IF NOT EXISTS "deliveryTerms" TEXT,
      ADD COLUMN IF NOT EXISTS "transporterName" TEXT,
      ADD COLUMN IF NOT EXISTS "ewayBillNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "amountInWords" TEXT,
      ADD COLUMN IF NOT EXISTS "packingFee" NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "shippingFee" NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "otherCharges" NUMERIC DEFAULT 0;
    `);
    console.log("✅ Invoices table columns checked");

    // Leads table
    await client.query(`
      ALTER TABLE IF EXISTS leads
      ADD COLUMN IF NOT EXISTS "assignedTo" UUID,
      ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "expectedClosingDate" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "createdBy" UUID,
      ADD COLUMN IF NOT EXISTS "assignedBy" UUID;
    `);
    console.log("✅ Leads table columns checked");

    console.log("All database columns fixed successfully!");
  } catch (error) {
    console.error("Error fixing columns:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixColumns();
