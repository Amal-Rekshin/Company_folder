import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { DataTable } from '../../components/common/DataTable';
import { PlusCircle, X } from 'lucide-react';
import { Loading } from '../../components/ui/Loading';

const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', skills: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '', email: '', phone: '', is_active: true, skills: ''
  });

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data } = await adminApi.getUsers('technician');
      return data;
    }
  });

  const { data: technicianDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['technician', selectedTechId],
    queryFn: async () => {
      const { data } = await adminApi.getTechnician(selectedTechId);
      return data;
    },
    enabled: !!selectedTechId,
  });

  useEffect(() => {
    if (technicianDetails) {
      setEditFormData({
        name: technicianDetails.name || '',
        email: technicianDetails.email || '',
        phone: technicianDetails.phone || '',
        is_active: technicianDetails.is_active ?? true,
        skills: technicianDetails.skills || ''
      });
    }
  }, [technicianDetails]);

  const addMutation = useMutation({
    mutationFn: adminApi.addTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries(['technicians']);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', skills: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateTechnician(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['technicians']);
      setSelectedTechId(null);
    }
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: selectedTechId, data: editFormData });
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
          <DataTable columns={columns} data={technicians} onRowClick={(row) => setSelectedTechId(row.id)} />
        )}
      </GlassCard>

      {/* Add Technician Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-lg relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Add New Technician</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
              <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
              <Input label="Password" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              <Input label="Skills (comma separated)" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="e.g. Cameras, DVRs, Networking" required />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Technician'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Details & Edit Modal */}
      {selectedTechId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedTechId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-2 flex flex-col h-full">
              <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Technician Profile & Assignments</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2 pb-4">
                {/* Left Panel: Edit Form */}
                <div className="space-y-4 border-r border-slate-100 pr-0 md:pr-8">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Edit Details</h3>
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <Input 
                      label="Full Name" 
                      name="name" 
                      value={editFormData.name} 
                      onChange={handleEditInputChange} 
                      required 
                    />
                    <Input 
                      label="Email Address" 
                      type="email" 
                      name="email" 
                      value={editFormData.email} 
                      onChange={handleEditInputChange} 
                      required 
                    />
                    <Input 
                      label="Phone Number" 
                      name="phone" 
                      value={editFormData.phone} 
                      onChange={handleEditInputChange} 
                      required 
                    />
                    <Input 
                      label="Skills (comma separated)" 
                      name="skills" 
                      value={editFormData.skills} 
                      onChange={handleEditInputChange} 
                      placeholder="e.g. Cameras, DVRs, Networking" 
                      required 
                    />
                    
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block">Status</label>
                        <span className="text-xs text-slate-500">Toggle whether this technician is active</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="is_active"
                          checked={editFormData.is_active} 
                          onChange={handleEditInputChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button variant="secondary" onClick={() => setSelectedTechId(null)} type="button">Cancel</Button>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Right Panel: Assigned Tickets */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Tickets</h3>
                  {isLoadingDetails ? (
                    <Loading message="Loading details & tickets..." />
                  ) : (
                    <div className="space-y-4">
                      {(!technicianDetails?.tickets || technicianDetails.tickets.length === 0) ? (
                        <div className="text-center py-12 bg-slate-50/40 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                          No tickets currently assigned to this technician.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-700 border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="pb-3 px-2">Ticket #</th>
                                <th className="pb-3 px-2">Service</th>
                                <th className="pb-3 px-2">Priority</th>
                                <th className="pb-3 px-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {technicianDetails.tickets.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-2">
                                    <Link 
                                      to={`/admin/tickets/${t.id}`} 
                                      onClick={() => setSelectedTechId(null)}
                                      className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                                    >
                                      {t.ticket_number}
                                    </Link>
                                  </td>
                                  <td className="py-3 px-2 capitalize">{t.service_type}</td>
                                  <td className="py-3 px-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      t.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                      t.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                      'bg-slate-50 text-slate-600'
                                    }`}>
                                      {t.priority}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      t.status === 'completed' ? 'bg-green-50 text-green-600' :
                                      t.status === 'assigned' ? 'bg-blue-50 text-blue-600' :
                                      'bg-slate-50 text-slate-600'
                                    }`}>
                                      {t.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
