import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';

import { LoadingPage } from '../../components/ui/Loading';

const QuotationsPage = () => {
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['adminQuotations'],
    queryFn: () => adminApi.getAllQuotations().then(res => res.data)
  });

  const columns = [
    { header: 'Quotation ID', accessor: 'id', cell: (row) => row.id.substring(0, 8) },
    { header: 'Valid Until', accessor: 'validUntil' },
    { header: 'Total', cell: (row) => row.totalAmount ? `₹${row.totalAmount}` : '-' },
    { header: 'Status', cell: (row) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        row.status === 'draft' ? 'bg-slate-100 text-slate-800' :
        row.status === 'sent' ? 'bg-blue-100 text-blue-800' :
        row.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.status.toUpperCase()}
      </span>
    )}
  ];

  if (isLoading) return <LoadingPage message="Loading quotations..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">All Quotations</h1>
      <GlassCard>
        <DataTable columns={columns} data={quotations} />
      </GlassCard>
    </div>
  );
};

export default QuotationsPage;
