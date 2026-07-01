const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ticket.controller');

router.post('/', verifyToken, requireRole('customer'), ctrl.createTicket);
router.get('/', verifyToken, requireRole('admin'), ctrl.getAllTickets);
router.get('/my', verifyToken, requireRole('customer'), ctrl.getMyTickets);
router.get('/my-queries', verifyToken, requireRole('customer'), ctrl.getMyQueries);
router.get('/my-assigned', verifyToken, requireRole('partner', 'technician'), ctrl.getMyAssignedTickets);
router.get('/:id', verifyToken, ctrl.getTicketById);
router.patch('/:id/status', verifyToken, requireRole('admin', 'technician', 'partner'), ctrl.updateStatus);
router.patch('/:id/close', verifyToken, requireRole('customer'), ctrl.closeTicket);
router.post('/:id/reopen', verifyToken, requireRole('customer'), ctrl.reopenTicket);
router.get('/:id/status-log', verifyToken, ctrl.getStatusLog);

// Material Requests
const mrCtrl = require('../controllers/materialRequest.controller');
router.post('/:id/material-requests', verifyToken, requireRole('technician'), mrCtrl.createMaterialRequest);
router.get('/:id/material-requests', verifyToken, mrCtrl.getMaterialRequestsForTicket);

module.exports = router;
