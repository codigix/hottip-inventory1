import "dotenv/config"; // loads environment variables from .env
import pg from "pg";
const { Pool } = pg;
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema"; // adjust the path to your schema

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined. Please set it in your .env file (e.g., postgresql://username:password@localhost:5432/your_db)"
  );
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // AWS RDS requires SSL but allows skipping strict CA check
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Initialize Drizzle ORM with the pool and your schema
export const db = drizzle(pool, { schema });

// Optional: Test the connection at startup
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to PostgreSQL");
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL", err);
  }
})();
