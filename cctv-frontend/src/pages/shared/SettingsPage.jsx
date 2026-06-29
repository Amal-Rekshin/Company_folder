import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { User, Phone, Mail, Save, MapPin, Edit2, X } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

const SettingsPage = () => {
  const { user, login } = useAuth(); // login function might just set user state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        setFormData({
          name: res.data.name || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          city: res.data.city || '',
          state: res.data.state || '',
          pincode: res.data.pincode || ''
        });
      } catch (error) {
        console.error("Failed to load profile", error);
        setMessage({ text: 'Failed to load profile information.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Only sending name, phone and location fields as email might not be updatable
      const res = await userApi.updateProfile({ 
        name: formData.name, 
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false); // Switch back to view mode on success
      
      // If login function can update current user state, we do it here. 
      // Or we can just let it be, and next reload will fetch updated info.
    } catch (error) {
      console.error("Failed to update profile", error);
      setMessage({ text: error?.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage message="Loading settings..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account profile and preferences.</p>
      </div>

      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <User className="w-5 h-5 text-primary-600" />
            Profile Information
          </h2>
          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          )}
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {message.text}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                  <User className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Full Name</p>
                </div>
                <p className="font-medium text-slate-800 text-lg">{formData.name || '-'}</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                  <Phone className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Phone Number</p>
                </div>
                <p className="font-medium text-slate-800 text-lg">{formData.phone || '-'}</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 md:col-span-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                  <Mail className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Email Address</p>
                </div>
                <p className="font-medium text-slate-800 text-lg">{formData.email || '-'}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
                <MapPin className="w-4 h-4 text-primary-600" />
                Location Details
              </h3>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Address</p>
                <p className="font-medium text-slate-800 leading-relaxed text-lg">
                  {formData.address ? (
                    <>
                      {formData.address}<br />
                      {formData.city && formData.city + ', '}
                      {formData.state && formData.state + ' '}
                      {formData.pincode}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">No address provided</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-9 input-field"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="pl-9 input-field"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="pl-9 input-field opacity-70 bg-slate-50 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email address cannot be changed. Contact support if needed.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
                <MapPin className="w-4 h-4 text-primary-600" />
                Location Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Street Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="123 Main St, Apt 4B"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="New York"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
};

export default SettingsPage;
