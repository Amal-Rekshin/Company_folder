const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/assignment.controller');

// Admin assigns ticket to technician or partner
router.post('/tickets/:id/assign/technician', verifyToken, requireRole('admin'), ctrl.assignTechnician);
router.post('/tickets/:id/assign/partner', verifyToken, requireRole('admin'), ctrl.assignPartner);

// Look up assignment by ticket ID (must come before /:id routes)
router.get('/partner-assignments/by-ticket/:ticketId', verifyToken, requireRole('partner'), ctrl.getPartnerAssignmentByTicket);
router.get('/technician-assignments/by-ticket/:ticketId', verifyToken, requireRole('technician'), ctrl.getTechnicianAssignmentByTicket);

// Technician accepts/rejects assignment
router.patch('/technician-assignments/:id/accept', verifyToken, requireRole('technician'), ctrl.acceptTechnicianAssignment);
router.patch('/technician-assignments/:id/reject', verifyToken, requireRole('technician'), ctrl.rejectTechnicianAssignment);

// Partner accepts/rejects assignment
router.patch('/partner-assignments/:id/accept', verifyToken, requireRole('partner'), ctrl.acceptPartnerAssignment);
router.patch('/partner-assignments/:id/reject', verifyToken, requireRole('partner'), ctrl.rejectPartnerAssignment);

// Partner assigns a technician under them
router.post('/partner-assignments/:id/assign-technician', verifyToken, requireRole('partner'), ctrl.assignTechnicianByPartner);

module.exports = router;
