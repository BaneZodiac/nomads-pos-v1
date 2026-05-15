import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isSuperAdmin: boolean;
  tenantId?: string;
  tenantName?: string;
  tenantSlug?: string;
  role?: { id: string; name: string; slug: string };
  location?: { id: string; name: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  return {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    loading: false,

    login: async (email, password) => {
      set({ loading: true });
      try {
        const response = await api.post('/auth/login', { email, password });
        const data = response.data;
        if (data.success) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          set({ user: data.data.user, token: data.data.token, loading: false });
        }
      } catch (error: any) {
        set({ loading: false });
        throw new Error('Login failed');
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    },

    checkAuth: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await api.get('/auth/me');
        const data = response.data;
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.data));
          set({ user: data.data, token });
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      }
    },
  };
});