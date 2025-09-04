import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as customerApi from '../services/customerApi';
import { PublicCustomerUser, UpdateProfileData, ChangePasswordData } from '../types';
import { useToast } from './ToastContext';

const CUSTOMER_TOKEN_KEY = 'reservio_customer_token';

interface CustomerAuthContextType {
  currentCustomer: PublicCustomerUser | null;
  customerToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  reloadCustomer: () => void;
  addFavorite: (businessId: string) => Promise<void>;
  removeFavorite: (businessId: string) => Promise<void>;
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

  const setSession = (user: PublicCustomerUser, token: string) => {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    setCurrentCustomer(user);
    setCustomerToken(token);
  };

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await customerApi.customerLogin(email, password);
      setSession(user, token);
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
      setSession(user, token);
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

  const updateProfile = async (data: UpdateProfileData) => {
    if (!customerToken) throw new Error("Not authenticated");
    try {
        const updatedUser = await customerApi.updateMyProfile(data, customerToken);
        // The token needs to be regenerated if email changes, for simplicity we'll just update local state
        setCurrentCustomer(prev => prev ? { ...prev, ...updatedUser } : null);
        addToast('Profile updated successfully!', 'success');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        addToast(message, 'error');
        throw error;
    }
  };
  
  const changePassword = async (data: ChangePasswordData) => {
      if (!customerToken) throw new Error("Not authenticated");
      try {
          await customerApi.changeMyPassword(data, customerToken);
          addToast('Password changed successfully!', 'success');
      } catch (error) {
          const message = error instanceof Error ? error.message : 'An unknown error occurred.';
          addToast(message, 'error');
          throw error;
      }
  };

  const reloadCustomer = () => {
    // This is a simple reload. In a real app, you might re-fetch the user profile.
    loadSession();
  };

  const addFavorite = async (businessId: string) => {
    if (!customerToken || !currentCustomer) return;
    const originalCustomer = currentCustomer;
    const newFavorites = [...originalCustomer.favoriteBusinessIds, businessId];
    setCurrentCustomer({ ...originalCustomer, favoriteBusinessIds: newFavorites });
    try {
        await customerApi.addFavorite(businessId, customerToken);
        addToast('Added to favorites!', 'success');
    } catch (error) {
        setCurrentCustomer(originalCustomer); // Revert on error
        addToast('Failed to add favorite.', 'error');
    }
  };
  
  const removeFavorite = async (businessId: string) => {
    if (!customerToken || !currentCustomer) return;
    const originalCustomer = currentCustomer;
    const newFavorites = originalCustomer.favoriteBusinessIds.filter(id => id !== businessId);
    setCurrentCustomer({ ...originalCustomer, favoriteBusinessIds: newFavorites });
    try {
        await customerApi.removeFavorite(businessId, customerToken);
         addToast('Removed from favorites.', 'info');
    } catch (error) {
        setCurrentCustomer(originalCustomer); // Revert on error
        addToast('Failed to remove favorite.', 'error');
    }
  };

  const value = {
    currentCustomer,
    customerToken,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    reloadCustomer,
    addFavorite,
    removeFavorite,
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