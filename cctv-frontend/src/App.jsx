import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import { CustomerDashboard, AdminDashboard, TechnicianDashboard, PartnerDashboard } from './pages/Dashboards';
import AppLayout from './components/layout/AppLayout';

// Customer Pages
import MyTicketsPage from './pages/customer/MyTicketsPage';
import CreateTicketPage from './pages/customer/CreateTicketPage';
import TicketDetailPage from './pages/customer/TicketDetailPage';
import PaymentPage from './pages/customer/PaymentPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

// Admin Pages
import AllTicketsPage from './pages/admin/AllTicketsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import TechnicianDetailPage from './pages/admin/TechnicianDetailPage';
import PartnerManagementPage from './pages/admin/PartnerManagementPage';
import PartnerDetailPage from './pages/admin/PartnerDetailPage';
import SettlementPage from './pages/admin/SettlementPage';

// Technician Pages
import MyJobsPage from './pages/technician/MyJobsPage';
import JobDetailPage from './pages/technician/JobDetailPage';
import ScheduleCalendarPage from './pages/technician/ScheduleCalendarPage';

// Partner Pages
import IncomingTicketsPage from './pages/partner/IncomingTicketsPage';
import EarningsPage from './pages/partner/EarningsPage';

// Public Pages
import PublicQueryPage from './pages/public/PublicQueryPage';
import QueryThankYouPage from './pages/public/QueryThankYouPage';
import QuotationViewPage from './pages/public/QuotationViewPage';

// Admin CRM Pages
import QueriesPage from './pages/admin/QueriesPage';
import LeadsPage from './pages/admin/LeadsPage';
import LeadDetailPage from './pages/admin/LeadDetailPage';
import QuotationsPage from './pages/admin/QuotationsPage';
import QuotationForm from './pages/admin/QuotationForm';
import ReportsPage from './pages/admin/ReportsPage';
import ServiceReportPage from './pages/technician/ServiceReportPage';
import PartnerTicketDetailPage from './pages/partner/PartnerTicketDetailPage';
import SettingsPage from './pages/shared/SettingsPage';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/query" element={<PublicQueryPage />} />
            <Route path="/query/thank-you" element={<QueryThankYouPage />} />
            <Route path="/quotation/:token" element={<QuotationViewPage />} />
            
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route element={<AppLayout />}>
                <Route path="/customer" element={<CustomerDashboard />} />
                <Route path="/customer/tickets" element={<MyTicketsPage />} />
                <Route path="/customer/tickets/new" element={<CreateTicketPage />} />
                <Route path="/customer/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/customer/invoices" element={<PaymentPage />} />
                <Route path="/customer/profile" element={<CustomerProfilePage />} />
                <Route path="/customer/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/tickets" element={<AllTicketsPage />} />
                <Route path="/admin/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/admin/technicians" element={<UserManagementPage />} />
                <Route path="/admin/technicians/:id" element={<TechnicianDetailPage />} />
                <Route path="/admin/partners" element={<PartnerManagementPage />} />
                <Route path="/admin/partners/:id" element={<PartnerDetailPage />} />
                <Route path="/admin/settlements" element={<SettlementPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                
                {/* CRM Routes */}
                <Route path="/admin/queries" element={<QueriesPage />} />
                <Route path="/admin/leads" element={<LeadsPage />} />
                <Route path="/admin/leads/:id" element={<LeadDetailPage />} />
                <Route path="/admin/leads/:id/create-quotation" element={<QuotationForm />} />
                <Route path="/admin/leads/:id/edit-quotation/:quotationId" element={<QuotationForm />} />
                <Route path="/admin/quotations" element={<QuotationsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
              <Route element={<AppLayout />}>
                <Route path="/technician" element={<MyJobsPage />} />
                <Route path="/technician/jobs/:id" element={<JobDetailPage />} />
                <Route path="/technician/jobs/:id/report" element={<ServiceReportPage />} />
                <Route path="/technician/schedule" element={<ScheduleCalendarPage />} />
                <Route path="/technician/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
              <Route element={<AppLayout />}>
                <Route path="/partner" element={<IncomingTicketsPage />} />
                <Route path="/partner/tickets/:id" element={<PartnerTicketDetailPage />} />
                <Route path="/partner/earnings" element={<EarningsPage />} />
                <Route path="/partner/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
