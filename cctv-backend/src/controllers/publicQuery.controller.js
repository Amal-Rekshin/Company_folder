const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// POST /api/public/queries
async function submitQuery(req, res, next) {
  try {
    const { name, phone, email, city, state, pincode, issueType, description, source } = req.body;

    const result = await query(
      `INSERT INTO queries
         (name, phone, email, city, state, pincode, issue_type, description, source, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'received')
       RETURNING *`,
      [name, phone, email || null, city, state || null, pincode || null,
       issueType, description, source || 'website']
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/public/quotations/:token
async function getQuotationByToken(req, res, next) {
  try {
    const result = await query(
      `SELECT q.*, COALESCE(
         json_agg(qi.*) FILTER (WHERE qi.id IS NOT NULL), '[]'
       ) AS items
       FROM quotations q
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       WHERE q.accept_token = $1
       GROUP BY q.id`,
      [req.params.token]
    );
    if (result.rows.length === 0) throw new AppError('Invalid token', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/public/quotations/:token/accept
async function acceptQuotation(req, res, next) {
  try {
    const token = req.params.token;

    const quotResult = await query(
      `SELECT q.*, l.query_id, l.id AS lead_id FROM quotations q
       JOIN leads l ON l.id = q.lead_id
       WHERE q.accept_token = $1`,
      [token]
    );
    if (quotResult.rows.length === 0) throw new AppError('Invalid token', 404);
    const quotation = quotResult.rows[0];

    // Accept the quotation
    await query(
      `UPDATE quotations SET status = 'accepted', responded_at = NOW() WHERE id = $1`,
      [quotation.id]
    );

    // Update lead status
    await query(
      `UPDATE leads SET status = 'quotation_accepted', updated_at = NOW() WHERE id = $1`,
      [quotation.lead_id]
    );

    // Get query info to auto-create ticket
    const queryResult = await query(
      'SELECT * FROM queries WHERE id = $1', [quotation.query_id]
    );
    const q = queryResult.rows[0];

    // Generate ticket number
    const { generateTicketNumber } = require('../utils/ticketNumber');
    const ticketNumber = await generateTicketNumber();

    // Reuse customer_id from lead if set, else null (walk-in)
    const leadResult = await query('SELECT customer_id FROM leads WHERE id = $1', [quotation.lead_id]);
    const customerId = leadResult.rows[0].customer_id;

    if (!customerId) throw new AppError('No customer linked to this lead', 400);

    const ticketResult = await query(
      `INSERT INTO tickets
         (ticket_number, customer_id, service_type, issue_description, priority, status,
          svc_address, svc_city, svc_state, svc_pincode)
       VALUES ($1,$2,$3,$4,'medium','new',$5,$6,$7,$8)
       RETURNING id, ticket_number`,
      [ticketNumber, customerId, q.issue_type, q.description,
       '', q.city, q.state || '', q.pincode || '']
    );
    const ticket = ticketResult.rows[0];

    // Update lead as converted
    await query(
      `UPDATE leads SET status = 'converted', updated_at = NOW() WHERE id = $1`,
      [quotation.lead_id]
    );

    return res.json({ ticketId: ticket.id, ticketNumber: ticket.ticket_number });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/public/quotations/:token/reject
async function rejectQuotation(req, res, next) {
  try {
    const token = req.params.token;
    const reason = req.body.reason || '';

    const quotResult = await query(
      'SELECT id, lead_id FROM quotations WHERE accept_token = $1', [token]
    );
    if (quotResult.rows.length === 0) throw new AppError('Invalid token', 404);
    const quotation = quotResult.rows[0];

    await query(
      `UPDATE quotations SET status = 'rejected', responded_at = NOW(), rejection_reason = $1
       WHERE id = $2`,
      [reason, quotation.id]
    );
    await query(
      `UPDATE leads SET status = 'quotation_rejected', updated_at = NOW() WHERE id = $1`,
      [quotation.lead_id]
    );

    return res.json({ status: 'rejected' });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitQuery, getQuotationByToken, acceptQuotation, rejectQuotation };
