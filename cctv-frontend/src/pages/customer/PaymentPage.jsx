import React from 'react';
import { GlassCard } from '../../components/ui/Components';

const PaymentPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Invoices & Payments</h1>
          <p className="text-slate-500 mt-1">View and pay your service invoices</p>
        </div>
      </div>
      <GlassCard className="py-12 text-center">
        <p className="text-slate-500">Invoice history coming soon.</p>
      </GlassCard>
    </div>
  );
};

export default PaymentPage;
