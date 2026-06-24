import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Calendar, DollarSign, FileText,
  MapPin, Phone, Wrench, Clock, ChevronRight, AlertCircle,
  Plus, Trash2, ArrowLeft, Send
} from 'lucide-react';
import { ticketApi } from '../../api/ticketApi';
import { assignmentApi } from '../../api/assignmentApi';
import { scheduleApi } from '../../api/scheduleApi';
import { estimateApi } from '../../api/estimateApi';
import { GlassCard, Badge, Button } from '../../components/ui/Components';
import { LoadingPage } from '../../components/ui/Loading';

const statusColors = {
  new: 'slate', technician_assigned: 'blue', accepted: 'green',
  visit_scheduled: 'blue', estimate_pending: 'yellow', estimate_approved: 'green',
  work_in_progress: 'yellow', completed: 'green', closed: 'slate',
};

const statusLabel = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '';

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
      <Icon className="w-4 h-4" />
    </div>
    <h2 className="text-base font-semibold text-slate-800">{title}</h2>
  </div>
);

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({ scheduledDate: '', scheduledTime: '' });
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [estimateItems, setEstimateItems] = useState([{ description: '', unitPrice: '', quantity: 1 }]);
  const [estimateNotes, setEstimateNotes] = useState('');
  const [showEstimateForm, setShowEstimateForm] = useState(false);

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id).then(r => r.data),
  });

  const { data: assignment } = useQuery({
    queryKey: ['techAssignment', id],
    queryFn: () => assignmentApi.getTechnicianAssignmentByTicket(id).then(r => r.data),
    retry: false,
  });

  const { data: estimate } = useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimateApi.getLatestEstimate(id).then(r => r.data),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => assignmentApi.techAcceptJob(assignment.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['techAssignment', id]);
      queryClient.invalidateQueries(['ticket', id]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => assignmentApi.techRejectJob(assignment.id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries(['techAssignment', id]);
      queryClient.invalidateQueries(['ticket', id]);
      navigate('/technician');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: () => scheduleApi.scheduleVisit({ ticketId: id, ...scheduleForm }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      setShowScheduleForm(false);
    },
  });

  const createEstimateMutation = useMutation({
    mutationFn: () => estimateApi.createEstimate(id, {
      notes: estimateNotes,
      items: estimateItems.filter(i => i.description.trim()).map(i => ({
        description: i.description,
        unitPrice: parseFloat(i.unitPrice) || 0,
        quantity: parseInt(i.quantity) || 1,
      })),
    }),
    onSuccess: () => queryClient.invalidateQueries(['estimate', id]),
  });

  const submitEstimateMutation = useMutation({
    mutationFn: () => estimateApi.submitEstimate(estimate.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimate', id]);
      queryClient.invalidateQueries(['ticket', id]);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => ticketApi.updateStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      queryClient.invalidateQueries(['techAssignment', id]);
    }
  });

  if (ticketLoading) return <LoadingPage message="Loading job details..." />;
  if (!ticket) return <div className="p-8 text-center text-slate-500">Job not found.</div>;

  const canAcceptReject = assignment && assignment.status === 'pending';
  const canSchedule = assignment?.status === 'accepted' && ticket.status === 'accepted';
  const canCreateEstimate = ['accepted', 'visit_scheduled'].includes(ticket.status) && !estimate;
  const canSubmitEstimate = estimate && estimate.status === 'draft';

  const addItem = () => setEstimateItems(prev => [...prev, { description: '', unitPrice: '', quantity: 1 }]);
  const removeItem = (idx) => setEstimateItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, val) => setEstimateItems(prev =>
    prev.map((item, i) => i === idx ? { ...item, [field]: val } : item)
  );

  const estimateTotal = estimateItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1);
  }, 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate('/technician')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{ticket.ticketNumber}</h1>
          <p className="text-slate-500 mt-1 capitalize">{ticket.serviceType?.replace(/_/g, ' ')}</p>
        </div>
        <Badge color={statusColors[ticket.status] || 'slate'}>{statusLabel(ticket.status)}</Badge>
      </div>

      {/* Accept / Reject Banner */}
      {canAcceptReject && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">New Job Assignment</p>
              <p className="text-amber-700 text-sm mt-1">Please accept or reject this job assignment.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="w-4 h-4" /> Accept Job
            </Button>
            {!showRejectBox ? (
              <Button
                variant="secondary"
                onClick={() => setShowRejectBox(true)}
                className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <XCircle className="w-4 h-4" /> Reject Job
              </Button>
            ) : (
              <div className="w-full flex flex-col gap-2 mt-2">
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
                  rows={2}
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} className="text-sm">
                    Confirm Reject
                  </Button>
                  <Button variant="secondary" onClick={() => setShowRejectBox(false)} className="text-sm">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ticket Info */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <SectionTitle icon={Wrench} title="Job Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Service Type', ticket.serviceType?.replace(/_/g, ' ')],
                ['Ticket Created', new Date(ticket.createdAt).toLocaleDateString()],
                ['City', ticket.svcCity],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-1">{label}</p>
                  <p className="text-slate-800 font-medium capitalize">{value || '—'}</p>
                </div>
              ))}
              {ticket.description && (
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-1">Description</p>
                  <p className="text-slate-700">{ticket.description}</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Address */}
          {ticket.svcAddress && (
            <GlassCard>
              <SectionTitle icon={MapPin} title="Site Address" />
              <p className="text-slate-700 text-sm">
                {ticket.svcAddress}, {ticket.svcCity}
                {ticket.svcState ? `, ${ticket.svcState}` : ''}
                {ticket.svcPincode ? ` - ${ticket.svcPincode}` : ''}
              </p>
            </GlassCard>
          )}

          {/* Schedule Section */}
          <GlassCard>
            <SectionTitle icon={Calendar} title="Schedule Site Visit" />
            {ticket.status === 'visit_scheduled' ? (
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Visit has been scheduled.</p>
              </div>
            ) : canSchedule ? (
              !showScheduleForm ? (
                <button
                  onClick={() => setShowScheduleForm(true)}
                  className="flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Set Visit Date & Time
                </button>
              ) : (
                <form onSubmit={e => { e.preventDefault(); scheduleMutation.mutate(); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Visit Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={scheduleForm.scheduledDate}
                        onChange={e => setScheduleForm(f => ({ ...f, scheduledDate: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Preferred Time</label>
                      <input
                        type="time"
                        value={scheduleForm.scheduledTime}
                        onChange={e => setScheduleForm(f => ({ ...f, scheduledTime: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={scheduleMutation.isPending} className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Confirm Schedule
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                  </div>
                </form>
              )
            ) : (
              <p className="text-slate-400 text-sm">Accept the job first to schedule a visit.</p>
            )}
          </GlassCard>

          {/* Estimate Section */}
          <GlassCard>
            <SectionTitle icon={DollarSign} title="Cost Estimate" />

            {estimate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge color={estimate.status === 'approved' ? 'green' : estimate.status === 'rejected' ? 'red' : estimate.status === 'submitted' ? 'yellow' : 'slate'}>
                    {statusLabel(estimate.status)}
                  </Badge>
                  <span className="text-sm text-slate-500">v{estimate.version}</span>
                </div>

                {estimate.notes && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{estimate.notes}</p>
                )}

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase">Item</th>
                        <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs uppercase">Qty</th>
                        <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs uppercase">Price</th>
                        <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimate.items?.map((item, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="py-3 px-4 text-slate-700">{item.description}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-slate-600">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-800">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 font-semibold text-slate-800">Grand Total</td>
                        <td className="py-3 px-4 text-right font-bold text-primary-600 text-base">
                          ₹{(estimate.approvedTotal ?? estimate.currentTotal ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {canSubmitEstimate && (
                  <Button
                    onClick={() => submitEstimateMutation.mutate()}
                    disabled={submitEstimateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit for Customer Approval
                  </Button>
                )}

                {estimate.status === 'rejected' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
                    <strong>Rejection reason:</strong> {estimate.rejectionReason || 'No reason provided'}
                  </div>
                )}
              </div>
            ) : canCreateEstimate ? (
              !showEstimateForm ? (
                <button
                  onClick={() => setShowEstimateForm(true)}
                  className="flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Cost Estimate
                </button>
              ) : (
                <form onSubmit={e => { e.preventDefault(); createEstimateMutation.mutate(); }} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={estimateNotes}
                      onChange={e => setEstimateNotes(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                      placeholder="Any notes for the customer..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Line Items</label>
                    {estimateItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <input
                          placeholder="Description"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                          className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          min={1}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="w-16 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                        />
                        {estimateItems.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addItem} className="text-sm text-primary-600 flex items-center gap-1 hover:text-primary-700">
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Estimated Total</span>
                    <span className="font-bold text-primary-600 text-lg">₹{estimateTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createEstimateMutation.isPending} className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Save Estimate
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setShowEstimateForm(false)}>Cancel</Button>
                  </div>
                </form>
              )
            ) : (
              <p className="text-slate-400 text-sm">Schedule the site visit first to create an estimate.</p>
            )}
          </GlassCard>
        </div>

        {/* Right: Quick Actions */}
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle icon={FileText} title="Quick Actions" />
            <div className="space-y-3">
              {['accepted', 'visit_scheduled'].includes(ticket.status) && (
                <button
                  onClick={() => updateStatusMutation.mutate('on_site')}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all font-medium text-sm"
                >
                  <MapPin className="w-4 h-4" /> Arrived On-Site
                </button>
              )}
              {ticket.status === 'on_site' && (
                <button
                  onClick={() => updateStatusMutation.mutate('work_in_progress')}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-all font-medium text-sm"
                >
                  <Wrench className="w-4 h-4" /> Start Work (In Progress)
                </button>
              )}
              {['work_in_progress', 'estimate_approved'].includes(ticket.status) && (
                <button
                  onClick={() => updateStatusMutation.mutate('completed')}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-medium text-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Mark as Completed
                </button>
              )}

              {ticket.status !== 'new' && ticket.status !== 'technician_assigned' && (
                <button
                  onClick={() => navigate(`/technician/jobs/${id}/report`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm font-medium text-slate-700">Service Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                </button>
              )}
            </div>
          </GlassCard>

          {/* Status Timeline */}
          <GlassCard>
            <SectionTitle icon={Clock} title="Status" />
            <div className="flex items-start gap-3">
              <div className="mt-1 w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 ring-4 ring-primary-100"></div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{statusLabel(ticket.status)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(ticket.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>

          {/* Assignment status */}
          {assignment && (
            <GlassCard>
              <SectionTitle icon={CheckCircle} title="Assignment" />
              <div className="flex items-center gap-2">
                <Badge color={assignment.status === 'accepted' ? 'green' : assignment.status === 'pending' ? 'yellow' : 'red'}>
                  {assignment.status}
                </Badge>
                <span className="text-xs text-slate-500">{new Date(assignment.assigned_at).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
