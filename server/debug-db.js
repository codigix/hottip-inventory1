import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function run() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Checking leads table...');
        const leadsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'leads'
        `);
        console.log('Leads table columns:', leadsRes.rows);

        console.log('\nChecking field_visits table...');
        const visitsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'field_visits'
        `);
        console.log('Field visits table columns:', visitsRes.rows);

        console.log('\nChecking users table...');
        const usersRes = await pool.query(`
            SELECT id, username FROM users LIMIT 5
        `);
        console.log('Sample users:', usersRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
