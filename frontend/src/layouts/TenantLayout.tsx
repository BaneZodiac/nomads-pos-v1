import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/pos', label: 'POS Billing', icon: '💳' },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/categories', label: 'Categories', icon: '🏷️' },
  { path: '/inventory', label: 'Inventory', icon: '📋' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/suppliers', label: 'Suppliers', icon: '🚚' },
  { path: '/sales', label: 'Sales', icon: '💰' },
  { path: '/purchase-orders', label: 'Purchases', icon: '📝' },
  { path: '/reports', label: 'Reports', icon: '📈' },
  { path: '/users', label: 'Users', icon: '👤' },
  { path: '/locations', label: 'Locations', icon: '📍' },
  { path: '/shifts', label: 'Shifts', icon: '🔄' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function TenantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}>
        <div className="p-4 border-b border-slate-700">
          <Link to="/dashboard" className="text-xl font-bold">Nomads POS</Link>
          {user?.tenantName && (
            <p className="text-xs text-slate-400 mt-1">{user.tenantName}</p>
          )}
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName}
              {user?.role && <span className="text-xs text-slate-400 ml-1">({user.role.name})</span>}
            </span>
            <button onClick={handleLogout} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
