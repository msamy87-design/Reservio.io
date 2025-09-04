
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedCustomerRoute from './components/ProtectedCustomerRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

// Business Pages
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import StaffPage from './pages/StaffPage';
import StaffDetailPage from './pages/StaffDetailPage';
import ServicesPage from './pages/ServicesPage';
import ProductsPage from './pages/ProductsPage';
import MarketingPage from './pages/MarketingPage';
import ReviewsPage from './pages/ReviewsPage';
import ReportsPage from './pages/ReportsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Marketplace Pages
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import CustomerSignupPage from './pages/CustomerSignupPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminBusinessesPage from './pages/AdminBusinessesPage';


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Marketplace & Customer Routes */}
              <Route path="/" element={<CustomerAuthProvider><HomePage /></CustomerAuthProvider>} />
              <Route path="/search" element={<CustomerAuthProvider><SearchResultsPage /></CustomerAuthProvider>} />
              <Route path="/business/:businessId" element={<CustomerAuthProvider><BusinessProfilePage /></CustomerAuthProvider>} />
              <Route path="/login" element={<CustomerAuthProvider><CustomerLoginPage /></CustomerAuthProvider>} />
              <Route path="/signup" element={<CustomerAuthProvider><CustomerSignupPage /></CustomerAuthProvider>} />
              <Route path="/account" element={
                <CustomerAuthProvider>
                  <ProtectedCustomerRoute>
                    <CustomerDashboardPage />
                  </ProtectedCustomerRoute>
                </CustomerAuthProvider>
              } />

              {/* Business Portal Routes */}
              <Route path="/biz/login" element={<AuthProvider><LoginPage /></AuthProvider>} />
              <Route path="/biz/signup" element={<AuthProvider><SignupPage /></AuthProvider>} />
              <Route path="/biz/*" element={
                <AuthProvider>
                  <DataProvider>
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="dashboard" element={<DashboardPage />} />
                          <Route path="bookings" element={<BookingsPage />} />
                          <Route path="customers" element={<CustomersPage />} />
                          <Route path="customers/:id" element={<CustomerDetailPage />} />
                          <Route path="staff" element={<StaffPage />} />
                          <Route path="staff/:id" element={<StaffDetailPage />} />
                          <Route path="services" element={<ServicesPage />} />
                          <Route path="inventory" element={<ProductsPage />} />
                          <Route path="marketing" element={<MarketingPage />} />
                          <Route path="reviews" element={<ReviewsPage />} />
                          <Route path="reports" element={<ReportsPage />} />
                          <Route path="developer/api-keys" element={<ApiKeysPage />} />
                          <Route path="settings" element={<SettingsPage />} />
                          <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  </DataProvider>
                </AuthProvider>
              } />

              {/* Admin Portal Routes */}
              <Route path="/admin/login" element={<AdminAuthProvider><AdminLoginPage /></AdminAuthProvider>} />
              <Route path="/admin/*" element={
                <AdminAuthProvider>
                    <ProtectedAdminRoute>
                      <AdminLayout>
                        <Routes>
                          <Route path="dashboard" element={<AdminDashboardPage />} />
                          <Route path="businesses" element={<AdminBusinessesPage />} />
                          <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                      </AdminLayout>
                    </ProtectedAdminRoute>
                </AdminAuthProvider>
              } />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
