const bcrypt = require('bcryptjs');
const { query, getClient } = require('../../config/db');
const { generateTicketNumber } = require('../../utils/ticketNumber');
const AppError = require('../../utils/AppError');

// GET /api/admin/users  (admin)
async function getUsers(req, res, next) {
  try {
    const role = req.query.role;
    let sql = `SELECT id, name, email, phone, role, is_active, created_at FROM users`;
    const params = [];
    if (role) {
      sql += ' WHERE LOWER(role) = $1';
      params.push(role.toLowerCase());
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/toggle  (admin)
async function toggleActive(req, res, next) {
  try {
    const result = await query(
      `UPDATE users SET is_active = NOT is_active WHERE id = $1
       RETURNING id, name, email, phone, role, is_active`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/technicians  (admin)
async function addTechnician(req, res, next) {
  try {
    const { name, email, phone, password, skills } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active)
       VALUES ($1,$2,$3,$4,'technician',true)
       RETURNING id, name, email, phone, role, is_active`,
      [name, email, phone, passwordHash]
    );
    const user = userResult.rows[0];

    await query(
      'INSERT INTO technician_profiles (user_id, skills, is_available) VALUES ($1,$2,true)',
      [user.id, skills || null]
    );

    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/tickets  (admin)
async function createTicket(req, res, next) {
  try {
    const {
      customerEmail, customerName, customerPhone,
      serviceType, issueDescription,
      svcAddress, svcCity, svcState, svcPincode,
    } = req.body;

    // Find or create customer
    let customerResult = await query(
      'SELECT id FROM users WHERE email = $1', [customerEmail]
    );
    let customerId;
    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id;
    } else {
      const defaultHash = await bcrypt.hash('changeme123', 10);
      const newCustomer = await query(
        `INSERT INTO users (name, email, phone, password_hash, role, is_active)
         VALUES ($1,$2,$3,$4,'customer',true) RETURNING id`,
        [customerName, customerEmail, customerPhone, defaultHash]
      );
      customerId = newCustomer.rows[0].id;
    }

    const ticketNumber = await generateTicketNumber();
    const ticketResult = await query(
      `INSERT INTO tickets
         (ticket_number, customer_id, service_type, issue_description, status,
          svc_address, svc_city, svc_state, svc_pincode)
       VALUES ($1,$2,$3,$4,'new',$5,$6,$7,$8)
       RETURNING *`,
      [ticketNumber, customerId, serviceType, issueDescription,
       svcAddress, svcCity, svcState, svcPincode]
    );
    return res.status(201).json(ticketResult.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/tickets/:id/assign  (admin)
async function assignTicket(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const ticketId = req.params.id;
    const { assigneeId } = req.body;

    const assigneeResult = await client.query(
      'SELECT id, name, role FROM users WHERE id = $1', [assigneeId]
    );
    if (assigneeResult.rows.length === 0) throw new AppError('Assignee not found', 404);
    const assignee = assigneeResult.rows[0];

    // 1. Remove existing technician and partner assignments for this ticket
    await client.query(
      `DELETE FROM technician_assignments WHERE ticket_id = $1`, 
      [ticketId]
    );
    await client.query(
      `DELETE FROM partner_assignments WHERE ticket_id = $1`, 
      [ticketId]
    );

    // 2. Remove existing schedules for this ticket
    await client.query(
      `DELETE FROM service_schedules WHERE ticket_id = $1`, 
      [ticketId]
    );

    // 3. Create new assignment and update ticket status
    if (assignee.role === 'technician') {
      await client.query(
        `INSERT INTO technician_assignments (ticket_id, technician_id, status) VALUES ($1,$2,'pending')`,
        [ticketId, assigneeId]
      );
      await client.query(
        `UPDATE tickets SET status = 'assigned', updated_at = NOW() WHERE id = $1`, [ticketId]
      );
    } else if (assignee.role === 'partner') {
      await client.query(
        `INSERT INTO partner_assignments (ticket_id, partner_id, status) VALUES ($1,$2,'pending')`,
        [ticketId, assigneeId]
      );
      await client.query(
        `UPDATE tickets SET status = 'partner_assigned', updated_at = NOW() WHERE id = $1`, [ticketId]
      );
    } else {
      throw new AppError('Assignee must be a technician or partner', 400);
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Assigned successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/admin/technicians/available  (admin)
async function getAvailableTechnicians(req, res, next) {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, tp.skills, tp.is_available
       FROM users u
       JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE u.role = 'technician' AND u.is_active = true`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/partners  (admin)
async function addPartner(req, res, next) {
  try {
    const { name, email, phone, password, companyName, commissionRate } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active)
       VALUES ($1,$2,$3,$4,'partner',true)
       RETURNING id, name, email, phone, role, is_active`,
      [name, email, phone, passwordHash]
    );
    const user = userResult.rows[0];

    await query(
      'INSERT INTO partner_profiles (user_id, company_name, commission_rate) VALUES ($1,$2,$3)',
      [user.id, companyName || `${name} Co.`, parseFloat(commissionRate) || 10.0]
    );

    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/partners  (admin)
async function getPartners(req, res, next) {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, pp.company_name, pp.commission_rate
       FROM users u
       JOIN partner_profiles pp ON pp.user_id = u.id
       WHERE u.role = 'partner' ORDER BY u.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/daily  (admin)
async function getDailyReport(req, res, next) {
  try {
    const newTickets = await query(
      `SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE`
    );
    const completedTickets = await query(
      `SELECT COUNT(*) FROM tickets WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE`
    );
    const revenue = await query(
      `SELECT COALESCE(SUM(gross_amount),0) AS total FROM payments
       WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE`
    );
    return res.json({
      newTickets: parseInt(newTickets.rows[0].count, 10),
      completedTickets: parseInt(completedTickets.rows[0].count, 10),
      totalRevenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/revenue  (admin)
async function getRevenueReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const result = await query(
      `SELECT DATE(paid_at) AS date, SUM(gross_amount) AS revenue
       FROM payments WHERE status = 'paid'
       AND paid_at BETWEEN $1 AND $2
       GROUP BY DATE(paid_at) ORDER BY date`,
      [startDate, endDate]
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/technician-performance  (admin)
async function getTechnicianPerformance(req, res, next) {
  try {
    const result = await query(
      `SELECT u.name, COUNT(ta.id) AS jobs_completed,
              COALESCE(AVG(f.rating), 0) AS avg_rating
       FROM technician_assignments ta
       JOIN users u ON u.id = ta.technician_id
       LEFT JOIN feedbacks f ON f.technician_id = ta.technician_id
       WHERE ta.status = 'completed' OR ta.status = 'accepted'
       GROUP BY u.id, u.name ORDER BY jobs_completed DESC`
    );
    return res.json(result.rows.map((r) => ({
      name: r.name,
      jobsCompleted: parseInt(r.jobs_completed, 10),
      rating: parseFloat(r.avg_rating).toFixed(1),
    })));
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/partner-performance  (admin)
async function getPartnerPerformance(req, res, next) {
  try {
    const result = await query(
      `SELECT u.name,
              COUNT(pa.id) AS tickets_assigned,
              COUNT(pa.id) FILTER (WHERE t.status = 'completed') AS tickets_completed
       FROM partner_assignments pa
       JOIN users u ON u.id = pa.partner_id
       JOIN tickets t ON t.id = pa.ticket_id
       GROUP BY u.id, u.name ORDER BY tickets_assigned DESC`
    );
    return res.json(result.rows.map((r) => ({
      name: r.name,
      ticketsAssigned: parseInt(r.tickets_assigned, 10),
      ticketsCompleted: parseInt(r.tickets_completed, 10),
    })));
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/ticket-aging  (admin)
async function getTicketAging(req, res, next) {
  try {
    const now = new Date();
    const result = await query(
      `SELECT id, created_at FROM tickets
       WHERE status NOT IN ('completed','closed','cancelled')`
    );
    let a = 0, b = 0, c = 0;
    result.rows.forEach((t) => {
      const days = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
      if (days <= 2) a++;
      else if (days <= 5) b++;
      else c++;
    });
    return res.json({ '0-2 days': a, '3-5 days': b, '6+ days': c });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/technicians/:id (admin)
async function getTechnicianDetails(req, res, next) {
  try {
    const { id } = req.params;
    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, tp.skills, tp.is_available
       FROM users u
       LEFT JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'technician'`,
      [id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Technician not found', 404);
    }

    const technician = userResult.rows[0];

    const ticketsResult = await query(
      `SELECT * FROM (
         SELECT DISTINCT ON (t.id) t.id, t.ticket_number, t.service_type, t.status, t.created_at, ta.status AS assignment_status
         FROM tickets t
         JOIN technician_assignments ta ON ta.ticket_id = t.id
         WHERE ta.technician_id = $1
         ORDER BY t.id, t.created_at DESC
       ) sub
       ORDER BY sub.created_at DESC`,
      [id]
    );

    technician.tickets = ticketsResult.rows;

    return res.json(technician);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/technicians/:id (admin)
async function updateTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, is_active, skills } = req.body;

    // Start a transaction
    await query('BEGIN');

    // Update user table
    const userResult = await query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5 AND role = 'technician'
       RETURNING id, name, email, phone, role, is_active`,
      [name, email, phone, is_active, id]
    );

    if (userResult.rows.length === 0) {
      await query('ROLLBACK');
      throw new AppError('Technician not found', 404);
    }

    // Update profile table
    await query(
      `UPDATE technician_profiles SET skills = $1 WHERE user_id = $2`,
      [skills || null, id]
    );

    await query('COMMIT');

    // Fetch final result to return
    const finalResult = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, tp.skills, tp.is_available
       FROM users u
       LEFT JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    return res.json(finalResult.rows[0]);
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
}

// GET /api/admin/customers/addresses (admin)
async function getCustomersWithAddresses(req, res, next) {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone,
              t.svc_address, t.svc_city, t.svc_state, t.svc_pincode
       FROM users u
       LEFT JOIN (
         SELECT DISTINCT ON (customer_id) customer_id, svc_address, svc_city, svc_state, svc_pincode
         FROM tickets
         ORDER BY customer_id, created_at DESC
       ) t ON t.customer_id = u.id
       WHERE u.role = 'customer' AND u.is_active = true
       ORDER BY u.name ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/partners/:id (admin)
async function getPartnerDetails(req, res, next) {
  try {
    const { id } = req.params;
    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active,
              pp.company_name, pp.commission_rate
       FROM users u
       JOIN partner_profiles pp ON pp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'partner'`,
      [id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Partner not found', 404);
    }

    const partner = userResult.rows[0];

    const ticketsResult = await query(
      `SELECT * FROM (
         SELECT DISTINCT ON (t.id) t.id, t.ticket_number, t.service_type, t.status, t.created_at, pa.status AS assignment_status
         FROM tickets t
         JOIN partner_assignments pa ON pa.ticket_id = t.id
         WHERE pa.partner_id = $1
         ORDER BY t.id, t.created_at DESC
       ) sub
       ORDER BY sub.created_at DESC`,
      [id]
    );

    partner.tickets = ticketsResult.rows;

    return res.json(partner);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/partners/:id (admin)
async function updatePartner(req, res, next) {
  const { id } = req.params;
  const { name, email, phone, is_active, companyName, commissionRate } = req.body;
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Update user table
    const userResult = await client.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5 AND role = 'partner'
       RETURNING id`,
      [name, email, phone, is_active, id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('Partner not found', 404);
    }

    // Update partner profile
    await client.query(
      `UPDATE partner_profiles
       SET company_name = $1, commission_rate = $2
       WHERE user_id = $3`,
      [companyName, parseFloat(commissionRate) || 10.0, id]
    );

    await client.query('COMMIT');

    // Fetch final result to return
    const finalResult = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active,
              pp.company_name, pp.commission_rate
       FROM users u
       JOIN partner_profiles pp ON pp.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    return res.json(finalResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  getUsers,
  toggleActive,
  addTechnician,
  addPartner,
  createTicket,
  assignTicket,
  getAvailableTechnicians,
  getPartners,
  getDailyReport,
  getRevenueReport,
  getTechnicianPerformance,
  getPartnerPerformance,
  getTicketAging,
  getTechnicianDetails,
  updateTechnician,
  getCustomersWithAddresses,
  getPartnerDetails,
  updatePartner,
};
