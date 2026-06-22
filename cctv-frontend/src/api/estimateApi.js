import axiosInstance from './axiosInstance';

export const estimateApi = {
  createEstimate: (ticketId, data) => axiosInstance.post(`/tickets/${ticketId}/estimates`, data),
  getLatestEstimate: (ticketId) => axiosInstance.get(`/tickets/${ticketId}/estimates`),
  getEstimateHistory: (ticketId) => axiosInstance.get(`/tickets/${ticketId}/estimates/history`),
  submitEstimate: (id) => axiosInstance.patch(`/estimates/${id}/submit`),
  approveEstimate: (id) => axiosInstance.patch(`/estimates/${id}/approve`),
  rejectEstimate: (id, reason) => axiosInstance.patch(`/estimates/${id}/reject`, { reason }),
  reviseEstimate: (id, data) => axiosInstance.post(`/estimates/${id}/revise`, data),
};
