import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  CalendarDays, 
  CheckSquare, 
  Users, 
  HardHat, 
  Package, 
  ShoppingCart, 
  FileCheck2, 
  Camera, 
  AlertTriangle, 
  ShieldCheck, 
  Files, 
  CheckCircle, 
  CircleDollarSign, 
  BarChart3, 
  Settings,
  Database,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const location = useLocation();
  const { hasPermission } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
    { name: 'Projects', path: '/projects', icon: Briefcase, permission: 'projects.view' },
    { name: 'BOQ & Estimation', path: '/boq', icon: FileText, permission: 'boq.view' },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays, permission: 'schedule.view' },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
    { name: 'Labour', path: '/labour', icon: Users, permission: 'labour.view' },
    { name: 'Contractors', path: '/contractors', icon: HardHat, permission: 'contractors.view' },
    { name: 'Materials', path: '/materials', icon: Package, permission: 'materials.view' },
    { name: 'Vendors', path: '/vendors', icon: Briefcase, permission: 'purchase.view' },
    { name: 'Inventory', path: '/inventory', icon: Package, permission: 'inventory.view' },
    { name: 'Procurement', path: '/procurement', icon: ShoppingCart, permission: 'purchase.view' },
    { name: 'DPR', path: '/dpr', icon: FileCheck2, permission: 'dpr.view' },
    { name: 'Site Photos', path: '/photos', icon: Camera, permission: 'dpr.view' }, // typically part of dpr or site monitoring
    { name: 'Issues', path: '/issues', icon: AlertTriangle, permission: 'issues.view' },
    { name: 'Quality', path: '/quality', icon: ShieldCheck, permission: 'issues.view' }, // grouped with issues for now
    { name: 'Documents', path: '/documents', icon: Files, permission: 'documents.view' },
    { name: 'Approvals', path: '/approvals', icon: CheckCircle, permission: 'projects.view' }, // General view
    { name: 'Finance', path: '/finance', icon: CircleDollarSign, permission: 'finance.view' },
    { name: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
    { name: 'Users', path: '/users', icon: Users, permission: 'users:read' },
    { name: 'Data Import', path: '/imports', icon: Database, permission: 'settings.manage' },
    { name: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' },
    { name: 'Platform Admin', path: '/platform-admin', icon: ShieldAlert, permission: 'all' },
  ];

  const filteredNavItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <HardHat size={20} className="text-white" />
          </div>
          ConstructionOS
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-800">
        <nav className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-slate-800/60 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                )}
              >
                <Icon size={18} className={isActive ? "text-blue-500" : "text-slate-500"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
