import { storage } from './server/storage.js';

async function testGetTasks() {
  try {
    const tasks = await storage.getMarketingTasks();
    console.log(JSON.stringify(tasks, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testGetTasks();
