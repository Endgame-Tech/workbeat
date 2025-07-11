import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { Clock, Fingerprint, Camera, UserCheck, CheckCircle } from 'lucide-react';
import FingerprintScanner from './FingerprintScanner';
import FaceCapture from './FaceCapture';
import { Employee, AttendanceRecord } from '../types';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { toast } from 'react-hot-toast';
import AttendanceSuccess from './AttendanceSuccess';
import { useSubscription } from '../hooks/useSubscription';
import { FeatureGate } from './subscription/FeatureGate';

enum AttendanceStep {
  INITIAL,
  FINGERPRINT_SCAN,
  FACE_CAPTURE,
  CONFIRMATION,
  SUCCESS
}

interface BiometricAttendanceProps {
  onComplete: () => void;
}

const BiometricAttendance: React.FC<BiometricAttendanceProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<AttendanceStep>(AttendanceStep.INITIAL);
  const [attendanceType, setAttendanceType] = useState<'sign-in' | 'sign-out'>('sign-in');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { hasFeature } = useSubscription();
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Determine if sign-in or sign-out based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    const defaultType = hour < 12 ? 'sign-in' : 'sign-out';
    setAttendanceType(defaultType);
  }, []);
  
  // Handle successful fingerprint verification
  const handleFingerprintSuccess = async (employeeId?: string) => {
    setLoading(true);
    
    try {
      // If employeeId is provided, fetch employee details
      if (employeeId) {
        const employeeData = await employeeService.getEmployee(employeeId);
        
        if (employeeData) {
          setEmployee(employeeData);
          // Proceed to face capture for the second factor
          setCurrentStep(AttendanceStep.FACE_CAPTURE);
        } else {
          toast.error('Employee not found');
          setCurrentStep(AttendanceStep.INITIAL);
        }
      } else {
        toast.error('Employee identification failed');
        setCurrentStep(AttendanceStep.INITIAL);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to identify employee');
      setCurrentStep(AttendanceStep.INITIAL);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle fingerprint verification error
  const handleFingerprintError = (error: string) => {
    toast.error(`Fingerprint verification failed: ${error}`);
    setCurrentStep(AttendanceStep.INITIAL);
  };
  
  // Handle successful face capture
  const handleFaceCapture = (imageData: string) => {
    setFaceImage(imageData);
    setCurrentStep(AttendanceStep.CONFIRMATION);
  };
  
  // Handle attendance record submission
const handleSubmitAttendance = async () => {
  if (!employee || !faceImage) {
    toast.error('Employee data or face capture missing');
    return;
  }
  
  setLoading(true);
  
  try {
    // Get location data
    const location = await attendanceService.getClientLocation();
    const ipAddress = await attendanceService.getClientIpAddress();
    
    // Create attendance data
    const attendanceData = {
      employeeId: employee._id,
      employeeName: employee.name,
      type: attendanceType,
      facialCapture: {
        image: faceImage
      },
      verificationMethod: 'biometric',
      location,
      ipAddress,
      notes: `Verified using fingerprint and face recognition`
    };
    
    // Record the attendance via service
    const record = await employeeAuthService.recordAttendanceWithBiometrics(attendanceData);
    
    // Set the record and show success screen
    setAttendanceRecord(record);
    setCurrentStep(AttendanceStep.SUCCESS);
  } catch (error) {
    console.error('Error recording attendance:', error);
    toast.error('Failed to record attendance');
  } finally {
    setLoading(false);
  }
};
  
  // Function to record attendance using both biometrics
  const recordAttendanceWithBiometrics = async (attendanceData: any): Promise<AttendanceRecord> => {
    // In a real app, this would make an API call
    // For now, we'll mock it by calling our existing attendance service
    return await attendanceService.recordAttendance(
      attendanceData.employeeId,
      attendanceData.employeeName,
      attendanceData.type,
      attendanceData.ipAddress,
      attendanceData.location,
      attendanceData.notes
    );
  };
  
  // Determine what to render based on current step
  const renderContent = () => {
    switch (currentStep) {
      case AttendanceStep.FINGERPRINT_SCAN:
        return (
          <FingerprintScanner
            onSuccess={handleFingerprintSuccess}
            onError={handleFingerprintError}
            onCancel={() => setCurrentStep(AttendanceStep.INITIAL)}
          />
        );
        
      case AttendanceStep.FACE_CAPTURE:
        return (
          <FaceCapture
            onCapture={handleFaceCapture}
            onCancel={() => setCurrentStep(AttendanceStep.INITIAL)}
            employeeName={employee?.name}
          />
        );
        
      case AttendanceStep.CONFIRMATION:
        if (!employee) return null;
        
        return (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                Confirm Attendance
              </h2>
            </CardHeader>
            
            <CardContent>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserCheck size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {employee.name}
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employee.department} | {employee.position}
                </p>
              </div>
              
              <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <Clock size={14} className="mr-1" />
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Action:</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    attendanceType === 'sign-in' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                  }`}>
                    {attendanceType === 'sign-in' ? 'Sign In' : 'Sign Out'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Biometric verification completed successfully:
                </p>
                
                <div className="flex justify-center space-x-6">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                      <Fingerprint size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Fingerprint</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                      <Camera size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Face</span>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(AttendanceStep.INITIAL)}
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSubmitAttendance}
                isLoading={loading}
              >
                Confirm {attendanceType === 'sign-in' ? 'Sign In' : 'Sign Out'}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case AttendanceStep.SUCCESS:
        if (!attendanceRecord || !employee) return null;
        
        return (
          <AttendanceSuccess
            type={attendanceType}
            timestamp={attendanceRecord.timestamp}
            employeeName={employee.name}
            isLate={attendanceRecord.isLate}
            onDone={() => {
              setCurrentStep(AttendanceStep.INITIAL);
              setEmployee(null);
              setFaceImage(null);
              setAttendanceRecord(null);
              onComplete();
            }}
          />
        );
        
      default:
        return (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                Employee Attendance
              </h2>
            </CardHeader>
            
            <CardContent>
              <div className="text-center mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {currentTime.toLocaleTimeString()}
                </p>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  variant={attendanceType === 'sign-in' ? 'primary' : 'ghost'}
                  onClick={() => setAttendanceType('sign-in')}
                  className="flex-1 py-3"
                >
                  Sign In
                </Button>
                
                <Button
                  variant={attendanceType === 'sign-out' ? 'primary' : 'ghost'}
                  onClick={() => setAttendanceType('sign-out')}
                  className="flex-1 py-3"
                >
                  Sign Out
                </Button>
              </div>
              
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                Use fingerprint and face verification to record your attendance
              </p>
              
              <FeatureGate 
                feature="biometricFingerprint"
                requiredPlan="professional"
                fallbackMessage="Biometric authentication requires a Professional or Enterprise plan."
                showUpgrade={true}
              >
                <Button
                  variant="primary"
                  className="w-full py-3"
                  leftIcon={<Fingerprint size={20} />}
                  onClick={() => setCurrentStep(AttendanceStep.FINGERPRINT_SCAN)}
                >
                  Start Biometric Verification
                </Button>
              </FeatureGate>
              
              {/* Basic attendance fallback for non-biometric plans */}
              {!hasFeature('biometricFingerprint') && (
                <Button
                  variant="outline"
                  className="w-full py-3 mt-3"
                  leftIcon={<UserCheck size={20} />}
                  onClick={() => {
                    // Skip to confirmation with manual entry
                    setCurrentStep(AttendanceStep.CONFIRMATION);
                    // Set a placeholder employee - in real implementation, this would be from login context
                    setEmployee({
                      id: 'manual',
                      name: 'Manual Entry',
                      department: 'General',
                      position: 'Employee'
                    } as Employee);
                  }}
                >
                  Manual Check-in
                </Button>
              )}
            </CardContent>
            
            <CardFooter className="text-center text-gray-500 dark:text-gray-400 text-xs">
              <p className="w-full">
                Please contact HR if you're having issues with biometric verification
              </p>
            </CardFooter>
          </Card>
        );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      {renderContent()}
    </div>
  );
};

export default BiometricAttendance;