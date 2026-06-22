const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/feedback.controller');

router.post('/tickets/:id/feedback', verifyToken, requireRole('customer'), ctrl.submitFeedback);
router.get('/tickets/:id/feedback', verifyToken, ctrl.getFeedback);

module.exports = router;
