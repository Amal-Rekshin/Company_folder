const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// POST /api/tickets/:id/report  (technician)
async function createReport(req, res, next) {
  try {
    const ticketId = req.params.id;
    const technicianId = req.user.id;
    const { inspectionNotes, workDone, recommendations, materialsUsed, partsReplaced, customerSignatureUrl } = req.body;

    const ticketCheck = await query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
    if (ticketCheck.rows.length === 0) throw new AppError('Ticket not found', 404);

    const result = await query(
      `INSERT INTO service_reports
         (ticket_id, technician_id, inspection_notes, work_done, recommendations, materials_used, parts_replaced,
          customer_signature_url, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [ticketId, technicianId, inspectionNotes || null, workDone || null, recommendations || null, materialsUsed || null,
       partsReplaced || null, customerSignatureUrl || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/:id/report
async function getReport(req, res, next) {
  try {
    const result = await query(
      `SELECT sr.*, u.name AS technician_name FROM service_reports sr
       JOIN users u ON u.id = sr.technician_id
       WHERE sr.ticket_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Report not found', 404);
    const row = result.rows[0];

    const imagesResult = await query(
      'SELECT * FROM report_images WHERE report_id = $1', [row.id]
    );
    
    const mappedImages = imagesResult.rows.map(img => ({
      id: img.id,
      imageType: img.image_type,
      url: img.url,
      description: img.description
    }));

    const report = {
      id: row.id,
      ticketId: row.ticket_id,
      technicianId: row.technician_id,
      technicianName: row.technician_name,
      workDone: row.work_done,
      recommendations: row.recommendations,
      materialsUsed: row.materials_used,
      partsReplaced: row.parts_replaced,
      customerSignatureUrl: row.customer_signature_url,
      inspectionNotes: row.inspection_notes,
      status: row.status,
      completedAt: row.completed_at,
      images: mappedImages
    };

    return res.json(report);
  } catch (err) {
    next(err);
  }
}

// POST /api/reports/:id/images  (technician)
async function addImage(req, res, next) {
  try {
    const reportId = req.params.id;
    const { imageType, url } = req.body;

    const reportCheck = await query('SELECT id FROM service_reports WHERE id = $1', [reportId]);
    if (reportCheck.rows.length === 0) throw new AppError('Report not found', 404);

    await query(
      `INSERT INTO report_images (report_id, image_type, url) VALUES ($1, $2, $3)`,
      [reportId, imageType, url]
    );
    return res.status(200).json({ message: 'Image added' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReport, getReport, addImage };
