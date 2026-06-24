const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// GET /api/schedules/my  (technician)
async function getMySchedules(req, res, next) {
  try {
    const technicianId = req.user.id;
    const result = await query(
      `SELECT ss.*, t.ticket_number, t.service_type, t.svc_address, t.svc_city
       FROM service_schedules ss
       JOIN tickets t ON t.id = ss.ticket_id
       WHERE ss.technician_id = $1
       ORDER BY ss.scheduled_date DESC`,
      [technicianId]
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/schedules  (technician)
async function scheduleVisit(req, res, next) {
  try {
    const technicianId = req.user.id;
    const { ticketId, scheduledDate, scheduledTime } = req.body;

    const ticketCheck = await query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
    if (ticketCheck.rows.length === 0) throw new AppError('Ticket not found', 404);

    const result = await query(
      `INSERT INTO service_schedules (ticket_id, technician_id, scheduled_date, scheduled_time, status)
       VALUES ($1, $2, $3, $4, 'scheduled')
       RETURNING *`,
      [ticketId, technicianId, scheduledDate, scheduledTime || null]
    );

    // Update ticket status
    await query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      ['visit_scheduled', ticketId]
    );
    await query(
      `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
       SELECT $1, status, 'visit_scheduled', $2, 'Visit scheduled'
       FROM tickets WHERE id = $1`,
      [ticketId, technicianId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/schedules/:id/reschedule  (technician)
async function rescheduleVisit(req, res, next) {
  try {
    const scheduleId = req.params.id;
    const { scheduledDate, scheduledTime, rescheduleReason } = req.body;

    const result = await query(
      `UPDATE service_schedules
       SET status = 'rescheduled', scheduled_date = $1, scheduled_time = $2,
           reschedule_reason = $3
       WHERE id = $4
       RETURNING *`,
      [scheduledDate, scheduledTime || null, rescheduleReason || null, scheduleId]
    );
    if (result.rows.length === 0) throw new AppError('Schedule not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { scheduleVisit, rescheduleVisit, getMySchedules };
