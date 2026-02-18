
import { sql } from 'drizzle-orm';
import { db } from './db.js';

async function migrate() {
  try {
    console.log('Applying migrations...');
    
    // Create enums if they don't exist
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE sales_order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create sales_orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" TEXT NOT NULL UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "quotationId" UUID REFERENCES outbound_quotations(id),
        "userId" UUID NOT NULL REFERENCES users(id),
        "orderDate" TIMESTAMP NOT NULL DEFAULT NOW(),
        "expectedDeliveryDate" TIMESTAMP,
        "deliveryPeriod" TEXT,
        status sales_order_status NOT NULL DEFAULT 'pending',
        "subtotalAmount" NUMERIC(12, 2) NOT NULL,
        "gstType" gst_type DEFAULT 'IGST',
        "gstPercentage" NUMERIC(5, 2) DEFAULT 18,
        "gstAmount" NUMERIC(12, 2) NOT NULL,
        "totalAmount" NUMERIC(12, 2) NOT NULL,
        notes TEXT,
        "shippingAddress" TEXT,
        "billingAddress" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create sales_order_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "salesOrderId" UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
        "productId" UUID REFERENCES products(id),
        "itemName" TEXT,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit TEXT NOT NULL DEFAULT 'pcs',
        "unitPrice" NUMERIC(12, 2) NOT NULL,
        amount NUMERIC(12, 2)
      );
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
