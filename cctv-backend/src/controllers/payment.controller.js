const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// POST /api/tickets/payment  (customer)
async function recordPayment(req, res, next) {
  try {
    const { ticketId, grossAmount, method, gatewayRef } = req.body;
    const customerId = req.user.id;

    const ticketCheck = await query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
    if (ticketCheck.rows.length === 0) throw new AppError('Ticket not found', 404);

    // Try to get partner's commission rate for this ticket
    let commissionAmount = 0;
    const partnerQ = await query(
      `SELECT pp.commission_rate FROM partner_assignments pa
       JOIN partner_profiles pp ON pp.user_id = pa.partner_id
       WHERE pa.ticket_id = $1 AND pa.status = 'accepted'
       ORDER BY pa.assigned_at DESC LIMIT 1`,
      [ticketId]
    );
    if (partnerQ.rows.length > 0) {
      const rate = parseFloat(partnerQ.rows[0].commission_rate) / 100;
      commissionAmount = parseFloat(grossAmount) * rate;
    }

    const result = await query(
      `INSERT INTO payments
         (ticket_id, customer_id, gross_amount, commission_amount, method, status, gateway_ref)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [ticketId, customerId, grossAmount, commissionAmount.toFixed(2), method || null, gatewayRef || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/payments/my  (customer)
async function getMyPayments(req, res, next) {
  try {
    const result = await query(
      `SELECT p.*, t.ticket_number FROM payments p
       JOIN tickets t ON t.id = p.ticket_id
       WHERE p.customer_id = $1 ORDER BY p.paid_at DESC NULLS LAST`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/payments  (admin)
async function getAllPayments(req, res, next) {
  try {
    const result = await query(
      `SELECT p.*, t.ticket_number, u.name AS customer_name
       FROM payments p
       JOIN tickets t ON t.id = p.ticket_id
       JOIN users u ON u.id = p.customer_id
       ORDER BY p.paid_at DESC NULLS LAST`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { recordPayment, getMyPayments, getAllPayments };
