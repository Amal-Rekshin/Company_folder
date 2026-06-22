const { query, getClient } = require('../config/db');
const AppError = require('../utils/AppError');
const { updateStatus } = require('./ticket.controller');

async function createNotification(userId, title, message, type, referenceId) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, is_read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [userId, title, message, type, referenceId]
    );
  } catch (_) {}
}

// POST /api/tickets/:id/assign/technician  (admin)
async function assignTechnician(req, res, next) {
  try {
    const ticketId = req.params.id;
    const { assigneeId } = req.body;
    const adminId = req.user.id;

    const techResult = await query(
      'SELECT id, name, role FROM users WHERE id = $1', [assigneeId]
    );
    if (techResult.rows.length === 0) throw new AppError('Technician not found', 404);
    const tech = techResult.rows[0];
    if (tech.role !== 'technician') throw new AppError('User is not a technician', 400);

    const ticketResult = await query('SELECT ticket_number FROM tickets WHERE id = $1', [ticketId]);
    if (ticketResult.rows.length === 0) throw new AppError('Ticket not found', 404);
    const ticket = ticketResult.rows[0];

    await query(
      `INSERT INTO technician_assignments (ticket_id, technician_id, status)
       VALUES ($1, $2, 'pending')`,
      [ticketId, assigneeId]
    );

    // Update ticket status via the ticket controller logic
    req.params.id = ticketId;
    req.body = { status: 'technician_assigned', note: `Assigned to technician ${tech.name}` };
    req.user = { ...req.user, id: adminId };
    await _updateTicketStatus(ticketId, 'technician_assigned',
      `Assigned to technician ${tech.name}`, adminId);

    await createNotification(assigneeId, 'New Assignment',
      `You have been assigned to ticket ${ticket.ticket_number}`, 'assignment', ticketId);

    return res.status(200).json({ message: 'Technician assigned successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /api/tickets/:id/assign/partner  (admin)
async function assignPartner(req, res, next) {
  try {
    const ticketId = req.params.id;
    const { assigneeId } = req.body;
    const adminId = req.user.id;

    const partnerResult = await query(
      'SELECT id, name, role FROM users WHERE id = $1', [assigneeId]
    );
    if (partnerResult.rows.length === 0) throw new AppError('Partner not found', 404);
    const partner = partnerResult.rows[0];
    if (partner.role !== 'partner') throw new AppError('User is not a partner', 400);

    const ticketResult = await query('SELECT ticket_number FROM tickets WHERE id = $1', [ticketId]);
    if (ticketResult.rows.length === 0) throw new AppError('Ticket not found', 404);
    const ticket = ticketResult.rows[0];

    await query(
      `INSERT INTO partner_assignments (ticket_id, partner_id, status)
       VALUES ($1, $2, 'pending')`,
      [ticketId, assigneeId]
    );

    await _updateTicketStatus(ticketId, 'partner_assigned',
      `Assigned to partner ${partner.name}`, adminId);

    await createNotification(assigneeId, 'New Assignment',
      `Your company has been assigned to ticket ${ticket.ticket_number}`, 'assignment', ticketId);

    return res.status(200).json({ message: 'Partner assigned successfully' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/technician-assignments/:id/accept  (technician)
async function acceptTechnicianAssignment(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const assignmentId = req.params.id;
    const technicianId = req.user.id;

    const aResult = await client.query(
      'SELECT * FROM technician_assignments WHERE id = $1', [assignmentId]
    );
    if (aResult.rows.length === 0) throw new AppError('Assignment not found', 404);
    const assignment = aResult.rows[0];
    if (assignment.technician_id !== technicianId)
      throw new AppError('You can only accept your own assignments', 403);

    await client.query(
      `UPDATE technician_assignments
       SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [assignmentId]
    );
    await client.query('COMMIT');

    await _updateTicketStatus(assignment.ticket_id, 'accepted',
      'Technician accepted the assignment', technicianId);

    return res.status(200).json({ message: 'Assignment accepted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/technician-assignments/:id/reject  (technician)
async function rejectTechnicianAssignment(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const assignmentId = req.params.id;
    const technicianId = req.user.id;
    const reason = req.body.reason || '';

    const aResult = await client.query(
      'SELECT * FROM technician_assignments WHERE id = $1', [assignmentId]
    );
    if (aResult.rows.length === 0) throw new AppError('Assignment not found', 404);
    const assignment = aResult.rows[0];
    if (assignment.technician_id !== technicianId)
      throw new AppError('You can only reject your own assignments', 403);

    await client.query(
      `UPDATE technician_assignments
       SET status = 'rejected', rejected_at = NOW(), rejection_reason = $1 WHERE id = $2`,
      [reason, assignmentId]
    );
    await client.query('COMMIT');

    await _updateTicketStatus(assignment.ticket_id, 'new',
      `Technician rejected the assignment: ${reason}`, technicianId);

    return res.status(200).json({ message: 'Assignment rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/partner-assignments/:id/accept  (partner)
async function acceptPartnerAssignment(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const assignmentId = req.params.id;
    const partnerId = req.user.id;

    const aResult = await client.query(
      `SELECT * FROM partner_assignments WHERE id = $1 AND partner_id = $2 AND status = 'pending'`,
      [assignmentId, partnerId]
    );
    if (aResult.rows.length === 0)
      throw new AppError('Pending assignment not found', 404);
    const assignment = aResult.rows[0];

    await client.query(
      `UPDATE partner_assignments
       SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [assignmentId]
    );
    await client.query('COMMIT');

    await _updateTicketStatus(assignment.ticket_id, 'partner_accepted',
      'Partner accepted the assignment', partnerId);

    return res.status(200).json({ message: 'Assignment accepted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/partner-assignments/:id/reject  (partner)
async function rejectPartnerAssignment(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const assignmentId = req.params.id;
    const partnerId = req.user.id;
    const reason = req.body.reason || '';

    const aResult = await client.query(
      `SELECT * FROM partner_assignments WHERE id = $1 AND partner_id = $2 AND status = 'pending'`,
      [assignmentId, partnerId]
    );
    if (aResult.rows.length === 0)
      throw new AppError('Pending assignment not found', 404);
    const assignment = aResult.rows[0];

    await client.query(
      `UPDATE partner_assignments
       SET status = 'rejected', rejected_at = NOW(), rejection_reason = $1 WHERE id = $2`,
      [reason, assignmentId]
    );
    await client.query('COMMIT');

    await _updateTicketStatus(assignment.ticket_id, 'new',
      `Partner rejected the assignment: ${reason}`, partnerId);

    return res.status(200).json({ message: 'Assignment rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/partner-assignments/:id/assign-technician  (partner)
async function assignTechnicianByPartner(req, res, next) {
  try {
    const assignmentId = req.params.id;
    const partnerId = req.user.id;
    const { technicianId } = req.body;

    // Verify partner has accepted this assignment
    const paResult = await query(
      `SELECT pa.*, t.ticket_number FROM partner_assignments pa
       JOIN tickets t ON t.id = pa.ticket_id
       WHERE pa.id = $1 AND pa.partner_id = $2 AND pa.status = 'accepted'`,
      [assignmentId, partnerId]
    );
    if (paResult.rows.length === 0)
      throw new AppError('You must accept the ticket before assigning a technician', 400);
    const pa = paResult.rows[0];

    const techResult = await query(
      'SELECT id, name, role FROM users WHERE id = $1', [technicianId]
    );
    if (techResult.rows.length === 0) throw new AppError('Technician not found', 404);
    const tech = techResult.rows[0];
    if (tech.role !== 'technician') throw new AppError('User is not a technician', 400);

    await query(
      `INSERT INTO technician_assignments (ticket_id, technician_id, status)
       VALUES ($1, $2, 'pending')`,
      [pa.ticket_id, technicianId]
    );

    await _updateTicketStatus(pa.ticket_id, 'technician_assigned',
      `Partner assigned to technician ${tech.name}`, partnerId);

    await createNotification(technicianId, 'New Assignment',
      `You have been assigned to ticket ${pa.ticket_number} by a Partner.`, 'assignment', pa.ticket_id);

    return res.status(200).json({ message: 'Technician assigned by partner' });
  } catch (err) {
    next(err);
  }
}

/**
 * Internal helper: update ticket status + write status log
 */
async function _updateTicketStatus(ticketId, newStatus, note, changedById) {
  const ticketResult = await query('SELECT status FROM tickets WHERE id = $1', [ticketId]);
  if (ticketResult.rows.length === 0) return;
  const oldStatus = ticketResult.rows[0].status;

  await query(
    'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
    [newStatus, ticketId]
  );
  await query(
    `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [ticketId, oldStatus, newStatus, changedById, note || null]
  );
}

module.exports = {
  assignTechnician,
  assignPartner,
  acceptTechnicianAssignment,
  rejectTechnicianAssignment,
  acceptPartnerAssignment,
  rejectPartnerAssignment,
  assignTechnicianByPartner,
};
