import { storage } from "./server/storage";

async function checkShipments() {
  const shipments = await storage.getLogisticsShipments();
  console.log("Shipments from storage.getLogisticsShipments():");
  console.log(JSON.stringify(shipments, null, 2));
}

checkShipments().catch(console.error);
