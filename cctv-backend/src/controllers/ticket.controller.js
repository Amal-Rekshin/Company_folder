const { query, getClient } = require('../config/db');
const { generateTicketNumber } = require('../utils/ticketNumber');
const AppError = require('../utils/AppError');

// Ticket state machine — mirrors TicketStateMachine.java
const VALID_TRANSITIONS = {
  new: ['assigned', 'partner_assigned', 'cancelled'],
  assigned: ['technician_assigned', 'new', 'cancelled'],
  partner_assigned: ['partner_accepted', 'new', 'cancelled'],
  partner_accepted: ['technician_assigned', 'cancelled'],
  technician_assigned: ['accepted', 'new', 'cancelled'],
  accepted: ['visit_scheduled', 'on_site', 'estimate_pending', 'cancelled'],
  visit_scheduled: ['on_site', 'cancelled'],
  on_site: ['work_in_progress', 'estimate_pending'],
  work_in_progress: ['estimate_pending', 'completed'],
  estimate_pending: ['estimate_approved', 'estimate_pending'],
  estimate_approved: ['completed'],
  completed: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['assigned', 'technician_assigned', 'cancelled'],
  cancelled: [],
};

function validateTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new AppError(
      `Invalid status transition from '${from}' to '${to}'`,
      422
    );
  }
}

async function createNotification(userId, title, message, type, referenceId) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, is_read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [userId, title, message, type, referenceId]
    );
  } catch (_) {
    // Non-critical — don't fail the main operation
  }
}

function mapTicket(row) {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    serviceType: row.service_type,
    issueDescription: row.issue_description,
    priority: row.priority,
    status: row.status,
    svcAddress: row.svc_address,
    svcCity: row.svc_city,
    svcState: row.svc_state,
    svcPincode: row.svc_pincode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// POST /api/tickets
async function createTicket(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { serviceType, issueDescription, priority, svcAddress, svcCity, svcState, svcPincode } = req.body;
    const customerId = req.user.id;

    const ticketNumber = await generateTicketNumber();

    const ticketResult = await client.query(
      `INSERT INTO tickets
         (ticket_number, customer_id, service_type, issue_description, priority, status,
          svc_address, svc_city, svc_state, svc_pincode)
       VALUES ($1,$2,$3,$4,$5,'new',$6,$7,$8,$9)
       RETURNING *`,
      [ticketNumber, customerId, serviceType, issueDescription, priority || 'medium',
       svcAddress, svcCity, svcState, svcPincode]
    );
    const ticket = ticketResult.rows[0];

    await client.query(
      `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
       VALUES ($1, NULL, 'new', $2, 'Ticket created')`,
      [ticket.id, customerId]
    );

    await client.query('COMMIT');

    // Notification (best-effort)
    await createNotification(customerId, 'Ticket Created',
      `Your ticket ${ticketNumber} has been created.`, 'ticket_update', ticket.id);

    // Fetch with customer name
    const full = await query(
      `SELECT t.*, u.name AS customer_name FROM tickets t
       JOIN users u ON u.id = t.customer_id WHERE t.id = $1`,
      [ticket.id]
    );
    return res.status(201).json(mapTicket(full.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/tickets  (admin)
async function getAllTickets(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const size = Math.min(parseInt(req.query.size, 10) || 20, 100);
    const offset = page * size;

    const result = await query(
      `SELECT t.*, u.name AS customer_name FROM tickets t
       JOIN users u ON u.id = t.customer_id
       ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
      [size, offset]
    );
    const total = await query('SELECT COUNT(*) FROM tickets');
    return res.json({
      content: result.rows.map(mapTicket),
      totalElements: parseInt(total.rows[0].count, 10),
      page,
      size,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/my  (customer)
async function getMyTickets(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const size = Math.min(parseInt(req.query.size, 10) || 20, 100);
    const offset = page * size;
    const customerId = req.user.id;

    const result = await query(
      `SELECT t.*, u.name AS customer_name FROM tickets t
       JOIN users u ON u.id = t.customer_id
       WHERE t.customer_id = $1
       ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
      [customerId, size, offset]
    );
    const total = await query(
      'SELECT COUNT(*) FROM tickets WHERE customer_id = $1', [customerId]
    );
    return res.json({
      content: result.rows.map(mapTicket),
      totalElements: parseInt(total.rows[0].count, 10),
      page,
      size,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/:id
async function getTicketById(req, res, next) {
  try {
    const result = await query(
      `SELECT t.*, u.name AS customer_name FROM tickets t
       JOIN users u ON u.id = t.customer_id WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Ticket not found', 404);
    return res.json(mapTicket(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tickets/:id/status
async function updateStatus(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { status: newStatus, note } = req.body;
    const ticketId = req.params.id;
    const changedBy = req.user.id;

    const ticketResult = await client.query(
      `SELECT t.*, u.name AS customer_name, u.id AS customer_uid FROM tickets t
       JOIN users u ON u.id = t.customer_id WHERE t.id = $1`,
      [ticketId]
    );
    if (ticketResult.rows.length === 0) throw new AppError('Ticket not found', 404);
    const ticket = ticketResult.rows[0];

    validateTransition(ticket.status, newStatus.toLowerCase());

    await client.query(
      `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus.toLowerCase(), ticketId]
    );

    await client.query(
      `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [ticketId, ticket.status, newStatus.toLowerCase(), changedBy, note || null]
    );

    await client.query('COMMIT');

    await createNotification(ticket.customer_uid, 'Ticket Status Updated',
      `Ticket ${ticket.ticket_number} is now ${newStatus}`, 'ticket_update', ticketId);

    const updated = await query(
      `SELECT t.*, u.name AS customer_name FROM tickets t
       JOIN users u ON u.id = t.customer_id WHERE t.id = $1`,
      [ticketId]
    );
    return res.json(mapTicket(updated.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/tickets/:id/close  (customer)
async function closeTicket(req, res, next) {
  req.body.status = 'closed';
  req.body.note = (req.body && req.body.note) || 'Customer closed the ticket';
  return updateStatus(req, res, next);
}

// POST /api/tickets/:id/reopen  (customer)
async function reopenTicket(req, res, next) {
  req.body.status = 'reopened';
  req.body.note = (req.body && req.body.note) || 'Customer reopened the ticket';
  return updateStatus(req, res, next);
}

// GET /api/tickets/:id/status-log
async function getStatusLog(req, res, next) {
  try {
    const result = await query(
      `SELECT tsl.*, u.name AS changed_by_name
       FROM ticket_status_log tsl
       JOIN users u ON u.id = tsl.changed_by
       WHERE tsl.ticket_id = $1
       ORDER BY tsl.changed_at DESC`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/my-assigned  (partner or technician)
async function getMyAssignedTickets(req, res, next) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let rows;

    if (role === 'partner') {
      const result = await query(
        `SELECT DISTINCT ON (t.id)
            t.*,
            u.name AS customer_name,
            pa.id AS assignment_id,
            pa.status AS assignment_status
         FROM partner_assignments pa
         JOIN tickets t ON t.id = pa.ticket_id
         JOIN users u ON u.id = t.customer_id
         WHERE pa.partner_id = $1
         ORDER BY t.id, pa.assigned_at DESC`,
        [userId]
      );
      rows = result.rows.map(row => ({
        ...mapTicket(row),
        assignmentId: row.assignment_id,
        assignmentStatus: row.assignment_status,
      }));
    } else if (role === 'technician') {
      const result = await query(
        `SELECT DISTINCT ON (t.id)
            t.*,
            u.name AS customer_name,
            ta.id AS assignment_id,
            ta.status AS assignment_status
         FROM technician_assignments ta
         JOIN tickets t ON t.id = ta.ticket_id
         JOIN users u ON u.id = t.customer_id
         WHERE ta.technician_id = $1
         ORDER BY t.id, ta.assigned_at DESC`,
        [userId]
      );
      rows = result.rows.map(row => ({
        ...mapTicket(row),
        assignmentId: row.assignment_id,
        assignmentStatus: row.assignment_status,
      }));
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTicket,
  getAllTickets,
  getMyTickets,
  getMyAssignedTickets,
  getTicketById,
  updateStatus,
  closeTicket,
  reopenTicket,
  getStatusLog,
};
