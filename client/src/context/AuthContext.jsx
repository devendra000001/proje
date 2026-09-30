import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const saved = localStorage.getItem('rss_vnit_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    try { localStorage.removeItem('rss_vnit_user'); } catch { /* storage unavailable */ }
    return null;
  }
};

const readStoredToken = () => {
  try { return localStorage.getItem('rss_vnit_token'); } catch { return null; }
};

const removeSession = () => {
  try {
    localStorage.removeItem('rss_vnit_token');
    localStorage.removeItem('rss_vnit_user');
  } catch { /* storage unavailable */ }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return readStoredUser();
  });
  const [token, setToken] = useState(readStoredToken);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  // Logout helper
  const logout = useCallback(() => {
    removeSession();
    setToken(null);
    setUser(null);
    setSessionError(null);
  }, []);

  // Check auth session on load
  const checkAuth = useCallback(async () => {
    const savedToken = readStoredToken();
    if (!savedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setSessionError(null);
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('rss_vnit_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      } else {
        setSessionError('Could not verify your session with the server. Some information may be out of date.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();

    // Event listener for expired token emitted by Axios interceptor
    const handleExpired = () => logout();
    window.addEventListener('rss_auth_expired', handleExpired);
    return () => window.removeEventListener('rss_auth_expired', handleExpired);
  }, [checkAuth, logout]);

  // Login handler
  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('rss_vnit_token', newToken);
      localStorage.setItem('rss_vnit_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      setSessionError(null);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const updateToken = useCallback((newToken) => {
    localStorage.setItem('rss_vnit_token', newToken);
    setToken(newToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        sessionError,
        login,
        updateToken,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
