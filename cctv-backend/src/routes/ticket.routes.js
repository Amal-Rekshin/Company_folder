const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ticket.controller');

router.post('/', verifyToken, requireRole('customer'), ctrl.createTicket);
router.get('/', verifyToken, requireRole('admin'), ctrl.getAllTickets);
router.get('/my', verifyToken, requireRole('customer'), ctrl.getMyTickets);
router.get('/:id', verifyToken, ctrl.getTicketById);
router.patch('/:id/status', verifyToken, requireRole('admin', 'technician'), ctrl.updateStatus);
router.patch('/:id/close', verifyToken, requireRole('customer'), ctrl.closeTicket);
router.post('/:id/reopen', verifyToken, requireRole('customer'), ctrl.reopenTicket);
router.get('/:id/status-log', verifyToken, ctrl.getStatusLog);

module.exports = router;
