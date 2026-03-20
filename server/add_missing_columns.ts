import { db } from "./db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Adding material_request_id to vendor_quotations...");
    await db.execute(sql`ALTER TABLE vendor_quotations ADD COLUMN IF NOT EXISTS material_request_id UUID REFERENCES material_requests(id)`);
    
    console.log("Adding material_request_id to purchase_orders...");
    await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS material_request_id UUID REFERENCES material_requests(id)`);
    
    console.log("Done!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
