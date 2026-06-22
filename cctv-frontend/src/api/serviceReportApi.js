import axiosInstance from './axiosInstance';

export const serviceReportApi = {
  createReport: (ticketId, data) => axiosInstance.post(`/tickets/${ticketId}/report`, data),
  getReport: (ticketId) => axiosInstance.get(`/tickets/${ticketId}/report`),
  addImage: (reportId, data) => axiosInstance.post(`/reports/${reportId}/images`, data),
};
