import {
  TrendingUp, AlertCircle, Clock, CheckCircle2, Briefcase,
  CircleDollarSign, ShieldAlert, FileText, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { ClientDashboard } from './ClientPortal/ClientDashboard';

// Helper to format relative time without external dependency
function getRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function Dashboard() {
  const { hasPermission, user } = useAuthStore();

  if (user?.role === 'CLIENT' || user?.permissions.includes('client.dashboard.view')) {
    return <ClientDashboard />;
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['executiveDashboardStats'],
    queryFn: async () => {
      // Use the newly added getExecutiveDashboard endpoint
      const res = await api.get('/dashboard/executive');
      return res.data;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Portfolio overview, health, and risk management.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reports" className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            Generate Report
          </Link>
          {hasPermission('projects.write') && (
            <Link to="/projects/new" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors">
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Active Projects"
          value={isLoading ? '...' : (stats?.totalActiveProjects || 0).toString()}
          trend="Currently running"
          trendUp={true}
          icon={<Briefcase className="text-blue-500" size={24} />}
        />
        <KpiCard
          title="Portfolio Budget"
          value={isLoading ? '...' : formatCurrency(stats?.portfolioBudget || 0)}
          trend={`Value: ${formatCurrency(stats?.totalProjectValue || 0)}`}
          trendUp={true}
          icon={<CircleDollarSign className="text-emerald-500" size={24} />}
        />
        <KpiCard
          title="Actual Cost"
          value={isLoading ? '...' : formatCurrency(stats?.totalActualCost || 0)}
          trend={`Procurement: ${formatCurrency(stats?.procurementExposure || 0)}`}
          trendUp={false}
          trendColor="text-amber-600"
          icon={<TrendingUp className="text-amber-500" size={24} />}
        />
        <KpiCard
          title="Portfolio Progress"
          value={isLoading ? '...' : `${stats?.portfolioProgress || 0}%`}
          trend={`${stats?.delayedProjectsCount || 0} delayed`}
          trendUp={stats?.delayedProjectsCount === 0}
          icon={<Clock className="text-blue-500" size={24} />}
          trendColor={stats?.delayedProjectsCount > 0 ? "text-red-600" : "text-emerald-600"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risks & Issues Column */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-500" />
                Material Risks & Critical Issues
              </h3>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-slate-100">
                {isLoading ? (
                  <li className="p-5 text-sm text-slate-500">Loading risks...</li>
                ) : (stats?.materialRisks?.length > 0 || stats?.criticalIssues?.length > 0) ? (
                  <>
                    {stats?.materialRisks?.map((risk: any) => (
                      <ActionItem
                        key={risk.id}
                        title={`High Risk: ${risk.title}`}
                        subtitle={risk.projectName}
                        type="Risk"
                        time={getRelativeTime(risk.createdAt)}
                        urgent={true}
                        icon={<AlertTriangle size={18} className="text-amber-500" />}
                      />
                    ))}
                    {stats?.criticalIssues?.map((issue: any) => (
                      <ActionItem
                        key={issue.id}
                        title={`Critical Issue: ${issue.title}`}
                        subtitle={issue.projectName}
                        type="Issue"
                        time={getRelativeTime(issue.createdAt)}
                        urgent={true}
                        icon={<AlertCircle size={18} className="text-red-500" />}
                      />
                    ))}
                  </>
                ) : (
                  <li className="p-5 text-sm text-emerald-600 font-medium">No material risks or critical issues currently identified.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                Schedule Health (Delayed Projects)
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-6">
                {isLoading ? (
                  <p className="text-slate-500 text-sm">Loading projects...</p>
                ) : stats?.delayedProjects?.length > 0 ? (
                  stats.delayedProjects.map((p: any) => (
                    <ProjectProgressRow key={p.id} name={p.name} progress={p.progress} status="Delayed" overdue={p.overdueCount} />
                  ))
                ) : (
                  <p className="text-sm text-emerald-600 font-medium">All projects are on track.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Required Column */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              Pending Approvals
            </h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {stats?.attentionRequired?.length || 0}
            </span>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-slate-100">
              {isLoading ? (
                <li className="p-5 text-sm text-slate-500">Loading action items...</li>
              ) : stats?.attentionRequired?.length > 0 ? (
                stats.attentionRequired.map((item: any) => (
                  <ActionItem
                    key={item.id}
                    title={item.title}
                    type={item.type}
                    time={getRelativeTime(item.time)}
                    urgent={item.type === 'Review'}
                    link={item.link}
                  />
                ))
              ) : (
                <li className="p-5 text-sm text-slate-500">No pending actions required.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function KpiCard({ title, value, trend, trendUp, icon, trendColor }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight line-clamp-1">{value}</h2>
        <div className={cn("mt-2 text-sm flex items-center gap-1 font-medium", trendColor ? trendColor : (trendUp ? "text-emerald-600" : "text-slate-500"))}>
          {trendUp ? <TrendingUp size={16} /> : <AlertCircle size={16} />}
          <span className="line-clamp-1">{trend}</span>
        </div>
      </div>
    </div>
  );
}

function ProjectProgressRow({ name, progress, status, overdue }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <div>
          <span className="font-medium text-slate-800">{name}</span>
          {overdue > 0 && <span className="ml-2 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">{overdue} overdue tasks</span>}
        </div>
        <span className="text-slate-600 font-medium">{progress}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className="h-2.5 rounded-full bg-red-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

function ActionItem({ title, subtitle, type, time, urgent, icon, link }: any) {
  const content = (
    <div className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group cursor-pointer">
      <div className="mt-0.5">
        {icon ? icon : (urgent ? <AlertCircle size={18} className="text-red-500" /> : <CheckCircle2 size={18} className="text-blue-500" />)}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{type}</span>
          <span className="text-xs text-slate-400">{time}</span>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
