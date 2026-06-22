const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// POST /api/settlements/batch  (admin)
async function createBatch(req, res, next) {
  try {
    const { partnerId, periodStart, periodEnd, paymentIds } = req.body;

    // Calculate total from the selected payments
    const payResult = await query(
      `SELECT SUM(gross_amount - commission_amount) AS net
       FROM payments WHERE id = ANY($1::uuid[]) AND status = 'paid'`,
      [paymentIds]
    );
    const total = parseFloat(payResult.rows[0].net) || 0;

    const batchResult = await query(
      `INSERT INTO settlement_batches (partner_id, status, total_amount, period_start, period_end)
       VALUES ($1, 'pending', $2, $3, $4) RETURNING *`,
      [partnerId, total, periodStart, periodEnd]
    );
    const batch = batchResult.rows[0];

    // Create settlement records
    for (const payId of (paymentIds || [])) {
      const pResult = await query(
        'SELECT gross_amount, commission_amount FROM payments WHERE id = $1', [payId]
      );
      if (pResult.rows.length === 0) continue;
      const p = pResult.rows[0];
      const amount = parseFloat(p.gross_amount) - parseFloat(p.commission_amount);
      await query(
        'INSERT INTO settlements (payment_id, batch_id, amount) VALUES ($1, $2, $3)',
        [payId, batch.id, amount]
      );
    }

    return res.status(201).json(batch);
  } catch (err) {
    next(err);
  }
}

// GET /api/settlements/partner/my  (partner)
async function getMyBatches(req, res, next) {
  try {
    const result = await query(
      `SELECT * FROM settlement_batches WHERE partner_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/settlements/batches  (admin)
async function getAllBatches(req, res, next) {
  try {
    const result = await query(
      `SELECT sb.*, u.name AS partner_name FROM settlement_batches sb
       JOIN users u ON u.id = sb.partner_id
       ORDER BY sb.period_start DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/settlements/pending  (admin)
async function getPendingPayments(req, res, next) {
  try {
    const result = await query(
      `SELECT p.*, t.ticket_number, u.name AS customer_name,
              pa.partner_id, pu.name AS partner_name
       FROM payments p
       JOIN tickets t ON t.id = p.ticket_id
       JOIN users u ON u.id = p.customer_id
       JOIN partner_assignments pa ON pa.ticket_id = p.ticket_id AND pa.status = 'accepted'
       JOIN users pu ON pu.id = pa.partner_id
       WHERE p.status = 'paid'
       AND p.id NOT IN (SELECT payment_id FROM settlements)
       ORDER BY p.paid_at DESC NULLS LAST`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBatch, getMyBatches, getAllBatches, getPendingPayments };
