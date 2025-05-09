import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import EmployeeView from './components/EmployeeView';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import FaceCapture from './components/FaceCapture';
import BiometricAttendance from './components/BiometricAttendance';
import FingerprintScanner from './components/FingerprintScanner';

// Services
import { authService } from './services/authService';
import { themeService } from './services/themeService';
import { employeeAuthService } from './services/employeeAuthService';
import { fingerprintService } from './services/fingerprintService';

function App() {
  // User state 
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(themeService.initTheme());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Biometric authentication state
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [attendanceType, setAttendanceType] = useState('sign-in');
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [showBiometricAttendance, setShowBiometricAttendance] = useState(false);
  const [fingerprintSupported, setFingerprintSupported] = useState(false);
  
  // Check for existing session and device capabilities on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check user session
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
        
        // Check fingerprint capability
        const hasFingerprint = await fingerprintService.checkFingerprintSupport();
        setFingerprintSupported(hasFingerprint);
        
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initApp();
  }, []);
  
  const handleLogin = async (email, password) => {
    try {
      const user = await authService.login(email, password);
      
      if (!user) {
        throw new Error('Login failed - no user data returned');
      }
      
      setCurrentUser(user);
      setShowLoginModal(false);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };
  
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    toast.success('You have been logged out');
  };
  
  const toggleTheme = () => {
    const newTheme = themeService.toggleTheme();
    setIsDarkMode(newTheme === 'dark');
  };
  
  // Start fingerprint verification
  const startFingerprintVerification = () => {
    setIsScanningFingerprint(true);
    setAttendanceSuccess(false);
  };
  
  // Handle fingerprint verification completion
  const handleFingerprintVerify = async (employeeId) => {
    try {
      // Get employee data using verified fingerprint
      const employee = await employeeAuthService.getEmployeeByFingerprint(employeeId);
      
      if (employee) {
        setEmployeeData(employee);
        
        // Determine if this is a sign-in or sign-out
        const currentHour = new Date().getHours();
        const isSignIn = currentHour < 12; // Before noon is sign-in, after is sign-out
        
        setAttendanceType(isSignIn ? 'sign-in' : 'sign-out');
        
        // Start facial capture
        setIsCapturingFace(true);
        setIsScanningFingerprint(false);
      } else {
        toast.error('Employee verification failed. Please try again.');
        setIsScanningFingerprint(false);
      }
    } catch (error) {
      console.error('Fingerprint verification error:', error);
      toast.error('Error verifying identity. Please try again.');
      setIsScanningFingerprint(false);
    }
  };
  
  // Cancel biometric verification
  const handleBiometricCancel = () => {
    setIsScanningFingerprint(false);
    setIsCapturingFace(false);
    setEmployeeData(null);
    setAttendanceSuccess(false);
    setShowBiometricAttendance(false);
  };
  
  // Handle face capture for attendance
  const handleFaceCapture = async (faceImage) => {
    if (!employeeData) return;
    
    try {
      // Prepare attendance data
      const attendanceData = {
        employeeId: employeeData._id,
        type: attendanceType,
        facialImage: faceImage,
        verificationMethod: 'biometric'
      };
      
      // Record attendance
      await employeeAuthService.recordAttendanceWithFace(attendanceData);
      
      // Handle success
      setIsCapturingFace(false);
      setAttendanceSuccess(true);
      toast.success(`${attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} successfully!`);
      
      // Reset states after a delay
      setTimeout(() => {
        setEmployeeData(null);
        setAttendanceSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance. Please try again.');
      setIsCapturingFace(false);
    }
  };
  
  // Demo function to toggle between admin and employee roles
  const toggleUserRole = async () => {
    if (!currentUser) return;
    

    const newRole = currentUser.role === 'admin' ? 'employee' : 'admin';
    setCurrentUser({
      ...currentUser,
      role: newRole
    });
    
    toast.success(`Switched to ${newRole} view`);
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#333',
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
        {isScanningFingerprint ? (
          <div className="container mx-auto px-4 py-8">
            <FingerprintScanner 
              onSuccess={handleFingerprintVerify}
              onError={(error) => {
                toast.error(`Verification failed: ${error}`);
                setIsScanningFingerprint(false);
              }}
              onCancel={handleBiometricCancel}
            />
          </div>
        ) : isCapturingFace ? (
          <div className="container mx-auto px-4 py-8">
            <FaceCapture
              onCapture={handleFaceCapture}
              onCancel={handleBiometricCancel}
              employeeName={employeeData?.name}
            />
          </div>
        ) : showBiometricAttendance ? (
          <BiometricAttendance 
            onComplete={() => setShowBiometricAttendance(false)} 
          />
        ) : attendanceSuccess ? (
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {attendanceType === 'sign-in' ? 'Signed In Successfully!' : 'Signed Out Successfully!'}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Thank you, {employeeData?.name}!
              </p>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Time: {new Date().toLocaleTimeString()}
              </div>
              
              <button
                onClick={() => setAttendanceSuccess(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : currentUser ? (
          <div>
            {currentUser.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <EmployeeView />
            )}
            
            {/* Role toggle for demo purposes */}
            <div className="container mx-auto px-4 mt-8 mb-8">
              <button 
                onClick={toggleUserRole}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Switch to {currentUser.role === 'admin' ? 'Employee' : 'Admin'} View
              </button>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-3xl font-bold mb-6">Welcome to WorkBeat</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Employee attendance made simple
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setShowBiometricAttendance(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM13 12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-3zm1 2v1h1v-1h-1z" clipRule="evenodd" />
                  </svg>
                  Biometric Attendance
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                      or
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-6 rounded-md flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;