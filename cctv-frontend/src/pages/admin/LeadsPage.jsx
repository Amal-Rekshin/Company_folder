import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';

import { LoadingPage } from '../../components/ui/Loading';

const LeadsPage = () => {
  const navigate = useNavigate();
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['adminLeads'],
    queryFn: () => adminApi.getLeads().then(res => res.data)
  });

  const columns = [
    { header: 'Lead ID', accessor: 'id', cell: (row) => row.id.substring(0, 8) },
    { header: 'Customer', cell: (row) => row.query?.name },
    { header: 'Phone', cell: (row) => row.query?.phone },
    {
      header: 'Status', cell: (row) => (
        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">
          {row.status.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Actions', cell: (row) => (
        <Button size="sm" onClick={() => navigate(`/admin/leads/${row.id}`)}>View Details</Button>
      )
    }
  ];

  if (isLoading) return <LoadingPage message="Loading leads..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Sales Leads</h1>
      <GlassCard>
        <DataTable columns={columns} data={leads} />
      </GlassCard>
    </div>
  );
};

export default LeadsPage;
