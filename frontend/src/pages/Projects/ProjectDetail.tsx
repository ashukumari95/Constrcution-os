import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, LayoutDashboard, ListTodo, Map, Calculator, CalendarDays, Users, FileText, Settings, Package, ShoppingCart, HardHat, FileSpreadsheet, AlertTriangle, IndianRupee, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/api';
import { TasksTab } from './tabs/TasksTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { LabourTab } from './tabs/LabourTab';
import { MaterialTab } from './tabs/MaterialTab';
import { ProcurementTab } from './tabs/ProcurementTab';
import { ContractorTab } from './tabs/ContractorTab';
import { DPRTab } from './tabs/DPRTab';
import { IssuesTab } from './tabs/IssuesTab';
import { FinanceTab } from './tabs/FinanceTab';
import { WbsTab } from './tabs/WbsTab';
import { BoqTab } from './tabs/BoqTab';
import { PhotosTab } from './tabs/PhotosTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ProjectHealthCard } from './components/ProjectHealthCard';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    }
  });

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading project details...</div>;
  if (!project) return <div className="p-10 text-center text-red-500">Project not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'planning', label: 'Planning', icon: <Map size={16} /> },
    { id: 'boq', label: 'BOQ', icon: <Calculator size={16} /> },
    { id: 'schedule', label: 'Schedule', icon: <CalendarDays size={16} /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo size={16} /> },
    { id: 'labour', label: 'Labour', icon: <Users size={16} /> },
    { id: 'materials', label: 'Materials', icon: <Package size={16} /> },
    { id: 'procurement', label: 'Procurement', icon: <ShoppingCart size={16} /> },
    { id: 'contractors', label: 'Contractors', icon: <HardHat size={16} /> },
    { id: 'dpr', label: 'DPR', icon: <FileSpreadsheet size={16} /> },
    { id: 'issues', label: 'Issues', icon: <AlertTriangle size={16} /> },
    { id: 'photos', label: 'Photos', icon: <ImageIcon size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'finance', label: 'Finance', icon: <IndianRupee size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{project.projectCode} • {project.location}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Project Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {project.description || 'No description provided.'}
              </p>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Details</h3>
                <DetailRow label="Client" value={project.client || '-'} />
                <DetailRow label="Type" value={project.projectType || '-'} />
                <DetailRow label="Manager" value={project.projectManager ? `${project.projectManager.firstName} ${project.projectManager.lastName}` : 'Unassigned'} />
                <DetailRow label="Budget" value={`₹${((project.budget || 0) / 10000000).toFixed(2)} Cr`} />
                <DetailRow label="Start Date" value={project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'} />
              </div>
              {id && <ProjectHealthCard projectId={id} />}
            </div>
          </div>
        )}

        {activeTab === 'planning' && <WbsTab />}
        {activeTab === 'boq' && <BoqTab />}
        {activeTab === 'schedule' && <ScheduleTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'labour' && <LabourTab />}
        {activeTab === 'materials' && <MaterialTab />}
        {activeTab === 'procurement' && <ProcurementTab />}
        {activeTab === 'contractors' && <ContractorTab />}
        {activeTab === 'dpr' && <DPRTab />}
        {activeTab === 'issues' && <IssuesTab />}
        {activeTab === 'photos' && <PhotosTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'finance' && <FinanceTab />}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}
