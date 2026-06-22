import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTickets } from '../../hooks/useTickets';
import { adminApi } from '../../api/adminApi';
import { DataTable } from '../../components/common/DataTable';
import { Badge, GlassCard, Button, Input } from '../../components/ui/Components';
import { PlusCircle, X, UserPlus } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

const AllTicketsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tickets, isLoading } = useTickets();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState(null);

  // Form states
  const [createData, setCreateData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    serviceType: 'installation', issueDescription: '', priority: 'medium',
    svcAddress: '', svcCity: '', svcState: '', svcPincode: ''
  });
  const [assignData, setAssignData] = useState({ assigneeId: '' });

  // Data fetching for Assignment dropdown
  const { data: technicians = [] } = useQuery({
    queryKey: ['availableTechnicians'],
    queryFn: async () => (await adminApi.getAvailableTechnicians()).data
  });
  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data } = await adminApi.getPartners();
      return data.filter(p => p.is_active);
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: adminApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
      setShowCreateModal(false);
      setCreateData({
        customerName: '', customerEmail: '', customerPhone: '',
        serviceType: 'installation', issueDescription: '', priority: 'medium',
        svcAddress: '', svcCity: '', svcState: '', svcPincode: ''
      });
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assigneeId }) => adminApi.assignTicket(id, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
      setShowAssignModal(false);
      setAssignData({ assigneeId: '' });
    }
  });

  const handleCreateChange = (e) => setCreateData({ ...createData, [e.target.name]: e.target.value });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(createData);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (assignData.assigneeId) {
      assignMutation.mutate({ id: assigningTicketId, assigneeId: assignData.assigneeId });
    }
  };

  const openAssignModal = (e, ticketId) => {
    e.stopPropagation();
    setAssigningTicketId(ticketId);
    setShowAssignModal(true);
  };

  if (isLoading) return <LoadingPage message="Loading all tickets..." />;

  const columns = [
    { header: 'Ticket #', accessor: 'ticketNumber', cell: row => <span className="font-bold text-primary-600">{row.ticketNumber}</span> },
    { header: 'Service', accessor: 'serviceType', cell: row => <span className="capitalize">{row.serviceType.replace('_', ' ')}</span> },
    { header: 'Priority', accessor: 'priority', cell: row => (
        <span className={`capitalize font-medium ${row.priority === 'urgent' ? 'text-red-500' : row.priority === 'high' ? 'text-orange-500' : 'text-slate-600'}`}>
          {row.priority}
        </span>
      ) 
    },
    { header: 'Status', accessor: 'status', cell: row => <Badge color="blue">{row.status.replace(/_/g, ' ')}</Badge> },
    { header: 'Created', accessor: 'createdAt', cell: row => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Action', cell: row => row.status === 'new' ? (
        <Button size="sm" variant="secondary" className="flex items-center space-x-1" onClick={(e) => openAssignModal(e, row.id)}>
          <UserPlus className="w-4 h-4" />
          <span>Assign</span>
        </Button>
      ) : null 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">All Tickets</h1>
          <p className="text-slate-500 mt-1">Platform-wide service request management</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <PlusCircle className="w-5 h-5" />
          <span>Create Ticket</span>
        </Button>
      </div>

      <GlassCard className="!p-0">
        <DataTable 
          columns={columns} 
          data={tickets || []} 
          onRowClick={(row) => navigate(`/admin/tickets/${row.id}`)}
        />
      </GlassCard>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl relative my-8">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Ticket</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Customer Name" name="customerName" value={createData.customerName} onChange={handleCreateChange} required />
                <Input label="Customer Email" type="email" name="customerEmail" value={createData.customerEmail} onChange={handleCreateChange} required />
                <Input label="Customer Phone" name="customerPhone" value={createData.customerPhone} onChange={handleCreateChange} required />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Service Type</label>
                  <select name="serviceType" value={createData.serviceType} onChange={handleCreateChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all">
                    <option value="installation">Installation</option>
                    <option value="complaint">Complaint / Repair</option>
                    <option value="device_replacement">Device Replacement</option>
                    <option value="amc_support">AMC Support</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Priority</label>
                  <select name="priority" value={createData.priority} onChange={handleCreateChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Issue Description</label>
                <textarea name="issueDescription" value={createData.issueDescription} onChange={handleCreateChange} required rows={3} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"></textarea>
              </div>

              <h3 className="font-semibold text-slate-800 pt-2">Service Address</h3>
              <Input label="Street Address" name="svcAddress" value={createData.svcAddress} onChange={handleCreateChange} required />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="City" name="svcCity" value={createData.svcCity} onChange={handleCreateChange} required />
                <Input label="State" name="svcState" value={createData.svcState} onChange={handleCreateChange} required />
                <Input label="Pincode" name="svcPincode" value={createData.svcPincode} onChange={handleCreateChange} required />
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Assign Ticket Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md relative">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Assign Ticket</h2>
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Select Assignee</label>
                <select 
                  value={assignData.assigneeId} 
                  onChange={(e) => setAssignData({ assigneeId: e.target.value })} 
                  className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  required
                >
                  <option value="">-- Choose Technician or Partner --</option>
                  <optgroup label="Internal Technicians">
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                  </optgroup>
                  <optgroup label="External Partners">
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                  </optgroup>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAssignModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={assignMutation.isPending || !assignData.assigneeId}>
                  {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default AllTicketsPage;
