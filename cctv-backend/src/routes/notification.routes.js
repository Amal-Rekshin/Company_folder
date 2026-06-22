const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

router.get('/', verifyToken, ctrl.getNotifications);
router.get('/unread-count', verifyToken, ctrl.getUnreadCount);
router.patch('/:id/read', verifyToken, ctrl.markAsRead);
router.post('/mark-all-read', verifyToken, ctrl.markAllAsRead);

module.exports = router;
