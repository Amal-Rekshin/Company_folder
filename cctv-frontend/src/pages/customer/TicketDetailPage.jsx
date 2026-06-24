import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTicketDetails } from '../../hooks/useTickets';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { GlassCard, Badge, Button, Input } from '../../components/ui/Components';
import { ticketApi } from '../../api/ticketApi';
import { estimateApi } from '../../api/estimateApi';
import { feedbackApi } from '../../api/feedbackApi';
import { publicApi } from '../../api/publicApi';
import { X, Star, FileText, ChevronRight, CheckCircle2, ArrowLeft, MapPin, AlignLeft, Activity } from 'lucide-react';

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

  const { data: quotation } = useQuery({
    queryKey: ['publicQuotation', ticket?.quotationAcceptToken],
    queryFn: () => publicApi.getQuotation(ticket.quotationAcceptToken).then(res => res.data),
    enabled: !!ticket?.quotationAcceptToken
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
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-12">
      {/* Header Area */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to tickets
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{ticket.ticketNumber}</h1>
            <Badge color="blue">{ticket.status.replace(/_/g, ' ').toUpperCase()}</Badge>
          </div>
          <p className="text-slate-500 mt-2 font-medium tracking-wide text-sm">
            <span className="uppercase">{ticket.serviceType.replace('_', ' ')}</span> <span className="mx-2 text-slate-300">|</span> {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {ticket.quotationAcceptToken && quotation && (
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-sm shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Approved Quotation</h3>
                <p className="text-sm text-slate-500">The service estimate you approved</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Approved Amount</p>
              <p className="text-2xl font-black text-blue-600 font-mono tracking-tight mt-1">₹{quotation.total_amount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm mb-6">
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3 border-b-2 border-slate-100 pb-2 inline-block">Items & Services</p>
              <ul className="space-y-3">
                {quotation.items?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item.description} <span className="text-slate-400 font-medium ml-1">x{item.quantity}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3 border-b-2 border-slate-100 pb-2 inline-block">Details</p>
              <div className="bg-slate-50 rounded-sm p-4 border border-slate-200 space-y-2">
                {quotation.notes && <p className="text-slate-700"><span className="font-semibold text-slate-600">Note:</span> {quotation.notes}</p>}
                <p className="text-slate-700"><span className="font-semibold text-slate-600">GST:</span> {quotation.gst_rate}% (₹{quotation.gst_amount})</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={() => window.open(`/quotation/${ticket.quotationAcceptToken}`, '_blank')} variant="secondary" size="sm" className="rounded-sm flex items-center group">
              View Full Invoice <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 sm:p-8">
        <TicketTimeline currentStatus={ticket.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <AlignLeft className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Issue Description</h3>
          </div>
          <p className="text-slate-600 text-sm whitespace-pre-wrap flex-grow leading-relaxed">{ticket.issueDescription}</p>
          
          <div className="flex items-center gap-2 mt-8 mb-4 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Service Address</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {ticket.svcAddress}<br />
            {ticket.svcCity}, {ticket.svcState} {ticket.svcPincode}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Updates & Actions</h3>
          </div>
          <div className="flex-grow flex flex-col justify-center">
            {ticket.status === 'estimate_pending' ? (
              <div className="bg-amber-50 p-5 rounded-sm border border-amber-200 text-center">
                <p className="text-amber-900 font-bold mb-2 text-base">Approval Required</p>
                <p className="text-sm text-amber-700 mb-6 leading-relaxed">The technician has submitted an estimate for the repair work. Please review and approve it to proceed.</p>
                <Button onClick={() => setShowEstimateModal(true)} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-sm shadow-none">Review Estimate</Button>
              </div>
            ) : ticket.status === 'completed' ? (
              <div className="bg-emerald-50 p-5 rounded-sm border border-emerald-200 text-center">
                <p className="text-emerald-900 font-bold mb-2 text-base">Work Completed</p>
                <p className="text-sm text-emerald-700 mb-6 leading-relaxed">The technician has marked this job as completed. Please confirm to close the ticket.</p>
                <Button onClick={() => closeTicketMutation.mutate()} disabled={closeTicketMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm shadow-none">Confirm & Close</Button>
              </div>
            ) : ticket.status === 'closed' ? (
               <div className="bg-blue-50 p-5 rounded-sm border border-blue-200 text-center">
                 <p className="text-blue-900 font-bold mb-2 text-base">Ticket Closed</p>
                 <p className="text-sm text-blue-700 mb-6 leading-relaxed">Thank you for choosing us! Please leave your feedback.</p>
                 <Button onClick={() => setShowFeedbackModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-none">Leave Feedback</Button>
               </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-300 mb-3 border border-slate-100">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No pending actions required.</p>
                <p className="text-xs text-slate-400 mt-1">We will notify you when there's an update.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estimate Modal */}
      {showEstimateModal && estimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 relative text-slate-800">
            <button onClick={() => setShowEstimateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Service Estimate</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-600">Total Amount:</span>
                <span className="font-bold text-slate-900 text-lg">₹{estimate.totalAmount}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 block mb-1">Details:</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{estimate.details || "No specific details provided."}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button onClick={() => approveEstimateMutation.mutate(estimate.id)} disabled={approveEstimateMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Approve Estimate</Button>
              <Button variant="secondary" onClick={() => setShowEstimateModal(false)} className="flex-1">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 relative text-slate-800">
            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Service Feedback</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); feedbackMutation.mutate(feedbackData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(num => (
                    <Star 
                      key={num} 
                      className={`w-8 h-8 cursor-pointer transition-all ${feedbackData.rating >= num ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-slate-300 hover:text-yellow-300'}`} 
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
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none resize-none text-sm text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="How was your service experience?"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                <Button type="submit" disabled={feedbackMutation.isPending}>Submit Feedback</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;
