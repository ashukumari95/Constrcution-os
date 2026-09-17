import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, Calculator, Search, Filter } from 'lucide-react';
import api from '../../../lib/api';

export function BoqTab() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: '',
    description: '',
    category: 'Civil',
    unit: '',
    quantity: '',
    rate: ''
  });

  const { data: boqItems, isLoading } = useQuery({
    queryKey: ['boq', id],
    queryFn: async () => {
      const res = await api.get(`/boq/${id}`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/boq', { 
        ...data, 
        projectId: id,
        quantity: parseFloat(data.quantity),
        rate: parseFloat(data.rate)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boq', id] });
      setIsAdding(false);
      setFormData({
        itemCode: '',
        description: '',
        category: 'Civil',
        unit: '',
        quantity: '',
        rate: ''
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const totalEstimatedAmount = boqItems?.reduce((sum: number, item: any) => sum + (item.estimatedAmount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Bill of Quantities (BOQ)</h2>
          <p className="text-sm text-slate-500">Total BOQ Value: <span className="font-semibold text-slate-900">₹{totalEstimatedAmount.toLocaleString()}</span></p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-sm font-medium">
            <Filter size={16} /> Filter
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add BOQ Item
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-800 mb-4">New BOQ Item</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Code</label>
                <input
                  type="text"
                  required
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  placeholder="e.g. CIV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                >
                  <option>Civil</option>
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>HVAC</option>
                  <option>Interior</option>
                  <option>Other</option>
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
                rows={2}
                placeholder="Detailed item description"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  placeholder="e.g. Cum, Sqm, Nos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rate (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 mt-4">
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
                {createMutation.isPending ? 'Saving...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOQ Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium text-right">Qty</th>
                <th className="px-6 py-3 font-medium text-right">Unit</th>
                <th className="px-6 py-3 font-medium text-right">Rate</th>
                <th className="px-6 py-3 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading BOQ items...</td>
                </tr>
              ) : boqItems?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Calculator size={48} className="text-slate-300 mb-4" />
                      <p className="text-slate-500 text-base">No BOQ items added yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Add items to estimate project costs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                boqItems?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.itemCode}</td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate" title={item.description}>{item.description}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-slate-700 text-right">{item.unit}</td>
                    <td className="px-6 py-4 text-slate-700 text-right">₹{item.rate.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium text-right">₹{item.estimatedAmount.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
