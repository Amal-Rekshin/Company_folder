const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

// GET /api/admin/leads
async function getAllLeads(req, res, next) {
  try {
    const result = await query(
      `SELECT l.*, q.name, q.phone, q.email, q.city, q.issue_type,
              u.name AS assigned_to_name
       FROM leads l
       JOIN queries q ON q.id = l.query_id
       LEFT JOIN users u ON u.id = l.assigned_to
       ORDER BY l.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/leads/:id
async function getLead(req, res, next) {
  try {
    const result = await query(
      `SELECT l.*, q.*, u.name AS assigned_to_name
       FROM leads l
       JOIN queries q ON q.id = l.query_id
       LEFT JOIN users u ON u.id = l.assigned_to
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Lead not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/leads/:id/assign
async function assignLead(req, res, next) {
  try {
    const { assignedTo } = req.body;

    const userCheck = await query('SELECT id FROM users WHERE id = $1', [assignedTo]);
    if (userCheck.rows.length === 0) throw new AppError('User not found', 404);

    const result = await query(
      `UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assignedTo, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Lead not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/leads/:id/notes
async function addNote(req, res, next) {
  try {
    const { note } = req.body;
    const result = await query(
      `UPDATE leads SET notes = COALESCE(notes || E'\n', '') || $1,
       updated_at = NOW() WHERE id = $2 RETURNING *`,
      [note, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Lead not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllLeads, getLead, assignLead, addNote };
