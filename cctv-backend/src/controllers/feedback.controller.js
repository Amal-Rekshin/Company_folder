const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// POST /api/tickets/:id/feedback  (customer)
async function submitFeedback(req, res, next) {
  try {
    const ticketId = req.params.id;
    const customerId = req.user.id;
    const { rating, comments, technicianId } = req.body;

    const ticketCheck = await query(
      'SELECT id, customer_id FROM tickets WHERE id = $1', [ticketId]
    );
    if (ticketCheck.rows.length === 0) throw new AppError('Ticket not found', 404);
    if (ticketCheck.rows[0].customer_id !== customerId)
      throw new AppError('Only the ticket owner can submit feedback', 403);

    const result = await query(
      `INSERT INTO feedbacks (ticket_id, customer_id, technician_id, rating, comments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ticketId, customerId, technicianId || null, rating, comments || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/:id/feedback
async function getFeedback(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM feedbacks WHERE ticket_id = $1', [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Feedback not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitFeedback, getFeedback };
