import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Pages
import Login from './pages/Login';
import Categories from './pages/Categories';
import Assets from './pages/Assets';
import AssetDetails from './pages/AssetDetails';
import AssetSerialNumbers from './pages/AssetSerialNumbers';
import BulkScanSerialNumbers from './pages/BulkScanSerialNumbers';
import BulkScanSerialNumbersGeneral from './pages/BulkScanSerialNumbersGeneral';
import Computers from './pages/Computers';
import Borrowings from './pages/Borrowings';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Departments from './pages/Departments';
import Layout from './components/Layout';
import PermissionGuard from './components/PermissionGuard';
import SystemSettings from './pages/SystemSettings';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="departments" element={<PermissionGuard permission="view departments"><Departments /></PermissionGuard>} />
              <Route path="categories" element={<PermissionGuard permission="view categories"><Categories /></PermissionGuard>} />
              <Route path="assets" element={<PermissionGuard permission="view assets"><Assets /></PermissionGuard>} />
              <Route path="assets/:assetId" element={<PermissionGuard permission="view assets"><AssetDetails /></PermissionGuard>} />
              <Route path="assets/:assetId/bulk-scan" element={<PermissionGuard permission="update assets"><BulkScanSerialNumbers /></PermissionGuard>} />
              <Route path="serial-numbers" element={<PermissionGuard permission="view assets"><AssetSerialNumbers /></PermissionGuard>} />
              <Route path="serial-numbers/bulk-scan" element={<PermissionGuard permission="update assets"><BulkScanSerialNumbersGeneral /></PermissionGuard>} />
              <Route path="computers" element={<PermissionGuard permission="view computers"><Computers /></PermissionGuard>} />
              <Route path="borrowings" element={<PermissionGuard permission="view borrowings"><Borrowings /></PermissionGuard>} />
              <Route path="reports" element={<PermissionGuard permission="view reports"><Reports /></PermissionGuard>} />
              <Route path="users" element={<PermissionGuard permission="view users"><Users /></PermissionGuard>} />
              <Route path="roles" element={<PermissionGuard permission="view users"><Roles /></PermissionGuard>} />
              <Route path="audit-logs" element={<PermissionGuard permission="view logs"><AuditLogs /></PermissionGuard>} />
              <Route path="system-settings" element={<PermissionGuard permission="view system settings"><SystemSettings /></PermissionGuard>} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
