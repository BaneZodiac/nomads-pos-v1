import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return '/api';
  return 'https://nomads-pos-api.onrender.com/api';
};

const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = basename + '/login';
    }
    if (!error.response) {
      console.error('Network error - is the backend running?', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
