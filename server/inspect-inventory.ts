import { db, pool } from "./db";
import { products, stockTransactions } from "@shared/schema";
import { sql } from "drizzle-orm";

async function inspectInventory() {
  const client = await pool.connect();
  try {
    console.log("🔍 Inspecting Inventory Data...");

    // Check products
    const allProducts = await db.select().from(products);
    console.log(`📦 Total Products in DB: ${allProducts.length}`);
    if (allProducts.length > 0) {
      console.log("Sample product:", JSON.stringify(allProducts[0], null, 2));
    }

    // Check transactions
    const allTransactions = await db.select().from(stockTransactions);
    console.log(`📜 Total Transactions in DB: ${allTransactions.length}`);
    if (allTransactions.length > 0) {
      console.log("Sample transaction:", JSON.stringify(allTransactions[0], null, 2));
    }

    // Inspect table structures
    console.log("\n📐 Table Structures:");
    
    const productCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    console.log("Products columns:", productCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

    const transCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stock_transactions'
    `);
    console.log("Stock Transactions columns:", transCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

  } catch (error) {
    console.error("💥 Error during inspection:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

inspectInventory();
