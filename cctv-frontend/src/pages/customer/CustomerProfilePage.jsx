import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';
import { useAuth } from '../../context/AuthContext';

const CustomerProfilePage = () => {
  const queryClient = useQueryClient();
  const { user, login } = useAuth(); // We might need to update the auth context if name changes

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile().then(res => res.data)
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      }));
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries(['userProfile']);
      // Clear password field after successful update
      setFormData(prev => ({ ...prev, password: '' }));
      alert('Profile updated successfully!');
      
      // If we had a way to update the auth context user name, we would do it here.
      // A full page reload is a quick hack to reflect the name change in the Topbar if auth context relies on local storage
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken) {
         // Optionally force a reload to refresh auth state if needed, or better, the auth context should have an updateUser function
      }
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }
    updateProfileMutation.mutate(submitData);
  };

  if (isLoading) return <LoadingPage message="Loading profile..." />;

  const userInitials = formData.name ? formData.name.substring(0, 2).toUpperCase() : 'CU';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* ── Header Section ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-primary-900/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative group">
            <div className="absolute -inset-1 bg-white/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white text-primary-700 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-lg border-4 border-white/20">
              {userInitials}
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-400 border-2 border-white rounded-full shadow-sm animate-pulse" title="Online & Active" />
          </div>
          <div className="flex flex-col justify-center mt-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">My Profile</h1>
            <p className="text-primary-100 font-medium max-w-md leading-relaxed">
              Manage your personal information, security settings, and ensure your contact details are up to date.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ── Personal Info Section ── */}
        <GlassCard className="p-6 sm:p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-shadow duration-300">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              Personal Information
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">This information is used to contact you regarding your tickets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Full Name */}
            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <User className="w-4.5 h-4.5" />
                </div>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all hover:bg-white text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email address"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all hover:bg-white text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter your phone number"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all hover:bg-white text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Security Section ── */}
        <GlassCard className="p-6 sm:p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-shadow duration-300">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" />
              Security Settings
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Update your password to keep your account secure.</p>
          </div>

          <div className="max-w-md">
            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">New Password (Optional)</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all hover:bg-white text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Action Bar ── */}
        <div className="flex justify-end pt-2 pb-6">
          <button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {updateProfileMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerProfilePage;
