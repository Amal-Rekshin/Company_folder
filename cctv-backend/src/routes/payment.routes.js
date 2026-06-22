const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/payment.controller');

router.post('/tickets/payment', verifyToken, requireRole('customer'), ctrl.recordPayment);
router.get('/payments/my', verifyToken, requireRole('customer'), ctrl.getMyPayments);
router.get('/admin/payments', verifyToken, requireRole('admin'), ctrl.getAllPayments);

module.exports = router;
