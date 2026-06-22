import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { DataTable } from '../../components/common/DataTable';
import { Badge, GlassCard } from '../../components/ui/Components';

import { LoadingPage } from '../../components/ui/Loading';

const IncomingTicketsPage = () => {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useTickets();

  if (isLoading) return <LoadingPage message="Loading incoming tickets..." />;

  const columns = [
    { header: 'Ticket #', accessor: 'ticketNumber', cell: row => <span className="font-bold text-primary-600">{row.ticketNumber}</span> },
    { header: 'Service', accessor: 'serviceType', cell: row => <span className="capitalize">{row.serviceType.replace('_', ' ')}</span> },
    { header: 'Status', accessor: 'status', cell: row => <Badge color="yellow">{row.status.replace(/_/g, ' ')}</Badge> },
    { header: 'Location', accessor: 'svcCity' },
    { header: 'Created', accessor: 'createdAt', cell: row => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Incoming Assignments</h1>
          <p className="text-slate-500 mt-1">Accept or reject service requests assigned to your company</p>
        </div>
      </div>

      <GlassCard className="!p-0">
        <DataTable 
          columns={columns} 
          data={tickets || []} 
          onRowClick={(row) => navigate(`/partner/tickets/${row.id}`)}
        />
      </GlassCard>
    </div>
  );
};

export default IncomingTicketsPage;
