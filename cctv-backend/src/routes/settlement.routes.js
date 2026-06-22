const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/settlement.controller');

router.post('/settlements/batch', verifyToken, requireRole('admin'), ctrl.createBatch);
router.get('/settlements/partner/my', verifyToken, requireRole('partner'), ctrl.getMyBatches);
router.get('/admin/settlements/batches', verifyToken, requireRole('admin'), ctrl.getAllBatches);
router.get('/admin/settlements/pending', verifyToken, requireRole('admin'), ctrl.getPendingPayments);

module.exports = router;
