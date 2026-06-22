import axiosInstance from './axiosInstance';

export const feedbackApi = {
  submitFeedback: (ticketId, data) => axiosInstance.post(`/tickets/${ticketId}/feedback`, data),
  getFeedback: (ticketId) => axiosInstance.get(`/tickets/${ticketId}/feedback`),
};
