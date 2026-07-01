const { getClient } = require('../config/db');
const AppError = require('../utils/AppError');

// ── GET /api/invoices (Admin sees all, Customer sees theirs) ──
async function getInvoices(req, res, next) {
  const client = await getClient();
  try {
    let query = `
      SELECT i.*, 
             t.ticket_number, t.service_type,
             u.name AS customer_name, u.email AS customer_email
      FROM invoices i
      JOIN tickets t ON i.ticket_id = t.id
      JOIN users u ON i.customer_id = u.id
    `;
    const params = [];
    
    if (req.user.role === 'customer') {
      query += ` WHERE i.customer_id = $1`;
      params.push(req.user.id);
    }
    
    query += ` ORDER BY i.created_at DESC`;

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// ── GET /api/invoices/:id ──
async function getInvoiceById(req, res, next) {
  const client = await getClient();
  try {
    const { id } = req.params;
    const result = await client.query(`
      SELECT i.*, 
             t.ticket_number, t.service_type, t.svc_address, t.svc_city, t.svc_state, t.svc_pincode,
             u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM invoices i
      JOIN tickets t ON i.ticket_id = t.id
      JOIN users u ON i.customer_id = u.id
      WHERE i.id = $1
    `, [id]);
    
    if (result.rows.length === 0) throw new AppError('Invoice not found', 404);
    
    const invoice = result.rows[0];
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }
    
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

// ── PATCH /api/invoices/:id/payment (Admin only) ──
async function updatePaymentStatus(req, res, next) {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { paid_amount, status } = req.body;
    
    await client.query('BEGIN');
    
    const invRes = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [id]);
    if (invRes.rows.length === 0) throw new AppError('Invoice not found', 404);
    
    const invoice = invRes.rows[0];
    
    const result = await client.query(`
      UPDATE invoices
      SET paid_amount = $1, status = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [paid_amount, status, id]);
    
    // Automatically close the ticket if invoice is fully paid
    if (status === 'paid') {
      await client.query(`
        UPDATE tickets SET status = 'closed', updated_at = NOW()
        WHERE id = $1 AND status != 'closed'
      `, [invoice.ticket_id]);
      
      await client.query(`
        INSERT INTO ticket_status_log (ticket_id, old_status, new_status, changed_by)
        VALUES ($1, (SELECT status FROM tickets WHERE id = $1), 'closed', $2)
      `, [invoice.ticket_id, req.user.id]);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  updatePaymentStatus
};
