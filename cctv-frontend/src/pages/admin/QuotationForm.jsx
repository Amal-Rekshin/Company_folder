import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { LoadingPage } from '../../components/ui/Loading';

const QuotationForm = () => {
  const { id: leadId, quotationId } = useParams();
  const isEditMode = !!quotationId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    notes: '',
    terms: '1. 100% advance payment\n2. Quotation valid for 7 days',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  const [items, setItems] = useState([
    { description: '', unitPrice: 0, quantity: 1 }
  ]);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['adminQuotation', quotationId],
    queryFn: () => adminApi.getQuotation(quotationId).then(res => res.data),
    enabled: isEditMode
  });

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ['adminLead', leadId],
    queryFn: () => adminApi.getLead(leadId).then(res => res.data),
    enabled: !isEditMode
  });

  useEffect(() => {
    if (isEditMode && quotation) {
      setFormData({
        customerName: quotation.customerName || quotation.customer_name || '',
        customerPhone: quotation.customerPhone || quotation.customer_phone || '',
        notes: quotation.notes || '',
        terms: quotation.terms || '',
        validUntil: quotation.valid_until ? quotation.valid_until.split('T')[0] : (quotation.validUntil ? quotation.validUntil.split('T')[0] : '')
      });
      if (quotation.items) {
        setItems(quotation.items.map(item => ({
          description: item.description || '',
          unitPrice: item.unit_price ? parseFloat(item.unit_price) : (item.unitPrice ? parseFloat(item.unitPrice) : 0),
          quantity: item.quantity || 1
        })));
      }
    } else if (!isEditMode && lead) {
      setFormData(prev => ({
        ...prev,
        customerName: lead.query?.name || lead.name || '',
        customerPhone: lead.query?.phone || lead.phone || ''
      }));
    }
  }, [quotation, lead, isEditMode]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditMode) {
        return adminApi.updateQuotation(quotationId, data);
      } else {
        return adminApi.createQuotation(leadId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminLeadQuotations', leadId]);
      navigate(`/admin/leads/${leadId}`);
    }
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', unitPrice: 0, quantity: 1 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...formData, items });
  };

  const isPageLoading = isEditMode ? isLoading : leadLoading;
  if (isPageLoading) return <LoadingPage message="Loading details..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Edit Quotation' : 'Create Quotation'}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard>
          <h2 className="text-lg font-bold mb-4">General Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Name" type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} required />
            <Input label="Customer Phone" type="text" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} required />
            <Input label="Valid Until" type="date" value={formData.validUntil} onChange={(e) => setFormData({...formData, validUntil: e.target.value})} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Notes to Customer</label>
              <textarea className="w-full p-2 border rounded-xl" rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Terms & Conditions</label>
              <textarea className="w-full p-2 border rounded-xl" rows={3} value={formData.terms} onChange={(e) => setFormData({...formData, terms: e.target.value})} />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Line Items</h2>
            <Button type="button" size="sm" onClick={addItem}>+ Add Item</Button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required />
                </div>
                <div className="w-32">
                  <Input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required />
                </div>
                <div className="w-24">
                  <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))} required />
                </div>
                <div className="w-32 pt-2 text-right font-bold">
                  ₹{item.unitPrice * item.quantity}
                </div>
                {items.length > 1 && (
                  <Button type="button" variant="danger" className="mt-1" onClick={() => removeItem(index)}>X</Button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t mt-6 pt-4 text-right">
            <span className="text-lg font-bold text-slate-700">Total Pre-Tax: </span>
            <span className="text-2xl font-bold text-blue-600">₹{total}</span>
          </div>
        </GlassCard>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Quotation'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
