import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    return !!token && !!user;
  };

  // Load user data on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          // Try to get user data from local storage first
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          // Then try to refresh user data from the server
          try {
            const response = await authApi.getCurrentUser();
            if (response && response.data) {
              const userData = response.data;
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (error) {
            console.warn('Could not refresh user data:', error);
            // Keep using the stored user data if available
            if (!storedUser) {
              throw error;
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user', error);
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (userData) => {
    try {
      // Store user data in state and local storage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('manager_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const isAuthenticated = checkAuth();
  const isManager = user?.user_type === 'MANAGER' || user?.user_type === 'ADMIN';
  const isAdmin = user?.user_type === 'ADMIN';

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isManager,
    isAdmin,
    login,
    logout
  }), [user, loading, isAuthenticated, isManager, isAdmin, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

export default AuthContext;
