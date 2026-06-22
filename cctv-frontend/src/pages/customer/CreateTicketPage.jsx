import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicket } from '../../hooks/useTickets';
import { GlassCard } from '../../components/ui/Components';

const CreateTicketPage = () => {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const [formData, setFormData] = useState({
    serviceType: 'complaint',
    priority: 'medium',
    issueDescription: '',
    svcAddress: '',
    svcCity: '',
    svcState: '',
    svcPincode: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicket.mutate(formData, {
      onSuccess: () => navigate('/customer/tickets')
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Raise a Service Request</h1>
      <p className="text-slate-500 mb-8">Please provide details about the issue you are facing.</p>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
              <select 
                className="input-field"
                value={formData.serviceType}
                onChange={e => setFormData({...formData, serviceType: e.target.value})}
              >
                <option value="complaint">Complaint / Repair</option>
                <option value="installation">New Installation</option>
                <option value="amc_support">AMC Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select 
                className="input-field"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Description</label>
            <textarea 
              className="input-field min-h-[100px]"
              required
              placeholder="Please describe the issue in detail..."
              value={formData.issueDescription}
              onChange={e => setFormData({...formData, issueDescription: e.target.value})}
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-800 mb-4">Service Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                <input 
                  type="text" className="input-field" required
                  value={formData.svcAddress}
                  onChange={e => setFormData({...formData, svcAddress: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input type="text" className="input-field" required value={formData.svcCity} onChange={e => setFormData({...formData, svcCity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input type="text" className="input-field" required value={formData.svcState} onChange={e => setFormData({...formData, svcState: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <input type="text" className="input-field" required value={formData.svcPincode} onChange={e => setFormData({...formData, svcPincode: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createTicket.isLoading} className="btn-primary">
              {createTicket.isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default CreateTicketPage;
