const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// GET /api/notifications
async function getNotifications(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const size = Math.min(parseInt(req.query.size, 10) || 20, 100);
    const offset = page * size;
    const isAdmin = req.user.role === 'admin';

    let result, total;
    if (isAdmin) {
      result = await query(
        `SELECT n.*, u.name AS user_name, u.email AS user_email
         FROM notifications n
         LEFT JOIN users u ON u.id = n.user_id
         ORDER BY n.created_at DESC LIMIT $1 OFFSET $2`,
        [size, offset]
      );
      total = await query('SELECT COUNT(*) FROM notifications');
    } else {
      result = await query(
        `SELECT * FROM notifications WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, size, offset]
      );
      total = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [req.user.id]);
    }

    return res.json({
      content: result.rows,
      totalElements: parseInt(total.rows[0].count, 10),
      page,
      size,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications/unread-count
async function getUnreadCount(req, res, next) {
  try {
    const isAdmin = req.user.role === 'admin';
    const queryStr = isAdmin 
      ? 'SELECT COUNT(*) FROM notifications WHERE is_read = false'
      : 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false';
    const params = isAdmin ? [] : [req.user.id];
    const result = await query(queryStr, params);
    return res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
async function markAsRead(req, res, next) {
  try {
    const notifResult = await query(
      'SELECT * FROM notifications WHERE id = $1', [req.params.id]
    );
    if (notifResult.rows.length === 0) throw new AppError('Notification not found', 404);
    const notif = notifResult.rows[0];
    if (notif.user_id !== req.user.id && req.user.role !== 'admin')
      throw new AppError("Cannot mark another user's notification as read", 403);

    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]
    );
    return res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/mark-all-read
async function markAllAsRead(req, res, next) {
  try {
    const isAdmin = req.user.role === 'admin';
    if (isAdmin) {
      await query('UPDATE notifications SET is_read = true');
    } else {
      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]
      );
    }
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
