import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerLogin from './pages/ManagerLogin';
import AdminLogin from './pages/AdminLogin';
import StaffLogin from './pages/StaffLogin';
import Layout from './components/staff/Layout';
import Menu from './components/staff/Menu';
import TablesPage from './components/staff/TablesPage';
import TableDetails from './components/staff/TableDetails';
// Lazy load dashboard components
const ManagerLayout = React.lazy(() => import('./components/manager/ManagerLayout'));
const ManagerDashboard = React.lazy(() => import('./components/manager/ManagerDashboard'));
const ProductsDashboard = React.lazy(() => import('./components/manager/ProductsDashboard'));
const ManagerStaffs = React.lazy(() => import('./components/manager/ManagerStaffs'));
const ManagerSettings = React.lazy(() => import('./components/manager/ManagerSettings'));
const ManagerReports = React.lazy(() => import('./components/manager/ManagerReports'));
const InventoryManagement = React.lazy(() => import('./components/manager/InventoryManagement'));
// StaffDashboard component is not used directly in this file
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Home component to redirect based on user role
const Home = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }
  
  if (user.user_type === 'ADMIN' || user.user_type === 'MANAGER') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/staff/dashboard" replace />;
  }
};

// Admin routes component - used in AdminManagerRoutes
const AdminRoutes = () => (
  <AdminDashboard>
    <Routes>
      <Route index element={<ManagerDashboard />} />
      <Route path="staff" element={<ManagerStaffs />} />
      <Route path="inventory" element={<InventoryManagement />} />
      <Route path="reports" element={<ManagerReports />} />
      <Route path="settings" element={<ManagerSettings />} />
      <Route path="products" element={<ProductsDashboard />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </AdminDashboard>
);

// Manager routes component
const ManagerRoutes = () => (
  <ManagerLayout>
    <Routes>
      <Route index element={<ManagerDashboard />} />
      <Route path="dashboard" element={<ManagerDashboard />} />
      <Route path="items" element={<ProductsDashboard />} />
      <Route path="staff" element={<ManagerStaffs />} />
      <Route path="inventory" element={<InventoryManagement />} />
      <Route path="reports" element={<ManagerReports />} />
      <Route path="settings" element={<ManagerSettings />} />
      <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
    </Routes>
  </ManagerLayout>
);

// Admin/Manager routes component - renders the appropriate layout based on user type
const AdminManagerRoutes = () => {
  const { user } = useAuth();
  
  // For admin users, wrap content in AdminDashboard
  if (user?.user_type === 'ADMIN') {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <AdminDashboard>
          <Routes>
            <Route index element={<ManagerDashboard />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="items" element={<ProductsDashboard />} />
            <Route path="staff" element={<ManagerStaffs />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="settings" element={<ManagerSettings />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </AdminDashboard>
      </React.Suspense>
    );
  }
  
  // For manager users, use ManagerLayout with manager routes
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ManagerLayout>
        <Routes>
          <Route index element={<ManagerDashboard />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="manager-items" element={<ProductsDashboard />} />
          <Route path="staff" element={<ManagerStaffs />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="reports" element={<ManagerReports />} />
          <Route path="settings" element={<ManagerSettings />} />
          <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
        </Routes>
      </ManagerLayout>
    </React.Suspense>
  );
};

// Staff routes component
const StaffRoutes = () => (
  <Layout>
    <Routes>
      <Route path="dashboard" element={<TablesPage />} />
      <Route path="tables" element={<TablesPage />} />
      <Route path="menu" element={<Menu />} />
      <Route path="tables/:id" element={<TableDetails />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </Layout>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <React.Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/manager-login" element={<ManagerLogin />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Home />} />
            
            {/* Admin routes - only for users with ADMIN role */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminManagerRoutes />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="products" element={<ProductsDashboard />} />
              <Route path="manager-staff" element={<ManagerStaffs />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="reports" element={<ManagerReports />} />
              <Route path="settings" element={<ManagerSettings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
            
            {/* Manager routes - for both ADMIN and MANAGER roles */}
            <Route
              path="/manager/*"
              element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <ManagerRoutes />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="items" element={<ProductsDashboard />} />
              <Route path="staff" element={<ManagerStaffs />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="reports" element={<ManagerReports />} />
              <Route path="settings" element={<ManagerSettings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
            
            {/* Staff routes - for STAFF role */}
            <Route
              path="/staff/*"
              element={
                <ProtectedRoute roles={['STAFF']}>
                  <StaffRoutes />
                </ProtectedRoute>
              }
            />
            
            {/* Regular Layout for menu and tables */}
            <Route element={<Layout />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/tables/:id" element={<TableDetails />} />
            </Route>
            
            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
