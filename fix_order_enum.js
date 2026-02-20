
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function fixEnum() {
  const client = await pool.connect();
  try {
    console.log("Adding 'approved' to order_status enum...");
    // Check if 'approved' already exists (shouldn't given previous check, but safer)
    const checkRes = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'order_status' AND enumlabel = 'approved'");
    
    if (checkRes.rows.length === 0) {
      await client.query("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'approved' AFTER 'pending'");
      console.log("✅ 'approved' added to order_status enum");
    } else {
      console.log("ℹ️ 'approved' already exists in enum");
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}
fixEnum();
