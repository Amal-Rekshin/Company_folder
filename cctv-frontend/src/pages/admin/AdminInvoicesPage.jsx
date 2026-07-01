import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { LoadingPage } from '../../components/ui/Loading';
import { FileText, IndianRupee, Search, Edit3 } from 'lucide-react';

export default function AdminInvoicesPage() {
  const queryClient = useQueryClient();
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['adminInvoices'],
    queryFn: () => axiosInstance.get('/invoices').then(res => res.data)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => axiosInstance.patch(`/invoices/${id}/payment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminInvoices']);
      setEditingInvoice(null);
    }
  });

  if (isLoading) return <LoadingPage message="Loading Invoices..." />;

  const handleEditClick = (inv) => {
    setEditingInvoice(inv);
    setPaymentAmount(inv.paid_amount || '0');
    setPaymentStatus(inv.status);
  };

  const handleSave = () => {
    if (!editingInvoice) return;
    updateMutation.mutate({
      id: editingInvoice.id,
      data: {
        paid_amount: parseFloat(paymentAmount),
        status: paymentStatus
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-sm text-slate-500">Manage customer invoices and payments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice ID / Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Paid Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices?.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{inv.id.substring(0,8).toUpperCase()}</p>
                    <p className="text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{inv.customer_name}</p>
                    <p className="text-xs text-slate-500">{inv.customer_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary-600">#{inv.ticket_number}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">₹{parseFloat(inv.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">₹{parseFloat(inv.paid_amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'partial_paid' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditClick(inv)}
                      className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-medium"
                    >
                      <Edit3 className="w-4 h-4" /> Update
                    </button>
                  </td>
                </tr>
              ))}
              {invoices?.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Update Invoice Payment</h2>
              <p className="text-sm text-slate-500 mt-1">Ticket #{editingInvoice.ticket_number} - {editingInvoice.customer_name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-800">₹{parseFloat(editingInvoice.amount).toFixed(2)}</span>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Total Paid Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    ₹
                  </div>
                  <input 
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select 
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="partial_paid">Partial Paid</option>
                  <option value="paid">Fully Paid (Closes Ticket)</option>
                </select>
                {paymentStatus === 'paid' && (
                  <p className="text-xs text-rose-500 font-medium mt-1">Warning: Marking as Fully Paid will automatically close the ticket.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingInvoice(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
