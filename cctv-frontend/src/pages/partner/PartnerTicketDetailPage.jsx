import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../../api/ticketApi';
import { assignmentApi } from '../../api/assignmentApi';
import { GlassCard, Button } from '../../components/ui/Components';
import {
  ArrowLeft, CheckCircle2, XCircle, UserCog, MapPin, Wrench,
  CalendarDays, Hash, ClipboardList, Clock, Users, AlertTriangle,
  Loader2, Ban
} from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_MAP = {
  new:                { label: 'New',                 bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'  },
  partner_assigned:   { label: 'Pending Review',      bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'  },
  partner_accepted:   { label: 'Accepted',            bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  technician_assigned:{ label: 'Tech Assigned',       bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  accepted:           { label: 'Tech Accepted',       bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500'   },
  visit_scheduled:    { label: 'Visit Scheduled',     bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  on_site:            { label: 'On Site',             bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  work_in_progress:   { label: 'In Progress',         bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  completed:          { label: 'Completed',           bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500'},
  closed:             { label: 'Closed',              bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-500'  },
  cancelled:          { label: 'Cancelled',           bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400'    },
};

/* ─── Timeline steps (partner view) ───────────────────────────────────────────── */
const TIMELINE_STEPS = [
  { key: 'partner_assigned', label: 'Assigned to You' },
  { key: 'partner_accepted', label: 'Accepted'        },
  { key: 'completed',        label: 'Completed'       },
];

const REJECTED_STEPS = [
  { key: 'partner_assigned', label: 'Assigned to You', done: true  },
  { key: 'rejected',         label: 'You Rejected',    done: true, isRejected: true },
];

const STEP_ORDER = TIMELINE_STEPS.map(s => s.key);

// Map all intermediate statuses back to the right step index for the partner
function getActiveStep(status) {
  if (['completed', 'closed'].includes(status)) return 2;
  if (['partner_accepted', 'technician_assigned', 'accepted', 'visit_scheduled', 'on_site', 'work_in_progress'].includes(status)) return 1;
  return 0; // new, partner_assigned, or anything else
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
};

/* ─── Info row ───────────────────────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, iconClass = 'text-primary-500' }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} />
      {value || <span className="text-slate-400 font-normal">—</span>}
    </span>
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────────── */
const PartnerTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [technicianName, setTechnicianName] = useState('');
  const [actionError, setActionError] = useState('');

  /* ── Ticket ── */
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id).then(r => r.data),
    enabled: !!id,
  });

  /* ── Assignment record (direct lookup by ticket ID) ── */
  const { data: assignment, isLoading: asgLoading } = useQuery({
    queryKey: ['partner-assignment-by-ticket', id],
    queryFn: () => assignmentApi.getPartnerAssignmentByTicket(id).then(r => r.data),
    enabled: !!id,
    retry: false,                 // don't retry 404s
    onError: () => {},            // suppress console error for 404
  });

  const assignmentId = assignment?.id;

  /* ── Mutations ── */
  const invalidate = () => {
    queryClient.invalidateQueries(['ticket', id]);
    queryClient.invalidateQueries(['partner-assignment-by-ticket', id]);
    queryClient.invalidateQueries(['tickets']);
  };

  const acceptMutation = useMutation({
    mutationFn: () => {
      if (!assignmentId) throw new Error('Assignment record not loaded yet');
      return assignmentApi.partnerAcceptJob(assignmentId);
    },
    onSuccess: () => { setActionError(''); invalidate(); },
    onError: (err) => setActionError(err.response?.data?.error || err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!assignmentId) throw new Error('Assignment record not loaded yet');
      return assignmentApi.partnerRejectJob(assignmentId, rejectReason);
    },
    onSuccess: () => {
      setActionError('');
      invalidate();
      setShowRejectModal(false);
      navigate('/partner');
    },
    onError: (err) => setActionError(err.response?.data?.error || err.message),
  });

  const assignTechMutation = useMutation({
    mutationFn: () => {
      if (!assignmentId) throw new Error('Assignment record not loaded yet');
      if (!technicianName.trim()) throw new Error('Please enter a technician name');
      return assignmentApi.partnerAssignTech(assignmentId, { technicianName: technicianName.trim() });
    },
    onSuccess: () => { setActionError(''); setTechnicianName(''); invalidate(); },
    onError: (err) => setActionError(err.response?.data?.error || err.message),
  });

  if (ticketLoading) return <LoadingPage message="Loading ticket details..." />;

  const activeStep = getActiveStep(ticket?.status);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Assignments
        </button>
        <div className="flex items-center gap-2">
          {assignment?.status === 'rejected' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Rejected by You
            </span>
          )}
          {ticket && assignment?.status !== 'rejected' && <StatusBadge status={ticket.status} />}
        </div>
      </div>

      {/* ── Title strip ── */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-6 py-5 text-white shadow-lg shadow-primary-200">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2.5">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-primary-200 uppercase tracking-widest mb-0.5">Ticket</div>
            <h1 className="text-2xl font-extrabold tracking-tight">#{ticket?.ticketNumber}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: Ticket details + Timeline ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Details card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Ticket Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
              <InfoRow icon={Wrench}       label="Service Type"   value={ticket?.serviceType?.replace(/_/g, ' ')} />
              <InfoRow icon={CalendarDays} label="Created"        value={ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
              <div className="col-span-2 sm:col-span-3">
                <InfoRow
                  icon={MapPin}
                  label="Service Location"
                  value={[ticket?.svcAddress, ticket?.svcCity, ticket?.svcState, ticket?.svcPincode].filter(Boolean).join(', ')}
                  iconClass="text-rose-400"
                />
              </div>
            </div>

            {/* Issue description */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Issue Description</span>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[60px]">
                {ticket?.issueDescription || <span className="text-slate-400 italic">No description provided.</span>}
              </p>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Progress Timeline</h2>

            {/* ── REJECTED timeline ── */}
            {assignment?.status === 'rejected' ? (
              <div className="relative">
                <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-slate-100" />
                <div className="space-y-5">
                  {REJECTED_STEPS.map((step) => (
                    <div key={step.key} className="flex items-center gap-4 relative">
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        step.isRejected
                          ? 'bg-red-500 shadow-red-200 shadow-md'
                          : step.done
                          ? 'bg-emerald-500 shadow-emerald-200 shadow-md'
                          : 'bg-white border-2 border-slate-200'
                      }`}>
                        {step.isRejected ? (
                          <XCircle className="w-4 h-4 text-white" />
                        ) : step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-semibold ${
                          step.isRejected ? 'text-red-600' : step.done ? 'text-slate-600' : 'text-slate-300'
                        }`}>
                          {step.label}
                        </span>
                        {step.isRejected && (
                          <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rejection callout */}
                <div className="mt-5 pt-4 border-t border-red-50">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-red-100 rounded-full p-1.5 flex-shrink-0">
                      <Ban className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-700">Assignment Rejected</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        You rejected this assignment. The ticket has been returned to the admin queue for reassignment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── NORMAL timeline ── */
              <div className="relative">
                {/* connector line */}
                <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-slate-100" />
                <div className="space-y-5">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const done    = idx < activeStep;
                    const current = idx === activeStep;
                    return (
                      <div key={step.key} className="flex items-center gap-4 relative">
                        <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          done    ? 'bg-emerald-500 shadow-emerald-200 shadow-md' :
                          current ? 'bg-primary-600 shadow-primary-200 shadow-md ring-4 ring-primary-100' :
                                    'bg-white border-2 border-slate-200'
                        }`}>
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : current ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-semibold ${
                            done ? 'text-slate-600' : current ? 'text-primary-700' : 'text-slate-300'
                          }`}>
                            {step.label}
                          </span>
                          {current && (
                            <span className="ml-2 text-[10px] font-bold bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Partner Actions ── */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <div className="bg-primary-50 rounded-lg p-1.5">
                <UserCog className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Partner Actions</h2>
            </div>

            {/* Loading state */}
            {asgLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading assignment...
              </div>
            )}

            {/* Error */}
            {actionError && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {actionError}
              </div>
            )}

            {/* ── REJECTED ── */}
            {assignment?.status === 'rejected' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-1.5 flex-shrink-0 mt-0.5">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">You rejected this assignment</p>
                    <p className="text-xs text-red-500 mt-1">
                      The ticket has been returned to the admin for reassignment to another partner.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── PENDING: accept/reject ── */}
            {ticket?.status === 'partner_assigned' && !asgLoading && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-700 leading-relaxed">
                  This ticket has been assigned to your company. Review the details and accept or reject.
                </div>

                <button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || !assignmentId}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-sm shadow-primary-200 hover:shadow-md hover:shadow-primary-300"
                >
                  {acceptMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                    : <><CheckCircle2 className="w-4 h-4" /> Accept Ticket</>
                  }
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejectMutation.isPending || !assignmentId}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 active:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 font-semibold text-sm py-3 px-4 rounded-xl border border-red-200 hover:border-red-300 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Ticket
                </button>

                {!assignmentId && !asgLoading && (
                  <p className="text-xs text-amber-600 text-center pt-1">
                    Could not load assignment — please refresh.
                  </p>
                )}
              </div>
            )}

            {/* ── ACCEPTED: assign technician ── */}
            {ticket?.status === 'partner_accepted' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs font-medium text-emerald-700 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  You accepted this ticket. Enter your technician's name to proceed.
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    <Users className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Technician Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ravi Kumar"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-slate-400"
                  />

                  <button
                    onClick={() => assignTechMutation.mutate()}
                    disabled={!technicianName.trim() || assignTechMutation.isPending || !assignmentId}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-sm shadow-primary-200"
                  >
                    {assignTechMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                      : <><UserCog className="w-4 h-4" /> Assign Technician</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ── Tech assigned ── */}
            {ticket?.status === 'technician_assigned' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700 flex items-start gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Technician has been assigned. Awaiting their acceptance.</span>
              </div>
            )}

            {/* ── Tech accepted / In progress ── */}
            {ticket?.status === 'accepted' && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 text-sm text-cyan-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Technician has accepted the job. Work is in progress.</span>
              </div>
            )}

            {/* ── Completed ── */}
            {['completed', 'closed'].includes(ticket?.status) && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>This ticket has been <strong>completed</strong>. Great work!</span>
              </div>
            )}

            {/* ── Fallback ── */}
            {ticket && !['partner_assigned','partner_accepted','technician_assigned','accepted','completed','closed'].includes(ticket.status) && (
              <div className="text-center text-sm text-slate-400 py-6">
                No actions available for this status.
              </div>
            )}
          </div>

          {/* Quick info card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Info</h3>
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500">Ticket #</span>
              <span className="font-bold text-slate-800">{ticket?.ticketNumber}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500">City</span>
              <span className="font-semibold text-slate-700">{ticket?.svcCity || '—'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Assignment</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${assignmentId ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                {assignmentId ? 'Loaded ✓' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Reject Assignment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ticket #{ticket?.ticketNumber}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Please provide a reason for rejecting this assignment. This will be recorded.</p>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Rejection Reason</label>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  rows={4}
                  placeholder="e.g. Unavailability of technicians in this area..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>

              {actionError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {actionError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRejectModal(false); setActionError(''); }}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectMutation.mutate()}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all"
                >
                  {rejectMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</>
                    : <><XCircle className="w-4 h-4" /> Confirm Reject</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerTicketDetailPage;
