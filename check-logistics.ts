
import { db } from "./server/db";
import { logisticsShipments, salesOrders } from "./shared/schema";
import { desc } from "drizzle-orm";

async function checkShipments() {
  console.log("Checking logistics_shipments table...");
  const shipments = await db.select().from(logisticsShipments).orderBy(desc(logisticsShipments.createdAt)).limit(10);
  console.log(JSON.stringify(shipments, null, 2));

  console.log("\nChecking sales_orders table...");
  const orders = await db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)).limit(10);
  console.log(JSON.stringify(orders, null, 2));
}

checkShipments().catch(console.error);
