import { db } from "./server/db.ts";
import { salesOrders } from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function reset() {
  await db.update(salesOrders).set({ materialReleased: false }).where(eq(salesOrders.id, "7b5f31c6-2838-484d-a6d7-7bc99d2e7535"));
  console.log("Reset materialReleased to false");
  process.exit();
}

reset();
