
import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function truncateTables() {
  const client = await pool.connect();
  try {
    console.log('Starting truncation...');
    
    // List of tables to truncate (based on schema analysis)
    // We KEEP: users, suppliers
    const tablesToTruncate = [
      'tour_tracking',
      'material_requests',
      'material_request_items',
      'spare_parts',
      'inventory_tasks',
      'fabrication_orders',
      'admin_settings',
      'admin_backups',
      'audit_logs',
      'leads',
      'marketing_tasks',
      'marketing_attendance',
      'marketing_todays',
      'marketing_metrics',
      'leave_requests',
      'account_tasks',
      'field_visits',
      'visit_purpose_logs',
      'deliveries',
      'outbound_quotations',
      'inbound_quotations',
      'invoices',
      'invoice_items',
      'products',
      'customers',
      'accounts_receivables',
      'accounts_payables',
      'vendor_quotations',
      'gst_returns',
      'purchase_orders',
      'purchase_order_items',
      'vendor_communications',
      'logistics_shipments',
      'logistics_shipment_plans',
      'logistics_tasks',
      'logistics_attendance',
      'logistics_leave_requests',
      'tasks',
      'stock_transactions',
      'attendance',
      'bank_accounts',
      'bank_transactions',
      'account_reminders',
      'activities',
      'account_reports',
      'mold_details'
    ];

    for (const table of tablesToTruncate) {
      try {
        // TRUNCATE with CASCADE to handle foreign keys
        // We use CASCADE because dynamic data often references users/suppliers which we keep,
        // but dynamic data also references other dynamic data.
        await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        console.log(`✅ Truncated table: ${table}`);
      } catch (err) {
        console.error(`❌ Error truncating table ${table}:`, err.message);
      }
    }

    console.log('Truncation complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

truncateTables().catch(err => {
  console.error('Fatal error during truncation:', err);
  process.exit(1);
});
