import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../../api/ticketApi';
import { assignmentApi } from '../../api/assignmentApi';
import { adminApi } from '../../api/adminApi'; // to get technicians
import { GlassCard, Button, Badge } from '../../components/ui/Components';

import { LoadingPage } from '../../components/ui/Loading';

const PartnerTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id).then(res => res.data)
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['availableTechnicians'],
    queryFn: () => adminApi.getAvailableTechnicians().then(res => res.data)
  });

  // Note: For a real app, you would fetch partner assignments to get the assignmentId. 
  // We'll assume the API uses ticketId directly in partner assignment for simplicity, 
  // or that the backend is expecting the ticketId. Wait, our API endpoints are:
  // PATCH /api/partner-assignments/{id}/accept
  // Wait, {id} there was the assignmentId, but let's change the backend to use ticketId for simplicity.
  // Wait, I already implemented backend to use assignmentId for accept/reject, but ticketId for assign-technician.
  // Actually, I can update the backend to take ticketId instead of assignmentId, or fetch the assignment first.
  // To keep it simple without changing backend again, let's just use the `ticketId` for assign-technician,
  // and we'll change backend to use `ticketId` for accept/reject.

  const acceptMutation = useMutation({
    mutationFn: () => assignmentApi.partnerAcceptJob(id), // Backend modified later
    onSuccess: () => queryClient.invalidateQueries(['ticket', id])
  });

  const rejectMutation = useMutation({
    mutationFn: () => assignmentApi.partnerRejectJob(id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket']);
      navigate('/partner');
    }
  });

  const assignTechMutation = useMutation({
    mutationFn: () => assignmentApi.partnerAssignTech(id, { technicianId: selectedTech }),
    onSuccess: () => queryClient.invalidateQueries(['ticket', id])
  });

  if (isLoading) return <LoadingPage message="Loading ticket details..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Ticket #{ticket?.ticketNumber}</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Ticket Info</h2>
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>Status:</strong> <Badge color="blue">{ticket?.status}</Badge></p>
            <p><strong>Service:</strong> {ticket?.serviceType}</p>
            <p><strong>Description:</strong> {ticket?.issueDescription}</p>
            <p><strong>Location:</strong> {ticket?.svcAddress}, {ticket?.svcCity}</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Partner Actions</h2>
          
          {ticket?.status === 'partner_assigned' && (
            <div className="flex gap-4">
              <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>Accept Ticket</Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>Reject Ticket</Button>
            </div>
          )}

          {ticket?.status === 'partner_accepted' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-emerald-600">You have accepted this ticket. Please assign a technician.</p>
              <div className="flex gap-2">
                <select 
                  className="flex-1 p-2 border rounded-xl"
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                >
                  <option value="">Select Technician...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <Button onClick={() => assignTechMutation.mutate()} disabled={!selectedTech || assignTechMutation.isPending}>Assign</Button>
              </div>
            </div>
          )}
          
          {ticket?.status === 'technician_assigned' && (
            <p className="text-sm text-blue-600">Technician has been assigned. Awaiting their acceptance.</p>
          )}
        </GlassCard>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GlassCard className="max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold">Reject Assignment</h3>
            <textarea 
              className="w-full p-3 border rounded-xl"
              rows={4}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>Reject</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default PartnerTicketDetailPage;
