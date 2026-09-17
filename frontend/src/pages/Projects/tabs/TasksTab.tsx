import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useParams } from 'react-router-dom';
import { Plus, MoreVertical, Paperclip, CheckSquare } from 'lucide-react';

export function TasksTab() {
  const { id } = useParams<{ id: string }>();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['projectTasks', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}/tasks`);
      return res.data;
    }
  });

  if (isLoading) return <div className="py-10 text-center text-slate-500">Loading tasks...</div>;

  const columns = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'BLOCKED', title: 'Blocked' },
    { id: 'COMPLETED', title: 'Completed' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Task Board</h2>
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
          <Plus size={16} /> Add Task
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start h-[calc(100vh-300px)] min-h-[500px] overflow-y-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full max-h-full">
            <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-100 rounded-t-xl">
              <h3 className="font-medium text-slate-700 text-sm">{col.title}</h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {tasks?.filter((t: any) => t.status === col.id).length || 0}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {tasks?.filter((t: any) => t.status === col.id).map((task: any) => (
                <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white ${
                      task.priority === 'URGENT' ? 'bg-red-500' :
                      task.priority === 'HIGH' ? 'bg-orange-500' :
                      task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={14} /></button>
                  </div>
                  <h4 className="font-medium text-slate-800 text-sm mb-1">{task.title}</h4>
                  {task.dueDate && (
                    <div className="text-xs text-slate-500 mb-3">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex -space-x-1">
                      {task.assignee ? (
                        <div className="w-6 h-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[10px] font-bold text-blue-700" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                          {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      {task.attachments?.length > 0 && (
                        <span className="flex items-center gap-0.5"><Paperclip size={12} /> {task.attachments.length}</span>
                      )}
                      {task.checklist?.length > 0 && (
                        <span className="flex items-center gap-0.5"><CheckSquare size={12} /> {task.checklist.filter((c:any)=>c.isCompleted).length}/{task.checklist.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg flex items-center justify-center gap-1 transition-colors">
                <Plus size={14} /> Add Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
