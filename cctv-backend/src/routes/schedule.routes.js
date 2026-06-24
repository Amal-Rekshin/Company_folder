const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/schedule.controller');

router.get('/my', verifyToken, requireRole('technician'), ctrl.getMySchedules);
router.post('/', verifyToken, requireRole('technician'), ctrl.scheduleVisit);
router.patch('/:id/reschedule', verifyToken, requireRole('technician'), ctrl.rescheduleVisit);

module.exports = router;
