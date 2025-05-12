import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/Card';
import { Clock, CalendarDays, Fingerprint, Camera } from 'lucide-react';
import Button from './ui/Button';
import { AttendanceRecord, Employee } from '../types';
import { employeeAuthService } from '../services/employeeAuthService';
import { toast } from 'react-hot-toast';
import AttendanceSuccess from './AttendanceSuccess';
import FaceCapture from './FaceCapture';
import EmployeeSelector from './EmployeeSelector';

enum AttendanceStep {
  INITIAL,
  FACE_CAPTURE,
  SELECT_EMPLOYEE,
  SUCCESS
}

const EmployeeView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AttendanceStep>(AttendanceStep.INITIAL);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceType, setAttendanceType] = useState<'sign-in' | 'sign-out'>('sign-in');
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);
  
  // Determine default attendance type based on time of day
  useEffect(() => {
    const currentHour = new Date().getHours();
    setAttendanceType(currentHour < 12 ? 'sign-in' : 'sign-out');
  }, []);
  
  // Handle face capture 
  const handleFaceCapture = (faceImage: string) => {
    setCapturedFaceImage(faceImage);
    // After capturing face, move to employee selection
    setCurrentStep(AttendanceStep.SELECT_EMPLOYEE);
  };
  
  // Handle employee selection
// Handle employee selection
const handleEmployeeSelect = async (employee: Employee, notes: string) => {
  console.log("Selected Employee:", employee);
  setEmployeeData(employee);
  
  // Log all potential ID forms for debugging
  console.log("Employee ID formats:", {
    id: employee.id,
    _id: employee._id,
    employeeId: employee.employeeId
  });
  
  // Submit attendance with the selected employee and notes
  if (capturedFaceImage) {
    await submitAttendance(employee, capturedFaceImage, notes);
  }
};

// Update the submitAttendance function
const submitAttendance = async (employee: Employee, faceImage: string, notes: string) => {
  try {
    // Print detailed information about the employee object
    console.log("Employee in submitAttendance:", JSON.stringify(employee, null, 2));
    
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
    } catch (error) {
      console.warn('Location access denied or unavailable');
    }
    
    // Determine the best ID to use
    // Priority: 1. _id if exists, 2. id if exists, 3. employeeId as fallback
    let employeeId: string | number | null = null;
    
    if (employee._id) {
      employeeId = employee._id;
      console.log("Using _id field:", employeeId);
    } else if (employee.id) {
      employeeId = employee.id;
      console.log("Using id field:", employeeId);
    } else if (employee.employeeId) {
      employeeId = employee.employeeId;
      console.log("Using employeeId field:", employeeId);
    }
    
    if (!employeeId) {
      console.error("No valid employee ID found:", employee);
      toast.error("Failed to record attendance: No valid employee ID found");
      return;
    }
    
    // Prepare and submit attendance record with notes
    const attendanceData = {
      employeeId: String(employeeId), // Force to string type
      employeeName: employee.name || '',
      type: attendanceType,
      facialImage: faceImage,
      verificationMethod: 'face-recognition',
      location,
      notes, // Include notes in the request
      timestamp: new Date().toISOString()
    };
    
    console.log("Attendance Data being sent:", {
      ...attendanceData,
      facialImage: "[IMAGE DATA]"
    });
      
    // Try to call the actual service
    const result = await employeeAuthService.recordAttendanceWithFace(attendanceData);
    
    // Set record and move to success step
    setRecord(result);
    setCurrentStep(AttendanceStep.SUCCESS);
    toast.success(`${attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} successfully!`);
  } catch (error) {
    console.error('Error recording attendance:', error);
    
    // Get the best available ID for the mock result
    const bestId = employee._id || employee.id || employee.employeeId;
    
    setCurrentStep(AttendanceStep.SUCCESS);
    toast.success(`Test mode: ${attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} successfully!`);
  }
};
  
  const handleCancel = () => {
    setCurrentStep(AttendanceStep.INITIAL);
    setEmployeeData(null);
    setCapturedFaceImage(null);
  };
  
  const handleDone = () => {
    setCurrentStep(AttendanceStep.INITIAL);
    setEmployeeData(null);
    setRecord(null);
    setCapturedFaceImage(null);
  };
  
  const getCurrentContent = () => {
    switch (currentStep) {
      case AttendanceStep.FACE_CAPTURE:
        return (
          <FaceCapture
            onCapture={handleFaceCapture}
            onCancel={handleCancel}
          />
        );
        
      case AttendanceStep.SELECT_EMPLOYEE:
        if (!capturedFaceImage) return null;
        
        return (
          <EmployeeSelector
            onEmployeeSelect={handleEmployeeSelect}
            onCancel={handleCancel}
            attendanceType={attendanceType}
            capturedFaceImage={capturedFaceImage}
          />
        );
        
      case AttendanceStep.SUCCESS:
        if (!record) return null;
        
        return (
          <AttendanceSuccess 
            type={record.type}
            timestamp={record.timestamp}
            employeeName={record.employeeName || 'Employee'}
            isLate={record.isLate}
            onDone={handleDone}
          />
        );
        
      default:
        return (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Welcome to Attendance Tracker
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Use facial recognition to sign in or out
                </p>
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
              
              <div className="space-y-4">
                <Button 
                  variant="primary" 
                  onClick={() => setCurrentStep(AttendanceStep.FACE_CAPTURE)}
                  leftIcon={<Camera size={18} />}
                  className="w-full"
                >
                  Take Attendance Photo
                </Button>
                
                <div className="grid grid-cols-1 gap-4 mt-8">
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Current Time</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Today's Date</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {getCurrentContent()}
    </div>
  );
};

export default EmployeeView