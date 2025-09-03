import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as adminApi from '../services/adminApi';
import { AdminUser } from '../types';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'reservio_admin_token';

interface AdminAuthContextType {
  currentAdmin: AdminUser | null;
  adminToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadSession = useCallback(() => {
    setLoading(true);
    try {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentAdmin(payload.user);
            setAdminToken(token);
        }
    } catch (error) {
        console.error("Failed to load admin session:", error);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await adminApi.adminLogin(email, password);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      setCurrentAdmin(user);
      setAdminToken(token);
      addToast('Admin login successful!', 'success');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToast(message, 'error');
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setCurrentAdmin(null);
    setAdminToken(null);
    navigate('/admin/login');
    addToast('You have been logged out.', 'info');
  }, [addToast, navigate]);

  const value = {
    currentAdmin,
    adminToken,
    loading,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};