import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export const TasksGlobalView = () => {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['global-tasks'],
    queryFn: async () => {
      const res = await api.get('/global/tasks');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-4">Loading Tasks...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading tasks</div>;

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Tasks</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeTasks.map((task: any) => (
              <tr key={task.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.project?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</td>
              </tr>
            ))}
            {safeTasks.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
