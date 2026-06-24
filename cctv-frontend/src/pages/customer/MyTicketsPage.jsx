import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useMyQueries } from '../../hooks/useTickets';
import { TicketCard } from '../../components/tickets/TicketCard';
import { GlassCard, Badge, Button } from '../../components/ui/Components';
import { FileText, Wrench } from 'lucide-react';
import { LoadingPage } from '../../components/ui/Loading';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: queries, isLoading: queriesLoading } = useMyQueries();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'queries'

  if (ticketsLoading || queriesLoading) return <LoadingPage message="Loading your dashboard..." />;

  const queryCount = queries?.length || 0;
  const ticketCount = tickets?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Dashboard</h1>
          <p className="text-slate-500 mt-1">Track and manage your enquiries and service requests</p>
        </div>
        <button 
          onClick={() => navigate('/customer/tickets/new')}
          className="btn-primary shrink-0"
        >
          Submit New Query
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'tickets' 
              ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Active Tickets
          <Badge color={activeTab === 'tickets' ? 'emerald' : 'slate'}>{ticketCount}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'queries' 
              ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Enquiries & Quotations
          <Badge color={activeTab === 'queries' ? 'blue' : 'slate'}>{queryCount}</Badge>
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'queries' && (
          <div>
            {queryCount === 0 ? (
              <GlassCard className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-slate-500 mb-4 font-medium">You don't have any enquiries or quotations.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queries.map(q => (
                  <GlassCard key={q.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">{q.issue_type?.replace(/_/g, ' ')}</span>
                        <Badge color={q.query_status === 'received' ? 'blue' : q.query_status === 'converted_to_lead' ? 'yellow' : 'green'}>
                          {q.query_status?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-4 line-clamp-2">{q.description}</p>
                    </div>
                    
                    {q.quotation_status === 'sent' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold">Quotation Total</p>
                          <p className="font-bold text-lg text-blue-600">₹{q.total_amount}</p>
                        </div>
                        <Button onClick={() => navigate(`/quotation/${q.accept_token}`)} size="sm">
                          Review Quotation
                        </Button>
                      </div>
                    )}
                    {q.quotation_status === 'accepted' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                        <Badge color="green">Quotation Accepted</Badge>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            {!ticketCount ? (
              <GlassCard className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8" />
                </div>
                <p className="text-slate-500 mb-4 font-medium">You don't have any active service requests.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map(ticket => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onClick={() => navigate(`/customer/tickets/${ticket.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default MyTicketsPage;
