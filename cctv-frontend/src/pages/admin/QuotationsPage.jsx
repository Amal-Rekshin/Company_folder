import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';
import { X } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

const QuotationsPage = () => {
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['adminQuotations'],
    queryFn: () => adminApi.getAllQuotations().then(res => res.data)
  });

  const { data: quotationDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminQuotationDetail', selectedQuotationId],
    queryFn: () => adminApi.getQuotation(selectedQuotationId).then(res => res.data),
    enabled: !!selectedQuotationId
  });

  const columns = [
    { header: 'Quotation ID', accessor: 'id', cell: (row) => row.id.substring(0, 8) },
    { header: 'Valid Until', cell: (row) => row.validUntil ? new Date(row.validUntil).toLocaleDateString() : (row.valid_until ? new Date(row.valid_until).toLocaleDateString() : '-') },
    { header: 'Total', cell: (row) => row.totalAmount ? `₹${row.totalAmount}` : '-' },
    { header: 'Status', cell: (row) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        row.status === 'draft' ? 'bg-slate-100 text-slate-800' :
        row.status === 'sent' ? 'bg-blue-100 text-blue-800' :
        row.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.status.toUpperCase()}
      </span>
    )}
  ];

  if (isLoading) return <LoadingPage message="Loading quotations..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">All Quotations</h1>
      <GlassCard className="!p-0">
        <DataTable 
          columns={columns} 
          data={quotations} 
          onRowClick={(row) => setSelectedQuotationId(row.id)}
        />
      </GlassCard>

      {/* Quotation Detail Modal */}
      {selectedQuotationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl relative my-8 p-6 bg-white border border-slate-200/80 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            <button 
              onClick={() => setSelectedQuotationId(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {isDetailLoading ? (
              <div className="py-12 text-center text-slate-500 font-medium">
                Loading quotation details...
              </div>
            ) : quotationDetail ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      Quotation Details
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${
                      quotationDetail.status === 'draft' ? 'bg-slate-100 text-slate-800' :
                      quotationDetail.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      quotationDetail.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {quotationDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {quotationDetail.id}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Info */}
                  <div className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-200/60 space-y-3">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-200/60 pb-1.5">General Info</h3>
                    <div>
                      <p className="text-slate-500 text-xs">Prepared By</p>
                      <p className="font-semibold text-slate-800">
                        {quotationDetail.created_by_name || quotationDetail.createdBy || 'System'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Valid Until</p>
                      <p className="font-semibold text-slate-800">
                        {quotationDetail.valid_until ? new Date(quotationDetail.valid_until).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-500 text-xs">Version</p>
                        <p className="font-semibold text-slate-800">V{quotationDetail.version || 1}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Created At</p>
                        <p className="font-semibold text-slate-800">
                          {quotationDetail.created_at ? new Date(quotationDetail.created_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-200/60 space-y-3">
                    <h3 className="font-semibold text-slate-800 border-b border-slate-200/60 pb-1.5">Customer Info</h3>
                    <div>
                      <p className="text-slate-500 text-xs">Customer Name</p>
                      <p className="font-semibold text-slate-800">
                        {quotationDetail.customerName || quotationDetail.customer_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Customer Phone</p>
                      <p className="font-semibold text-slate-800 font-mono">
                        {quotationDetail.customerPhone || quotationDetail.customer_phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {quotationDetail.notes && (
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">Notes to Customer</h3>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 whitespace-pre-line font-medium">
                      {quotationDetail.notes}
                    </p>
                  </div>
                )}

                {quotationDetail.terms && (
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">Terms & Conditions</h3>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 whitespace-pre-line font-medium">
                      {quotationDetail.terms}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-2">Assigned Products & Items</h3>
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200/80">
                        <tr>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Unit Price</th>
                          <th className="px-4 py-3 text-center w-20">Qty</th>
                          <th className="px-4 py-3 text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 bg-white">
                        {quotationDetail.items?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-slate-800 font-medium">{item.description}</td>
                            <td className="px-4 py-3 text-right text-slate-700 font-medium">₹{parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-center text-slate-700 font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              ₹{(parseFloat(item.unit_price || item.unitPrice || 0) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {(!quotationDetail.items || quotationDetail.items.length === 0) && (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-slate-400 bg-white">
                              No items assigned to this quotation.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="border-t border-slate-200/80 pt-4 flex flex-col items-end text-sm space-y-1.5">
                  <div className="flex w-64 justify-between text-slate-600 font-medium">
                    <span>Subtotal:</span>
                    <span className="text-slate-800">₹{((quotationDetail.items || []).reduce((sum, item) => sum + (parseFloat(item.unit_price || item.unitPrice || 0) * item.quantity), 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex w-64 justify-between text-slate-600 font-medium">
                    <span>GST ({parseFloat(quotationDetail.gstRate || quotationDetail.gst_rate || 18).toFixed(1)}%):</span>
                    <span className="text-slate-800">
                      ₹{quotationDetail.gstAmount || quotationDetail.gst_amount ? parseFloat(quotationDetail.gstAmount || quotationDetail.gst_amount).toFixed(2) : (
                        ((quotationDetail.items || []).reduce((sum, item) => sum + (parseFloat(item.unit_price || item.unitPrice || 0) * item.quantity), 0) * (parseFloat(quotationDetail.gstRate || quotationDetail.gst_rate || 18) / 100)).toFixed(2)
                      )}
                    </span>
                  </div>
                  <div className="flex w-64 justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200/80">
                    <span>Total Amount:</span>
                    <span className="text-blue-600 text-lg">
                      ₹{quotationDetail.totalAmount || quotationDetail.total_amount ? parseFloat(quotationDetail.totalAmount || quotationDetail.total_amount).toFixed(2) : (
                        (((quotationDetail.items || []).reduce((sum, item) => sum + (parseFloat(item.unit_price || item.unitPrice || 0) * item.quantity), 0)) * (1 + (parseFloat(quotationDetail.gstRate || quotationDetail.gst_rate || 18) / 100))).toFixed(2)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200/80">
                  <Button onClick={() => setSelectedQuotationId(null)}>Close</Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-red-500 font-medium">
                Failed to load quotation details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsPage;
