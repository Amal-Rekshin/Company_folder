import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '../../api/publicApi';
import { Button, Badge } from '../../components/ui/Components';
import { CheckCircle, XCircle } from 'lucide-react';
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
      navigate('/customer/tickets');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => publicApi.rejectQuotation(token, rejectReason),
    onSuccess: () => {
      alert('Quotation Rejected.');
      navigate('/customer/tickets');
    }
  });

  if (isLoading) return <LoadingPage message="Loading quotation..." />;
  if (error || !quotation) return <div className="p-8 text-center text-red-500">Invalid or expired quotation link.</div>;

  // Split terms if they are numbered (simple heuristic)
  const formatTerms = (terms) => {
    if (!terms) return null;
    return terms.split(/(?=\d+\.)/).map((term, i) => <div key={i} className="mb-1">{term.trim()}</div>);
  };

  const subtotal = quotation.total_amount - (quotation.gst_amount || 0);

  return (
    <div className="min-h-screen bg-slate-200/80 py-12 px-4 flex justify-center font-sans">
      <div className="max-w-4xl w-full">
        <div className="bg-white shadow-2xl overflow-hidden rounded-sm relative">
          
          {/* Header Strip */}
          <div className="bg-slate-800 h-3 w-full absolute top-0 left-0"></div>

          <div className="p-10 pt-14">
            {/* Top Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-14 gap-6">
              <div>
                <Link to="/">
                  <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-1 cursor-pointer hover:opacity-80 transition-opacity">CCTV PRO</h1>
                </Link>
                <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Professional Security Solutions</p>
              </div>
              <div className="text-left sm:text-right">
                <h2 className="text-3xl font-light text-slate-400 mb-2 uppercase tracking-widest">Quotation</h2>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <p className="text-slate-800 font-bold text-lg font-mono tracking-wider">{quotation.id.split('-')[0].toUpperCase()}</p>
                  <Badge color={quotation.status === 'sent' ? 'blue' : quotation.status === 'accepted' ? 'green' : 'red'}>
                    {quotation.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col sm:flex-row justify-between mb-14 gap-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b-2 border-slate-100 pb-2 inline-block">Prepared For</h3>
                <p className="text-lg font-bold text-slate-800">{quotation.customer_name || 'Customer'}</p>
                <p className="text-slate-600 mt-1">{quotation.customer_phone || 'N/A'}</p>
              </div>
              <div className="sm:text-right">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <span className="text-slate-500 font-medium">Issue Date:</span>
                  <span className="text-slate-800 font-semibold">{quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : 'N/A'}</span>
                  
                  <span className="text-slate-500 font-medium">Valid Until:</span>
                  <span className="text-slate-800 font-semibold">{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'N/A'}</span>
                  
                  <span className="text-slate-500 font-medium">Prepared By:</span>
                  <span className="text-slate-800 font-semibold">Admin Team</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mb-14">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y-2 border-slate-800 text-slate-800 uppercase text-xs font-bold tracking-wider bg-slate-50/50">
                    <th className="py-4 px-3">Description</th>
                    <th className="py-4 px-3 text-right">Unit Price</th>
                    <th className="py-4 px-3 text-center w-24">Qty</th>
                    <th className="py-4 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-5 px-3 text-slate-800 font-medium">{item.description}</td>
                      <td className="py-5 px-3 text-slate-600 text-right font-mono text-sm">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="py-5 px-3 text-slate-600 text-center font-mono text-sm">{item.quantity}</td>
                      <td className="py-5 px-3 text-slate-800 font-bold text-right font-mono">₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!quotation.items || quotation.items.length === 0) && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400 italic border-b border-slate-200">No items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary & Terms */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
              <div className="w-full md:w-1/2 order-2 md:order-1">
                {quotation.terms && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b-2 border-slate-100 pb-2 inline-block">Terms & Conditions</h3>
                    <div className="text-slate-500 text-xs leading-relaxed space-y-1 pr-4">
                      {formatTerms(quotation.terms)}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-[350px] order-1 md:order-2 self-end">
                <div className="space-y-4 text-sm bg-slate-50 p-6 rounded-sm border border-slate-200">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>GST ({quotation.gst_rate || 18.0}%)</span>
                    <span className="font-mono">₹{parseFloat(quotation.gst_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 mt-2 border-t-2 border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">Grand Total</span>
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">₹{parseFloat(quotation.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          {quotation.status === 'sent' && (
            <div className="bg-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row justify-end items-center gap-4 mt-6">
              <span className="text-slate-400 text-sm italic mr-auto hidden sm:block font-medium tracking-wide">Please review and respond to this quotation to proceed.</span>
              <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={acceptMutation.isPending} className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white rounded-sm px-6">
                <XCircle className="w-4 h-4 mr-2" /> Decline
              </Button>
              <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm px-8">
                <CheckCircle className="w-4 h-4 mr-2" /> Accept Quotation
              </Button>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-md w-full p-8 shadow-2xl space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Decline Quotation</h3>
                <p className="text-sm text-slate-500 mt-1">Please let us know why you are declining.</p>
              </div>
              <textarea 
                className="w-full p-4 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm"
                rows={4}
                placeholder="Reason for declining..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowRejectModal(false)} className="rounded-sm">Cancel</Button>
                <Button variant="danger" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} className="rounded-sm bg-rose-500 hover:bg-rose-600 text-white">Decline</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuotationViewPage;
