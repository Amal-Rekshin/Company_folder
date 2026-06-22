const router = require('express').Router();
const { verifyToken, requireRole } = require('../../middleware/auth');
const ctrl = require('../../controllers/admin/adminLead.controller');

const admin = [verifyToken, requireRole('admin')];

router.get('/', ...admin, ctrl.getAllLeads);
router.get('/:id', ...admin, ctrl.getLead);
router.patch('/:id/assign', ...admin, ctrl.assignLead);
router.post('/:id/notes', ...admin, ctrl.addNote);

module.exports = router;
