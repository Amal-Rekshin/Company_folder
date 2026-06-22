require('dotenv').config();
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const estimateRoutes = require('./routes/estimate.routes');
const paymentRoutes = require('./routes/payment.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const serviceReportRoutes = require('./routes/serviceReport.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const publicQueryRoutes = require('./routes/publicQuery.routes');
const settlementRoutes = require('./routes/settlement.routes');

// Admin routes
const adminRoutes = require('./routes/admin/admin.routes');
const adminLeadRoutes = require('./routes/admin/adminLead.routes');
const adminQueryRoutes = require('./routes/admin/adminQuery.routes');
const adminQuotationRoutes = require('./routes/admin/adminQuotation.routes');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'cctv-platform-api' }));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', estimateRoutes);
app.use('/api', paymentRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api', serviceReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicQueryRoutes);
app.use('/api', settlementRoutes);

// Admin routes (prefixed at /api/admin/*)
app.use('/api/admin', adminRoutes);
app.use('/api/admin/leads', adminLeadRoutes);
app.use('/api/admin/queries', adminQueryRoutes);
app.use('/api/admin/quotations', adminQuotationRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

const initializeDatabase = require('./config/initDb');

// ─── Start Server ──────────────────────────────────────────────────────────────
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('=======================================================');
    console.log(`  CCTV Platform API running on http://localhost:${PORT}`);
    console.log('=======================================================');
    console.log(`  Health: GET http://localhost:${PORT}/health`);
    console.log(`  Auth:   POST http://localhost:${PORT}/api/auth/login`);
    console.log('=======================================================');
  });
}).catch(err => {
  console.error('Failed to initialize database on startup:', err);
  process.exit(1);
});

module.exports = app;
