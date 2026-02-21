import { drizzle } from "drizzle-orm/neon-http";
import { http } from "@neondatabase/serverless";
import { products } from "./shared/schema";
import { eq } from "drizzle-orm";

async function seedProducts() {
  try {
    const db = drizzle(http(process.env.DATABASE_URL || ""));

    const sampleProducts = [
      {
        name: "Laptop",
        sku: "LAPTOP-001",
        description: "High-performance laptop",
        category: "Electronics",
        price: "75000.00",
        costPrice: "55000.00",
        stock: 50,
        lowStockThreshold: 10,
        unit: "pcs",
      },
      {
        name: "Office Chair",
        sku: "CHAIR-001",
        description: "Ergonomic office chair",
        category: "Furniture",
        price: "8000.00",
        costPrice: "5000.00",
        stock: 30,
        lowStockThreshold: 5,
        unit: "pcs",
      },
      {
        name: "Desk",
        sku: "DESK-001",
        description: "Wooden office desk",
        category: "Furniture",
        price: "15000.00",
        costPrice: "9000.00",
        stock: 20,
        lowStockThreshold: 3,
        unit: "pcs",
      },
      {
        name: "Monitor",
        sku: "MONITOR-001",
        description: "27 inch LED monitor",
        category: "Electronics",
        price: "18000.00",
        costPrice: "12000.00",
        stock: 25,
        lowStockThreshold: 5,
        unit: "pcs",
      },
      {
        name: "Keyboard",
        sku: "KB-001",
        description: "Mechanical keyboard",
        category: "Accessories",
        price: "5000.00",
        costPrice: "2500.00",
        stock: 100,
        lowStockThreshold: 20,
        unit: "pcs",
      },
    ];

    for (const product of sampleProducts) {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.sku, product.sku))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(products).values(product);
        console.log(`✅ Added: ${product.name}`);
      } else {
        console.log(`⏭️  Skipped: ${product.name} (already exists)`);
      }
    }

    console.log("\n✅ Products seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
  } finally {
    process.exit(0);
  }
}

seedProducts();
