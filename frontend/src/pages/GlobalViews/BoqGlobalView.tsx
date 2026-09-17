import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export const BoqGlobalView = () => {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['global-boq'],
    queryFn: async () => {
      const res = await api.get('/global/boq');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-4">Loading BOQ...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading BOQ</div>;

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All BOQ Items</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeItems.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.project?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.estimatedAmount?.toLocaleString()}</td>
              </tr>
            ))}
            {safeItems.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No BOQ items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
