// Test script to add sample marketing attendance data
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const { marketingTodays, users } = require("./shared/schema");

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/inventory_db";
const sql = postgres(connectionString);
const db = drizzle(sql);

async function addSampleData() {
  try {
    console.log("🔍 Adding sample marketing attendance data...");

    // First, let's check if we have any users
    const existingUsers = await db.select().from(users).limit(5);
    console.log("👥 Found users:", existingUsers.length);

    if (existingUsers.length === 0) {
      console.log("❌ No users found. Please create some users first.");
      return;
    }

    // Add sample attendance records for today
    const today = new Date();
    const sampleData = [
      {
        userId: existingUsers[0].id,
        date: today,
        checkInTime: new Date(today.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
        checkOutTime: null,
        latitude: 12.9716,
        longitude: 77.5946,
        location: "Bangalore Office",
        attendanceStatus: "present",
        visitCount: 3,
        tasksCompleted: 2,
        isOnLeave: false,
      },
    ];

    // Add more sample data if we have more users
    if (existingUsers.length > 1) {
      sampleData.push({
        userId: existingUsers[1].id,
        date: today,
        checkInTime: new Date(today.getTime() - 7 * 60 * 60 * 1000), // 7 hours ago
        checkOutTime: new Date(today.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        latitude: 13.0827,
        longitude: 80.2707,
        location: "Chennai Office",
        attendanceStatus: "present",
        visitCount: 5,
        tasksCompleted: 4,
        isOnLeave: false,
      });
    }

    // Insert the sample data
    const inserted = await db
      .insert(marketingTodays)
      .values(sampleData)
      .returning();
    console.log("✅ Added sample attendance records:", inserted.length);
    console.log("📊 Sample data:", inserted);
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
  } finally {
    await sql.end();
  }
}

// Run the script
addSampleData();
