import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface ColumnDef {
  header: string;
  accessor: (row: any) => React.ReactNode;
}

interface GenericGlobalViewProps {
  title: string;
  endpoint: string;
  columns: ColumnDef[];
  emptyMessage?: string;
}

export const GenericGlobalView: React.FC<GenericGlobalViewProps> = ({ title, endpoint, columns, emptyMessage = 'No records found.' }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['global', endpoint],
    queryFn: async () => {
      const res = await api.get(endpoint);
      return res.data;
    }
  });

  if (isLoading) return <div className="p-4">Loading {title}...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading {title}</div>;

  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeData.map((row: any, rIdx: number) => (
              <tr key={row.id || rIdx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
            {safeData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
