import React from 'react';
import { Badge } from '../ui/Components';
import { Clock, Calendar, MapPin, Wrench } from 'lucide-react';

export const TicketCard = ({ ticket, onClick }) => {
  const getStatusColor = (status) => {
    if (status === 'closed' || status === 'completed') return 'green';
    if (status === 'new') return 'slate';
    if (status.includes('assigned') || status.includes('pending')) return 'yellow';
    return 'blue';
  };

  return (
    <div 
      onClick={onClick}
      className="glass-card flex flex-col p-5 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
            {ticket.ticketNumber}
          </h3>
          <span className="text-sm font-medium text-slate-500 capitalize">{ticket.serviceType.replace('_', ' ')}</span>
        </div>
        <Badge color={getStatusColor(ticket.status)}>
          {ticket.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
        {ticket.issueDescription}
      </p>

      <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(ticket.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {ticket.svcCity}
        </div>
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5" />
          {ticket.priority}
        </div>
      </div>
    </div>
  );
};
