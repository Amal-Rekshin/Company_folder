const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/estimate.controller');

// Ticket-scoped estimate endpoints
router.post('/tickets/:id/estimates', verifyToken, requireRole('technician'), ctrl.createEstimate);
router.get('/tickets/:id/estimates', verifyToken, ctrl.getLatestEstimate);

// Estimate lifecycle endpoints
router.patch('/estimates/:id/submit', verifyToken, requireRole('technician'), ctrl.submitEstimate);
router.patch('/estimates/:id/approve', verifyToken, requireRole('customer'), ctrl.approveEstimate);
router.patch('/estimates/:id/reject', verifyToken, requireRole('customer'), ctrl.rejectEstimate);
router.post('/estimates/:id/revise', verifyToken, requireRole('technician'), ctrl.reviseEstimate);

module.exports = router;
