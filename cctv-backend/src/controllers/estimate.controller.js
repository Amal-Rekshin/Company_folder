const { query, getClient } = require('../config/db');
const AppError = require('../utils/AppError');

async function createNotification(userId, title, message, type, referenceId) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, is_read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [userId, title, message, type, referenceId]
    );
  } catch (_) {}
}

async function _updateTicketStatus(ticketId, newStatus, note, changedById) {
  const r = await query('SELECT status FROM tickets WHERE id = $1', [ticketId]);
  if (r.rows.length === 0) return;
  const oldStatus = r.rows[0].status;
  await query('UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, ticketId]);
  await query(
    `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [ticketId, oldStatus, newStatus, changedById, note || null]
  );
}

function mapEstimate(row, items = []) {
  let currentTotal = 0;
  const mappedItems = items.map((item) => {
    const lineTotal = parseFloat(item.unit_price) * item.quantity;
    currentTotal += lineTotal;
    return {
      id: item.id,
      description: item.description,
      unitPrice: parseFloat(item.unit_price),
      quantity: item.quantity,
      lineTotal,
    };
  });
  return {
    id: row.id,
    ticketId: row.ticket_id,
    status: row.status,
    notes: row.notes,
    validUntil: row.valid_until,
    version: row.version,
    approvedTotal: row.approved_total ? parseFloat(row.approved_total) : null,
    currentTotal,
    submittedAt: row.submitted_at,
    respondedAt: row.responded_at,
    rejectionReason: row.rejection_reason,
    items: mappedItems,
  };
}

// POST /api/tickets/:id/estimates  (technician)
async function createEstimate(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const ticketId = req.params.id;
    const creatorId = req.user.id;
    const { notes, validUntil, items } = req.body;

    const ticketCheck = await client.query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
    if (ticketCheck.rows.length === 0) throw new AppError('Ticket not found', 404);

    const estimateResult = await client.query(
      `INSERT INTO estimates (ticket_id, created_by, notes, valid_until, status, version)
       VALUES ($1, $2, $3, $4, 'draft', 1)
       RETURNING *`,
      [ticketId, creatorId, notes || null, validUntil || null]
    );
    const estimate = estimateResult.rows[0];

    const savedItems = [];
    for (const item of (items || [])) {
      const ir = await client.query(
        `INSERT INTO estimate_items (estimate_id, description, unit_price, quantity)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [estimate.id, item.description, item.unitPrice, item.quantity || 1]
      );
      savedItems.push(ir.rows[0]);
    }

    await client.query('COMMIT');
    return res.status(201).json(mapEstimate(estimate, savedItems));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/tickets/:id/estimates
async function getLatestEstimate(req, res, next) {
  try {
    const ticketId = req.params.id;
    const estResult = await query(
      `SELECT * FROM estimates WHERE ticket_id = $1 ORDER BY version DESC LIMIT 1`,
      [ticketId]
    );
    if (estResult.rows.length === 0) throw new AppError('No estimate found for ticket', 404);
    const estimate = estResult.rows[0];

    const items = await query(
      'SELECT * FROM estimate_items WHERE estimate_id = $1', [estimate.id]
    );
    return res.json(mapEstimate(estimate, items.rows));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/estimates/:id/submit  (technician)
async function submitEstimate(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const estimateId = req.params.id;

    const estResult = await client.query(
      `UPDATE estimates SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1 RETURNING *`,
      [estimateId]
    );
    if (estResult.rows.length === 0) throw new AppError('Estimate not found', 404);
    const estimate = estResult.rows[0];

    await client.query('COMMIT');

    await _updateTicketStatus(estimate.ticket_id, 'estimate_pending',
      'Estimate submitted', estimate.created_by);

    // Notify customer
    const ticketResult = await query(
      'SELECT customer_id FROM tickets WHERE id = $1', [estimate.ticket_id]
    );
    if (ticketResult.rows.length > 0) {
      await createNotification(ticketResult.rows[0].customer_id, 'Estimate Received',
        'A new estimate is pending your approval.', 'estimate', estimate.id);
    }

    const items = await query(
      'SELECT * FROM estimate_items WHERE estimate_id = $1', [estimateId]
    );
    return res.json(mapEstimate(estimate, items.rows));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/estimates/:id/approve  (customer)
async function approveEstimate(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const estimateId = req.params.id;
    const customerId = req.user.id;

    const estResult = await client.query(
      `SELECT e.*, t.customer_id FROM estimates e
       JOIN tickets t ON t.id = e.ticket_id WHERE e.id = $1`,
      [estimateId]
    );
    if (estResult.rows.length === 0) throw new AppError('Estimate not found', 404);
    const estimate = estResult.rows[0];
    if (estimate.customer_id !== customerId)
      throw new AppError('Only the ticket owner can approve the estimate', 403);

    const items = await client.query(
      'SELECT * FROM estimate_items WHERE estimate_id = $1', [estimateId]
    );
    const total = items.rows.reduce(
      (sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0
    );

    const updated = await client.query(
      `UPDATE estimates
       SET status = 'approved', responded_at = NOW(), approved_by = $1, approved_total = $2
       WHERE id = $3 RETURNING *`,
      [customerId, total, estimateId]
    );

    await client.query('COMMIT');

    await _updateTicketStatus(estimate.ticket_id, 'estimate_approved',
      'Estimate approved by customer', customerId);

    return res.json(mapEstimate(updated.rows[0], items.rows));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/estimates/:id/reject  (customer)
async function rejectEstimate(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const estimateId = req.params.id;
    const customerId = req.user.id;
    const reason = req.body.reason || '';

    const estResult = await client.query(
      `SELECT e.*, t.customer_id FROM estimates e
       JOIN tickets t ON t.id = e.ticket_id WHERE e.id = $1`,
      [estimateId]
    );
    if (estResult.rows.length === 0) throw new AppError('Estimate not found', 404);
    const estimate = estResult.rows[0];
    if (estimate.customer_id !== customerId)
      throw new AppError('Only the ticket owner can reject the estimate', 403);

    const updated = await client.query(
      `UPDATE estimates
       SET status = 'rejected', responded_at = NOW(), rejection_reason = $1
       WHERE id = $2 RETURNING *`,
      [reason, estimateId]
    );

    await client.query('COMMIT');

    await createNotification(estimate.created_by, 'Estimate Rejected',
      `The customer rejected your estimate: ${reason}`, 'estimate', estimateId);

    const items = await query(
      'SELECT * FROM estimate_items WHERE estimate_id = $1', [estimateId]
    );
    return res.json(mapEstimate(updated.rows[0], items.rows));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/estimates/:id/revise  (technician)
async function reviseEstimate(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const oldEstimateId = req.params.id;
    const creatorId = req.user.id;
    const { notes, validUntil, items } = req.body;

    const oldResult = await client.query(
      'SELECT * FROM estimates WHERE id = $1', [oldEstimateId]
    );
    if (oldResult.rows.length === 0) throw new AppError('Estimate not found', 404);
    const oldEstimate = oldResult.rows[0];

    await client.query(
      `UPDATE estimates SET status = 'revised' WHERE id = $1`, [oldEstimateId]
    );

    const newEstimate = await client.query(
      `INSERT INTO estimates (ticket_id, created_by, notes, valid_until, status, version)
       VALUES ($1, $2, $3, $4, 'draft', $5) RETURNING *`,
      [oldEstimate.ticket_id, creatorId, notes || null, validUntil || null, oldEstimate.version + 1]
    );
    const estimate = newEstimate.rows[0];

    const savedItems = [];
    for (const item of (items || [])) {
      const ir = await client.query(
        `INSERT INTO estimate_items (estimate_id, description, unit_price, quantity)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [estimate.id, item.description, item.unitPrice, item.quantity || 1]
      );
      savedItems.push(ir.rows[0]);
    }

    await client.query('COMMIT');
    return res.status(201).json(mapEstimate(estimate, savedItems));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  createEstimate,
  getLatestEstimate,
  submitEstimate,
  approveEstimate,
  rejectEstimate,
  reviseEstimate,
};
