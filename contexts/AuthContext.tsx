
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { User } from '../types';
import { useToast } from './ToastContext';
import * as ReactRouterDOM from 'react-router-dom';

type AuthUser = Omit<User, 'passwordHash'>;

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (businessName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = ReactRouterDOM.useNavigate();

  const checkUserSession = useCallback(async () => {
    setLoading(true);
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Session check failed:", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await api.login(email, password);
      setCurrentUser(user);
      addToast('Login successful!', 'success');
      navigate('/biz/bookings');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToast(message, 'error');
      throw error;
    }
  };

  const signup = async (businessName: string, email: string, password: string) => {
    try {
      const { user } = await api.signup(businessName, email, password);
      setCurrentUser(user);
      addToast('Account created successfully!', 'success');
      navigate('/biz/bookings');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToast(message, 'error');
      throw error;
    }
  };

  const logout = useCallback(async () => {
    await api.logout();
    setCurrentUser(null);
    navigate('/');
    addToast('You have been logged out.', 'info');
  }, [addToast, navigate]);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// This custom hook will be used by consumers of the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};