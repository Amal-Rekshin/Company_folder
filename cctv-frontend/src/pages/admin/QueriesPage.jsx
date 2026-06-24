import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button } from '../../components/ui/Components';
import { Loading } from '../../components/ui/Loading';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  received:           { label: 'Received',         color: 'bg-amber-100 text-amber-800 border-amber-200',   dot: 'bg-amber-500' },
  converted_to_lead:  { label: 'Converted → Lead', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  rejected:           { label: 'Rejected',         color: 'bg-rose-100 text-rose-800 border-rose-200',     dot: 'bg-rose-500' },
};

const ISSUE_LABELS = {
  complaint:          'Complaint',
  installation:       'Installation',
  amc_support:        'AMC Support',
  device_replacement: 'Device Replacement',
  general:            'General',
};

const SOURCE_ICONS = {
  website:   '🌐',
  whatsapp:  '💬',
  phone:     '📞',
  walk_in:   '🚶',
  referral:  '🤝',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, color = 'text-slate-800' }) {
  return (
    <GlassCard className="!p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </GlassCard>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────

function QueryDrawer({ query, onClose, onQualify, onReject, isQualifying, isRejecting }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!query) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-blue-50">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest">Query Detail</p>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">{query.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/60 text-slate-500 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Status + Source */}
          <div className="flex items-center justify-between">
            <StatusBadge status={query.status} />
            <span className="text-sm text-slate-500">
              {SOURCE_ICONS[query.source] || '📋'} {query.source?.replace('_', ' ')}
            </span>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-sm font-medium text-slate-800">{query.phone}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm font-medium text-slate-800">{query.email || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">City</p>
              <p className="text-sm font-medium text-slate-800">{query.city}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pincode</p>
              <p className="text-sm font-medium text-slate-800">{query.pincode || '—'}</p>
            </div>
          </div>

          {/* Issue Type */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Issue Type</p>
            <p className="text-sm font-semibold text-blue-900">{ISSUE_LABELS[query.issue_type] || query.issue_type}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">
              {query.description}
            </p>
          </div>

          {/* Submitted */}
          <div className="text-right">
            <p className="text-xs text-slate-400">
              Submitted {new Date(query.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          {/* Rejection reason (if rejected) */}
          {query.rejection_reason && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-sm text-rose-800">{query.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {query.status === 'received' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-3">
            {!showRejectInput ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => onQualify(query.id)}
                  disabled={isQualifying}
                >
                  {isQualifying ? 'Converting…' : '✅ Qualify → Lead'}
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => setShowRejectInput(true)}
                >
                  ✕ Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 outline-none resize-none"
                  rows={3}
                  placeholder="Reason for rejection (optional)…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowRejectInput(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => onReject(query.id, rejectReason)}
                    disabled={isRejecting}
                  >
                    {isRejecting ? 'Rejecting…' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const QueriesPage = () => {
  const queryClient = useQueryClient();
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ['adminQueries'],
    queryFn: () => adminApi.getQueries().then(res => res.data),
    refetchInterval: 30000,
  });

  const qualifyMutation = useMutation({
    mutationFn: (id) => adminApi.qualifyQuery(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminQueries']);
      setSelectedQuery(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectQuery(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminQueries']);
      setSelectedQuery(null);
    },
  });

  // Stats
  const stats = useMemo(() => ({
    total:     queries.length,
    received:  queries.filter(q => q.status === 'received').length,
    converted: queries.filter(q => q.status === 'converted_to_lead').length,
    rejected:  queries.filter(q => q.status === 'rejected').length,
  }), [queries]);

  // Filtered list
  const filtered = useMemo(() => queries.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchIssue  = issueFilter === 'all' || q.issue_type === issueFilter;
    const matchSearch = !search ||
      q.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.phone?.includes(search) ||
      q.email?.toLowerCase().includes(search.toLowerCase()) ||
      q.city?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchIssue && matchSearch;
  }), [queries, statusFilter, issueFilter, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Public Queries</h1>
          <p className="text-sm text-slate-500 mt-0.5">Incoming customer enquiries — qualify to convert into a Lead</p>
        </div>
        </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Queries"    value={stats.total}     color="text-slate-800" />
        <StatCard label="Pending Review"   value={stats.received}  color="text-amber-600" />
        <StatCard label="Converted Leads"  value={stats.converted} color="text-emerald-600" />
        <StatCard label="Rejected"         value={stats.rejected}  color="text-rose-600" />
      </div>

      {/* Filters + Search */}
      <GlassCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, phone, email, city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="received">Received</option>
            <option value="converted_to_lead">Converted</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Issue Filter */}
          <select
            value={issueFilter}
            onChange={e => setIssueFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none"
          >
            <option value="all">All Issue Types</option>
            {Object.entries(ISSUE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {(statusFilter !== 'all' || issueFilter !== 'all' || search) && (
            <button
              onClick={() => { setStatusFilter('all'); setIssueFilter('all'); setSearch(''); }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      {isLoading ? (
        <Loading message="Loading queries..." />
      ) : filtered.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-600 font-medium">No queries match your filters</p>
          <p className="text-slate-400 text-sm mt-1">Try clearing the search or changing filters</p>
        </GlassCard>
      ) : (
        <GlassCard className="!p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                {['Name & Contact', 'Location', 'Issue Type', 'Source', 'Submitted', 'Status', 'Actions'].map(h => (
                  <th key={h} className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(q => (
                <tr
                  key={q.id}
                  className="hover:bg-primary-50/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedQuery(q)}
                >
                  {/* Name & Contact */}
                  <td className="py-4 px-5">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">
                      {q.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{q.phone}</p>
                    {q.email && <p className="text-xs text-slate-400">{q.email}</p>}
                  </td>

                  {/* Location */}
                  <td className="py-4 px-5">
                    <p className="text-sm text-slate-700">{q.city}</p>
                    {q.state && <p className="text-xs text-slate-400">{q.state}</p>}
                  </td>

                  {/* Issue Type */}
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                      {ISSUE_LABELS[q.issue_type] || q.issue_type}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="py-4 px-5">
                    <span className="text-sm text-slate-600">
                      {SOURCE_ICONS[q.source] || '📋'} {q.source?.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Submitted */}
                  <td className="py-4 px-5 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <br />
                    {new Date(q.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">
                    <StatusBadge status={q.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5" onClick={e => e.stopPropagation()}>
                    {q.status === 'received' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => qualifyMutation.mutate(q.id)}
                          disabled={qualifyMutation.isPending}
                        >
                          Qualify
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setSelectedQuery(q)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-primary-600 hover:underline font-medium"
                        onClick={() => setSelectedQuery(q)}
                      >
                        View →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer count */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">
              Showing <strong className="text-slate-600">{filtered.length}</strong> of{' '}
              <strong className="text-slate-600">{queries.length}</strong> queries
            </p>
          </div>
        </GlassCard>
      )}

      {/* Detail Drawer */}
      <QueryDrawer
        query={selectedQuery}
        onClose={() => setSelectedQuery(null)}
        onQualify={(id) => qualifyMutation.mutate(id)}
        onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
        isQualifying={qualifyMutation.isPending}
        isRejecting={rejectMutation.isPending}
      />
    </div>
  );
};

export default QueriesPage;
