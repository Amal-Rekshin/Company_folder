const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

function mapQuotation(row) {
  return {
    ...row,
    totalAmount: row.total_amount ? parseFloat(row.total_amount) : null,
    gstRate: parseFloat(row.gst_rate),
    gstAmount: row.gst_amount ? parseFloat(row.gst_amount) : null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
  };
}

// GET /api/admin/quotations
async function getAllQuotations(req, res, next) {
  try {
    const result = await query(
      `SELECT q.*, l.query_id, u.name AS created_by_name
       FROM quotations q
       JOIN leads l ON l.id = q.lead_id
       JOIN users u ON u.id = q.created_by
       ORDER BY q.sent_at DESC NULLS LAST`
    );
    return res.json(result.rows.map(mapQuotation));
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/quotations/lead/:leadId
async function getQuotationsByLead(req, res, next) {
  try {
    const result = await query(
      `SELECT q.*, u.name AS created_by_name FROM quotations q
       JOIN users u ON u.id = q.created_by
       WHERE q.lead_id = $1 ORDER BY q.version DESC`,
      [req.params.leadId]
    );
    return res.json(result.rows.map(mapQuotation));
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/quotations/:id
async function getQuotation(req, res, next) {
  try {
    const quotResult = await query(
      `SELECT q.*, u.name AS created_by_name FROM quotations q
       JOIN users u ON u.id = q.created_by WHERE q.id = $1`,
      [req.params.id]
    );
    if (quotResult.rows.length === 0) throw new AppError('Quotation not found', 404);

    const items = await query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1', [req.params.id]
    );
    return res.json({ ...mapQuotation(quotResult.rows[0]), items: items.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/quotations/lead/:leadId
async function createQuotation(req, res, next) {
  try {
    const leadId = req.params.leadId;
    const adminId = req.user.id;
    const { notes, terms, validUntil, gstRate, items, customerName, customerPhone } = req.body;

    const leadCheck = await query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (leadCheck.rows.length === 0) throw new AppError('Lead not found', 404);

    const quotResult = await query(
      `INSERT INTO quotations (lead_id, created_by, notes, terms, valid_until, gst_rate, status, version, customer_name, customer_phone)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',1,$7,$8) RETURNING *`,
      [leadId, adminId, notes || null, terms || null, validUntil, gstRate || 18.0, customerName || null, customerPhone || null]
    );
    const quotation = quotResult.rows[0];

    for (const item of (items || [])) {
      await query(
        `INSERT INTO quotation_items (quotation_id, description, unit_price, quantity)
         VALUES ($1,$2,$3,$4)`,
        [quotation.id, item.description, item.unitPrice, item.quantity || 1]
      );
    }

    const finalItems = await query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1', [quotation.id]
    );
    return res.status(201).json({ ...mapQuotation(quotation), items: finalItems.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/quotations/:id/send
async function sendQuotation(req, res, next) {
  try {
    const quotId = req.params.id;

    // Compute totals
    const items = await query(
      'SELECT unit_price, quantity FROM quotation_items WHERE quotation_id = $1', [quotId]
    );
    const subtotal = items.rows.reduce(
      (sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0
    );

    const quotResult = await query('SELECT gst_rate FROM quotations WHERE id = $1', [quotId]);
    if (quotResult.rows.length === 0) throw new AppError('Quotation not found', 404);
    const gstRate = parseFloat(quotResult.rows[0].gst_rate);
    const gstAmount = subtotal * (gstRate / 100);
    const totalAmount = subtotal + gstAmount;

    const updated = await query(
      `UPDATE quotations
       SET status = 'sent', sent_at = NOW(), total_amount = $1, gst_amount = $2, accept_token = COALESCE(accept_token, gen_random_uuid()::varchar)
       WHERE id = $3 RETURNING *`,
      [totalAmount.toFixed(2), gstAmount.toFixed(2), quotId]
    );

    // Update lead status
    await query(
      'UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2',
      ['quotation_sent', updated.rows[0].lead_id]
    );

    return res.json(mapQuotation(updated.rows[0]));
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/quotations/:id
async function updateQuotation(req, res, next) {
  try {
    const quotId = req.params.id;
    const { notes, terms, validUntil, gstRate, items, customerName, customerPhone } = req.body;

    const quotCheck = await query('SELECT status FROM quotations WHERE id = $1', [quotId]);
    if (quotCheck.rows.length === 0) throw new AppError('Quotation not found', 404);
    if (quotCheck.rows[0].status !== 'draft') {
      throw new AppError('Only draft quotations can be modified', 400);
    }

    // Start a transaction
    await query('BEGIN');

    const updatedResult = await query(
      `UPDATE quotations
       SET notes = $1, terms = $2, valid_until = $3, gst_rate = $4, customer_name = $5, customer_phone = $6, updated_at = NOW()
       WHERE id = $7 AND status = 'draft'
       RETURNING *`,
      [notes || null, terms || null, validUntil, gstRate || 18.0, customerName || null, customerPhone || null, quotId]
    );
    const quotation = updatedResult.rows[0];

    // Delete existing items
    await query('DELETE FROM quotation_items WHERE quotation_id = $1', [quotId]);

    // Insert new items
    for (const item of (items || [])) {
      await query(
        `INSERT INTO quotation_items (quotation_id, description, unit_price, quantity)
         VALUES ($1,$2,$3,$4)`,
        [quotId, item.description, item.unitPrice, item.quantity || 1]
      );
    }

    await query('COMMIT');

    const finalItems = await query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1', [quotId]
    );
    return res.json({ ...mapQuotation(quotation), items: finalItems.rows });
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
}

module.exports = {
  getAllQuotations,
  getQuotationsByLead,
  getQuotation,
  createQuotation,
  sendQuotation,
  updateQuotation,
};
