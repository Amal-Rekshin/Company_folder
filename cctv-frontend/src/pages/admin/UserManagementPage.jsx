import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';
import { PlusCircle, X } from 'lucide-react';
import { Loading } from '../../components/ui/Loading';

const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', skills: ''
  });

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data } = await adminApi.getUsers('technician');
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries(['technicians']);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', skills: '' });
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
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Status', cell: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Technicians</h1>
          <p className="text-slate-500 mt-1">Manage field technicians and availability</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <PlusCircle className="w-5 h-5" />
          <span>Add Technician</span>
        </Button>
      </div>

      <GlassCard>
        {isLoading ? (
          <Loading message="Loading technicians..." />
        ) : (
          <DataTable columns={columns} data={technicians} onRowClick={(row) => navigate(`/admin/technicians/${row.id}`)} />
        )}
      </GlassCard>

      {/* Add Technician Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 relative text-slate-800">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Technician</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
              <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
              <Input label="Password" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              <Input label="Skills (comma separated)" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="e.g. Cameras, DVRs, Networking" required />
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Technician'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
