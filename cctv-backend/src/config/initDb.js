const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Transition public_queries to queries if it exists
    await client.query('ALTER TABLE IF EXISTS public_queries RENAME TO queries');

    // Check if tables already exist
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    let shouldSeed = !checkTable.rows[0].exists;

    if (checkTable.rows[0].exists) {
      // Check if customer_id exists in leads table, if not add it
      const checkLeadsCol = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'leads' AND column_name = 'customer_id'
        );
      `);
      if (!checkLeadsCol.rows[0].exists) {
        console.log('⚠️ Adding customer_id column to leads table...');
        await client.query('ALTER TABLE leads ADD COLUMN customer_id UUID REFERENCES users(id) ON DELETE SET NULL;');
      }

      // Check if customer_name exists in quotations table, if not add customer_name and customer_phone
      const checkQuotationsCustomerCol = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'customer_name'
        );
      `);
      if (!checkQuotationsCustomerCol.rows[0].exists) {
        console.log('⚠️ Adding customer_name and customer_phone columns to quotations table...');
        await client.query('ALTER TABLE quotations ADD COLUMN customer_name VARCHAR(100);');
        await client.query('ALTER TABLE quotations ADD COLUMN customer_phone VARCHAR(50);');
      }

      // Check if quotations table needs upgrade
      const checkQuotationsCol = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'quotations' AND column_name = 'created_by'
        );
      `);
      if (!checkQuotationsCol.rows[0].exists) {
        console.log('⚠️ quotations table is outdated. Re-creating quotations and quotation_items...');
        await client.query('DROP TABLE IF EXISTS quotations CASCADE;');
      } else {
        // ── Run incremental migrations ──────────────────────────────────────────
        // Migration: create ticket_status_log if missing
        const checkStatusLog = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'ticket_status_log'
          );
        `);
        if (!checkStatusLog.rows[0].exists) {
          console.log('⚠️ Creating missing ticket_status_log table...');
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
          console.log('✅ ticket_status_log table created.');
        }

        // Migration: add customer_id to queries
        const checkQueriesCustomerCol = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'queries' AND column_name = 'customer_id'
          );
        `);
        if (!checkQueriesCustomerCol.rows[0].exists) {
          console.log('⚠️ Adding customer_id to queries table...');
          await client.query('ALTER TABLE queries ADD COLUMN customer_id UUID REFERENCES users(id) ON DELETE SET NULL;');
        }

        // Migration: create missing tables and columns for technician portal
        const checkEstimatesVersionCol = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'estimates' AND column_name = 'version'
          );
        `);
        if (!checkEstimatesVersionCol.rows[0].exists) {
          console.log('⚠️ Updating estimates table schema and adding new tables...');
          // Add missing columns to estimates
          await client.query('ALTER TABLE estimates ADD COLUMN version INT DEFAULT 1;');
          await client.query('ALTER TABLE estimates ADD COLUMN notes TEXT;');
          await client.query('ALTER TABLE estimates ADD COLUMN valid_until DATE;');
          await client.query('ALTER TABLE estimates ADD COLUMN approved_total DECIMAL(10,2);');
          await client.query('ALTER TABLE estimates ADD COLUMN submitted_at TIMESTAMP;');
          await client.query('ALTER TABLE estimates ADD COLUMN responded_at TIMESTAMP;');
          await client.query('ALTER TABLE estimates ADD COLUMN rejection_reason TEXT;');
          await client.query('ALTER TABLE estimates ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;');
          await client.query('ALTER TABLE estimates ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;');

          // Create estimate_items
          await client.query(`
            CREATE TABLE IF NOT EXISTS estimate_items (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
              description TEXT,
              unit_price DECIMAL(10,2),
              quantity INT DEFAULT 1
            );
          `);

          // Create service_schedules (or rename existing schedules)
          const checkServiceSchedules = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'service_schedules'
            );
          `);
          if (!checkServiceSchedules.rows[0].exists) {
            await client.query('ALTER TABLE IF EXISTS schedules RENAME TO service_schedules;');
            await client.query('ALTER TABLE service_schedules RENAME COLUMN time_slot TO scheduled_time;');
            await client.query('ALTER TABLE service_schedules ADD COLUMN reschedule_reason TEXT;');
          }

          // Service reports updates
          await client.query('ALTER TABLE service_reports ADD COLUMN inspection_notes TEXT;');
          await client.query('ALTER TABLE service_reports ADD COLUMN work_done TEXT;');
          await client.query('ALTER TABLE service_reports ADD COLUMN recommendations TEXT;');
          await client.query('ALTER TABLE service_reports ADD COLUMN materials_used TEXT;');
          await client.query('ALTER TABLE service_reports ADD COLUMN parts_replaced TEXT;');
          await client.query('ALTER TABLE service_reports ADD COLUMN customer_signature_url TEXT;');
          await client.query('ALTER TABLE service_reports ADD COLUMN completed_at TIMESTAMP;');

          // Create report_images
          await client.query(`
            CREATE TABLE IF NOT EXISTS report_images (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              report_id UUID REFERENCES service_reports(id) ON DELETE CASCADE,
              image_type VARCHAR(50),
              url TEXT,
              description TEXT,
              created_at TIMESTAMP DEFAULT NOW()
            );
          `);
          console.log('✅ Technician portal schema updates applied.');
        }

        console.log('✅ Database schema already exists. Skipping initialization.');
        return;
      }
    }

    console.log('⚠️ Database schema not found. Initializing tables...');

    // ─── 1. CREATE TABLES ────────────────────────────────────────────────────────
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS technician_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        skills TEXT,
        is_available BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS partner_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(100),
        commission_rate DECIMAL(5,2) DEFAULT 10.0
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        service_type VARCHAR(50),
        issue_description TEXT,
        status VARCHAR(50) DEFAULT 'new',
        svc_address TEXT,
        svc_city VARCHAR(100),
        svc_state VARCHAR(100),
        svc_pincode VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS technician_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50),
        assigned_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partner_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50),
        assigned_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS estimates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        details TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        gross_amount DECIMAL(10,2),
        commission_amount DECIMAL(10,2),
        method VARCHAR(50),
        status VARCHAR(50),
        gateway_ref VARCHAR(100),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating DECIMAL(2,1),
        comments TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        scheduled_date DATE,
        time_slot VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS service_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        report_text TEXT,
        status VARCHAR(50),
        submitted_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200),
        message TEXT,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS queries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        issue_type VARCHAR(50),
        source VARCHAR(50),
        description TEXT,
        status VARCHAR(50) DEFAULT 'received',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        terms TEXT,
        valid_until DATE,
        gst_rate DECIMAL(5,2) DEFAULT 18.00,
        gst_amount DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'draft',
        version INT DEFAULT 1,
        accept_token VARCHAR(100),
        sent_at TIMESTAMP,
        responded_at TIMESTAMP,
        rejection_reason TEXT,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
        description TEXT,
        unit_price DECIMAL(10,2),
        quantity INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS settlement_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50),
        total_amount DECIMAL(10,2),
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
        batch_id UUID REFERENCES settlement_batches(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    if (shouldSeed) {
      // ─── 2. SEED DATA ────────────────────────────────────────────────────────────
      console.log('🌱 Seeding initial data...');
      const defaultPassword = await bcrypt.hash('password123', 10);

      // Seed Users
      const adminRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role) VALUES ('Admin User', 'admin@cctv.com', '9876543210', $1, 'admin') RETURNING id`,
        [defaultPassword]
      );
      const adminId = adminRes.rows[0].id;

      const customerRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role) VALUES ('Customer One', 'customer@cctv.com', '9876543211', $1, 'customer') RETURNING id`,
        [defaultPassword]
      );
      const customerId = customerRes.rows[0].id;

      const techRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role) VALUES ('Tech Guru', 'tech@cctv.com', '9876543212', $1, 'technician') RETURNING id`,
        [defaultPassword]
      );
      const techId = techRes.rows[0].id;

      const partnerRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role) VALUES ('Partner Agency', 'partner@cctv.com', '9876543213', $1, 'partner') RETURNING id`,
        [defaultPassword]
      );
      const partnerId = partnerRes.rows[0].id;

      // Seed Profiles
      await client.query(
        `INSERT INTO technician_profiles (user_id, skills, is_available) VALUES ($1, 'Cameras, Networking, DVRs', true)`,
        [techId]
      );
      await client.query(
        `INSERT INTO partner_profiles (user_id, company_name, commission_rate) VALUES ($1, 'SecureTech Partners Pvt Ltd', 15.00)`,
        [partnerId]
      );

      // Seed Queries
      const query1Res = await client.query(
        `INSERT INTO queries (name, email, phone, city, issue_type, source, description, status) 
         VALUES ('John Smith', 'john@example.com', '1234567890', 'Mumbai', 'installation', 'website', 'Need 4 cameras installed in my office.', 'converted_to_lead') RETURNING id`
      );
      await client.query(
        `INSERT INTO queries (name, email, phone, city, issue_type, source, description, status) 
         VALUES ('Alice Cooper', 'alice@example.com', '0987654321', 'Delhi', 'amc_support', 'phone', 'Looking for an AMC for existing setup.', 'received')`
      );

      // Seed Leads
      await client.query(
        `INSERT INTO leads (query_id, assigned_to, customer_id, status, notes) VALUES ($1, $2, $3, 'new', 'Customer called yesterday')`,
        [query1Res.rows[0].id, adminId, customerId]
      );

      // Seed Tickets
      await client.query(
        `INSERT INTO tickets (ticket_number, customer_id, service_type, status, svc_city)
         VALUES ('TICK-100001', $1, 'installation', 'assigned', 'Mumbai') RETURNING id`,
        [customerId]
      );
      
      await client.query(
        `INSERT INTO tickets (ticket_number, customer_id, service_type, status, svc_city)
         VALUES ('TICK-100002', $1, 'complaint', 'new', 'Delhi') RETURNING id`,
        [customerId]
      );
    }

    await client.query('COMMIT');
    console.log('🎉 Database initialization and seeding complete!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize database:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = initializeDatabase;
