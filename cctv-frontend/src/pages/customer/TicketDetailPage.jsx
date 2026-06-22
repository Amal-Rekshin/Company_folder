import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTicketDetails } from '../../hooks/useTickets';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { GlassCard, Badge, Button, Input } from '../../components/ui/Components';
import { ticketApi } from '../../api/ticketApi';
import { estimateApi } from '../../api/estimateApi';
import { feedbackApi } from '../../api/feedbackApi';
import { X, Star } from 'lucide-react';

import { LoadingPage } from '../../components/ui/Loading';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ticket, isLoading } = useTicketDetails(id);

  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comments: '' });

  // Fetch latest estimate if status is estimate_pending
  const { data: estimate } = useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimateApi.getLatestEstimate(id).then(res => res.data),
    enabled: ticket?.status === 'estimate_pending' || ticket?.status === 'estimate_approved'
  });

  const approveEstimateMutation = useMutation({
    mutationFn: (estimateId) => estimateApi.approveEstimate(estimateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      setShowEstimateModal(false);
    }
  });

  const closeTicketMutation = useMutation({
    mutationFn: () => ticketApi.closeTicket(id),
    onSuccess: () => queryClient.invalidateQueries(['ticket', id])
  });

  const feedbackMutation = useMutation({
    mutationFn: (data) => feedbackApi.submitFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      setShowFeedbackModal(false);
    }
  });

  if (isLoading) return <LoadingPage message="Loading ticket details..." />;
  if (!ticket) return <div className="p-8 text-center text-red-500">Ticket not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:underline mb-2 block">&larr; Back to tickets</button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{ticket.ticketNumber}</h1>
          <p className="text-slate-500 mt-1 capitalize">{ticket.serviceType.replace('_', ' ')} • {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <Badge color="blue">{ticket.status.replace(/_/g, ' ').toUpperCase()}</Badge>
      </div>

      <GlassCard className="mb-6">
        <TicketTimeline currentStatus={ticket.status} />
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Issue Description</h3>
          <p className="text-slate-600 text-sm whitespace-pre-wrap">{ticket.issueDescription}</p>
          
          <h3 className="font-semibold text-slate-800 mt-6 mb-4 border-b border-slate-100 pb-2">Service Address</h3>
          <p className="text-slate-600 text-sm">
            {ticket.svcAddress}<br />
            {ticket.svcCity}, {ticket.svcState} {ticket.svcPincode}
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Updates & Actions</h3>
          {ticket.status === 'estimate_pending' ? (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <p className="text-amber-800 font-medium mb-2">An estimate requires your approval</p>
              <p className="text-sm text-amber-700 mb-4">The technician has submitted an estimate for the repair work. Please review and approve it to proceed.</p>
              <button onClick={() => setShowEstimateModal(true)} className="btn-primary w-full bg-amber-600 hover:bg-amber-700 shadow-amber-500/30">Review Estimate</button>
            </div>
          ) : ticket.status === 'completed' ? (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <p className="text-emerald-800 font-medium mb-2">Work Completed!</p>
              <p className="text-sm text-emerald-700 mb-4">The technician has marked this job as completed. Please confirm to close the ticket.</p>
              <button onClick={() => closeTicketMutation.mutate()} disabled={closeTicketMutation.isPending} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30">Confirm & Close</button>
            </div>
          ) : ticket.status === 'closed' ? (
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
               <p className="text-blue-800 font-medium mb-2">Ticket Closed</p>
               <p className="text-sm text-blue-700 mb-4">Thank you for choosing us! Please leave your feedback.</p>
               <button onClick={() => setShowFeedbackModal(true)} className="btn-primary w-full bg-blue-600 hover:bg-blue-700 shadow-blue-500/30">Leave Feedback</button>
             </div>
          ) : (
            <p className="text-sm text-slate-500">No pending actions required from you at this moment.</p>
          )}
        </GlassCard>
      </div>

      {/* Estimate Modal */}
      {showEstimateModal && estimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-lg relative">
            <button onClick={() => setShowEstimateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Service Estimate</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-slate-600">Total Amount:</span>
                <span className="font-bold text-slate-800">₹{estimate.totalAmount}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 block mb-1">Details:</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border">{estimate.details || "No specific details provided."}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => approveEstimateMutation.mutate(estimate.id)} disabled={approveEstimateMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Approve Estimate</Button>
              <Button variant="secondary" onClick={() => setShowEstimateModal(false)} className="flex-1">Close</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-lg relative">
            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Service Feedback</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); feedbackMutation.mutate(feedbackData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(num => (
                    <Star 
                      key={num} 
                      className={`w-8 h-8 cursor-pointer ${feedbackData.rating >= num ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} 
                      onClick={() => setFeedbackData({...feedbackData, rating: num})}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Comments</label>
                <textarea 
                  value={feedbackData.comments} 
                  onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})} 
                  required 
                  rows={4} 
                  className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl outline-none resize-none"
                  placeholder="How was your service experience?"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={feedbackMutation.isPending}>Submit Feedback</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;
