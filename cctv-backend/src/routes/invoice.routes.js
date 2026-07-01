const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/invoice.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/invoices', verifyToken, ctrl.getInvoices);
router.get('/invoices/:id', verifyToken, ctrl.getInvoiceById);

// Admin updates payment status
router.patch('/invoices/:id/payment', verifyToken, requireRole('admin'), ctrl.updatePaymentStatus);

module.exports = router;
