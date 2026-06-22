import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { DataTable } from '../../components/common/DataTable';
import { Badge, GlassCard } from '../../components/ui/Components';

import { LoadingPage } from '../../components/ui/Loading';

const MyJobsPage = () => {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useTickets();

  if (isLoading) return <LoadingPage message="Loading your jobs..." />;

  const columns = [
    { header: 'Ticket #', accessor: 'ticketNumber', cell: row => <span className="font-bold text-primary-600">{row.ticketNumber}</span> },
    { header: 'Service', accessor: 'serviceType', cell: row => <span className="capitalize">{row.serviceType.replace('_', ' ')}</span> },
    { header: 'Priority', accessor: 'priority', cell: row => <span className="capitalize">{row.priority}</span> },
    { header: 'Status', accessor: 'status', cell: row => <Badge color="blue">{row.status.replace(/_/g, ' ')}</Badge> },
    { header: 'City', accessor: 'svcCity' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Assigned Jobs</h1>
          <p className="text-slate-500 mt-1">Review and manage your field visits</p>
        </div>
      </div>

      <GlassCard className="!p-0">
        <DataTable 
          columns={columns} 
          data={tickets || []} 
          onRowClick={(row) => navigate(`/technician/jobs/${row.id}`)}
        />
      </GlassCard>
    </div>
  );
};

export default MyJobsPage;
