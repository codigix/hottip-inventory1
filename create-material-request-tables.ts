import { pool } from "./server/db.js";

async function createTables() {
  const client = await pool.connect();
  try {
    console.log("🚀 Creating material request tables...");

    await client.query("BEGIN");

    // Create enum if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE material_request_status AS ENUM (
          'DRAFT',
          'PENDING',
          'APPROVED',
          'PROCESSING',
          'FULFILLED',
          'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create material_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS material_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestNumber" TEXT NOT NULL,
        "requesterId" UUID NOT NULL REFERENCES users(id),
        department TEXT NOT NULL,
        status material_request_status NOT NULL DEFAULT 'DRAFT',
        purpose TEXT NOT NULL DEFAULT 'Purchase Request',
        "requiredBy" TIMESTAMP,
        notes TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create material_request_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS material_request_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
        "productId" UUID REFERENCES products(id),
        "sparePartId" UUID REFERENCES spare_parts(id),
        quantity NUMERIC(10, 3) NOT NULL,
        unit TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT
      );
    `);

    await client.query("COMMIT");
    console.log("✅ Tables created successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to create tables:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTables().catch(console.error);
