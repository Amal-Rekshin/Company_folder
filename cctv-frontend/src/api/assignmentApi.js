import axiosInstance from './axiosInstance';

export const assignmentApi = {
  assignTechnician: (ticketId, data) => axiosInstance.post(`/tickets/${ticketId}/assign/technician`, data),
  assignPartner: (ticketId, data) => axiosInstance.post(`/tickets/${ticketId}/assign/partner`, data),
  techAcceptJob: (id) => axiosInstance.patch(`/technician-assignments/${id}/accept`),
  techRejectJob: (id, reason) => axiosInstance.patch(`/technician-assignments/${id}/reject`, { reason }),
  partnerAcceptJob: (id) => axiosInstance.patch(`/partner-assignments/${id}/accept`),
  partnerRejectJob: (id, reason) => axiosInstance.patch(`/partner-assignments/${id}/reject`, { reason }),
  partnerAssignTech: (id, data) => axiosInstance.post(`/partner-assignments/${id}/assign-technician`, data),
  getPartnerAssignmentByTicket: (ticketId) => axiosInstance.get(`/partner-assignments/by-ticket/${ticketId}`),
  getTechnicianAssignmentByTicket: (ticketId) => axiosInstance.get(`/technician-assignments/by-ticket/${ticketId}`),
};
