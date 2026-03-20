import { db } from "./db";
import { sql } from "drizzle-orm";

async function addColumn() {
  try {
    console.log("Adding purchase_order_id column to material_requests...");
    await db.execute(sql`ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id)`);
    console.log("Column added successfully!");
    
    // Verify columns again
    const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'material_requests'`);
    console.log("Current columns:", JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error adding column:", error);
    process.exit(1);
  }
}

addColumn();
