import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';

export const useDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: async () => {
      switch (user?.role) {
        case 'admin':
          return (await dashboardApi.getAdminDashboard()).data;
        case 'customer':
          return (await dashboardApi.getCustomerDashboard()).data;
        case 'technician':
          return (await dashboardApi.getTechnicianDashboard()).data;
        case 'partner':
          return (await dashboardApi.getPartnerDashboard()).data;
        default:
          return null;
      }
    },
    enabled: !!user,
  });
};
