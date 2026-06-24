const { query } = require('../config/db');
const AppError = require('../utils/AppError');

async function createNotification(userId, title, message, type) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [userId, title, message, type]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

// POST /api/tickets/:id/material-requests
async function createMaterialRequest(req, res, next) {
  try {
    const ticketId = req.params.id;
    const technicianId = req.user.id;
    const { requestText } = req.body;

    if (!requestText) throw new AppError('Request text is required', 400);

    const result = await query(
      `INSERT INTO material_requests (ticket_id, technician_id, request_text)
       VALUES ($1, $2, $3) RETURNING *`,
      [ticketId, technicianId, requestText]
    );

    // Notify admins
    const adminRes = await query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of adminRes.rows) {
      await createNotification(
        admin.id,
        'New Material Request',
        `Technician has requested additional materials for Ticket ${ticketId}`,
        'material_request',
        result.rows[0].id
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/:id/material-requests
async function getMaterialRequestsForTicket(req, res, next) {
  try {
    const ticketId = req.params.id;
    
    const result = await query(
      `SELECT mr.*, u.name AS technician_name 
       FROM material_requests mr
       JOIN users u ON mr.technician_id = u.id
       WHERE mr.ticket_id = $1 ORDER BY mr.created_at DESC`,
      [ticketId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/material-requests/:id/status
async function updateMaterialRequestStatus(req, res, next) {
  try {
    const requestId = req.params.id;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const result = await query(
      `UPDATE material_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, requestId]
    );

    if (result.rows.length === 0) throw new AppError('Material request not found', 404);

    // Notify technician
    await createNotification(
      result.rows[0].technician_id,
      'Material Request Updated',
      `Your material request has been ${status}`,
      'material_request',
      requestId
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createMaterialRequest,
  getMaterialRequestsForTicket,
  updateMaterialRequestStatus
};
