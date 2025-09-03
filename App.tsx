
import React from 'react';
// FIX: Use namespace import for react-router-dom to fix module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
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
      <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/biz/bookings" replace />} />
        <ReactRouterDOM.Route path="/dashboard" element={<DashboardPage />} />
        <ReactRouterDOM.Route path="/bookings" element={<BookingsPage />} />
        <ReactRouterDOM.Route path="/customers" element={<CustomersPage />} />
        <ReactRouterDOM.Route path="/customers/:id" element={<CustomerDetailPage />} />
        <ReactRouterDOM.Route path="/staff" element={<StaffPage />} />
        <ReactRouterDOM.Route path="/services" element={<ServicesPage />} />
        <ReactRouterDOM.Route path="/inventory" element={<ProductsPage />} />
        <ReactRouterDOM.Route path="/marketing" element={<MarketingPage />} />
        <ReactRouterDOM.Route path="/reviews" element={<ReviewsPage />} />
        <ReactRouterDOM.Route path="/reports" element={<ReportsPage />} />
        <ReactRouterDOM.Route path="/developer/api-keys" element={<ApiKeysPage />} />
        <ReactRouterDOM.Route path="/settings" element={<SettingsPage />} />
      </ReactRouterDOM.Routes>
    </Layout>
);

const MarketplaceRoutes: React.FC = () => (
  <CustomerAuthProvider>
    <ReactRouterDOM.Routes>
      <ReactRouterDOM.Route path="/" element={<HomePage />} />
      <ReactRouterDOM.Route path="/search" element={<SearchResultsPage />} />
      <ReactRouterDOM.Route path="/business/:businessId" element={<BusinessProfilePage />} />
      <ReactRouterDOM.Route path="/login" element={<CustomerLoginPage />} />
      <ReactRouterDOM.Route path="/signup" element={<CustomerSignupPage />} />
      <ReactRouterDOM.Route 
        path="/account" 
        element={
          <ProtectedCustomerRoute>
            <CustomerDashboardPage />
          </ProtectedCustomerRoute>
        } 
      />
    </ReactRouterDOM.Routes>
  </CustomerAuthProvider>
);

const AdminRoutes: React.FC = () => (
  <AdminLayout>
    <ReactRouterDOM.Routes>
      <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/admin/dashboard" replace />} />
      <ReactRouterDOM.Route path="/dashboard" element={<AdminDashboardPage />} />
      <ReactRouterDOM.Route path="/businesses" element={<AdminBusinessesPage />} />
    </ReactRouterDOM.Routes>
  </AdminLayout>
);


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <ReactRouterDOM.HashRouter>
            <AuthProvider>
              <DataProvider>
                <AdminAuthProvider>
                  <ReactRouterDOM.Routes>
                    {/* Admin Portal Routes */}
                    <ReactRouterDOM.Route path="/admin/login" element={<AdminLoginPage />} />
                    <ReactRouterDOM.Route 
                      path="/admin/*"
                      element={
                        <ProtectedAdminRoute>
                          <AdminRoutes />
                        </ProtectedAdminRoute>
                      }
                    />

                    {/* Business Portal Routes */}
                    <ReactRouterDOM.Route path="/biz/login" element={<LoginPage />} />
                    <ReactRouterDOM.Route path="/biz/signup" element={<SignupPage />} />
                    <ReactRouterDOM.Route 
                      path="/biz/*" 
                      element={
                        <ProtectedRoute>
                          <BizRoutes />
                        </ProtectedRoute>
                      } 
                    />

                    {/* All other routes are handled by MarketplaceRoutes */}
                    <ReactRouterDOM.Route path="/*" element={<MarketplaceRoutes />} />
                  </ReactRouterDOM.Routes>
                </AdminAuthProvider>
              </DataProvider>
            </AuthProvider>
          </ReactRouterDOM.HashRouter>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
