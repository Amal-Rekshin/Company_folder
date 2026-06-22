import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';

const QuotationForm = () => {
  const { id: leadId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    notes: '',
    terms: '1. 100% advance payment\n2. Quotation valid for 7 days',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  const [items, setItems] = useState([
    { description: '', unitPrice: 0, quantity: 1 }
  ]);

  const mutation = useMutation({
    mutationFn: (data) => adminApi.createQuotation(leadId, data),
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Create Quotation</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard>
          <h2 className="text-lg font-bold mb-4">General Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Valid Until" type="date" value={formData.validUntil} onChange={(e) => setFormData({...formData, validUntil: e.target.value})} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Notes to Customer</label>
              <textarea className="w-full p-2 border rounded-xl" rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="space-y-1">
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
          <Button type="submit" disabled={mutation.isPending}>Save Quotation</Button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
