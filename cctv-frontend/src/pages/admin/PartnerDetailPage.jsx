import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { ArrowLeft, FileText, User, Check, X } from 'lucide-react';
import { Loading } from '../../components/ui/Loading';

const TicketStatusVerticalTimeline = ({ status }) => {
  const steps = [
    { key: 'new', label: 'Created', desc: 'Ticket successfully created' },
    { key: 'assigned', label: 'Assigned', desc: 'Assigned to service provider' },
    { key: 'on_site', label: 'On Site', desc: 'Technician is on-site' },
    { key: 'in_progress', label: 'In Progress', desc: 'Service work is in progress' },
    { key: 'completed', label: 'Completed', desc: 'Work marked as completed' },
    { key: 'closed', label: 'Closed', desc: 'Ticket closed and settled' }
  ];

  let activeIndex = 0;
  if (['closed'].includes(status)) activeIndex = 5;
  else if (['completed'].includes(status)) activeIndex = 4;
  else if (status.includes('progress') || status.includes('estimate')) activeIndex = 3;
  else if (['on_site', 'visit_scheduled'].includes(status)) activeIndex = 2;
  else if (status.includes('assigned') || status.includes('accepted') || status.includes('pending')) activeIndex = 1;
  else activeIndex = 0;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ticket Status Timeline</div>
      <div className="relative pl-6 space-y-4">
        {/* Vertical Line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-slate-100"></div>

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div key={step.key} className="relative flex items-start gap-3">
              {/* Timeline dot */}
              <div className="absolute -left-[23px] top-0.5 flex items-center justify-center">
                {isCompleted ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="flex flex-col">
                <span className={`text-xs font-semibold ${isActive ? 'text-primary-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                    {step.desc}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PartnerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'edit'
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  const [editFormData, setEditFormData] = useState({
    companyName: '', commissionRate: '', name: '', email: '', phone: '', is_active: true
  });

  const { data: partnerDetails, isLoading } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const { data } = await adminApi.getPartner(id);
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (partnerDetails) {
      setEditFormData({
        companyName: partnerDetails.company_name || '',
        commissionRate: partnerDetails.commission_rate || '',
        name: partnerDetails.name || '',
        email: partnerDetails.email || '',
        phone: partnerDetails.phone || '',
        is_active: partnerDetails.is_active ?? true
      });
      setExpandedTicketId(null);
    }
  }, [partnerDetails]);

  const updateMutation = useMutation({
    mutationFn: (data) => adminApi.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['partners']);
      queryClient.invalidateQueries(['partner', id]);
      setActiveTab('tickets');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminApi.toggleUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['partners']);
      queryClient.invalidateQueries(['partner', id]);
    }
  });

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(editFormData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading message="Loading partner details..." />
      </div>
    );
  }

  if (!partnerDetails) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
        <p className="text-slate-500 font-semibold mb-4">Partner not found.</p>
        <Button onClick={() => navigate('/admin/partners')} className="flex items-center space-x-2 mx-auto">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Partners</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="secondary" 
          onClick={() => navigate('/admin/partners')}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs shadow-sm bg-white border-slate-200/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Partners</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Read-only Profile Card */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 border border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white/70">
            <h2 className="text-lg font-bold border-b border-slate-100 pb-2.5 mb-4 text-slate-800">Partner Details</h2>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Company Name</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{partnerDetails.company_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact Person</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{partnerDetails.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{partnerDetails.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Phone Number</span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">{partnerDetails.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Commission Rate</span>
                <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-100 inline-block mt-1">
                  {partnerDetails.commission_rate}%
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Status</span>
                <button 
                  onClick={() => toggleMutation.mutate()}
                  disabled={toggleMutation.isPending}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
                    partnerDetails.is_active 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200'
                  }`}
                  title="Click to toggle status"
                >
                  {partnerDetails.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6 border border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white">
            {/* Tab Switcher */}
            <div className="flex border-b border-slate-200 mb-6">
              <button 
                onClick={() => setActiveTab('tickets')}
                className={`pb-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all mr-8 ${
                  activeTab === 'tickets' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Assigned Tickets ({partnerDetails.tickets?.length || 0})</span>
              </button>
              <button 
                onClick={() => setActiveTab('edit')}
                className={`pb-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all ${
                  activeTab === 'edit' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === 'tickets' && (
                <div className="space-y-4">
                  {(!partnerDetails.tickets || partnerDetails.tickets.length === 0) ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                      No tickets currently assigned to this partner.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {partnerDetails.tickets.map((t) => {
                        const isExpanded = expandedTicketId === t.id;
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                            className={`p-4 bg-white border rounded-xl hover:shadow-md transition-all cursor-pointer flex flex-col space-y-3 ${
                              isExpanded ? 'border-primary-500 shadow-sm ring-1 ring-primary-500/20' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <Link 
                                  to={`/admin/tickets/${t.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-bold text-primary-600 hover:text-primary-700 hover:underline text-sm"
                                >
                                  {t.ticket_number}
                                </Link>
                                <span className="text-xs text-slate-400 font-medium">
                                  Created on {new Date(t.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  t.assignment_status === 'accepted' || t.assignment_status === 'partner_accepted' ? 'bg-green-50 text-green-600 border border-green-100' :
                                  t.assignment_status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-slate-50 text-slate-600 border border-slate-100'
                                }`}>
                                  {t.assignment_status || 'assigned'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  t.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  t.status === 'partner_assigned' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-2.5">
                              <span>Service Type: <strong className="capitalize text-slate-700 font-semibold">{t.service_type.replace('_', ' ')}</strong></span>
                              <span className="text-[10px] text-slate-400">Click card to toggle status timeline</span>
                            </div>
                            
                            {isExpanded && (
                              <TicketStatusVerticalTimeline status={t.status} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'edit' && (
                <form onSubmit={handleEditSubmit} className="space-y-4 max-w-xl">
                  <Input label="Company Name" name="companyName" value={editFormData.companyName} onChange={handleEditInputChange} required />
                  <Input label="Commission Rate (%)" type="number" step="0.1" name="commissionRate" value={editFormData.commissionRate} onChange={handleEditInputChange} required />
                  <Input label="Contact Person" name="name" value={editFormData.name} onChange={handleEditInputChange} required />
                  <Input label="Email Address" type="email" name="email" value={editFormData.email} onChange={handleEditInputChange} required />
                  <Input label="Phone Number" name="phone" value={editFormData.phone} onChange={handleEditInputChange} required />
                  
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block">Status</label>
                      <span className="text-xs text-slate-500">Toggle whether this partner is active</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="is_active"
                        checked={editFormData.is_active} 
                        onChange={handleEditInputChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                    <Button variant="secondary" onClick={() => navigate('/admin/partners')} type="button">Cancel</Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default PartnerDetailPage;
