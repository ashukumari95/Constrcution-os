import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { UserPlus, CheckCircle, Clock } from 'lucide-react';
import api from '../../../lib/api';

export function LabourTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const [view, setView] = useState<'attendance' | 'workers'>('attendance');

  const { data: workers, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['workers', projectId],
    queryFn: async () => {
      const res = await api.get(`/labour/workers?projectId=${projectId}`);
      return res.data;
    }
  });

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', projectId],
    queryFn: async () => {
      const res = await api.get(`/labour/attendance?projectId=${projectId}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setView('attendance')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setView('workers')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'workers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Worker Roster
          </button>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {view === 'attendance' ? <CheckCircle size={16} /> : <UserPlus size={16} />}
          {view === 'attendance' ? 'Mark Attendance' : 'Add Worker'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {view === 'workers' ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Assigned Workers</h3>
            {isLoadingWorkers ? (
              <p className="text-slate-500">Loading workers...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Contractor</th>
                      <th className="px-4 py-3 text-right">Daily Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers?.map((w: any) => (
                      <tr key={w.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {w.firstName[0]}
                            </div>
                            {w.firstName} {w.lastName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{w.category}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${w.type === 'SKILLED' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {w.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{w.contractor?.companyName || 'Direct'}</td>
                        <td className="px-4 py-3 text-right text-slate-600 font-medium">₹{w.dailyRate}</td>
                      </tr>
                    ))}
                    {!workers?.length && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No workers assigned to this project yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Attendance</h3>
            {isLoadingAttendance ? (
              <p className="text-slate-500">Loading attendance...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Worker Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance?.map((a: any) => (
                      <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {new Date(a.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{a.worker?.firstName} {a.worker?.lastName}</td>
                        <td className="px-4 py-3 text-slate-600">{a.worker?.category}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!attendance?.length && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No attendance records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
