import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { GlassCard } from '../../components/ui/Components';
import { LoadingPage } from '../../components/ui/Loading';
import { Ticket, MapPin, Wrench, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const assignmentStatusConfig = {
  pending:  { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  accepted: { label: 'Accepted',       cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  rejected: { label: 'Rejected by You',cls: 'bg-red-100 text-red-700 border border-red-200' },
};

const ticketStatusConfig = {
  partner_assigned: { label: 'Awaiting Response', cls: 'bg-amber-50 text-amber-600' },
  partner_accepted: { label: 'Accepted', cls: 'bg-blue-50 text-blue-700' },
  technician_assigned: { label: 'Tech Assigned', cls: 'bg-indigo-50 text-indigo-700' },
  accepted: { label: 'Tech Accepted', cls: 'bg-cyan-50 text-cyan-700' },
  on_site: { label: 'On Site', cls: 'bg-orange-50 text-orange-700' },
  work_in_progress: { label: 'In Progress', cls: 'bg-yellow-50 text-yellow-700' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', cls: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700' },
};

const IncomingTicketsPage = () => {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useTickets();

  if (isLoading) return <LoadingPage message="Loading your assigned tickets..." />;

  const pendingTickets   = tickets.filter(t => t.assignmentStatus === 'pending');
  const activeTickets    = tickets.filter(t => t.assignmentStatus === 'accepted' && !['completed', 'closed'].includes(t.status));
  const completedTickets = tickets.filter(t => ['completed', 'closed'].includes(t.status));
  const rejectedTickets  = tickets.filter(t => t.assignmentStatus === 'rejected');

  const TicketCard = ({ ticket }) => {
    const asCfg = assignmentStatusConfig[ticket.assignmentStatus] || { label: ticket.assignmentStatus || 'assigned', cls: 'bg-slate-100 text-slate-600' };
    const stCfg = ticketStatusConfig[ticket.status] || { label: ticket.status?.replace(/_/g, ' '), cls: 'bg-slate-50 text-slate-600' };

    return (
      <div
        onClick={() => navigate(`/partner/tickets/${ticket.id}`)}
        className={`border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group ${
          ticket.assignmentStatus === 'rejected'
            ? 'bg-red-50/40 border-red-100 hover:border-red-200'
            : 'bg-white border-slate-200/80 hover:border-primary-300'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <span className="font-bold text-primary-600 text-sm group-hover:underline">
              #{ticket.ticketNumber}
            </span>
            <span className="text-xs text-slate-400">
              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${asCfg.cls}`}>
              {asCfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${stCfg.cls}`}>
              {stCfg.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize font-medium">{ticket.serviceType?.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-500">{[ticket.svcCity, ticket.svcState].filter(Boolean).join(', ')}</span>
          </div>
        </div>
      </div>
    );
  };

  const SectionBlock = ({ title, icon: Icon, iconClass, tickets: list, emptyMsg }) => (
    <div>
      <div className={`flex items-center gap-2 mb-3`}>
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{list.length}</span>
      </div>
      {list.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
          {emptyMsg}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(t => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Incoming Assignments</h1>
          <p className="text-slate-500 mt-1 text-sm">Accept or reject service requests assigned to your company</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center shadow-sm">
          <div className="text-2xl font-bold text-primary-600">{tickets.length}</div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <GlassCard className="p-12 text-center border border-slate-200/60 bg-white">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">No tickets assigned to your company yet.</p>
          <p className="text-slate-400 text-sm mt-1">Assigned tickets will appear here when the admin assigns them to you.</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 border border-slate-200/60 bg-white space-y-8">
          <SectionBlock
            title="Pending Your Response"
            icon={AlertCircle}
            iconClass="text-amber-500"
            tickets={pendingTickets}
            emptyMsg="No pending tickets awaiting your response."
          />
          <SectionBlock
            title="Active Assignments"
            icon={Clock}
            iconClass="text-blue-500"
            tickets={activeTickets}
            emptyMsg="No active assignments at the moment."
          />
          <SectionBlock
            title="Completed"
            icon={CheckCircle2}
            iconClass="text-emerald-500"
            tickets={completedTickets}
            emptyMsg="No completed tickets yet."
          />
          {rejectedTickets.length > 0 && (
            <SectionBlock
              title="Rejected Assignments"
              icon={XCircle}
              iconClass="text-red-400"
              tickets={rejectedTickets}
              emptyMsg=""
            />
          )}
        </GlassCard>
      )}
    </div>
  );
};

export default IncomingTicketsPage;
