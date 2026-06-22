import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Badge } from '../../components/ui/Components';
import { Loading } from '../../components/ui/Loading';

const SettlementPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPayments, setSelectedPayments] = useState(new Set());

  // Fetch pending payments
  const { data: pendingPayments = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['pendingSettlements'],
    queryFn: async () => {
      const res = await adminApi.getPendingSettlements();
      return res.data;
    }
  });

  // Fetch settlement batches history
  const { data: batches = [], isLoading: isLoadingBatches } = useQuery({
    queryKey: ['settlementBatches'],
    queryFn: async () => {
      const res = await adminApi.getSettlementBatches();
      return res.data;
    }
  });

  // Mutation to create a batch
  const createBatchMutation = useMutation({
    mutationFn: adminApi.createSettlementBatch,
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSettlements']);
      queryClient.invalidateQueries(['settlementBatches']);
      setSelectedPayments(new Set());
    }
  });

  // Group pending payments by partner
  const groupedPending = useMemo(() => {
    const groups = {};
    pendingPayments.forEach(p => {
      if (!groups[p.partner_id]) {
        groups[p.partner_id] = {
          partnerId: p.partner_id,
          partnerName: p.partner_name,
          payments: [],
          totalGross: 0,
          totalCommission: 0,
          totalNet: 0
        };
      }
      const gross = parseFloat(p.gross_amount) || 0;
      const commission = parseFloat(p.commission_amount) || 0;
      const net = gross - commission;

      groups[p.partner_id].payments.push({ ...p, net });
      groups[p.partner_id].totalGross += gross;
      groups[p.partner_id].totalCommission += commission;
      groups[p.partner_id].totalNet += net;
    });
    return Object.values(groups);
  }, [pendingPayments]);

  const toggleSelection = (paymentId) => {
    const newSet = new Set(selectedPayments);
    if (newSet.has(paymentId)) {
      newSet.delete(paymentId);
    } else {
      newSet.add(paymentId);
    }
    setSelectedPayments(newSet);
  };

  const handleCreateBatch = (partnerGroup) => {
    // Get selected payments for this partner
    const paymentsToSettle = partnerGroup.payments.filter(p => selectedPayments.has(p.id));
    if (paymentsToSettle.length === 0) return;

    const paymentIds = paymentsToSettle.map(p => p.id);
    // Simple period calculation: min date to max date of selected payments
    const dates = paymentsToSettle.map(p => new Date(p.paid_at).getTime());
    const periodStart = new Date(Math.min(...dates)).toISOString();
    const periodEnd = new Date(Math.max(...dates)).toISOString();

    createBatchMutation.mutate({
      partnerId: partnerGroup.partnerId,
      paymentIds,
      periodStart,
      periodEnd
    });
  };

  const selectAllPartnerPayments = (partnerId, payments) => {
    const newSet = new Set(selectedPayments);
    const allSelected = payments.every(p => newSet.has(p.id));
    
    payments.forEach(p => {
      if (allSelected) newSet.delete(p.id);
      else newSet.add(p.id);
    });
    
    setSelectedPayments(newSet);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Settlements</h1>
          <p className="text-slate-500 mt-1">Process partner payouts and view settlement history</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'pending' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Payouts
          {pendingPayments.length > 0 && (
            <span className="ml-2 bg-rose-100 text-rose-600 py-0.5 px-2 rounded-full text-xs">
              {pendingPayments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Settlement History
        </button>
      </div>

      {/* Pending Payouts Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {isLoadingPending ? (
            <Loading message="Loading pending settlements..." />
          ) : groupedPending.length === 0 ? (
            <GlassCard className="py-12 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-slate-400 text-sm mt-1">No pending payouts for any partners.</p>
            </GlassCard>
          ) : (
            groupedPending.map((group) => {
              const selectedCount = group.payments.filter(p => selectedPayments.has(p.id)).length;
              const selectedNet = group.payments
                .filter(p => selectedPayments.has(p.id))
                .reduce((sum, p) => sum + p.net, 0);

              return (
                <GlassCard key={group.partnerId} className="!p-0 overflow-hidden border border-slate-200 shadow-sm">
                  {/* Header */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{group.partnerName}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {group.payments.length} pending payments • Total Net: ₹{group.totalNet.toFixed(2)}
                      </p>
                    </div>
                    {selectedCount > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">₹{selectedNet.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{selectedCount} selected</p>
                        </div>
                        <Button 
                          onClick={() => handleCreateBatch(group)}
                          disabled={createBatchMutation.isPending}
                        >
                          {createBatchMutation.isPending ? 'Processing...' : 'Settle Selected'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-6 w-12">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                              checked={selectedCount === group.payments.length && group.payments.length > 0}
                              onChange={() => selectAllPartnerPayments(group.partnerId, group.payments)}
                            />
                          </th>
                          <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                          <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Paid At</th>
                          <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Gross</th>
                          <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Commission</th>
                          <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Net Payout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-6">
                              <input 
                                type="checkbox"
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                checked={selectedPayments.has(p.id)}
                                onChange={() => toggleSelection(p.id)}
                              />
                            </td>
                            <td className="py-3 px-6">
                              <span className="font-medium text-slate-700">{p.ticket_number}</span>
                            </td>
                            <td className="py-3 px-6 text-sm text-slate-500">
                              {new Date(p.paid_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-6 text-sm text-slate-700 text-right">
                              ₹{parseFloat(p.gross_amount).toFixed(2)}
                            </td>
                            <td className="py-3 px-6 text-sm text-amber-600 text-right">
                              - ₹{parseFloat(p.commission_amount).toFixed(2)}
                            </td>
                            <td className="py-3 px-6 text-sm font-semibold text-emerald-600 text-right">
                              ₹{p.net.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <GlassCard className="!p-0 overflow-x-auto">
          {isLoadingBatches ? (
            <Loading message="Loading history..." />
          ) : batches.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No settlement batches processed yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Batch ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Partner</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Period</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Total Payout</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Processed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-700">{b.id.substring(0, 8)}...</td>
                    <td className="py-4 px-6 text-sm text-slate-700 font-semibold">{b.partner_name}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(b.period_start).toLocaleDateString()} - {new Date(b.period_end).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-emerald-600">₹{parseFloat(b.total_amount).toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <Badge color={b.status === 'paid' ? 'green' : 'yellow'}>{b.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      )}

    </div>
  );
};

export default SettlementPage;
