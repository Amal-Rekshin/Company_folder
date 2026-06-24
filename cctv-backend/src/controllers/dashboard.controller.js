const { query } = require('../config/db');

// GET /api/dashboard/admin
async function getAdminDashboard(req, res, next) {
  try {
    const total = await query('SELECT COUNT(*) FROM tickets');
    const open = await query(
      `SELECT COUNT(*) FROM tickets WHERE status IN ('new','assigned','work_in_progress','estimate_pending')`
    );
    const revenue = await query(
      `SELECT COALESCE(SUM(gross_amount), 0) AS total FROM payments WHERE status = 'paid'`
    );
    const partners = await query(
      `SELECT COUNT(*) FROM users WHERE role = 'partner' AND is_active = true`
    );
    const unassigned = await query(
      `SELECT COUNT(*) FROM tickets WHERE status = 'new'`
    );
    const pendingSettlements = await query(
      `SELECT COUNT(p.id)
       FROM payments p
       JOIN partner_assignments pa ON pa.ticket_id = p.ticket_id AND pa.status = 'accepted'
       WHERE p.status = 'paid'
       AND p.id NOT IN (SELECT payment_id FROM settlements)`
    );
    const weeklyVol = await query(
      `SELECT TO_CHAR(created_at, 'Dy') as name, COUNT(*) as tickets 
       FROM tickets 
       WHERE created_at >= current_date - interval '6 days' 
       GROUP BY DATE(created_at), TO_CHAR(created_at, 'Dy')
       ORDER BY DATE(created_at)`
    );
    return res.json({
      totalTickets: parseInt(total.rows[0].count, 10),
      openTickets: parseInt(open.rows[0].count, 10),
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalPartners: parseInt(partners.rows[0].count, 10),
      unassignedTickets: parseInt(unassigned.rows[0].count, 10),
      pendingSettlements: parseInt(pendingSettlements.rows[0].count, 10),
      weeklyTicketVolume: weeklyVol.rows.map(r => ({ name: r.name, tickets: parseInt(r.tickets, 10) }))
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/customer
async function getCustomerDashboard(req, res, next) {
  try {
    const customerId = req.user.id;
    const total = await query(
      'SELECT COUNT(*) FROM tickets WHERE customer_id = $1', [customerId]
    );
    const active = await query(
      `SELECT COUNT(*) FROM tickets WHERE customer_id = $1
       AND status IN ('new','assigned','work_in_progress')`,
      [customerId]
    );
    const completed = await query(
      `SELECT COUNT(*) FROM tickets WHERE customer_id = $1
       AND status IN ('completed','closed')`,
      [customerId]
    );
    return res.json({
      totalTickets: parseInt(total.rows[0].count, 10),
      activeTickets: parseInt(active.rows[0].count, 10),
      completedTickets: parseInt(completed.rows[0].count, 10),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/technician
async function getTechnicianDashboard(req, res, next) {
  try {
    const techId = req.user.id;
    const assigned = await query(
      `SELECT COUNT(*) FROM technician_assignments WHERE technician_id = $1 AND status = 'accepted'`,
      [techId]
    );
    const completed = await query(
      `SELECT COUNT(*) FROM technician_assignments ta
       JOIN tickets t ON t.id = ta.ticket_id
       WHERE ta.technician_id = $1 AND t.status = 'completed'`,
      [techId]
    );
    return res.json({
      activeAssignments: parseInt(assigned.rows[0].count, 10),
      completedJobs: parseInt(completed.rows[0].count, 10),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/partner
async function getPartnerDashboard(req, res, next) {
  try {
    const partnerId = req.user.id;
    const assigned = await query(
      `SELECT COUNT(*) FROM partner_assignments WHERE partner_id = $1 AND status = 'accepted'`,
      [partnerId]
    );
    const completed = await query(
      `SELECT COUNT(*) FROM partner_assignments pa
       JOIN tickets t ON t.id = pa.ticket_id
       WHERE pa.partner_id = $1 AND t.status = 'completed'`,
      [partnerId]
    );
    const revenue = await query(
      `SELECT COALESCE(SUM(p.commission_amount), 0) AS total
       FROM payments p
       JOIN partner_assignments pa ON pa.ticket_id = p.ticket_id
       WHERE pa.partner_id = $1 AND p.status = 'paid'`,
      [partnerId]
    );
    return res.json({
      activeAssignments: parseInt(assigned.rows[0].count, 10),
      completedJobs: parseInt(completed.rows[0].count, 10),
      totalRevenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminDashboard,
  getCustomerDashboard,
  getTechnicianDashboard,
  getPartnerDashboard,
};
