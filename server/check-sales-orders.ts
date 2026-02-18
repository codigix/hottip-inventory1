
import { sql } from 'drizzle-orm';
import { db } from './db.js';

async function check() {
  try {
    const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'sales_orders'`);
    console.log('Table exists:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
        const columns = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders'`);
        console.log('Columns:', columns.rows.map(r => r.column_name));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
