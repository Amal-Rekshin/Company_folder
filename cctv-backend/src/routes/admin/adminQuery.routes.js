const router = require('express').Router();
const { verifyToken, requireRole } = require('../../middleware/auth');
const ctrl = require('../../controllers/admin/adminQuery.controller');

const admin = [verifyToken, requireRole('admin')];

router.get('/', ...admin, ctrl.getAllQueries);
router.get('/:id', ...admin, ctrl.getQuery);
router.patch('/:id/qualify', ...admin, ctrl.qualifyQuery);
router.patch('/:id/reject', ...admin, ctrl.rejectQuery);

module.exports = router;
