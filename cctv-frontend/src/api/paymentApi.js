import axiosInstance from './axiosInstance';

export const paymentApi = {
  getMyPayments: () => axiosInstance.get('/payments/my'),
  recordPayment: (data) => axiosInstance.post('/tickets/payment', data)
};
