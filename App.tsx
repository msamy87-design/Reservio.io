
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ApiKeysPage from './pages/ApiKeysPage';
import SettingsPage from './pages/SettingsPage';
import BookingsPage from './pages/BookingsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ServicesPage from './pages/ServicesPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MarketingPage from './pages/MarketingPage';
import ReviewsPage from './pages/ReviewsPage';
import ProductsPage from './pages/ProductsPage';
import { ToastProvider } from './contexts/ToastContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
// FIX: Correct import path for SearchResultsPage
import SearchResultsPage from './pages/SearchResultsPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import CustomerSignupPage from './pages/CustomerSignupPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import ProtectedCustomerRoute from './components/ProtectedCustomerRoute';
import BusinessProfilePage from './pages/BusinessProfilePage';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminLoginPage from './pages/AdminLoginPage';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminBusinessesPage from './pages/AdminBusinessesPage';

const BizRoutes: React.FC = () => (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/biz/bookings" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/inventory" element={<ProductsPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/developer/api-keys" element={<ApiKeysPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
);

const MarketplaceRoutes: React.FC = () => (
  <CustomerAuthProvider>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/business/:businessId" element={<BusinessProfilePage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      <Route path="/signup" element={<CustomerSignupPage />} />
      <Route 
        path="/account" 
        element={
          <ProtectedCustomerRoute>
            <CustomerDashboardPage />
          </ProtectedCustomerRoute>
        } 
      />
    </Routes>
  </CustomerAuthProvider>
);

const AdminRoutes: React.FC = () => (
  <AdminLayout>
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/dashboard" element={<AdminDashboardPage />} />
      <Route path="/businesses" element={<AdminBusinessesPage />} />
    </Routes>
  </AdminLayout>
);


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <HashRouter>
            <AuthProvider>
              <DataProvider>
                <AdminAuthProvider>
                  <Routes>
                    {/* Admin Portal Routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route 
                      path="/admin/*"
                      element={
                        <ProtectedAdminRoute>
                          <AdminRoutes />
                        </ProtectedAdminRoute>
                      }
                    />

                    {/* Business Portal Routes */}
                    <Route path="/biz/login" element={<LoginPage />} />
                    <Route path="/biz/signup" element={<SignupPage />} />
                    <Route 
                      path="/biz/*" 
                      element={
                        <ProtectedRoute>
                          <BizRoutes />
                        </ProtectedRoute>
                      } 
                    />

                    {/* All other routes are handled by MarketplaceRoutes */}
                    <Route path="/*" element={<MarketplaceRoutes />} />
                  </Routes>
                </AdminAuthProvider>
              </DataProvider>
            </AuthProvider>
          </HashRouter>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;