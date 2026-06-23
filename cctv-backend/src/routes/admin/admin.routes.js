const router = require('express').Router();
const { verifyToken, requireRole } = require('../../middleware/auth');
const ctrl = require('../../controllers/admin/admin.controller');

const admin = [verifyToken, requireRole('admin')];
const adminOrPartner = [verifyToken, requireRole('admin', 'partner')];

router.get('/users', ...admin, ctrl.getUsers);
router.get('/customers/addresses', ...admin, ctrl.getCustomersWithAddresses);
router.patch('/users/:id/toggle', ...admin, ctrl.toggleActive);
router.post('/technicians', ...admin, ctrl.addTechnician);
router.get('/technicians/available', ...adminOrPartner, ctrl.getAvailableTechnicians);
router.get('/technicians/:id', ...admin, ctrl.getTechnicianDetails);
router.put('/technicians/:id', ...admin, ctrl.updateTechnician);
router.post('/partners', ...admin, ctrl.addPartner);
router.get('/partners', ...admin, ctrl.getPartners);
router.get('/partners/:id', ...admin, ctrl.getPartnerDetails);
router.put('/partners/:id', ...admin, ctrl.updatePartner);
router.post('/tickets', ...admin, ctrl.createTicket);
router.post('/tickets/:id/assign', ...admin, ctrl.assignTicket);
router.get('/reports/daily', ...admin, ctrl.getDailyReport);
router.get('/reports/revenue', ...admin, ctrl.getRevenueReport);
router.get('/reports/technician-performance', ...admin, ctrl.getTechnicianPerformance);
router.get('/reports/partner-performance', ...admin, ctrl.getPartnerPerformance);
router.get('/reports/ticket-aging', ...admin, ctrl.getTicketAging);

module.exports = router;
