import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export const ProcurementGlobalView = () => {
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['global-procurement'],
    queryFn: async () => {
      const res = await api.get('/global/procurement');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-4">Loading Procurement...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading Procurement</div>;

  const safeRequests = Array.isArray(requests) ? requests : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Purchase Requests</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeRequests.map((req: any) => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.project?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.prNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : '-'}</td>
              </tr>
            ))}
            {safeRequests.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No purchase requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
