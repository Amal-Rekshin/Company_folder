import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { TicketCard } from '../../components/tickets/TicketCard';
import { GlassCard } from '../../components/ui/Components';

import { LoadingPage } from '../../components/ui/Loading';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useTickets();

  if (isLoading) return <LoadingPage message="Loading your tickets..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Tickets</h1>
          <p className="text-slate-500 mt-1">Track and manage your service requests</p>
        </div>
        <button 
          onClick={() => navigate('/customer/tickets/new')}
          className="btn-primary"
        >
          Raise New Ticket
        </button>
      </div>

      {!tickets?.length ? (
        <GlassCard className="text-center py-16">
          <p className="text-slate-500 mb-4">You don't have any active service requests.</p>
          <button onClick={() => navigate('/customer/tickets/new')} className="btn-secondary">Create your first ticket</button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onClick={() => navigate(`/customer/tickets/${ticket.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
