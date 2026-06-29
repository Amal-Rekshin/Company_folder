const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'config', 'initDb.js');
let code = fs.readFileSync(filePath, 'utf8');

// Fix 1: Remove the `else` that skips migrations if quotations is outdated.
code = code.replace(
  `} else {\n        // ── Run incremental migrations ──────────────────────────────────────────`,
  `}\n\n      // ── Run incremental migrations ──────────────────────────────────────────`
);

// Fix 2: Remove the closing brace of the removed `else` block
code = code.replace(
  `        console.log('✅ Database schema already exists. Skipping initialization.');\n        return;\n      }\n    }`,
  `      console.log('✅ Database schema already exists. Skipping initialization.');\n      return;\n    }`
);

// Fix 3: Unindent the migration blocks from 8 spaces to 6 spaces (Optional but good, though it doesn't break logic. Let's not risk regex failures and leave indentation as is, it's valid JS).

// Fix 4: Rewrite the fresh database creation schema
const newSchema = `
    // ─── 1. CREATE TABLES ────────────────────────────────────────────────────────
    await client.query('BEGIN');

    await client.query(\`
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
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
        customer_name VARCHAR(100),
        customer_phone VARCHAR(50),
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

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
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

      CREATE TABLE IF NOT EXISTS ticket_status_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50),
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        note TEXT,
        changed_at TIMESTAMP DEFAULT NOW()
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
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        amount DECIMAL(10,2),
        approved_total DECIMAL(10,2),
        details TEXT,
        notes TEXT,
        status VARCHAR(50),
        version INT DEFAULT 1,
        valid_until DATE,
        submitted_at TIMESTAMP,
        responded_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS estimate_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
        description TEXT,
        unit_price DECIMAL(10,2),
        quantity INT DEFAULT 1
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

      CREATE TABLE IF NOT EXISTS service_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        scheduled_date DATE,
        scheduled_time VARCHAR(50),
        reschedule_reason TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS service_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        report_text TEXT,
        inspection_notes TEXT,
        work_done TEXT,
        recommendations TEXT,
        materials_used TEXT,
        parts_replaced TEXT,
        customer_signature_url TEXT,
        status VARCHAR(50),
        submitted_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS report_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID REFERENCES service_reports(id) ON DELETE CASCADE,
        image_type VARCHAR(50),
        url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
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

      CREATE TABLE IF NOT EXISTS material_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
        request_text TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    \`);`;

const startIdx = code.indexOf('    // ─── 1. CREATE TABLES ────────────────────────────────────────────────────────');
const endIdx = code.indexOf('    if (shouldSeed) {');

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newSchema + '\n\n' + code.substring(endIdx);
  fs.writeFileSync(filePath, code);
  console.log('Successfully updated initDb.js');
} else {
  console.log('Could not find boundaries for CREATE TABLE block.');
}
