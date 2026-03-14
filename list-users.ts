import { db } from './server/db.js';
import { users } from './shared/schema.js';

async function listUsers() {
  try {
    const res = await db.select().from(users);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
