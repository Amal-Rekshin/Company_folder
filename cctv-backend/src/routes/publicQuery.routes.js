const router = require('express').Router();
const ctrl = require('../controllers/publicQuery.controller');

router.post('/queries', ctrl.submitQuery);
router.get('/quotations/:token', ctrl.getQuotationByToken);
router.patch('/quotations/:token/accept', ctrl.acceptQuotation);
router.patch('/quotations/:token/reject', ctrl.rejectQuotation);

module.exports = router;
