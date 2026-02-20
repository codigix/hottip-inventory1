import { storage } from "./server/storage.ts";

async function testUpdate() {
  try {
    const id = "7b5f31c6-2838-484d-a6d7-7bc99d2e7535";
    console.log("Testing status update to 'material_released' for order:", id);
    const result = await storage.updateSalesOrderStatus(id, "material_released");
    console.log("Update successful:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ UPDATE FAILED:", err);
  } finally {
    process.exit();
  }
}

testUpdate();
