import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicApi } from '../../api/publicApi';
import { userApi } from '../../api/userApi';
import { GlassCard } from '../../components/ui/Components';

const CreateTicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    issueType: 'complaint',
    phone: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [profile, setProfile] = useState(null);

  React.useEffect(() => {
    if (user?.userId || user?.id) {
      userApi.getProfile().then(res => setProfile(res.data)).catch(console.error);
    }
  }, [user]);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setUseSavedAddress(checked);
    if (checked && profile) {
      setFormData(prev => ({
        ...prev,
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        address: '',
        city: '',
        state: '',
        pincode: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await publicApi.submitQuery({
        name: user?.name || 'Customer',
        email: user?.email || '',
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        issueType: formData.issueType,
        source: 'customer_portal',
        customerId: user?.userId,
        description: formData.description
      });
      alert('Query submitted successfully! An admin will review it shortly.');
      navigate('/customer');
    } catch (err) {
      console.error(err);
      alert('Failed to submit query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Submit a Query</h1>
      <p className="text-slate-500 mb-8">Please provide details about the issue or requirement you have.</p>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
              <select 
                className="input-field"
                value={formData.issueType}
                onChange={e => setFormData({...formData, issueType: e.target.value})}
              >
                <option value="complaint">Complaint / Repair</option>
                <option value="installation">New Installation</option>
                <option value="amc_support">AMC Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Phone Number</label>
              <input 
                type="tel" className="input-field" required
                placeholder="10-digit number"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              className="input-field min-h-[100px]"
              required
              placeholder="Please describe the issue or your requirements in detail..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Service Location</h3>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useSavedAddress} 
                  onChange={handleCheckboxChange}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                Use saved address
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
              <textarea 
                className="input-field resize-none" 
                required 
                rows={2}
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="123 Main St, Apt 4B"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input type="text" className="input-field" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input type="text" className="input-field" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <input type="text" className="input-field" required value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Submitting...' : 'Submit Query'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default CreateTicketPage;
