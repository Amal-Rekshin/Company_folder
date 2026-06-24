import axiosInstance from './axiosInstance';

export const adminApi = {
  getUsers: (role) => axiosInstance.get('/admin/users', { params: { role } }),
  getCustomersWithAddresses: () => axiosInstance.get('/admin/customers/addresses'),
  toggleUserActive: (id) => axiosInstance.patch(`/admin/users/${id}/toggle`),
  addTechnician: (data) => axiosInstance.post('/admin/technicians', data),
  getTechnician: (id) => axiosInstance.get(`/admin/technicians/${id}`),
  updateTechnician: (id, data) => axiosInstance.put(`/admin/technicians/${id}`, data),
  createTicket: (data) => axiosInstance.post('/admin/tickets', data),
  assignTicket: (id, assigneeId) => axiosInstance.post(`/admin/tickets/${id}/assign`, { assigneeId }),
  getAvailableTechnicians: () => axiosInstance.get('/admin/technicians/available'),
  addPartner: (data) => axiosInstance.post('/admin/partners', data),
  getPartners: () => axiosInstance.get('/admin/partners'),
  getPartner: (id) => axiosInstance.get(`/admin/partners/${id}`),
  updatePartner: (id, data) => axiosInstance.put(`/admin/partners/${id}`, data),

  // Queries
  getQueries: () => axiosInstance.get('/admin/queries'),
  getQuery: (id) => axiosInstance.get(`/admin/queries/${id}`),
  qualifyQuery: (id) => axiosInstance.patch(`/admin/queries/${id}/qualify`),
  rejectQuery: (id, reason) => axiosInstance.patch(`/admin/queries/${id}/reject`, { reason }),

  // Leads
  getLeads: () => axiosInstance.get('/admin/leads'),
  getLead: (id) => axiosInstance.get(`/admin/leads/${id}`),
  createLead: (data) => axiosInstance.post('/admin/leads', data),
  assignLead: (id, assignedTo) => axiosInstance.patch(`/admin/leads/${id}/assign`, { assignedTo }),
  addLeadNote: (id, note) => axiosInstance.post(`/admin/leads/${id}/notes`, { note }),

  // Quotations
  getQuotationsByLead: (leadId) => axiosInstance.get(`/admin/quotations/lead/${leadId}`),
  getAllQuotations: () => axiosInstance.get('/admin/quotations'),
  getQuotation: (id) => axiosInstance.get(`/admin/quotations/${id}`),
  createQuotation: (leadId, data) => axiosInstance.post(`/admin/quotations/lead/${leadId}`, data),
  updateQuotation: (id, data) => axiosInstance.put(`/admin/quotations/${id}`, data),
  sendQuotation: (id) => axiosInstance.post(`/admin/quotations/${id}/send`),

  // Reports
  getDailyReport: () => axiosInstance.get('/admin/reports/daily'),
  getRevenueReport: (startDate, endDate) => axiosInstance.get('/admin/reports/revenue', { params: { startDate, endDate } }),
  getTechnicianPerformance: () => axiosInstance.get('/admin/reports/technician-performance'),
  getTicketAging: () => axiosInstance.get('/admin/reports/ticket-aging'),
  // Settlements
  getPendingSettlements: () => axiosInstance.get('/admin/settlements/pending'),
  getSettlementBatches: () => axiosInstance.get('/admin/settlements/batches'),
  createSettlementBatch: (data) => axiosInstance.post('/settlements/batch', data)
};
