import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Plus, X, MessageSquare, Send, CheckCircle2, Clock } from 'lucide-react';
import api from '../../../lib/api';

export function IssuesTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SAFETY',
    priority: 'MEDIUM',
    category: 'OTHER'
  });
  
  const [commentText, setCommentText] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: async () => {
      const res = await api.get(`/issues?projectId=${projectId}`);
      return res.data;
    }
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/issues', { ...data, projectId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      setIsAdding(false);
      setFormData({ title: '', description: '', type: 'SAFETY', priority: 'MEDIUM', category: 'OTHER' });
    }
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: any) => {
      const res = await api.put(`/issues/${id}`, { status, resolution });
      return res.data;
    },
    onSuccess: (updatedIssue) => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      // Update selected issue locally to reflect changes immediately
      if (selectedIssue && selectedIssue.id === updatedIssue.id) {
        setSelectedIssue({ ...selectedIssue, status: updatedIssue.status, resolution: updatedIssue.resolution });
      }
      setResolutionText('');
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ issueId, content }: any) => {
      const res = await api.post(`/issues/${issueId}/comments`, { content });
      return res.data;
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      if (selectedIssue) {
        setSelectedIssue({
          ...selectedIssue,
          comments: [...(selectedIssue.comments || []), newComment]
        });
      }
      setCommentText('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIssueMutation.mutate(formData);
  };

  const handleResolve = () => {
    if (!resolutionText.trim()) return alert('Please enter resolution details');
    updateIssueMutation.mutate({ id: selectedIssue.id, status: 'RESOLVED', resolution: resolutionText });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ issueId: selectedIssue.id, content: commentText });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Project Issues</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Report Issue
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-md font-semibold text-slate-800">Report New Issue</h4>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                >
                  <option>SAFETY</option>
                  <option>QUALITY</option>
                  <option>SCHEDULE</option>
                  <option>MATERIAL</option>
                  <option>DESIGN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                >
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>CRITICAL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={createIssueMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {createIssueMutation.isPending ? 'Reporting...' : 'Report Issue'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
        <div className={`flex-1 transition-all ${selectedIssue ? 'hidden md:block md:w-1/2 border-r border-slate-200' : 'w-full'}`}>
          <div className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading issues...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Issue</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues?.map((issue: any) => (
                      <tr 
                        key={issue.id} 
                        onClick={() => setSelectedIssue(issue)}
                        className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${selectedIssue?.id === issue.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className={
                              issue.priority === 'HIGH' || issue.priority === 'CRITICAL' ? 'text-red-500' : 
                              issue.priority === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                            } />
                            <span className="line-clamp-1">{issue.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{issue.type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            issue.priority === 'HIGH' || issue.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                            issue.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            issue.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 
                            issue.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!issues?.length && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No issues reported.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Issue Details Drawer (Side Panel) */}
        {selectedIssue && (
          <div className="w-full md:w-1/2 flex flex-col bg-slate-50 h-[600px] max-h-[70vh]">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    selectedIssue.status === 'OPEN' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {selectedIssue.status}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-lg">{selectedIssue.title}</h4>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Description */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h5>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedIssue.description}</p>
                <div className="mt-4 flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><AlertTriangle size={14}/> {selectedIssue.priority} Priority</span>
                  <span className="flex items-center gap-1"><Clock size={14}/> Reported by {selectedIssue.reportedBy?.firstName || 'User'}</span>
                </div>
              </div>

              {/* Resolution Section */}
              {selectedIssue.status === 'OPEN' ? (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 shadow-sm">
                  <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Resolve Issue</h5>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe how this issue was resolved..."
                    className="w-full p-2 border border-emerald-200 rounded-md text-sm mb-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleResolve}
                      disabled={updateIssueMutation.isPending}
                      className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={16} /> Mark as Resolved
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 shadow-sm">
                  <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Resolved
                  </h5>
                  <p className="text-sm text-emerald-900 whitespace-pre-wrap">{selectedIssue.resolution || 'No resolution details provided.'}</p>
                </div>
              )}

              {/* Comments Section */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <MessageSquare size={14} /> Comments & Activity
                </h5>
                <div className="space-y-3 mb-4">
                  {selectedIssue.comments?.map((comment: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-800">{comment.author?.firstName || 'User'}</span>
                        <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600">{comment.content}</p>
                    </div>
                  ))}
                  {(!selectedIssue.comments || selectedIssue.comments.length === 0) && (
                    <p className="text-sm text-slate-400 text-center py-2">No comments yet.</p>
                  )}
                </div>
                
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-2 border border-slate-300 rounded-md text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="bg-slate-800 text-white p-2 rounded-md hover:bg-slate-900 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
