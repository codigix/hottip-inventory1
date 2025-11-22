import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:backend@localhost:5432/hottip?sslmode=disable',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const client = await pool.connect();
    
    const result = await client.query('SELECT id, username, email FROM users LIMIT 5');
    
    console.log('Users in database:');
    if (result.rows.length === 0) {
      console.log('  No users found');
    } else {
      result.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Username: ${row.username}, Email: ${row.email}`);
      });
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
