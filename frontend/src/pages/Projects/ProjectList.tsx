import { useQuery } from '@tanstack/react-query';
import { Briefcase, Plus, Search, Building2, MapPin, FolderOpen, Database } from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export function ProjectList() {
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    }
  });

  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your construction projects.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-10 text-slate-500">Loading projects...</div>
        ) : safeProjects.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <FolderOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Get started by creating your first construction project, or import your existing historical projects into the system.
            </p>
            <div className="flex gap-4">
              <button className="px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                <Plus size={18} /> Create Project
              </button>
              <button 
                onClick={() => navigate('/imports')}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2"
              >
                <Database size={18} /> Import Data
              </button>
            </div>
          </div>
        ) : (
          safeProjects.map((project: any) => (
            <div 
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    project.status === 'PLANNING' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-sm font-medium text-slate-500">{project.projectCode || 'N/A'}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{project.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{project.description || 'No description provided.'}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 size={16} className="text-slate-400" />
                    <span>{project.client || 'Internal'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{project.location || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Briefcase size={16} className="text-slate-400" />
                  <span>{project._count?.sites || 0} Sites</span>
                </div>
                <div className="font-medium text-slate-700">
                  ₹{((project.budget || 0) / 10000000).toFixed(2)} Cr
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
