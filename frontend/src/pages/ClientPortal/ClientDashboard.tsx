import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building2, MapPin, CalendarDays, CheckCircle2, TrendingUp, CircleDollarSign } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';

export function ClientDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['client-projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading your projects...</div>;
  if (!projects || projects.length === 0) return <div className="p-10 text-center text-slate-500">You don't have access to any projects.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your active projects and recent progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project: any) => (
          <ClientProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ClientProjectCard({ project }: { project: any }) {
  // Fetch high-level finance summary if the client has access (we'll query it for this project)
  const { data: finance } = useQuery({
    queryKey: ['finance', project.id],
    queryFn: async () => {
      const res = await api.get(`/projects/${project.id}/finance/summary`);
      return res.data;
    },
    // Prevent refetching unnecessarily
    staleTime: 60000
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-slate-100 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full", 
            project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
          )}>
            {project.status}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-1">{project.name}</h3>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
          <MapPin size={14} /> {project.location || 'Location not specified'}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1.5"><Briefcase size={14} /> Type</span>
            <span className="font-medium text-slate-800">{project.projectType || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1.5"><CalendarDays size={14} /> Start</span>
            <span className="font-medium text-slate-800">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span>
          </div>
          {finance && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5"><CircleDollarSign size={14} /> Budget</span>
              <span className="font-medium text-slate-800">{formatCurrency(finance.currentBudget)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <a 
          href={`/projects/${project.id}`}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          View Detailed Progress
        </a>
      </div>
    </div>
  );
}
