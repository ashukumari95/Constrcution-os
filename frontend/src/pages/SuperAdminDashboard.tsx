import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  status: string;
  plan: string;
  subscriptionStatus: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  userCount: number;
  projectCount: number;
}

export function SuperAdminDashboard() {
  const { user, token } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Extension form state
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(14);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/super-admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch organizations.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async (id: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/super-admin/organizations/${id}/extend-trial`,
        { additionalDays: extendDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExtendingId(null);
      fetchOrganizations();
    } catch (err) {
      console.error(err);
      alert('Failed to extend trial');
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/unauthorized" replace />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Platform Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Organization</th>
                  <th className="px-6 py-4 font-medium">Plan & Status</th>
                  <th className="px-6 py-4 font-medium">Usage</th>
                  <th className="px-6 py-4 font-medium">Trial Info</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {organizations.map(org => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{org.name}</div>
                      <div className="text-slate-500">{org.subdomain}</div>
                      <div className="text-xs text-slate-400 mt-1">Created: {format(new Date(org.createdAt), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {org.plan}
                      </span>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${org.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            org.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-800' :
                            org.subscriptionStatus === 'TRIAL_EXPIRED' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }
                        `}>
                          {org.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div>Users: {org.userCount}</div>
                      <div>Projects: {org.projectCount}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {org.trialEndsAt ? (
                        <div>
                          <span className={new Date(org.trialEndsAt) < new Date() ? 'text-red-600 font-medium' : ''}>
                            Ends: {format(new Date(org.trialEndsAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {extendingId === org.id ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            className="w-16 border rounded px-2 py-1 text-sm" 
                            value={extendDays} 
                            onChange={(e) => setExtendDays(parseInt(e.target.value))}
                          />
                          <button 
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                            onClick={() => handleExtendTrial(org.id)}
                          >
                            Save
                          </button>
                          <button 
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                            onClick={() => setExtendingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setExtendingId(org.id);
                            setExtendDays(14);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Extend Trial
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
