import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { ProjectList } from './pages/Projects/ProjectList';
import { ProjectDetail } from './pages/Projects/ProjectDetail';
import { ContractorList } from './pages/Contractors/ContractorList';
import { MaterialList } from './pages/Materials/MaterialList';
import { VendorList } from './pages/Vendors/VendorList';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { 
  UsersGlobalView, BoqGlobalView, ScheduleGlobalView, TasksGlobalView, 
  LabourGlobalView, InventoryGlobalView, ProcurementGlobalView, DprGlobalView, 
  IssuesGlobalView, DocumentsGlobalView, FinanceGlobalView, SettingsGlobalView 
} from './pages/GlobalViews';
import { ImportCenter } from './pages/Imports/ImportCenter';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

const queryClient = new QueryClient();

const getWorkspaceSlug = () => {
  const match = window.location.pathname.match(/^\/workspace\/([^\/]+)/);
  return match ? match[1] : null;
};

function WorkspaceApp({ slug }: { slug: string }) {
  return (
    <Router basename={`/workspace/${slug}`}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            <Route element={<ProtectedRoute requiredPermission="users:read" />}>
              <Route path="/users" element={<UsersGlobalView />} />
            </Route>
            
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            
            <Route path="/boq" element={<BoqGlobalView />} />
            <Route path="/schedule" element={<ScheduleGlobalView />} />
            <Route path="/tasks" element={<TasksGlobalView />} />
            <Route path="/labour" element={<LabourGlobalView />} />
            <Route path="/contractors" element={<ContractorList />} />
            <Route path="/materials" element={<MaterialList />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/inventory" element={<InventoryGlobalView />} />
            <Route path="/procurement" element={<ProcurementGlobalView />} />
            <Route path="/dpr" element={<DprGlobalView />} />
            <Route path="/issues" element={<IssuesGlobalView />} />
            <Route path="/documents" element={<DocumentsGlobalView />} />
            <Route path="/finance" element={<FinanceGlobalView />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsGlobalView />} />
            
            <Route element={<ProtectedRoute requiredPermission="settings.manage" />}>
              <Route path="/imports" element={<ImportCenter />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="all" />}>
              <Route path="/platform-admin" element={<SuperAdminDashboard />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function GlobalApp() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  const workspaceSlug = getWorkspaceSlug();

  return (
    <QueryClientProvider client={queryClient}>
      {workspaceSlug ? <WorkspaceApp slug={workspaceSlug} /> : <GlobalApp />}
    </QueryClientProvider>
  );
}

export default App;
