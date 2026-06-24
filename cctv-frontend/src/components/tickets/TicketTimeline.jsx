import React from 'react';
import { Check, Circle } from 'lucide-react';

const STEPS = [
  { id: 'new', label: 'Created' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'on_site', label: 'On Site' },
  { id: 'work_in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'closed', label: 'Closed' }
];

export const TicketTimeline = ({ currentStatus }) => {
  // Map complex statuses to timeline steps
  let currentIndex = 0;
  
  if (['closed'].includes(currentStatus)) currentIndex = 5;
  else if (['completed'].includes(currentStatus)) currentIndex = 4;
  else if (currentStatus.includes('progress') || currentStatus.includes('estimate')) currentIndex = 3;
  else if (['on_site', 'visit_scheduled'].includes(currentStatus)) currentIndex = 2;
  else if (currentStatus.includes('assigned') || currentStatus.includes('accepted')) currentIndex = 1;
  else currentIndex = 0;

  return (
    <div className="py-6">
      <div className="relative">
        <div className="absolute top-4 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full hidden sm:block"></div>
        <div 
          className="absolute top-4 left-0 h-1 bg-primary-500 -translate-y-1/2 rounded-full hidden sm:block transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        ></div>
        
        <div className="relative flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={step.id} className="flex sm:flex-col items-center gap-3 sm:gap-2 z-10">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${isCompleted ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-slate-300 text-slate-300'}
                  ${isCurrent ? 'ring-4 ring-primary-100' : ''}
                `}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current" />}
                </div>
                <span className={`text-sm font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
