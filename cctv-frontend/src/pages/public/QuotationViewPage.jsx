import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '../../api/publicApi';
import { GlassCard, Button } from '../../components/ui/Components';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

import { LoadingPage } from '../../components/ui/Loading';

const QuotationViewPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['publicQuotation', token],
    queryFn: () => publicApi.getQuotation(token).then(res => res.data),
    retry: false
  });

  const acceptMutation = useMutation({
    mutationFn: () => publicApi.acceptQuotation(token),
    onSuccess: (res) => {
      alert(`Quotation Accepted! Your ticket number is: ${res.data.ticketNumber}`);
      navigate('/');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => publicApi.rejectQuotation(token, rejectReason),
    onSuccess: () => {
      alert('Quotation Rejected.');
      navigate('/');
    }
  });

  if (isLoading) return <LoadingPage message="Loading quotation..." />;
  if (error || !quotation) return <div className="p-8 text-center text-red-500">Invalid or expired quotation link.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Service Quotation</h1>
          <p className="text-slate-500 mt-2">Valid until: {quotation.validUntil}</p>
        </div>

        <GlassCard>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><FileText /> Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              quotation.status === 'sent' ? 'bg-blue-100 text-blue-700' :
              quotation.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
              'bg-red-100 text-red-700'
            }`}>
              {quotation.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4 text-slate-700 mb-8">
            <p><strong>Notes:</strong> {quotation.notes}</p>
            <p><strong>Terms:</strong> {quotation.terms}</p>
          </div>

          <div className="bg-slate-100 rounded-xl p-6">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-4 mb-4">
              <span>Item Description</span>
              <span>Amount</span>
            </div>
            
            {/* Displaying static total here since items aren't fetched via public endpoint in this simple view, 
                Ideally, we'd fetch items or include them in the quotation response. Let's assume totalAmount is set. */}
            
            <div className="flex justify-between items-center font-bold text-lg mt-4 pt-4 border-t border-slate-300">
              <span>Grand Total</span>
              <span className="text-2xl text-blue-600">₹{quotation.totalAmount}</span>
            </div>
          </div>

          {quotation.status === 'sent' && (
            <div className="mt-8 flex gap-4 justify-end">
              <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={acceptMutation.isPending}>
                <XCircle className="w-5 h-5 mr-2" /> Reject
              </Button>
              <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                <CheckCircle className="w-5 h-5 mr-2" /> Accept & Create Ticket
              </Button>
            </div>
          )}
        </GlassCard>

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <GlassCard className="max-w-md w-full space-y-4">
              <h3 className="text-xl font-bold">Reject Quotation</h3>
              <textarea 
                className="w-full p-3 border rounded-xl"
                rows={4}
                placeholder="Please tell us why you are rejecting this quotation..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>Confirm Rejection</Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationViewPage;
