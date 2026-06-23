import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';
import { X, PlusCircle } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

const LeadsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    issueType: 'installation',
    city: '',
    state: '',
    pincode: '',
    description: '',
    notes: '',
    assignedTo: ''
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['adminLeads'],
    queryFn: () => adminApi.getLeads().then(res => res.data)
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers('admin').then(res => res.data)
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => adminApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminLeads']);
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        issueType: 'installation',
        city: '',
        state: '',
        pincode: '',
        description: '',
        notes: '',
        assignedTo: ''
      });
    }
  });

  const columns = [
    { header: 'Lead ID', accessor: 'id', cell: (row) => row.id.substring(0, 8) },
    { header: 'Customer', cell: (row) => row.query?.name },
    { header: 'Phone', cell: (row) => row.query?.phone },
    {
      header: 'Status', cell: (row) => (
        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">
          {row.status.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Actions', cell: (row) => (
        <Button size="sm" onClick={() => navigate(`/admin/leads/${row.id}`)}>View Details</Button>
      )
    }
  ];

  if (isLoading) return <LoadingPage message="Loading leads..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Sales Leads</h1>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <PlusCircle className="w-5 h-5" />
          <span>Create Lead</span>
        </Button>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={leads} />
      </GlassCard>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 relative my-8 max-h-[90vh] overflow-y-auto text-slate-800">
            <button 
              onClick={() => setShowCreateModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Lead</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); createLeadMutation.mutate(formData); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Customer Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <Input label="Customer Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <Input label="Customer Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Issue Type</label>
                  <select 
                    value={formData.issueType} 
                    onChange={(e) => setFormData({...formData, issueType: e.target.value})} 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                  >
                    <option value="installation">Installation</option>
                    <option value="complaint">Complaint / Repair</option>
                    <option value="device_replacement">Device Replacement</option>
                    <option value="amc_support">AMC Support</option>
                  </select>
                </div>
                
                <Input label="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                <Input label="State" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                <Input label="Pincode" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Assigned Agent</label>
                  <select 
                    value={formData.assignedTo} 
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                  >
                    <option value="">-- Choose Agent (Optional) --</option>
                    {admins.map(admin => (
                      <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  required 
                  rows={3} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-sm"
                  placeholder="Describe the query or customer requirements..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Admin Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  rows={2} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-sm"
                  placeholder="Add internal notes (optional)..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={createLeadMutation.isPending}>
                  {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
