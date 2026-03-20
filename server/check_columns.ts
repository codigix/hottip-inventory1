import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkColumns() {
  try {
    const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'material_requests'`);
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error checking columns:", error);
    process.exit(1);
  }
}

checkColumns();
