// src/pages/CheckInPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { attendanceService } from '../services/attendanceService';
import { employeeAuthService } from '../services/employeeAuthService';
import { Employee } from '../types';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Clock, MapPin, Fingerprint, Camera } from 'lucide-react';
import AttendanceSuccess from '../components/AttendanceSuccess';
import FingerprintScanner from '../components/FingerprintScanner';
import toast from 'react-hot-toast';

const CheckInPage: React.FC = () => {
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [attendanceType, setAttendanceType] = useState<'sign-in' | 'sign-out'>('sign-in');
  const [isSuccess, setIsSuccess] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successData, setSuccessData] = useState<{
    type: 'sign-in' | 'sign-out';
    timestamp: string;
    employeeName: string;
    isLate: boolean;
  } | null>(null);
  
  // Video refs for face capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get client IP and location
  useEffect(() => {
    const getClientInfo = async () => {
      try {
        // Get IP address
        const ip = await attendanceService.getClientIpAddress();
        setIpAddress(ip);
        
        // Get geolocation
        const loc = await attendanceService.getClientLocation();
        if (loc) {
          setLocation(loc);
        }
      } catch (error) {
        console.error('Error getting client info:', error);
      }
    };
    
    getClientInfo();
    
    // Determine default attendance type based on time of day
    const currentHour = new Date().getHours();
    setAttendanceType(currentHour < 12 ? 'sign-in' : 'sign-out');
  }, []);
  
  // Handle fingerprint verification
  const handleFingerprintVerify = async (employeeId?: string) => {
    try {
      if (!employeeId) {
        toast.error('Employee identification failed');
        setIsScanningFingerprint(false);
        return;
      }
      
      // Get employee data using verified fingerprint
      const employee = await employeeAuthService.getEmployeeByFingerprint(employeeId);
      
      if (employee) {
        setEmployeeData(employee);
        
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
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera for face verification');
      setIsCapturingFace(false);
    }
  };
  
  // Capture employee's face manually
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
        
        // Submit attendance with facial verification
        submitAttendance(imageBase64);
      }
    }
  };
  
  // Submit attendance record with biometric verification
  const submitAttendance = async (faceImage: string) => {
    if (!employeeData) return;
    // isSubmitting removed
    try {
      // Prepare attendance record
      const attendanceData: import('../types/api.types').AttendanceData = {
        employeeId: employeeData._id ?? '',
        type: attendanceType,
        facialCapture: faceImage, // Pass as string (base64)
        verificationMethod: 'face-recognition',
        location: location || undefined,
        notes
      };
      // Submit attendance via employee auth service
      const result = await employeeAuthService.recordAttendanceWithBiometrics(attendanceData);
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Handle successful attendance recording
      setIsCapturingFace(false);
      setSuccessData({
        type: attendanceType,
        timestamp: result.timestamp,
        employeeName: employeeData.name,
        isLate: !!result.isLate // Always boolean
      });
      setIsSuccess(true);
      toast.success(`${attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} successfully!`);
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance. Please try again.');
      setIsCapturingFace(false);
    } finally {
      // isSubmitting removed
    }
  };

  const handleDone = () => {
    // Reset form
    setEmployeeData(null);
    setNotes('');
    setIsSuccess(false);
    setSuccessData(null);
    setIsScanningFingerprint(false);
    setIsCapturingFace(false);
    
    // Clear any active streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };
  
  const isLate = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours > 9) || (hours === 9 && minutes > 5);
  };

  // Always return a ReactNode or null
  if (isSuccess && successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <AttendanceSuccess
          type={successData.type}
          timestamp={successData.timestamp}
          employeeName={successData.employeeName}
          isLate={successData.isLate}
          onDone={handleDone}
        />
      </div>
    );
  }

  if (isCapturingFace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
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

              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {employeeData?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {attendanceType === 'sign-in' ? 'Signing in' : 'Signing out'}
                </p>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handleDone}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  onClick={captureFace}
                  leftIcon={<Camera size={18} />}
                >
                  Take Photo
                </Button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isScanningFingerprint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <FingerprintScanner 
          onSuccess={handleFingerprintVerify}
          onError={(error) => {
            toast.error(`Verification failed: ${error}`);
            setIsScanningFingerprint(false);
          }}
          onCancel={() => setIsScanningFingerprint(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                WorkBeat Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Biometric Authentication
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-6">
              <div className="flex items-center">
                <Clock className="text-gray-500 dark:text-gray-400 mr-2" size={20} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Time</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className={`text-xs font-medium px-2 py-1 rounded ${
                attendanceType === 'sign-in' 
                  ? (isLate() ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300')
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {attendanceType === 'sign-in' 
                  ? (isLate() ? 'Late' : 'On Time') 
                  : 'Sign Out'}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-center text-base font-medium text-gray-800 dark:text-white mb-2">
                Select Attendance Type
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={attendanceType === 'sign-in' ? 'primary' : 'ghost'}
                  onClick={() => setAttendanceType('sign-in')}
                  className="justify-center"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={attendanceType === 'sign-out' ? 'primary' : 'ghost'}
                  onClick={() => setAttendanceType('sign-out')}
                  className="justify-center"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Verify your identity with your fingerprint
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                A face photo will be taken after fingerprint verification
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs text-gray-500 dark:text-gray-400 mb-6">
              <div className="flex items-start mb-1">
                <MapPin size={16} className="mr-1 mt-0.5 flex-shrink-0" />
                <span>
                  {location ? 
                    `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 
                    'Location not available'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-1">IP:</span>
                <span>{ipAddress || 'Unknown'}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              variant="primary"
              onClick={() => setIsScanningFingerprint(true)}
              leftIcon={<Fingerprint size={18} />}
              className="w-full h-14"
            >
              Start Fingerprint Verification
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default CheckInPage;
