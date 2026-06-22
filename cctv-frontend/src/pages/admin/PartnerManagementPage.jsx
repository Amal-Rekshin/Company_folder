import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';
import { PlusCircle, X } from 'lucide-react';
import { Loading } from '../../components/ui/Loading';

const PartnerManagementPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', companyName: '', commissionRate: ''
  });

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data } = await adminApi.getPartners();
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addPartner,
    onSuccess: () => {
      queryClient.invalidateQueries(['partners']);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', companyName: '', commissionRate: '' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleUserActive,
    onSuccess: () => {
      queryClient.invalidateQueries(['partners']);
    }
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const columns = [
    { header: 'Company Name', accessor: 'company_name', cell: (row) => <span className="font-semibold text-slate-800">{row.company_name}</span> },
    { header: 'Contact Person', accessor: 'name' },
    { header: 'Email & Phone', cell: (row) => (
      <div>
        <div className="text-slate-800">{row.email}</div>
        <div className="text-slate-500 text-xs">{row.phone}</div>
      </div>
    ) },
    { header: 'Commission (%)', accessor: 'commission_rate', cell: (row) => `${row.commission_rate}%` },
    { header: 'Status', cell: (row) => (
      <button 
        onClick={() => toggleMutation.mutate(row.id)}
        disabled={toggleMutation.isPending}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
          row.is_active 
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' 
            : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200'
        }`}
        title="Click to toggle status"
      >
        {row.is_active ? 'Active' : 'Inactive'}
      </button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Partners</h1>
          <p className="text-slate-500 mt-1">Manage external service partners and agencies</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2 shadow-md hover:shadow-lg transition-all">
          <PlusCircle className="w-5 h-5" />
          <span>Add Partner</span>
        </Button>
      </div>

      <GlassCard className="!p-0 overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-200/20">
        {isLoading ? (
          <Loading message="Loading partners..." />
        ) : partners.length === 0 ? (
           <div className="p-12 text-center">
            <p className="text-slate-500 text-sm font-medium">No partners found. Add your first partner to get started.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={partners} />
        )}
      </GlassCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl relative my-8 shadow-2xl border border-white/50">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors bg-slate-100/50 hover:bg-slate-100 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Add New Partner</h2>
              <p className="text-sm text-slate-500 mt-1">Create a new partner agency account.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="e.g. Acme Security Co." required />
                <Input label="Commission Rate (%)" type="number" step="0.1" name="commissionRate" value={formData.commissionRate} onChange={handleInputChange} placeholder="e.g. 10.5" required />
                
                <Input label="Contact Person Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" required />
                <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@acme.com" required />
                
                <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 9876543210" required />
                <Input label="Temporary Password" type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required />
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button" className="px-6">Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending} className="px-8 shadow-md hover:shadow-lg transition-all">
                  {addMutation.isPending ? 'Adding Partner...' : 'Add Partner'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default PartnerManagementPage;
