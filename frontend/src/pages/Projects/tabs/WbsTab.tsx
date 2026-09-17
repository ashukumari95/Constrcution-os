import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, Calendar, User, FolderTree } from 'lucide-react';
import api from '../../../lib/api';

export function WbsTab() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    responsibleName: ''
  });

  const { data: wbsElements, isLoading } = useQuery({
    queryKey: ['wbs', id],
    queryFn: async () => {
      const res = await api.get(`/wbs/${id}`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/wbs', { ...data, projectId: id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wbs', id] });
      setIsAdding(false);
      setFormData({ name: '', startDate: '', endDate: '', responsibleName: '' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Work Breakdown Structure</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add WBS Element
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-800 mb-4">New WBS Element</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Element Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                placeholder="e.g. Foundation Work"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Person</label>
              <input
                type="text"
                value={formData.responsibleName}
                onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
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
                {createMutation.isPending ? 'Saving...' : 'Save Element'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WBS List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading WBS...</div>
        ) : wbsElements?.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <FolderTree size={48} className="text-slate-300 mb-4" />
            <p>No WBS elements defined yet.</p>
            <p className="text-sm mt-1">Add your first element to start planning.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {wbsElements?.map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FolderTree size={16} className="text-blue-500" />
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 ml-6">
                    {item.startDate && item.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                      </span>
                    )}
                    {item.responsibleName && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {item.responsibleName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
