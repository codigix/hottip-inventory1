import "dotenv/config";
import pgConnectionString from "pg-connection-string";
const { parse } = pgConnectionString;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("❌ DATABASE_URL is NOT defined in the current process environment.");
} else {
  console.log("✅ DATABASE_URL is defined.");
  try {
    const config = parse(dbUrl);
    console.log("--- Connection Details ---");
    console.log(`User: ${config.user}`);
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`Database: ${config.database}`);
    // console.log(`Full URL (Masked): ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
  } catch (err) {
    console.log("❌ Could not parse DATABASE_URL:", err.message);
    console.log(`Raw value: "${dbUrl}"`);
  }
}
