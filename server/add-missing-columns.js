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
      { name: 'packaging', type: 'TEXT' },
      { name: 'bankName', type: 'TEXT' },
      { name: 'bankAccountNo', type: 'TEXT' },
      { name: 'bankIfscCode', type: 'TEXT' },
      { name: 'bankBranch', type: 'TEXT' },
      { name: 'companyName', type: 'TEXT' },
      { name: 'companyAddress', type: 'TEXT' },
      { name: 'companyGstin', type: 'TEXT' },
      { name: 'companyEmail', type: 'TEXT' },
      { name: 'companyPhone', type: 'TEXT' },
      { name: 'companyWebsite', type: 'TEXT' },
      { name: 'gstType', type: 'TEXT' },
      { name: 'gstPercentage', type: 'NUMERIC(5,2)' }
    ];
    
    for (const col of columnsToAdd) {
      const result = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_name='outbound_quotations' AND column_name=$1
        )
      `, [col.name]);
      
      if (!result.rows[0].exists) {
        console.log(`Adding column: ${col.name}`);
        await client.query(`ALTER TABLE outbound_quotations ADD COLUMN "${col.name}" ${col.type}`);
        console.log(`✅ ${col.name} added`);
      } else {
        console.log(`✓ ${col.name} already exists`);
      }
    }
    
    console.log('\n✅ All missing columns have been added');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
