import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ShoppingCart, FileText, Plus } from 'lucide-react';
import api from '../../../lib/api';

export function ProcurementTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const [view, setView] = useState<'pr' | 'po'>('pr');

  const { data: prs, isLoading: isLoadingPRs } = useQuery({
    queryKey: ['prs', projectId],
    queryFn: async () => {
      const res = await api.get(`/procurement/pr?projectId=${projectId}`);
      return res.data;
    }
  });

  const { data: pos, isLoading: isLoadingPOs } = useQuery({
    queryKey: ['pos', projectId],
    queryFn: async () => {
      const res = await api.get(`/procurement/po?projectId=${projectId}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setView('pr')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'pr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Requests
          </button>
          <button
            onClick={() => setView('po')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'po' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Orders
          </button>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> 
          {view === 'pr' ? 'New PR' : 'New PO'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {view === 'pr' ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Purchase Requests</h3>
            {isLoadingPRs ? (
              <p className="text-slate-500">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">PR Number</th>
                      <th className="px-4 py-3">Requested By</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prs?.map((pr: any) => (
                      <tr key={pr.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            {pr.prNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{pr.requestedBy?.firstName} {pr.requestedBy?.lastName}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                pr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {pr.status}
                            </span>
                        </td>
                      </tr>
                    ))}
                    {!prs?.length && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No PRs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Purchase Orders</h3>
            {isLoadingPOs ? (
              <p className="text-slate-500">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">PO Number</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos?.map((po: any) => (
                      <tr key={po.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <ShoppingCart size={16} className="text-slate-400" />
                            {po.poNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{po.vendor?.name}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                po.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {po.status}
                            </span>
                        </td>
                      </tr>
                    ))}
                    {!pos?.length && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No POs found.</td></tr>
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
