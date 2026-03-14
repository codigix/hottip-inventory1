import { pool } from "./server/db.js";

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🚀 Seeding material requests...");
    
    const devUserId = "00000000-0000-0000-0000-000000000001";

    // Insert a draft request
    const res1 = await client.query(`
      INSERT INTO material_requests ("requestNumber", "requesterId", department, status, purpose, "requiredBy")
      VALUES ('MR-20260310-002', $1, 'Production', 'DRAFT', 'Purchase Request', '2026-03-10')
      RETURNING id
    `, [devUserId]);
    const requestId1 = res1.rows[0].id;

    // Insert a fulfilled request
    const res2 = await client.query(`
      INSERT INTO material_requests ("requestNumber", "requesterId", department, status, purpose, "requiredBy")
      VALUES ('MR-20260310-001', $1, 'Production', 'FULFILLED', 'Purchase Request', '2026-03-10')
      RETURNING id
    `, [devUserId]);
    const requestId2 = res2.rows[0].id;

    // Insert items for draft request
    await client.query(`
      INSERT INTO material_request_items ("requestId", quantity, unit, status, notes)
      VALUES 
      ($1, 0.900, 'Kg', 'pending', 'Stainless Steel Sheet'),
      ($1, 0.100, 'Kg', 'pending', 'Insulation Layer')
    `, [requestId1]);

    // Insert items for fulfilled request
    await client.query(`
      INSERT INTO material_request_items ("requestId", quantity, unit, status, notes)
      VALUES 
      ($1, 2.000, 'Nos', 'completed', 'Plastic Cap')
    `, [requestId2]);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
