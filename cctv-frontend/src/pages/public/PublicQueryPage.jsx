import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { publicApi } from '../../api/publicApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';

const PublicQueryPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '',
    issueType: 'complaint', description: '', source: 'website'
  });

  const mutation = useMutation({
    mutationFn: publicApi.submitQuery,
    onSuccess: () => {
      navigate('/query/thank-you');
    }
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">CCTV Service Request</h1>
          <p className="text-slate-500 mt-2">Submit your query below and our team will get back to you with a quotation.</p>
        </div>
        
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
              <Input label="Email Address (Optional)" type="email" name="email" value={formData.email} onChange={handleChange} />
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Issue Type</label>
                <select name="issueType" value={formData.issueType} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="complaint">Complaint / Repair</option>
                  <option value="installation">New Installation</option>
                  <option value="amc_support">AMC Support</option>
                  <option value="device_replacement">Device Replacement</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Street Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} required rows={2} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="123 Main St, Apt 4B"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="City" name="city" value={formData.city} onChange={handleChange} required />
              <Input label="State" name="state" value={formData.state} onChange={handleChange} />
              <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Describe the Issue</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Please provide details about the problem or requirement..."></textarea>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default PublicQueryPage;
