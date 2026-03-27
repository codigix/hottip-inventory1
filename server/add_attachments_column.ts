import { db } from "./db";
import { sql } from "drizzle-orm";

async function addAttachmentPathsColumn() {
  try {
    console.log("Adding attachmentPaths column to field_visits...");
    await db.execute(sql`ALTER TABLE field_visits ADD COLUMN IF NOT EXISTS "attachmentPaths" JSONB`);
    console.log("Column added successfully!");
    
    // Verify columns
    const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'field_visits'`);
    console.log("Current columns in field_visits:", JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error adding column:", error);
    process.exit(1);
  }
}

addAttachmentPathsColumn();
