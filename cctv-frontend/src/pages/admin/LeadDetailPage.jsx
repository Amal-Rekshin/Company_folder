import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';

import { LoadingPage } from '../../components/ui/Loading';

const LeadDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ['adminLead', id],
    queryFn: () => adminApi.getLead(id).then(res => res.data)
  });

  const { data: quotations = [], isLoading: quotsLoading } = useQuery({
    queryKey: ['adminLeadQuotations', id],
    queryFn: () => adminApi.getQuotationsByLead(id).then(res => res.data)
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers('admin').then(res => res.data)
  });

  const addNoteMutation = useMutation({
    mutationFn: () => adminApi.addLeadNote(id, noteText),
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries(['adminLead', id]);
    }
  });

  const sendQuotationMutation = useMutation({
    mutationFn: (quotationId) => adminApi.sendQuotation(quotationId),
    onSuccess: () => queryClient.invalidateQueries(['adminLeadQuotations', id])
  });

  const assignLeadMutation = useMutation({
    mutationFn: () => adminApi.assignLead(id, selectedAssignee),
    onSuccess: () => {
      setSelectedAssignee('');
      queryClient.invalidateQueries(['adminLead', id]);
    }
  });

  if (leadLoading || quotsLoading) return <LoadingPage message="Loading lead details..." />;

  const quotColumns = [
    { header: 'Version', accessor: 'version' },
    { header: 'Valid Until', cell: (row) => row.validUntil ? new Date(row.validUntil).toLocaleDateString() : (row.valid_until ? new Date(row.valid_until).toLocaleDateString() : '-') },
    { header: 'Total Amount', cell: (row) => row.totalAmount ? `₹${row.totalAmount}` : '-' },
    { header: 'Status', cell: (row) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        row.status === 'draft' ? 'bg-slate-100 text-slate-800' :
        row.status === 'sent' ? 'bg-blue-100 text-blue-800' :
        row.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.status.toUpperCase()}
      </span>
    )},
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        {row.status === 'draft' && (
          <>
            <Link to={`/admin/leads/${id}/edit-quotation/${row.id}`}>
              <Button size="sm" variant="secondary">Edit</Button>
            </Link>
            <Button size="sm" onClick={() => sendQuotationMutation.mutate(row.id)} disabled={sendQuotationMutation.isPending}>Send to Customer</Button>
          </>
        )}
        {row.status === 'sent' && (
          <span className="text-xs text-blue-600 font-bold">Link: /quotation/{row.acceptToken}</span>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Lead Details</h1>
        <Link to={`/admin/leads/${id}/create-quotation`}>
          <Button>Create Quotation</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold border-b pb-2 mb-4">Query Info</h2>
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Name:</strong> {lead.query?.name}</p>
                <p><strong>Phone:</strong> {lead.query?.phone}</p>
                <p><strong>City:</strong> {lead.query?.city}</p>
                <p><strong>Issue Type:</strong> {lead.query?.issueType}</p>
                <p><strong>Description:</strong> {lead.query?.description}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold border-b pb-2 mb-4">Lead Assignment</h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-700">
                  <strong>Assigned To:</strong>{' '}
                  <span className="font-semibold text-primary-600">
                    {lead.assignedToName || 'Unassigned'}
                  </span>
                </p>
                
                <div className="flex gap-2">
                  <select 
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Choose Agent --</option>
                    {admins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={() => assignLeadMutation.mutate()} 
                    disabled={!selectedAssignee || assignLeadMutation.isPending}
                    size="sm"
                  >
                    {assignLeadMutation.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Admin Notes</h2>
          <div className="mb-4 text-sm text-slate-700 whitespace-pre-wrap">
            {lead.notes || "No notes added yet."}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note..." 
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <Button onClick={() => addNoteMutation.mutate()} disabled={addNoteMutation.isPending || !noteText}>Save</Button>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-lg font-bold mb-4">Quotations</h2>
        <DataTable columns={quotColumns} data={quotations} />
      </GlassCard>
    </div>
  );
};

export default LeadDetailPage;
