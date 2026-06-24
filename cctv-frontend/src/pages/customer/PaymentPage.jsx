import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../api/paymentApi';
import { GlassCard, Badge, Button } from '../../components/ui/Components';
import { LoadingPage } from '../../components/ui/Loading';
import { FileText, CreditCard, Clock, CheckCircle } from 'lucide-react';

const PaymentPage = () => {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['myPayments'],
    queryFn: () => paymentApi.getMyPayments().then(res => res.data)
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge color="green">Completed</Badge>;
      case 'pending':
        return <Badge color="yellow">Pending</Badge>;
      case 'failed':
        return <Badge color="red">Failed</Badge>;
      default:
        return <Badge color="slate">{status}</Badge>;
    }
  };

  const handlePayNow = (payment) => {
    // In a real app, this would open a payment gateway modal or redirect to a payment page.
    alert(`Payment Gateway Integration Pending for Invoice #${payment.id.split('-')[0]}`);
  };

  if (isLoading) return <LoadingPage message="Loading invoices..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Invoices & Payments</h1>
          <p className="text-slate-500 mt-1">View and pay your service invoices</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Invoices Yet</h3>
          <p className="text-slate-500">When you receive service, your invoices will appear here.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map(payment => (
            <GlassCard key={payment.id} className="flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Ticket #{payment.ticket_number}</p>
                  <h3 className="text-2xl font-black text-slate-800">₹{payment.gross_amount}</h3>
                </div>
                {getStatusBadge(payment.status)}
              </div>
              
              <div className="space-y-3 mb-6 flex-grow">
                {payment.method && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Method: <span className="font-medium capitalize">{payment.method}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Created: <span className="font-medium">{new Date(payment.created_at).toLocaleDateString()}</span></span>
                </div>
                {payment.paid_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Paid on: <span className="font-medium">{new Date(payment.paid_at).toLocaleDateString()}</span></span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                {payment.status === 'pending' ? (
                  <Button onClick={() => handlePayNow(payment)} size="sm" className="w-full">
                    Pay Now
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="w-full" disabled>
                    Receipt Available
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
