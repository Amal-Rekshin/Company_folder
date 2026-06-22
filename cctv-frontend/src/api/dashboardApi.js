import axiosInstance from './axiosInstance';

export const dashboardApi = {
  getAdminDashboard: () => axiosInstance.get('/dashboard/admin'),
  getCustomerDashboard: () => axiosInstance.get('/dashboard/customer'),
  getTechnicianDashboard: () => axiosInstance.get('/dashboard/technician'),
  getPartnerDashboard: () => axiosInstance.get('/dashboard/partner'),
};

export const notificationApi = {
  getNotifications: (params) => axiosInstance.get('/notifications', { params }),
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count'),
  markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
  markAllRead: () => axiosInstance.post('/notifications/mark-all-read'),
};


