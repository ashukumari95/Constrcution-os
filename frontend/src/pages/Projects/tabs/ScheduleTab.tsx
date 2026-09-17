import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useParams } from 'react-router-dom';

export function ScheduleTab() {
  const { id } = useParams<{ id: string }>();
  
  const { data: wbsElements, isLoading } = useQuery({
    queryKey: ['projectWbs', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}/wbs`);
      return res.data;
    }
  });

  if (isLoading) return <div className="py-10 text-center text-slate-500">Loading schedule...</div>;

  // Extremely basic CSS Grid Gantt Chart placeholder for the Phase 2 implementation.
  // In a real app, this parses start/end dates to assign grid-column-start/end.
  
  const days = Array.from({length: 14}, (_, i) => i + 1); // Mock 14 days view

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Project Schedule</h2>
        <button className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
          Export PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-[300px_1fr] border-b border-slate-200 bg-slate-50">
            <div className="p-3 font-semibold text-slate-700 text-sm border-r border-slate-200">Task Name</div>
            <div className="grid grid-cols-14 relative" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(40px, 1fr))`}}>
              {days.map(d => (
                <div key={d} className="p-2 text-center text-xs font-medium text-slate-500 border-r border-slate-200 border-dashed">
                  Day {d}
                </div>
              ))}
            </div>
          </div>
          
          {/* Body */}
          <div className="divide-y divide-slate-100">
            {wbsElements?.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No WBS elements found. Create tasks to see them on the timeline.</div>
            ) : (
              wbsElements?.map((wbs: any) => (
                <div key={wbs.id} className="grid grid-cols-[300px_1fr] hover:bg-slate-50/50 transition-colors">
                  <div className="p-3 text-sm font-medium text-slate-800 border-r border-slate-200 flex items-center">
                    {wbs.name}
                  </div>
                  <div className="relative py-2 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(40px, 1fr))`}}>
                    {days.map(d => (
                      <div key={d} className="border-r border-slate-100 border-dashed h-8"></div>
                    ))}
                    {/* Mock Gantt Bar - Needs actual date math */}
                    <div 
                      className="absolute top-2.5 h-6 bg-blue-500 rounded-md shadow-sm border border-blue-600 opacity-90"
                      style={{ 
                        left: '40px', // Math based on startDate
                        width: '160px', // Math based on duration
                      }}
                    >
                      <div className="w-full h-full rounded-md bg-blue-400 opacity-30 absolute top-0 left-0" style={{ width: `${wbs.progress || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Mocked Item for visual demonstration */}
            {wbsElements?.length === 0 && (
              <div className="grid grid-cols-[300px_1fr] hover:bg-slate-50/50 transition-colors">
                <div className="p-3 text-sm font-medium text-slate-800 border-r border-slate-200 flex items-center">
                  Example Task (Foundation)
                </div>
                <div className="relative py-2 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(40px, 1fr))`}}>
                  {days.map(d => (
                    <div key={d} className="border-r border-slate-100 border-dashed h-8"></div>
                  ))}
                  <div 
                    className="absolute top-2.5 h-6 bg-emerald-500 rounded-md shadow-sm border border-emerald-600 opacity-90"
                    style={{ left: '40px', width: '240px' }}
                  >
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
