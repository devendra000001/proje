import axios from 'axios';

// Base API URL from environment variable or default local proxy
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '');
if (!API_URL) throw new Error('VITE_API_URL must be configured for production builds.');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rss_vnit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized / Token Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login failure endpoint itself
      const isLoginEndpoint = error.config && error.config.url && error.config.url.includes('/auth/login');
      if (!isLoginEndpoint) {
        localStorage.removeItem('rss_vnit_token');
        localStorage.removeItem('rss_vnit_user');
        window.dispatchEvent(new Event('rss_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
