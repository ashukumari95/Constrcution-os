import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { FileSpreadsheet, Plus, Check, X, FileText, Calendar, CloudRain, Users, HardHat, AlertTriangle, PenTool } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

export function DPRTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthStore();
  const canApprove = hasPermission('dpr:approve') || user?.role === 'Project Manager' || user?.role === 'Admin';
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weather: 'Clear',
    manpowerCount: '',
    workCompleted: '',
    materialsReceived: '',
    materialsConsumed: '',
    equipmentUsed: '',
    issues: '',
    safetyObservations: '',
    planForTomorrow: ''
  });

  const { data: dprs, isLoading } = useQuery({
    queryKey: ['dprs', projectId],
    queryFn: async () => {
      const res = await api.get(`/dprs?projectId=${projectId}`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/dprs', { 
        ...data, 
        projectId,
        manpowerCount: parseInt(data.manpowerCount) || 0
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dprs', projectId] });
      setIsAdding(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weather: 'Clear',
        manpowerCount: '',
        workCompleted: '',
        materialsReceived: '',
        materialsConsumed: '',
        equipmentUsed: '',
        issues: '',
        safetyObservations: '',
        planForTomorrow: ''
      });
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, remarks }: any) => {
      const res = await api.put(`/dprs/${id}/status`, { status, remarks });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dprs', projectId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this DPR?')) {
      statusMutation.mutate({ id, status: 'APPROVED', remarks: 'Approved from dashboard' });
    }
  };

  const handleReject = (id: string) => {
    const remarks = prompt('Enter rejection reason:');
    if (remarks !== null) {
      statusMutation.mutate({ id, status: 'REJECTED', remarks });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Daily Progress Reports</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> New DPR
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-md font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Create Daily Progress Report</h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><CloudRain size={14}/> Weather</label>
                <select
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                >
                  <option>Clear</option>
                  <option>Cloudy</option>
                  <option>Rainy</option>
                  <option>Windy</option>
                  <option>Extreme Heat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Users size={14}/> Manpower Count</label>
                <input
                  type="number"
                  required
                  value={formData.manpowerCount}
                  onChange={(e) => setFormData({ ...formData, manpowerCount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><PenTool size={14}/> Work Completed Today</label>
                <textarea
                  required
                  value={formData.workCompleted}
                  onChange={(e) => setFormData({ ...formData, workCompleted: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Describe the tasks completed, zones covered..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Materials Received</label>
                  <textarea
                    value={formData.materialsReceived}
                    onChange={(e) => setFormData({ ...formData, materialsReceived: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    rows={2}
                    placeholder="e.g. 500 bags cement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Materials Consumed</label>
                  <textarea
                    value={formData.materialsConsumed}
                    onChange={(e) => setFormData({ ...formData, materialsConsumed: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    rows={2}
                    placeholder="e.g. 300 bags cement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><HardHat size={14}/> Equipment</label>
                  <textarea
                    value={formData.equipmentUsed}
                    onChange={(e) => setFormData({ ...formData, equipmentUsed: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><AlertTriangle size={14}/> Safety Observations</label>
                  <textarea
                    value={formData.safetyObservations}
                    onChange={(e) => setFormData({ ...formData, safetyObservations: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan for Tomorrow</label>
                  <textarea
                    value={formData.planForTomorrow}
                    onChange={(e) => setFormData({ ...formData, planForTomorrow: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit DPR'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading DPRs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Prepared By</th>
                    <th className="px-6 py-4 text-center">Manpower</th>
                    <th className="px-6 py-4">Work Summary</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dprs?.map((dpr: any) => (
                    <tr key={dpr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-blue-500" />
                          {new Date(dpr.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{dpr.weather}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{dpr.preparedBy?.firstName} {dpr.preparedBy?.lastName}</div>
                        <div className="text-slate-500 text-xs">Site Engineer</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 rounded-full h-8 w-8 font-semibold">
                          {dpr.manpowerCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600 max-w-xs truncate" title={dpr.workCompleted}>{dpr.workCompleted}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          dpr.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          dpr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          dpr.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {dpr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {dpr.status === 'SUBMITTED' && canApprove ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApprove(dpr.id)}
                              className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md transition-colors"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleReject(dpr.id)}
                              className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!dprs?.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <FileSpreadsheet size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No DPRs found for this project.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
