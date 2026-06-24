import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { GlassCard } from '../../components/ui/Components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { LoadingPage } from '../../components/ui/Loading';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReportsPage = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ['adminReportDaily'],
    queryFn: () => adminApi.getDailyReport().then(res => res.data)
  });

  const { data: techPerf, isLoading: techLoading } = useQuery({
    queryKey: ['adminReportTechPerf'],
    queryFn: () => adminApi.getTechnicianPerformance().then(res => res.data)
  });

  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ['adminReportAging'],
    queryFn: () => adminApi.getTicketAging().then(res => res.data)
  });

  if (dailyLoading || techLoading || agingLoading) return <LoadingPage message="Loading reports..." />;

  const agingData = aging ? Object.keys(aging).map(key => ({ name: key, value: aging[key] })) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="text-center">
          <p className="text-sm font-medium text-slate-500 uppercase">New Tickets Today</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{daily?.newTickets}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-sm font-medium text-slate-500 uppercase">Completed Today</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{daily?.completedTickets}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-sm font-medium text-slate-500 uppercase">Daily Revenue</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">₹{daily?.totalRevenue}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance Chart */}
        <GlassCard>
          <h2 className="text-lg font-bold mb-4">Technician Performance (Jobs Completed)</h2>
          <div className="h-64">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techPerf}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="jobsCompleted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold mb-4">Ticket Aging</h2>
          <div className="h-64">
            {mounted && agingData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={agingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                No active tickets to display.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ReportsPage;
