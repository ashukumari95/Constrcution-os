import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingDown, TrendingUp, AlertCircle, FileText, CheckCircle2, Clock } from 'lucide-react';
import api from '../../../lib/api';
import { formatCurrency } from '../../../lib/utils';
import { useAuthStore } from '../../../store/authStore';

export function FinanceTab() {
  const { id } = useParams<{ id: string }>();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'invoices' | 'expenses'>('overview');
  const { user } = useAuthStore();
  const isClient = user?.role === 'CLIENT' || user?.permissions.includes('client.dashboard.view');

  const { data: finance, isLoading } = useQuery({
    queryKey: ['finance', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}/finance/summary`);
      return res.data;
    }
  });

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading financial data...</div>;
  if (!finance) return <div className="p-10 text-center text-red-500">Error loading finances</div>;

  return (
    <div className="space-y-6">
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Current Budget" amount={finance.currentBudget} icon={<IndianRupee />} color="blue" />
        
        {!isClient && (
          <MetricCard title="Committed Cost" amount={finance.committedCost} icon={<FileText />} color="indigo" />
        )}

        <MetricCard title="Invoiced Cost" amount={finance.invoicedCost} icon={<AlertCircle />} color="orange" />
        <MetricCard title="Paid Cost" amount={finance.paidCost} icon={<CheckCircle2 />} color="emerald" />
        
        <MetricCard title="Outstanding" amount={finance.outstandingPayables} icon={<Clock />} color="red" />
        <MetricCard title="Variance" amount={finance.budgetVariance} icon={finance.budgetVariance >= 0 ? <TrendingUp /> : <TrendingDown />} color={finance.budgetVariance >= 0 ? 'emerald' : 'red'} />
      </div>

      {!isClient && (
        <>
          <div className="border-b border-slate-200">
            <nav className="flex gap-4">
              <button 
                onClick={() => setActiveSubTab('overview')}
                className={`py-3 px-2 border-b-2 text-sm font-medium ${activeSubTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Overview & Subcontracts
              </button>
              <button 
                onClick={() => setActiveSubTab('invoices')}
                className={`py-3 px-2 border-b-2 text-sm font-medium ${activeSubTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Invoices & Payments
              </button>
              <button 
                onClick={() => setActiveSubTab('expenses')}
                className={`py-3 px-2 border-b-2 text-sm font-medium ${activeSubTab === 'expenses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Direct Expenses
              </button>
            </nav>
          </div>

          {activeSubTab === 'overview' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-medium text-slate-800">Subcontracts</h3>
              </div>
              <div className="p-4">
                {finance.subcontracts?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No active subcontracts</p>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-medium rounded-tl-lg rounded-bl-lg">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Contract Value</th>
                        <th className="px-4 py-3 font-medium text-right">Billed</th>
                        <th className="px-4 py-3 font-medium text-right rounded-tr-lg rounded-br-lg">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finance.subcontracts?.map((sc: any) => (
                        <tr key={sc.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{sc.status}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(sc.contractValue)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(sc.billedValue)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(sc.paidValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'invoices' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-medium text-slate-800">Vendor Invoices</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Inv #</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                      <th className="px-4 py-3 font-medium text-right">Paid</th>
                      <th className="px-4 py-3 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finance.invoices?.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            inv.status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(inv.amountPaid)}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(inv.total - inv.amountPaid)}</td>
                      </tr>
                    ))}
                    {(!finance.invoices || finance.invoices.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No invoices recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'expenses' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-medium text-slate-800">Direct Expenses</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finance.expenses?.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{exp.title}</td>
                        <td className="px-4 py-3 text-slate-500">{exp.category || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            exp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(exp.amount)}</td>
                      </tr>
                    ))}
                    {(!finance.expenses || finance.expenses.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No direct expenses</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ title, amount, icon, color }: { title: string, amount: number, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
          {icon}
        </div>
        <h4 className="font-semibold text-slate-700 text-sm">{title}</h4>
      </div>
      <p className="text-2xl font-bold text-slate-900">{formatCurrency(amount)}</p>
    </div>
  );
}
