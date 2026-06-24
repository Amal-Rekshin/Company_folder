import React from 'react';
import { GlassCard, Badge } from '../components/ui/Components';
import { Ticket, Clock, CheckCircle, CreditCard, Activity, Wrench, Users, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/ui/Loading';import { Link } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) return <LoadingPage message="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your service requests.</p>
        </div>
        {/* <button className="btn-primary flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          New Ticket
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer group">
          <div className="p-4 bg-primary-100 text-primary-600 rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-colors">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Tickets</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.totalTickets || 0}</p>
          </div>
        </GlassCard>
        
        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer group">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Tickets</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.activeTickets || 0}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer group">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Completed Jobs</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.completedTickets || 0}</p>
          </div>
        </GlassCard>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Tickets</h2>
        <GlassCard className="!p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Ticket ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Service</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-slate-800">TICK-20231024-1001</td>
                <td className="py-4 px-6 text-slate-600">Camera Installation</td>
                <td className="py-4 px-6"><Badge color="yellow">Estimate Pending</Badge></td>
                <td className="py-4 px-6 text-slate-500">Oct 24, 2023</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-medium text-slate-800">TICK-20231022-0998</td>
                <td className="py-4 px-6 text-slate-600">DVR Maintenance</td>
                <td className="py-4 px-6"><Badge color="green">Completed</Badge></td>
                <td className="py-4 px-6 text-slate-500">Oct 22, 2023</td>
              </tr>
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboard();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) return <LoadingPage message="Loading admin overview..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Control Center</h1>
          <p className="text-slate-500 mt-1">Platform overview and key metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform group">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors"><Activity className="w-6 h-6" /></div>
          <div><p className="text-slate-500 text-sm font-medium">Total Tickets</p><p className="text-3xl font-bold text-slate-800">{stats?.totalTickets || 0}</p></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform group">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-slate-500 text-sm font-medium">Open Tickets</p><p className="text-3xl font-bold text-slate-800">{stats?.openTickets || 0}</p></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform group">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CreditCard className="w-6 h-6" /></div>
          <div><p className="text-slate-500 text-sm font-medium">Revenue</p><p className="text-3xl font-bold text-slate-800">₹{stats?.totalRevenue || 0}</p></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 hover:-translate-y-1 transition-transform group">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Shield className="w-6 h-6" /></div>
          <div><p className="text-slate-500 text-sm font-medium">Active Partners</p><p className="text-3xl font-bold text-slate-800">{stats?.totalPartners || 0}</p></div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Weekly Ticket Volume</h2>
          <div className="h-72 w-full">
            {mounted && stats?.weeklyTicketVolume && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={stats.weeklyTicketVolume}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="tickets" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {(!stats?.weeklyTicketVolume || stats.weeklyTicketVolume.length === 0) && (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                No tickets in the last 7 days.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard dark className="bg-slate-800 text-white">
          <h2 className="text-lg font-bold mb-6">Pending Actions</h2>
          <div className="space-y-4">
            <div className="bg-slate-700/50 p-5 rounded-2xl border border-slate-600/50">
              <p className="font-medium text-sm text-slate-300">Unassigned Tickets</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-3xl font-extrabold">{stats?.unassignedTickets || 0}</span>
                <Link to="/admin/tickets" className="text-xs bg-white text-slate-900 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors">Assign Now</Link>
              </div>
            </div>
            <div className="bg-slate-700/50 p-5 rounded-2xl border border-slate-600/50">
              <p className="font-medium text-sm text-slate-300">Pending Settlements</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-3xl font-extrabold">{stats?.pendingSettlements || 0}</span>
                <Link to="/admin/settlements" className="text-xs bg-white text-slate-900 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors">Process</Link>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export const TechnicianDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-800">My Jobs</h1>
    <GlassCard>
      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl mb-4 hover:border-primary-300 transition-colors cursor-pointer">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">TICK-20231024-1001</h3>
          <p className="text-slate-500 text-sm mt-1">Camera Installation - 123 Main St, City</p>
        </div>
        <Badge color="blue">Assigned</Badge>
      </div>
      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors cursor-pointer">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">TICK-20231023-0988</h3>
          <p className="text-slate-500 text-sm mt-1">DVR Repair - 456 Oak Rd, City</p>
        </div>
        <Badge color="yellow">Work In Progress</Badge>
      </div>
    </GlassCard>
  </div>
);

export const PartnerDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-800">Partner Dashboard</h1>
    <div className="grid grid-cols-2 gap-6">
      <GlassCard>
        <p className="text-slate-500 text-sm">Pending Assignments</p>
        <p className="text-3xl font-bold mt-2">3</p>
      </GlassCard>
      <GlassCard>
        <p className="text-slate-500 text-sm">This Month's Earnings</p>
        <p className="text-3xl font-bold mt-2">$1,250</p>
      </GlassCard>
    </div>
  </div>
);