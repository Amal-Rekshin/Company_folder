import React from 'react';
import { GlassCard } from '../../components/ui/Components';

const ScheduleCalendarPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Schedule</h1>
          <p className="text-slate-500 mt-1">Calendar view of your upcoming jobs</p>
        </div>
      </div>
      <GlassCard className="py-12 text-center">
        <p className="text-slate-500">Calendar view coming soon.</p>
      </GlassCard>
    </div>
  );
};

export default ScheduleCalendarPage;
