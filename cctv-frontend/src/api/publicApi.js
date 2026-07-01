import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const publicAxios = axios.create({
  baseURL: `${API_BASE_URL}/public`
});

export const publicApi = {
  submitQuery: (data) => publicAxios.post('/queries', data),
  getQuotation: (token) => publicAxios.get(`/quotations/${token}`),
  acceptQuotation: (token) => publicAxios.patch(`/quotations/${token}/accept`),
  rejectQuotation: (token, reason) => publicAxios.patch(`/quotations/${token}/reject`, { reason }),
  getIssueCategories: () => publicAxios.get('/issue-categories')
};
