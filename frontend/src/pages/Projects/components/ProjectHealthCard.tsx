import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import api from '../../../lib/api';
import { cn } from '../../../lib/utils';

export function ProjectHealthCard({ projectId }: { projectId: string }) {
  const { data: health, isLoading } = useQuery({
    queryKey: ['projectHealth', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/health`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-12 w-full bg-slate-100 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded"></div>
          <div className="h-4 w-full bg-slate-100 rounded"></div>
          <div className="h-4 w-full bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50';
    if (score >= 65) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 65) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="text-emerald-500" size={24} />;
    if (score >= 65) return <AlertTriangle className="text-amber-500" size={24} />;
    return <ShieldAlert className="text-red-500" size={24} />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          Project Health Score
        </h3>
        <div className={cn("px-3 py-1 rounded-full font-bold flex items-center gap-2", getHealthColor(health.overallScore))}>
          {getIcon(health.overallScore)}
          <span className="text-lg">{health.overallScore}/100</span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6 bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex gap-3 items-start">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            Health score is calculated dynamically based on available data. 
            Metrics with insufficient data are excluded to prevent arbitrary penalization.
          </p>
        </div>

        <div className="space-y-5">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Metrics Breakdown</h4>
          {health.components.map((comp: any) => (
            <div key={comp.name} className="relative">
              <div className="flex justify-between items-end mb-1">
                <div>
                  <span className="font-medium text-slate-800">{comp.name}</span>
                  {!comp.hasData && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                      Insufficient Data
                    </span>
                  )}
                </div>
                {comp.hasData && (
                  <span className="text-sm font-bold text-slate-700">{comp.score}/100</span>
                )}
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-2">
                {comp.hasData ? (
                  <div 
                    className={cn("h-2 rounded-full", getBarColor(comp.score))} 
                    style={{ width: `${comp.score}%` }}
                  ></div>
                ) : (
                  <div className="h-2 rounded-full bg-slate-200 w-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)'}}></div>
                )}
              </div>
              
              {comp.hasData && comp.deductionReason && (
                <p className="text-xs text-slate-500 mt-1.5 flex gap-1">
                  <span className="text-red-500 font-medium shrink-0">Reason:</span> 
                  {comp.deductionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
