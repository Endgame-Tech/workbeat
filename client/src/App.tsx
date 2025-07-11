import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import EmployeeView from './components/EmployeeView';
import LoginModal from './components/LoginModal';

// Services
import { authService } from './services/authService';
import { themeService } from './services/themeService';


function App() {
  const navigate = useNavigate();
  
  // User state 
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(themeService.initTheme());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for existing user session
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await authService.login(credentials.email, credentials.password);
      setCurrentUser(user);
      setShowLoginModal(false);
      toast.success('Login successful!');
      
      // Redirect logic is now handled by LoginModal component
      // No need to duplicate it here
    } catch (error) {
      toast.error(
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Login failed'
      );
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/');
    toast.success('Logged out successfully');
  };

  const toggleTheme = () => {
    const newTheme = themeService.toggleTheme();
    setIsDarkMode(newTheme === 'dark');
  };

  const toggleUserRole = () => {
    if (currentUser) {
      const newRole = currentUser.role === 'admin' ? 'employee' : 'admin';
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success(`Switched to ${newRole} role`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#374151' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#111827',
          },
        }}
      />
      
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        onToggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      
      <main className="flex-1">
        {currentUser ? (
          currentUser.role === 'admin' ? (
            // Redirect admin users to their organization dashboard
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-md mx-auto text-center">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Redirecting you to your organization dashboard...
                </p>
                {(() => {
                  const orgId = currentUser.organizationId || currentUser.organization?.id;
                  if (orgId) {
                    navigate(`/organization/${orgId}`);
                  }
                  return null;
                })()}
              </div>
            </div>
          ) : (
            <EmployeeView />
          )
        ) : (
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-3xl font-bold mb-6">Welcome to WorkBeat</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Employee attendance made simple
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {/* TODO: Implement biometric attendance */}}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md"
                >
                  Biometric Attendance
                </button>
                
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
      
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default App;