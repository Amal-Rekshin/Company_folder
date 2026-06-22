const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/serviceReport.controller');

router.post('/tickets/:id/report', verifyToken, requireRole('technician'), ctrl.createReport);
router.get('/tickets/:id/report', verifyToken, ctrl.getReport);
router.post('/reports/:id/images', verifyToken, requireRole('technician'), ctrl.addImage);

module.exports = router;
