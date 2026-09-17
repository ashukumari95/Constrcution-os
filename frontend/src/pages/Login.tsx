import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { HardHat, ChevronDown } from 'lucide-react';
import api from '../lib/api';

interface TenantBranding {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  logoUrl: string | null;
  faviconUrl?: string | null;
  primaryColor: string | null;
  secondaryColor?: string | null;
  loginBackground?: string | null;
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [workspaceUrl, setWorkspaceUrl] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const hostname = window.location.hostname;
        const res = await api.get(`/auth/tenant?hostname=${hostname}`);
        setTenant(res.data);
      } catch (err: any) {
        // If 404, we just remain tenant-less
        setTenant(null);
      } finally {
        setTenantLoading(false);
      }
    };
    fetchTenant();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceUrl) {
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      // Basic approach: redirect to subdomain.localhost if in dev, else subdomain.domain.com
      const currentDomain = window.location.hostname;
      
      // If we are currently on localhost, prepend workspaceUrl + .localhost
      let newDomain = '';
      if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        newDomain = `${workspaceUrl}.localhost`;
      } else {
        newDomain = `${workspaceUrl}.${currentDomain}`;
      }
      
      window.location.href = `${protocol}//${newDomain}${port}/login`;
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. No Tenant Resolved - Generic Fallback (Workspace Resolver)
  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <HardHat size={32} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            ConstructionOS
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to your workspace
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
            <form className="space-y-6" onSubmit={handleWorkspaceResolve}>
              <div>
                <label htmlFor="workspaceUrl" className="block text-sm font-medium text-slate-700">
                  Workspace URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    id="workspaceUrl"
                    type="text"
                    required
                    value={workspaceUrl}
                    onChange={(e) => setWorkspaceUrl(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-slate-300"
                    placeholder="your-company"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                    .constructionos.com
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                New to ConstructionOS?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Create a workspace
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tenant Resolved - Branded Login
  const primaryColor = tenant.primaryColor || '#2563eb'; // Default to blue-600

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans bg-cover bg-center"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: tenant.loginBackground ? `url(${tenant.loginBackground})` : 'none'
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-16 object-contain" />
          ) : (
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <HardHat size={32} className="text-white" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {tenant.name}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {tenant.isSuperAdmin ? 'Platform Administration' : 'Project Management Platform'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="text-center pb-2">
              <h3 className="text-lg font-medium text-slate-900">Welcome back</h3>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  style={{ color: primaryColor }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" style={{ color: primaryColor }} className="font-medium hover:opacity-80">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: primaryColor }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Development Demo Access */}
          {import.meta.env.MODE === 'development' && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-2 rounded-md"
              >
                <span>Demo Access (Development Only)</span>
                <ChevronDown size={16} className={`transform transition-transform ${showDemoAccounts ? 'rotate-180' : ''}`} />
              </button>
              
              {showDemoAccounts && (
                <div className="mt-3 space-y-2">
                  <div className="bg-slate-50 rounded-lg p-3 text-xs border border-slate-200 shadow-sm">
                    <p className="font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1">Demo Credentials</p>
                    <ul className="space-y-1.5 font-mono text-slate-600">
                      <li><span className="font-semibold text-slate-800">Admin:</span> admin@apexbuild.demo / password123</li>
                      <li><span className="font-semibold text-slate-800">PM:</span> pm@apexbuild.demo / password123</li>
                      <li><span className="font-semibold text-slate-800">Site Eng:</span> engineer@apexbuild.demo / password123</li>
                      <li><span className="font-semibold text-slate-800">Finance:</span> finance@apexbuild.demo / password123</li>
                      <li><span className="font-semibold text-slate-800">Client:</span> client@apexbuild.demo / password123</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
