import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import TenantLayout from './layouts/TenantLayout';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import SalesPage from './pages/SalesPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import TenantsPage from './pages/TenantsPage';
import PlansPage from './pages/PlansPage';
import AuditLogsPage from './pages/AuditLogsPage';
import LocationsPage from './pages/LocationsPage';
import CategoriesPage from './pages/CategoriesPage';
import ShiftsPage from './pages/ShiftsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';

function ProtectedRoute({ children, requireSuperAdmin = false }: { children: React.ReactNode; requireSuperAdmin?: boolean }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !user.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  const { user, token } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

      {/* Super Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requireSuperAdmin><SuperAdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="tenants" replace />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Tenant Routes */}
      <Route path="/" element={<ProtectedRoute><TenantLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
