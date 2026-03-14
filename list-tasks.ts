import { db } from './server/db.js';
import { marketingTasks } from './shared/schema.js';

async function listTasks() {
  try {
    const res = await db.select().from(marketingTasks);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTasks();
