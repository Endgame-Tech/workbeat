import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { SubscriptionModalProvider } from './hooks/useSubscriptionModal';
import { OrganizationProvider } from './components/context/OrganizationContext';
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import SecurityPage from './pages/SecurityPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import OrganizationRegistration from './components/organization/OrganizationRegistration';
import OrganizationLayout from './components/layout/OrganizationLayout';
import OrganizationOverview from './components/organization/OrganizationOverview';
import OrganizationEmployees from './components/organization/OrganizationEmployees';
import OrganizationAttendance from './components/organization/OrganizationAttendance';
import OrganizationReports from './components/organization/OrganizationReports';
import OrganizationSettings from './components/organization/OrganizationSettings';
import EnhancedOrganizationSettings from './components/organization/EnhancedOrganizationSettings';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LeaveManagementDashboard from './components/leave/LeaveManagementDashboard';
import { ShiftManagementDashboard } from './components/shift/ShiftManagementDashboard';
import EmployeeView from './components/EmployeeView';
import BiometricAttendance from './components/BiometricAttendance';
import LoginModal from './components/LoginModal';
import NotFound from './components/layout/NotFound';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ThemePreview from './components/ThemePreview';

// Auth Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import OrganizationRoute from './components/auth/OrganizationRoute';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <SubscriptionModalProvider>
        <Toaster position="top-right" />
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Placeholder pages for missing links - Coming Soon pages */}
        <Route path="/integrations" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Integrations</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/docs" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Documentation</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/guides" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Guides</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/help" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Help Center</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/blog" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Blog</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/careers" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Careers</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/press" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Press</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/cookies" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Cookie Policy</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        <Route path="/data-processing" element={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Data Processing</h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-6">Coming Soon!</p>
              <Link to="/" className="text-primary-600 hover:text-primary-700 underline">← Back to Home</Link>
            </div>
          </div>
        } />
        
        {/* Theme Preview Route for testing branding */}
        <Route path="/theme-preview" element={<ThemePreview />} />
        
        {/* Offline Attendance Demo Route for testing offline functionality */}
        <Route path="/offline-demo" element={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Offline Attendance System Demo
              </h1>
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    How to Test Offline Functionality
                  </h2>
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>1. <strong>Try Network Offline:</strong> Disconnect your internet or turn off WiFi to test real offline mode</p>
                    <p>2. <strong>Use Manual Offline:</strong> Use the offline indicator to toggle manual offline mode</p>
                    <p>3. <strong>Record Attendance:</strong> Try recording attendance while offline - it will be stored locally</p>
                    <p>4. <strong>Go Back Online:</strong> Reconnect to internet to see automatic sync in action</p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <p className="text-blue-800 dark:text-blue-200 text-center">
                    The offline system uses IndexedDB to store attendance records locally when internet is unavailable.
                    Records are automatically synced when connectivity returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        } />
        
        
        <Route path="/login" element={<LoginModal isOpen={true} onClose={() => {}} />} />
        <Route path="/register" element={<OrganizationRegistration />} />
        <Route path="/attend" element={<BiometricAttendance onComplete={() => {}} />} />
        
        {/* Payment Callback Route - Protected */}
        <Route path="/subscription/callback" element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        } />
        
        {/* Legacy App Route - Redirect to new structure */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />
        
        {/* Organization Routes with Layout */}
        <Route path="/organization/:organizationId" element={
          <ProtectedRoute>
            <OrganizationRoute>
              <OrganizationProvider>
                <OrganizationLayout />
              </OrganizationProvider>
            </OrganizationRoute>
          </ProtectedRoute>
        }>
          {/* Nested routes within the organization layout */}
          <Route index element={<OrganizationOverview />} />
          <Route path="employees" element={<OrganizationEmployees />} />
          <Route path="attendance" element={<OrganizationAttendance />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="reports" element={<OrganizationReports />} />
          <Route path="leave" element={
            <LeaveManagementDashboard
              currentUser={{
                id: 1,
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'admin'
              }}
              isAdmin={true}
            />
          } />
          <Route path="shifts" element={<ShiftManagementDashboard />} />
          <Route path="settings" element={<EnhancedOrganizationSettings />} />
          <Route path="settings/basic" element={<OrganizationSettings />} />
        </Route>
        
        {/* Employee View - Only accessible to employees */}
        <Route path="/employee" element={
          <ProtectedRoute role="employee">
            <EmployeeView />
          </ProtectedRoute>
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </SubscriptionModalProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;