import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTickets } from '../../hooks/useTickets';
import { adminApi } from '../../api/adminApi';
import { DataTable } from '../../components/common/DataTable';
import { Badge, GlassCard, Button, Input } from '../../components/ui/Components';
import { PlusCircle, X, UserPlus, Search, RotateCcw } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

/* ─── Status configuration ──────────────────────────────────────────────── */
const STATUS_FILTERS = [
  { value: 'all',                 label: 'All',              bg: 'bg-slate-100',   text: 'text-slate-600',   active: 'bg-slate-800 text-white'   },
  { value: 'new',                 label: 'New',              bg: 'bg-slate-50',    text: 'text-slate-500',   active: 'bg-slate-600 text-white'   },
  { value: 'partner_assigned',    label: 'Partner Assigned', bg: 'bg-amber-50',    text: 'text-amber-600',   active: 'bg-amber-500 text-white'   },
  { value: 'partner_accepted',    label: 'Partner Accepted', bg: 'bg-blue-50',     text: 'text-blue-600',    active: 'bg-blue-600 text-white'    },
  { value: 'technician_assigned', label: 'Tech Assigned',    bg: 'bg-indigo-50',   text: 'text-indigo-600',  active: 'bg-indigo-600 text-white'  },
  { value: 'accepted',            label: 'Tech Accepted',    bg: 'bg-cyan-50',     text: 'text-cyan-600',    active: 'bg-cyan-600 text-white'    },
  { value: 'work_in_progress',    label: 'In Progress',      bg: 'bg-yellow-50',   text: 'text-yellow-700',  active: 'bg-yellow-500 text-white'  },
  { value: 'completed',           label: 'Completed',        bg: 'bg-emerald-50',  text: 'text-emerald-600', active: 'bg-emerald-600 text-white' },
  { value: 'closed',              label: 'Closed',           bg: 'bg-green-50',    text: 'text-green-600',   active: 'bg-green-600 text-white'   },
  { value: 'cancelled',           label: 'Cancelled',        bg: 'bg-red-50',      text: 'text-red-500',     active: 'bg-red-500 text-white'     },
];


const AllTicketsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tickets, isLoading } = useTickets();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState(null);

  /* ── Filter state ── */
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');

  // Form states
  const [createData, setCreateData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    serviceType: 'installation', issueDescription: '', priority: 'medium',
    svcAddress: '', svcCity: '', svcState: '', svcPincode: ''
  });
  const [assignData, setAssignData] = useState({ assigneeId: '' });

  // Data fetching for Customers and Assignment dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customersWithAddresses'],
    queryFn: async () => {
      try {
        const res = await adminApi.getCustomersWithAddresses();
        console.log("CUSTOMERS QUERY FETCH SUCCESS:", res.data);
        return res.data;
      } catch (err) {
        console.error("CUSTOMERS QUERY FETCH ERROR:", err);
        throw err;
      }
    }
  });

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
      queryClient.invalidateQueries(['customersWithAddresses']);
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


  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData(prev => {
      const updated = { ...prev, [name]: value };
      
      console.log("CREATE CHANGE - Name:", name, "Value:", value, "Customers Loaded:", customers.length);
      
      // If typing email or phone, check if it matches an existing customer
      if (name === 'customerEmail' || name === 'customerPhone') {
        const trimmed = value.trim().toLowerCase();
        const match = customers.find(c => {
          if (name === 'customerEmail') {
            return c.email && c.email.trim().toLowerCase() === trimmed;
          } else {
            // Clean both phone numbers to only digits for robust comparison
            const cleanInput = value.replace(/\D/g, '');
            const cleanCustomerPhone = (c.phone || '').replace(/\D/g, '');
            return cleanCustomerPhone && cleanInput && (cleanCustomerPhone === cleanInput || (cleanInput.length >= 10 && cleanCustomerPhone.endsWith(cleanInput)));
          }
        });
        
        if (match) {
          console.log("CUSTOMER MATCH FOUND:", match);
          return {
            ...updated,
            customerName: match.name || updated.customerName,
            customerEmail: match.email || updated.customerEmail,
            customerPhone: match.phone || updated.customerPhone,
            svcAddress: match.svc_address || updated.svcAddress,
            svcCity: match.svc_city || updated.svcCity,
            svcState: match.svc_state || updated.svcState,
            svcPincode: match.svc_pincode || updated.svcPincode
          };
        } else {
          console.log("NO MATCH FOUND FOR:", trimmed);
        }
      }
      
      return updated;
    });
  };

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

  /* ── Filtered tickets ── */
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.svcCity?.toLowerCase().includes(q) ||
        t.serviceType?.toLowerCase().includes(q)
      );
      return matchStatus && matchSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  /* ── Status counts ── */
  const countFor = (status) =>
    status === 'all' ? (tickets || []).length : (tickets || []).filter(t => t.status === status).length;

  const hasFilters = statusFilter !== 'all' || !!searchQuery;
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
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
    { header: 'Action', cell: row => {
        const canAssign = row.status === 'new';
        const canReassign = !['new', 'completed', 'closed', 'cancelled'].includes(row.status);
        
        if (canAssign) {
          return (
            <Button size="sm" variant="secondary" className="flex items-center space-x-1" onClick={(e) => openAssignModal(e, row.id)}>
              <UserPlus className="w-4 h-4" />
              <span>Assign</span>
            </Button>
          );
        }
        
        if (canReassign) {
          return (
            <Button size="sm" variant="secondary" className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200" onClick={(e) => openAssignModal(e, row.id)}>
              <UserPlus className="w-4 h-4" />
              <span>Reassign</span>
            </Button>
          );
        }
        
        return null;
      } 
    }
  ];

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">All Tickets</h1>
          <p className="text-slate-500 mt-1 text-sm">Platform-wide service request management</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <PlusCircle className="w-5 h-5" />
          <span>Create Ticket</span>
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">

        {/* Search row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticket #, city, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-700 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* Result count */}
          <span className="text-xs font-semibold text-slate-400 ml-auto">
            {filteredTickets.length} of {(tickets || []).length} tickets
          </span>
        </div>

        {/* Status chip row */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(sf => {
            const count = countFor(sf.value);
            if (sf.value !== 'all' && count === 0) return null;
            const isActive = statusFilter === sf.value;
            return (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? `${sf.active} border-transparent shadow-sm`
                    : `${sf.bg} ${sf.text} border-transparent hover:border-slate-200`
                }`}
              >
                {sf.label}
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <GlassCard className="!p-0">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No tickets match your filters</p>
            <button onClick={clearFilters} className="mt-2 text-sm text-primary-500 hover:underline font-medium">
              Clear all filters
            </button>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredTickets} 
            onRowClick={(row) => navigate(`/admin/tickets/${row.id}`)}
          />
        )}
      </GlassCard>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 relative my-8 max-h-[90vh] overflow-y-auto text-slate-800">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Ticket</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Input label="Customer Name" name="customerName" value={createData.customerName} onChange={handleCreateChange} required />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Service Type</label>
                  <select name="serviceType" value={createData.serviceType} onChange={handleCreateChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm text-slate-800">
                    <option value="installation">Installation</option>
                    <option value="complaint">Complaint / Repair</option>
                    <option value="device_replacement">Device Replacement</option>
                    <option value="amc_support">AMC Support</option>
                  </select>
                </div>

                <Input label="Customer Email" type="email" name="customerEmail" value={createData.customerEmail} onChange={handleCreateChange} required />
                <Input label="Customer Phone" name="customerPhone" value={createData.customerPhone} onChange={handleCreateChange} required />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Issue Description</label>
                <textarea name="issueDescription" value={createData.issueDescription} onChange={handleCreateChange} required rows={3} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-sm text-slate-800" placeholder="Describe the issue in detail..."></textarea>
              </div>

              <h3 className="font-semibold text-slate-800 pt-2 border-t border-slate-100">Service Address</h3>
              <Input label="Street Address" name="svcAddress" value={createData.svcAddress} onChange={handleCreateChange} required />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="City" name="svcCity" value={createData.svcCity} onChange={handleCreateChange} required />
                <Input label="State" name="svcState" value={createData.svcState} onChange={handleCreateChange} required />
                <Input label="Pincode" name="svcPincode" value={createData.svcPincode} onChange={handleCreateChange} required />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 mt-6">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Ticket Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 relative text-slate-800">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Assign Ticket</h2>
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Select Assignee</label>
                <select 
                  value={assignData.assigneeId} 
                  onChange={(e) => setAssignData({ assigneeId: e.target.value })} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm text-slate-800"
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
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 mt-6">
                <Button variant="secondary" onClick={() => setShowAssignModal(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={assignMutation.isPending || !assignData.assigneeId}>
                  {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTicketsPage;
