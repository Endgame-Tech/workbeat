// Fixed EmployeeView.tsx with properly working lateness detection

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Camera, Fingerprint } from 'lucide-react';
import Button from './ui/Button';
import { AttendanceRecord, Employee } from '../types';
import { employeeAuthService } from '../services/employeeAuthService';
import AttendanceSuccess from './AttendanceSuccess';
import FaceCapture from './FaceCapture';
import EmployeeSelector from './EmployeeSelector';
import FingerprintScanner from './FingerprintScanner';
import { fingerprintService } from '../services/fingerprintService';
import { toast } from 'react-hot-toast';

enum AttendanceStep {
  INITIAL,
  FINGERPRINT_SCAN,
  FACE_CAPTURE,
  SELECT_EMPLOYEE,
  SUCCESS
}

const EmployeeView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AttendanceStep>(AttendanceStep.INITIAL);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [isFingerprintSupported, setIsFingerprintSupported] = useState<boolean>(false);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceType, setAttendanceType] = useState<'sign-in' | 'sign-out'>('sign-in');
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);
  
  // Determine default attendance type based on time of day
  useEffect(() => {
    // Check fingerprint support
    fingerprintService.checkFingerprintSupport()
      .then(supported => setIsFingerprintSupported(supported));
    
    const currentHour = new Date().getHours();
    setAttendanceType(currentHour < 12 ? 'sign-in' : 'sign-out');
  }, []);
  
  // Handle face capture 
  const handleFaceCapture = async (faceImage: string) => {
    setCapturedFaceImage(faceImage);
    if (employeeData) {
      // For fingerprint flow, submit directly
      try {
        await submitAttendance(employeeData, faceImage, '');
      } catch (err) {
        console.error('Error submitting attendance:', err);
      }
    } else {
      // For manual flow, proceed to select employee
      setCurrentStep(AttendanceStep.SELECT_EMPLOYEE);
    }
  };
  
  // Handle employee selection
  const handleEmployeeSelect = async (employee: Employee, notes: string) => {
    console.log("👤 Selected Employee:", employee.name);
    setEmployeeData(employee);
    
    // Detailed logging of employee ID formats to help debugging
    console.log("👤 Employee ID formats:", {
      id: employee.id,
      _id: employee._id,
      employeeId: employee.employeeId
    });
    
    // Submit attendance with the selected employee and notes
    if (capturedFaceImage) {
      try {
        await submitAttendance(employee, capturedFaceImage, notes);
      } catch (error) {
        console.error("Error submitting attendance:", error);
        toast.error("Failed to record attendance. Please try again.");
        // Reset to initial state on error
        setCurrentStep(AttendanceStep.INITIAL);
      }
    } else {
      toast.error("No face capture image available. Please try again.");
      setCurrentStep(AttendanceStep.INITIAL);
    }
  };

  // Submit attendance
  const submitAttendance = async (employee: Employee, faceImage: string, notes: string) => {
    try {
      // Print useful debug info
      console.log("📋 Submitting attendance for:", employee.name);
      console.log("📋 Attendance type:", attendanceType);
      console.log("📋 Work schedule:", JSON.stringify(employee.workSchedule));
      
      // Get current location if available
      let location = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 0
          });
        });
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log("📋 Got location:", location);
      } catch (error) {
        console.warn('📋 Location access denied or unavailable:', error);
      }
      
      // Determine the best ID to use
      let employeeId: string | number | null = null;
      
      if (employee._id) {
        employeeId = employee._id;
        console.log("📋 Using _id field:", employeeId);
      } else if (employee.id) {
        employeeId = employee.id;
        console.log("📋 Using id field:", employeeId);
      } else if (employee.employeeId) {
        employeeId = employee.employeeId;
        console.log("📋 Using employeeId field:", employeeId);
      }
      
      if (!employeeId) {
        console.error("📋 No valid employee ID found");
        toast.error("Failed to record attendance: No valid employee ID found");
        return;
      }
      
      // Get current timestamp
      const timestamp = new Date().toISOString();
      console.log("📋 Attendance timestamp:", timestamp);
      
      // Prepare attendance data
      const attendanceData = {
        employeeId: String(employeeId),
        employeeName: employee.name || '',
        type: attendanceType,
        facialImage: faceImage,
        verificationMethod: 'face-recognition' as const,
        ...(location ? { location } : {}),
        notes,
        timestamp,
        // Let the service handle isLate
      };
      
      console.log("📋 Calling employeeAuthService.recordAttendanceWithFace");
      
      // Send to service
      const result = await employeeAuthService.recordAttendanceWithFace(attendanceData);
      
      // IMPORTANT: Log the result with explicit mention of the isLate flag
      console.log("📋 Attendance result received:", {
        ...result,
        facialCapture: result.facialCapture ? "[IMAGE DATA]" : null,
        isLate: result.isLate, // Explicitly log this
        timestamp: result.timestamp
      });
      
      // Make sure isLate exists in the result
      if (result) {
        if (typeof result.isLate === 'undefined' && attendanceType === 'sign-in') {
          console.warn("📋 isLate flag is undefined in the result, explicitly setting to false");
          result.isLate = false;
        }
        
        // Double check the boolean value is properly set
        if (attendanceType === 'sign-in') {
          console.log(`📋 Final isLate value being used: ${result.isLate}`);
          
          // Force isLate to be a proper boolean (not undefined, null, string, etc.)
          result.isLate = Boolean(result.isLate);
        }
      }
      
      // Update UI with the result
      setRecord(result);
      setCurrentStep(AttendanceStep.SUCCESS);
      
      // Show appropriate message
      if (attendanceType === 'sign-in') {
        if (result.isLate) {
          toast.success("Signed in successfully (marked as late)");
        } else {
          toast.success("Signed in successfully (on time)");
        }
      } else {
        toast.success("Signed out successfully");
      }
      
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error("Failed to record attendance. Please try again.");
      throw error; // Re-throw to allow the calling function to handle it
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
  
  // Handle successful fingerprint scan
  const handleFingerprintSuccess = async (employeeId: string) => {
    try {
      const employee = await employeeAuthService.getEmployeeByFingerprint(employeeId);
      if (employee) {
        setEmployeeData(employee);
        setCurrentStep(AttendanceStep.FACE_CAPTURE);
      } else {
        toast.error('Employee not found. Please contact administrator.');
        setCurrentStep(AttendanceStep.INITIAL);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Error retrieving employee information.');
      setCurrentStep(AttendanceStep.INITIAL);
    }
  };
  
  // Handle fingerprint scan error or cancellation
  const handleFingerprintError = (error?: Error) => {
    toast.error(error?.message || 'Fingerprint scan failed');
    setCurrentStep(AttendanceStep.INITIAL);
  };
  
  const getCurrentContent = () => {
    switch (currentStep) {
      case AttendanceStep.FINGERPRINT_SCAN:
        return (
          <FingerprintScanner
            onSuccess={handleFingerprintSuccess}
            onError={handleFingerprintError}
            onCancel={handleCancel}
          />
        );
        
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
        
        // IMPORTANT: Log the isLate value before rendering the success screen
        console.log("📋 Rendering Success screen with isLate =", record.isLate);
        
        return (
          <AttendanceSuccess 
            type={record.type}
            timestamp={typeof record.timestamp === 'string' ? record.timestamp : record.timestamp.toISOString()}
            employeeName={record.employeeName || 'Employee'}
            isLate={Boolean(record.isLate)} // IMPORTANT: Force boolean with Boolean()
            onDone={handleDone}
          />
        );
        
      default:
        return (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-center mb-4">Welcome to Attendance Tracker</h2>
              <p className="text-center text-gray-600 mb-4">Select Attendance Type</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant={attendanceType === 'sign-in' ? 'primary' : 'ghost'} onClick={() => setAttendanceType('sign-in')}>Sign In</Button>
                <Button variant={attendanceType === 'sign-out' ? 'primary' : 'ghost'} onClick={() => setAttendanceType('sign-out')}>Sign Out</Button>
              </div>
              {isFingerprintSupported && (
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep(AttendanceStep.FINGERPRINT_SCAN)}
                  leftIcon={<Fingerprint size={18} />}
                  className="w-full mb-4"
                >
                  Scan Fingerprint
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(AttendanceStep.FACE_CAPTURE)}
                leftIcon={<Camera size={18} />}
                className="w-full"
              >
                Take Attendance Photo
              </Button>
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

export default EmployeeView;