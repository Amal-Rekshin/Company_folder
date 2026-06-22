const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/schedule.controller');

router.post('/', verifyToken, requireRole('technician'), ctrl.scheduleVisit);
router.patch('/:id/reschedule', verifyToken, requireRole('technician'), ctrl.rescheduleVisit);

module.exports = router;
