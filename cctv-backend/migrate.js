require('dotenv').config();
const { pool } = require('./src/config/db');

async function run() {
  const client = await pool.connect();
  try {
    // 1. Check and create ticket_status_log
    const check = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_status_log');"
    );
    console.log('ticket_status_log exists:', check.rows[0].exists);
    if (!check.rows[0].exists) {
      await client.query(`
        CREATE TABLE ticket_status_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
          from_status VARCHAR(50),
          to_status VARCHAR(50),
          changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          note TEXT,
          changed_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Created ticket_status_log!');
    } else {
      console.log('✅ ticket_status_log already exists');
    }

    // 2. Show partner_assignments columns
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'partner_assignments' ORDER BY ordinal_position;"
    );
    console.log('partner_assignments columns:', cols.rows.map(r => r.column_name).join(', '));

    // 3. Show technician_assignments columns
    const cols2 = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'technician_assignments' ORDER BY ordinal_position;"
    );
    console.log('technician_assignments columns:', cols2.rows.map(r => r.column_name).join(', '));

    console.log('Done!');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
