import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Fingerprint, UserPlus, LogIn, User } from 'lucide-react';

// Import components
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';
import FingerprintScanner from '../components/FingerprintScanner';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

// Import services
import { employeeAuthService } from '../services/employeeAuthService';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  interface EmployeeData {
    _id: string;
    name: string;
    department: string;
    position: string;
    attendanceRecorded?: boolean;
    attendanceTime?: string;
    attendanceType?: 'sign-in' | 'sign-out';
    [key: string]: unknown;
  }

  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [attendanceType, setAttendanceType] = useState<'sign-in' | 'sign-out'>('sign-in');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        // If user is admin, redirect to dashboard
        if (userData.role === 'admin') {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  // Admin login modal close handler
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
  };

  const handleSignupModalClose = () => {
    setIsSignupModalOpen(false);
  };

  // Fingerprint verification handler
  const handleFingerprintVerify = async (employeeId?: string) => {
    try {
      if (!employeeId) {
        toast.error('Employee identification failed. Please try again.');
        setIsScanningFingerprint(false);
        return;
      }

      // Get employee data using verified fingerprint
      const employee = await employeeAuthService.getEmployeeByFingerprint(employeeId);
      
      if (employee) {
        setEmployeeData(employee);
        
        // Determine if this is a sign-in or sign-out
        const currentHour = new Date().getHours();
        const isSignIn = currentHour < 12; // Before noon is sign-in, after is sign-out
        
        setAttendanceType(isSignIn ? 'sign-in' : 'sign-out');
        
        // Start facial capture for verification
        startFaceCapture();
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

  // Start face capture for verification
  const startFaceCapture = async () => {
    setIsCapturingFace(true);
    setIsScanningFingerprint(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Wait a moment to ensure the video is playing
        setTimeout(() => {
          captureFace();
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera for face verification');
      setIsCapturingFace(false);
    }
  };

  // Capture employee's face
  const captureFace = () => {
    if (videoRef.current && canvasRef.current && employeeData) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const imageBase64 = canvas.toDataURL('image/jpeg');
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Submit attendance with facial verification
        submitAttendance(imageBase64);
      }
    }
  };

  // Submit attendance record with biometric verification
  const submitAttendance = async (faceImage: string) => {
    if (!employeeData) return;
    
    try {
      // Get current location (if available)
      let location = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch {
        console.warn('Location access denied or unavailable');
      }
      
      // Prepare attendance record
      const attendanceData = {
        employeeId: employeeData._id,
        type: attendanceType,
        facialCapture: faceImage,
        verificationMethod: 'biometric',
        ...(location ? { location } : {})
      };
      
      // Submit attendance via employee auth service
      const result = await employeeAuthService.recordAttendanceWithBiometrics(attendanceData);
      
      // Handle successful attendance recording
      setIsCapturingFace(false);
      toast.success(`${attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} successfully!`);
      
      // Show success message with employee details
      showSuccessMessage(result);
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance. Please try again.');
      setIsCapturingFace(false);
    }
  };

  // Show success message after recording attendance
  interface AttendanceRecord {
    timestamp?: string | number;
    [key: string]: unknown;
  }

  const showSuccessMessage = (attendanceRecord: AttendanceRecord) => {
    if (employeeData) {
      const timestamp = new Date(attendanceRecord.timestamp || Date.now());
      const formattedTime = timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      setEmployeeData({
        ...employeeData,
        attendanceRecorded: true,
        attendanceTime: formattedTime,
        attendanceType
      });
      
      // Reset employee data after 5 seconds
      setTimeout(() => {
        setEmployeeData(null);
      }, 5000);
    }
  };

  // Reset the attendance flow
  const resetAttendanceFlow = () => {
    // Stop any active streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Reset states
    setEmployeeData(null);
    setIsCapturingFace(false);
    setIsScanningFingerprint(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 bg-clip-text text-transparent">
                WorkBeat
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSignupModalOpen(true)}
                leftIcon={<UserPlus size={16} />}
                className="rounded-xl border-primary-200 hover:border-primary-300 text-primary-700 hover:bg-primary-50"
              >
                Get Started
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                leftIcon={<LogIn size={16} />}
                className="rounded-xl"
              >
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {employeeData && employeeData.attendanceRecorded ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-10 w-10 text-green-600 dark:text-green-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {attendanceType === 'sign-in' ? 'Welcome!' : 'Goodbye!'}
                </h2>
                
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
                  {employeeData.name}
                </p>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {employeeData.department} | {employeeData.position}
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
                  <p className="text-sm font-medium">
                    <span className="text-gray-600 dark:text-gray-400">
                      {attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} at:
                    </span>
                    <span className="ml-1 text-gray-900 dark:text-gray-100">
                      {employeeData.attendanceTime}
                    </span>
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  onClick={resetAttendanceFlow}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          ) : isCapturingFace ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  Face Verification
                </h2>
                
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                  Look at the camera for attendance verification
                </p>
                
                <div className="aspect-square bg-black rounded-lg overflow-hidden mb-4">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    autoPlay 
                    playsInline 
                    muted
                  />
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {employeeData?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {attendanceType === 'sign-in' ? 'Signing in' : 'Signing out'}
                  </p>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          ) : isScanningFingerprint ? (
            <FingerprintScanner 
              onSuccess={handleFingerprintVerify}
              onError={(error) => {
                toast.error(`Verification failed: ${error}`);
                setIsScanningFingerprint(false);
              }}
              onCancel={() => setIsScanningFingerprint(false)}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Employee Attendance
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use fingerprint authentication to sign in or out
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <Button
                    variant="primary"
                    onClick={() => setIsScanningFingerprint(true)}
                    leftIcon={<Fingerprint size={18} />}
                    className="h-14"
                  >
                    Scan Fingerprint
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => setIsLoginModalOpen(true)}
                    leftIcon={<User size={18} />}
                  >
                    Admin Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} WorkBeat. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
      />
      
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={handleSignupModalClose}
      />
    </div>
  );
};

export default HomePage;