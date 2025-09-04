import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as customerApi from '../services/customerApi';
import { PublicCustomerUser } from '../types';
import { useToast } from './ToastContext';

const CUSTOMER_TOKEN_KEY = 'reservio_customer_token';

interface CustomerAuthContextType {
  currentCustomer: PublicCustomerUser | null;
  customerToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCustomer, setCurrentCustomer] = useState<PublicCustomerUser | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadSession = useCallback(() => {
    setLoading(true);
    try {
        const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentCustomer(payload.user);
            setCustomerToken(token);
        }
    } catch (error) {
        console.error("Failed to load customer session:", error);
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await customerApi.customerLogin(email, password);
      localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
      setCurrentCustomer(user);
      setCustomerToken(token);
      addToast('Login successful!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToast(message, 'error');
      throw error;
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    try {
      const { user, token } = await customerApi.customerSignup(fullName, email, password);
      localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
      setCurrentCustomer(user);
      setCustomerToken(token);
      addToast('Account created successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToast(message, 'error');
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    setCurrentCustomer(null);
    setCustomerToken(null);
    addToast('You have been logged out.', 'info');
  }, [addToast]);

  const value = {
    currentCustomer,
    customerToken,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
