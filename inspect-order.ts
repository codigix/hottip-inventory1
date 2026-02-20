import { db } from "./server/db.ts";
import { salesOrders, salesOrderItems, products } from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function inspectOrder(id: string) {
  try {
    const [order] = await db.select().from(salesOrders).where(eq(salesOrders.id, id));
    if (!order) {
      console.log("Order not found:", id);
      return;
    }
    console.log("Order found:", JSON.stringify(order, null, 2));

    const items = await db.select().from(salesOrderItems).where(eq(salesOrderItems.salesOrderId, id));
    console.log("Items found:", JSON.stringify(items, null, 2));

    for (const item of items) {
      if (item.productId) {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        console.log(`Item "${item.itemName}" linked to product:`, product?.name || "NOT FOUND");
      } else {
        console.log(`Item "${item.itemName}" NOT LINKED to a product.`);
      }
    }
  } catch (err) {
    console.error("Error inspecting order:", err);
  } finally {
    process.exit();
  }
}

inspectOrder("7b5f31c6-2838-484d-a6d7-7bc99d2e7535");
