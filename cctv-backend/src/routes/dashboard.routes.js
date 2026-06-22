const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/dashboard.controller');

router.get('/admin', verifyToken, requireRole('admin'), ctrl.getAdminDashboard);
router.get('/customer', verifyToken, requireRole('customer'), ctrl.getCustomerDashboard);
router.get('/technician', verifyToken, requireRole('technician'), ctrl.getTechnicianDashboard);
router.get('/partner', verifyToken, requireRole('partner'), ctrl.getPartnerDashboard);

module.exports = router;
