import { db } from "./db";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const vq = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'vendor_quotations'`);
    console.log('Vendor Quotations:', vq.rows.map(r => r.column_name));
    
    const po = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_orders'`);
    console.log('Purchase Orders:', po.rows.map(r => r.column_name));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
