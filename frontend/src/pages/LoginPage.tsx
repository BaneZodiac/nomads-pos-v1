import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@nomadpos.com');
  const [password, setPassword] = useState('admin123');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome to Nomads POS!');
      const user = useAuthStore.getState().user;
      if (user?.isSuperAdmin) navigate('/admin/tenants');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">Nomads POS</h1>
          <p className="text-blue-200 mt-2 text-lg">Multi-tenant Point of Sale System</p>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg shrink-0 mt-1">✓</div>
            <div>
              <h3 className="text-white font-semibold">Multi-tenant Architecture</h3>
              <p className="text-blue-200 text-sm mt-1">Manage multiple businesses from a single platform with strict data isolation.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg shrink-0 mt-1">⚡</div>
            <div>
              <h3 className="text-white font-semibold">Real-time POS</h3>
              <p className="text-blue-200 text-sm mt-1">Fast billing with barcode scanning, discounts, split payments, and receipt printing.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg shrink-0 mt-1">📊</div>
            <div>
              <h3 className="text-white font-semibold">Analytics & Reports</h3>
              <p className="text-blue-200 text-sm mt-1">Sales insights, profit tracking, best-sellers, and inventory management.</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-blue-300 text-xs">
          © 2026 Nomads POS. All rights reserved.
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Nomads POS</h1>
            <p className="text-slate-500 mt-1">Sign in to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="hidden lg:block text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-lg">✉</span>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-400"
                    placeholder="you@example.com" required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-lg">🔒</span>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-400"
                    placeholder="Enter your password" required
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Demo credentials are pre-filled.<br />
                Click <span className="font-medium text-slate-600">Sign In</span> to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
