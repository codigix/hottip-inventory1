
import { sql } from 'drizzle-orm';
import { db } from './db.js';

async function checkColumns() {
  try {
    const result = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads'`);
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
