import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import api from '../../../lib/api';

export function ContractorTab() {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: contractors, isLoading } = useQuery({
    queryKey: ['contractors', projectId],
    queryFn: async () => {
      // This is a placeholder since getContractors endpoint doesn't currently filter by project out of the box,
      // but in a real app we'd pass projectId. For now, fetch all and filter client side for demo.
      const res = await api.get('/contractors');
      const all = res.data;
      return all.filter((c: any) => c.projects?.some((p: any) => p.id === projectId));
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Assigned Contractors</h3>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <p className="text-slate-500">Loading contractors...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contractors?.map((contractor: any) => (
                <div key={contractor.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <HardHat size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{contractor.companyName}</h4>
                        <p className="text-sm text-slate-500">{contractor.contactPerson}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Email</p>
                      <p className="font-medium text-slate-700">{contractor.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Phone</p>
                      <p className="font-medium text-slate-700">{contractor.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!contractors?.length && (
                <div className="col-span-full p-8 text-center text-slate-500">
                  No contractors assigned to this project yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
