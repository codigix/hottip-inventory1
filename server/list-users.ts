
import { users } from '../shared/schema.js';
import { db } from './db.js';

async function listUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log(JSON.stringify(allUsers, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
