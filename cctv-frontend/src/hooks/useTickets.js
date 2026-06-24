import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/ticketApi';
import { useAuth } from '../context/AuthContext';

export const useTickets = (params = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tickets', user?.role, params],
    queryFn: async () => {
      if (user?.role === 'customer') {
        const { data } = await ticketApi.getMyTickets();
        return data.content !== undefined ? data.content : data;
      }
      if (user?.role === 'partner' || user?.role === 'technician') {
        const { data } = await ticketApi.getMyAssignedTickets();
        return Array.isArray(data) ? data : (data.content ?? []);
      }
      const { data } = await ticketApi.getTickets(params);
      return data.content !== undefined ? data.content : data;
    },
    enabled: !!user,
  });
};

export const useMyQueries = () => {
  return useQuery({
    queryKey: ['queries', 'my'],
    queryFn: () => ticketApi.getMyQueries().then(res => res.data)
  });
};

export const useTicketDetails = (id) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ticket', id, user?.role],
    queryFn: async () => {
      const { data } = await ticketApi.getTicketById(id);
      return data;
    },
    enabled: !!id && !!user,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ticketApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets', user?.role]);
    },
  });
};
