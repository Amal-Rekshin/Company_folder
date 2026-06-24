import axiosInstance from './axiosInstance';

export const scheduleApi = {
  scheduleVisit: (data) => axiosInstance.post('/schedules', data),
  rescheduleVisit: (id, data) => axiosInstance.patch(`/schedules/${id}/reschedule`, data),
  getMySchedules: () => axiosInstance.get('/schedules/my'),
};
