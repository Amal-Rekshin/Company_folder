import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Wrench } from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { GlassCard, Badge } from '../../components/ui/Components';
import { LoadingPage } from '../../components/ui/Loading';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusColors = {
  scheduled: 'blue',
  rescheduled: 'yellow',
  completed: 'green',
  cancelled: 'red',
};

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  // Pad start
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  // Pad end to complete grid rows
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateKey(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ScheduleCalendarPage = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['mySchedules'],
    queryFn: () => scheduleApi.getMySchedules().then(r => r.data),
    retry: false,
  });

  if (isLoading) return <LoadingPage message="Loading your schedule..." />;

  const calDays = getCalendarDays(currentYear, currentMonth);

  // Build a map: "YYYY-MM-DD" -> [schedule, ...]
  const scheduleMap = {};
  (schedules || []).forEach(s => {
    const key = toDateKey(s.scheduled_date);
    if (!scheduleMap[key]) scheduleMap[key] = [];
    scheduleMap[key].push(s);
  });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const getDateKey = (day) => {
    if (!day) return null;
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const selectedKey = selectedDay ? getDateKey(selectedDay) : null;
  const selectedSchedules = selectedKey ? (scheduleMap[selectedKey] || []) : [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Upcoming jobs (sorted)
  const allUpcoming = (schedules || [])
    .filter(s => new Date(s.scheduled_date) >= todayStart)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Schedule</h1>
          <p className="text-slate-500 mt-1">Calendar view of your upcoming site visits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <GlassCard>
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDay(null); }}
                  className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((day, idx) => {
                const dateKey = getDateKey(day);
                const isToday = dateKey === todayKey;
                const isSelected = day && selectedDay === day && currentYear === today.getFullYear() || (selectedDay === day);
                const daySchedules = dateKey ? (scheduleMap[dateKey] || []) : [];
                const hasJobs = daySchedules.length > 0;

                return (
                  <button
                    key={idx}
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                      ${!day ? 'cursor-default' : 'hover:bg-primary-50 cursor-pointer'}
                      ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                      ${selectedDay === day && day ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : ''}
                      ${!selectedDay || selectedDay !== day ? 'text-slate-700' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <span className={`font-medium ${isToday && selectedDay !== day ? 'text-primary-600' : ''}`}>
                          {day}
                        </span>
                        {hasJobs && (
                          <div className={`flex gap-0.5 mt-1`}>
                            {daySchedules.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${selectedDay === day ? 'bg-white' : 'bg-primary-500'}`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Selected Day Detail */}
          {selectedDay && (
            <GlassCard className="mt-4">
              <h3 className="font-semibold text-slate-800 mb-4">
                {MONTHS[currentMonth]} {selectedDay}, {currentYear}
              </h3>
              {selectedSchedules.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Nothing assigned</p>
              ) : (
                <div className="space-y-3">
                  {selectedSchedules.map((s, i) => (
                    <div
                      key={i}
                      className="p-4 border border-slate-100 rounded-xl hover:border-primary-200 cursor-pointer transition-all group"
                      onClick={() => navigate(`/technician/jobs/${s.ticket_id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">
                            {s.ticket_number}
                          </p>
                          <p className="text-slate-500 text-xs capitalize mt-0.5">
                            {s.service_type?.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Badge color={statusColors[s.status] || 'slate'}>{s.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {s.scheduled_time && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {s.scheduled_time}
                          </div>
                        )}
                        {s.svc_city && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {s.svc_city}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Sidebar: Upcoming */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-slate-800">Upcoming Visits</h2>
            </div>
            {allUpcoming.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No upcoming visits scheduled.</p>
            ) : (
              <div className="space-y-3">
                {allUpcoming.map((s, i) => {
                  const d = new Date(s.scheduled_date);
                  return (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all border border-transparent hover:border-slate-100"
                      onClick={() => navigate(`/technician/jobs/${s.ticket_id}`)}
                    >
                      <div className="w-10 flex-shrink-0 text-center">
                        <p className="text-xs text-slate-500 font-medium uppercase">{MONTHS[d.getMonth()].slice(0, 3)}</p>
                        <p className="text-xl font-bold text-primary-600">{d.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                          {s.ticket_number}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Wrench className="w-3 h-3 text-slate-400" />
                          <p className="text-xs text-slate-500 capitalize truncate">{s.service_type?.replace(/_/g, ' ')}</p>
                        </div>
                        {s.scheduled_time && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-400">{s.scheduled_time}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Stats */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Schedule Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Visits', value: schedules?.length ?? 0, color: 'text-slate-800' },
                { label: 'Upcoming', value: allUpcoming.length, color: 'text-primary-600' },
                { label: 'Completed', value: schedules?.filter(s => s.status === 'completed').length ?? 0, color: 'text-emerald-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendarPage;
