
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function checkEnum() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'order_status'");
    console.log('order_status enum values:', res.rows.map(r => r.enumlabel));
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}
checkEnum();
