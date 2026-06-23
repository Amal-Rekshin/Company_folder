const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

// GET /api/admin/queries
async function getAllQueries(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM queries ORDER BY created_at DESC'
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/queries/:id
async function getQuery(req, res, next) {
  try {
    const result = await query('SELECT * FROM queries WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw new AppError('Query not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/queries/:id/qualify  → creates a Lead
async function qualifyQuery(req, res, next) {
  try {
    const queryId = req.params.id;

    const qResult = await query('SELECT * FROM queries WHERE id = $1', [queryId]);
    if (qResult.rows.length === 0) throw new AppError('Query not found', 404);

    const q = qResult.rows[0];

    // Update query status
    await query(
      `UPDATE queries SET status = 'converted_to_lead' WHERE id = $1`, [queryId]
    );

    // Find or create customer user
    const customerEmail = q.email || `customer_${q.phone || queryId.substring(0, 8)}@cctv.com`;
    let customerResult = await query(
      'SELECT id FROM users WHERE email = $1', [customerEmail]
    );
    let customerId;
    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id;
    } else {
      const bcrypt = require('bcryptjs');
      const defaultHash = await bcrypt.hash('changeme123', 10);
      const newCustomer = await query(
        `INSERT INTO users (name, email, phone, password_hash, role, is_active)
         VALUES ($1,$2,$3,$4,'customer',true) RETURNING id`,
        [q.name || 'Valued Customer', customerEmail, q.phone || '0000000000', defaultHash]
      );
      customerId = newCustomer.rows[0].id;
    }

    // Create lead
    const leadResult = await query(
      `INSERT INTO leads (query_id, customer_id, status) VALUES ($1, $2, 'qualified') RETURNING *`,
      [queryId, customerId]
    );
    return res.status(201).json(leadResult.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/queries/:id/reject
async function rejectQuery(req, res, next) {
  try {
    const reason = req.body.reason || '';
    const result = await query(
      `UPDATE queries SET status = 'rejected', rejection_reason = $1 WHERE id = $2 RETURNING *`,
      [reason, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Query not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllQueries, getQuery, qualifyQuery, rejectQuery };
