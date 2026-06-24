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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and security.</p>
      </div>

      <GlassCard className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Full Name
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Email Address
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> Phone Number
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> New Password (Optional)
              </label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default CustomerProfilePage;
