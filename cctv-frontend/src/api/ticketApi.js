import axiosInstance from './axiosInstance';

export const ticketApi = {
  createTicket: (data) => axiosInstance.post('/tickets', data),
  getTickets: (params) => axiosInstance.get('/tickets', { params }),
  getMyTickets: () => axiosInstance.get('/tickets/my'),
  getMyQueries: () => axiosInstance.get('/tickets/my-queries'),
  getMyAssignedTickets: () => axiosInstance.get('/tickets/my-assigned'),
  getTicketById: (id) => axiosInstance.get(`/tickets/${id}`),
  updateStatus: (id, status) => axiosInstance.patch(`/tickets/${id}/status`, { status }),
  getTicketStatusLog: (id) => axiosInstance.get(`/tickets/${id}/status-log`),
  closeTicket: (id) => axiosInstance.patch(`/tickets/${id}/close`),
  reopenTicket: (id) => axiosInstance.post(`/tickets/${id}/reopen`),
};
