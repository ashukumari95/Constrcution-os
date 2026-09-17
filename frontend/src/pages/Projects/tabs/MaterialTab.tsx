import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PackageSearch, Plus, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';

export function MaterialTab() {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', projectId],
    queryFn: async () => {
      const res = await api.get(`/materials/inventory?projectId=${projectId}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Project Inventory</h3>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Material to Project
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <p className="text-slate-500">Loading inventory...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Required</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory?.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <PackageSearch size={16} className="text-slate-400" />
                          {inv.material?.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{inv.material?.category}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{inv.requiredQuantity} {inv.material?.unit}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {inv.availableQuantity} {inv.material?.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.availableQuantity <= inv.reorderLevel ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertCircle size={12} /> Low Stock
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Sufficient
                            </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!inventory?.length && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No materials tracked in inventory yet.</td></tr>
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
