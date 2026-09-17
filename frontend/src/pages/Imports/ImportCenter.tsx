import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Database, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ImportWizard } from './ImportWizard';

export function ImportCenter() {
  const [showWizard, setShowWizard] = useState(false);

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['imports'],
    queryFn: async () => {
      const res = await api.get('/imports');
      return res.data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
      case 'VALIDATING':
      case 'IMPORTING':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> {status}</span>;
      case 'READY_TO_IMPORT':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><AlertCircle size={12} /> {status}</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> {status}</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> {status}</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-blue-600" />
            Data Import Center
          </h1>
          <p className="text-slate-500">Import your historical projects, financials, and inventory data into ConstructionOS.</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus size={16} /> New Import Job
        </button>
      </div>

      {showWizard && (
        <ImportWizard 
          onClose={() => setShowWizard(false)} 
          onComplete={() => {
            setShowWizard(false);
            refetch();
          }} 
        />
      )}

      {!showWizard && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Recent Import Jobs</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No imports yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Start by importing your existing data. We support Projects, Tasks, BOQ, and Finance data.
              </p>
              <button onClick={() => setShowWizard(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">Start First Import</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Import Type</th>
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Records</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{job.importType}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={job.fileName}>{job.fileName}</td>
                      <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {job.totalRecords > 0 ? (
                          <span>
                            {job.processedRecords} / {job.totalRecords}
                            {job.failedRecords > 0 && <span className="text-red-500 ml-2">({job.failedRecords} failed)</span>}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(job.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors" onClick={() => {/* View Details */}}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
