import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import LandingPage from './pages/LandingPage';
import OrganizationRegistration from './components/organization/OrganizationRegistration';
import OrganizationDashboard from './components/organization/OrganizationDashboard';
import OrganizationSettings from './components/organization/OrganizationSettings';
import EmployeeView from './components/EmployeeView';
import AdminDashboard from './components/AdminDashboard';
import BiometricAttendance from './components/BiometricAttendance';
import LoginModal from './components/LoginModal';
import NotFound from './components/layout/NotFound';

// Auth Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import OrganizationRoute from './components/auth/OrganizationRoute';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginModal isOpen={true} onClose={() => {}} onLogin={() => {}} />} />
        <Route path="/register" element={<OrganizationRegistration />} />
        <Route path="/attend" element={<BiometricAttendance onComplete={() => {}} />} />
        
        {/* Legacy App Route - Redirect to new structure */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />
        
        {/* Organization Routes */}
        <Route path="/organization/:organizationId" element={
          <ProtectedRoute>
            <OrganizationRoute>
              <OrganizationDashboard organizationId="" />
            </OrganizationRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/organization/:organizationId/settings" element={
          <ProtectedRoute>
            <OrganizationRoute>
              <OrganizationSettings organizationId="" />
            </OrganizationRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/organization/:organizationId/employees" element={
          <ProtectedRoute>
            <OrganizationRoute>
              <AdminDashboard />
            </OrganizationRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/organization/:organizationId/attendance" element={
          <ProtectedRoute>
            <OrganizationRoute>
              <BiometricAttendance onComplete={() => {}} />
            </OrganizationRoute>
          </ProtectedRoute>
        } />
        
        {/* Employee View - Only accessible to employees */}
        <Route path="/employee" element={
          <ProtectedRoute role="employee">
            <EmployeeView />
          </ProtectedRoute>
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;