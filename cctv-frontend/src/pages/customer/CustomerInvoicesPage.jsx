import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { LoadingPage } from '../../components/ui/Loading';
import { FileText, CheckCircle2, Clock, IndianRupee, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function CustomerInvoicesPage() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['customerInvoices'],
    queryFn: () => axiosInstance.get('/invoices').then(res => res.data)
  });

  if (isLoading) return <LoadingPage message="Loading Invoices..." />;

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <FileText className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-600">No invoices yet</p>
        <p className="text-sm">When your tickets are completed, invoices will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Invoices</h1>
        <p className="text-slate-500">View and pay your recent service invoices</p> 
      </div>

      <div className="space-y-4">
        {invoices.map(inv => (
          <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                  inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  inv.status === 'partial_paid' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {inv.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-medium">{new Date(inv.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Ticket #{inv.ticket_number}</h3>
                <p className="text-sm text-slate-500">{inv.service_type} Service</p>
              </div>
              
              <div className="flex flex-col gap-1 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-bold text-slate-800">₹{parseFloat(inv.amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Paid Amount:</span>
                  <span className="font-semibold text-emerald-600">₹{parseFloat(inv.paid_amount || 0).toFixed(2)}</span>
                </div>
                {inv.status !== 'paid' && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Balance Due:</span>
                    <span className="font-bold text-rose-600 text-base">₹{(parseFloat(inv.amount) - parseFloat(inv.paid_amount || 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            {inv.status !== 'paid' && inv.payment_qr && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col items-center w-full md:w-auto">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Pay via UPI
                </p>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                  <QRCodeSVG value={inv.payment_qr} size={130} />
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-3 max-w-[150px]">
                  Scan this QR code with any UPI app to pay the balance amount.
                </p>
              </div>
            )}
            
            {inv.status === 'paid' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col items-center justify-center w-full md:w-auto md:min-w-[200px]">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-emerald-700">Fully Paid</p>
                <p className="text-xs text-emerald-600 text-center mt-1">Thank you for your payment!</p>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}
