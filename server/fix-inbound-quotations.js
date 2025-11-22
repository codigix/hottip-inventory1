import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:backend@localhost:5432/hottip?sslmode=disable',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const client = await pool.connect();
    
    const columnsToAdd = [
      { name: 'notes', type: 'TEXT' },
      { name: 'attachmentPath', type: 'TEXT' },
      { name: 'attachmentName', type: 'TEXT' },
      { name: 'senderId', type: 'UUID' },
      { name: 'senderType', type: 'VARCHAR(20)' },
      { name: 'createdAt', type: 'TIMESTAMP' }
    ];
    
    for (const col of columnsToAdd) {
      const result = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_name='inbound_quotations' AND column_name=$1
        )
      `, [col.name]);
      
      if (!result.rows[0].exists) {
        console.log(`Adding column: ${col.name}`);
        const defaultVal = col.name === 'createdAt' ? ` DEFAULT NOW()` : '';
        await client.query(`ALTER TABLE inbound_quotations ADD COLUMN "${col.name}" ${col.type}${defaultVal}`);
        console.log(`✅ ${col.name} added`);
      } else {
        console.log(`✓ ${col.name} already exists`);
      }
    }
    
    console.log('\n✅ All columns synchronized');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
