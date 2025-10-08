import { pool } from "./server/db.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting migration...");

    const migrationSQL = readFileSync(
      join(
        __dirname,
        "migrations",
        "0001_add_comprehensive_quotation_fields.sql"
      ),
      "utf-8"
    );

    await client.query("BEGIN");
    await client.query(migrationSQL);
    await client.query("COMMIT");

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
