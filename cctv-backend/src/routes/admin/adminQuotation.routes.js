const router = require('express').Router();
const { verifyToken, requireRole } = require('../../middleware/auth');
const ctrl = require('../../controllers/admin/adminQuotation.controller');

const admin = [verifyToken, requireRole('admin')];

router.get('/', ...admin, ctrl.getAllQuotations);
router.get('/lead/:leadId', ...admin, ctrl.getQuotationsByLead);
router.get('/:id', ...admin, ctrl.getQuotation);
router.post('/lead/:leadId', ...admin, ctrl.createQuotation);
router.post('/:id/send', ...admin, ctrl.sendQuotation);

module.exports = router;
