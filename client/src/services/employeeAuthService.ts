// Fixed employeeAuthService.ts with reliable lateness detection

import { ApiError, AttendanceData, FingerprintData, FingerprintEnrollData } from '../types/api.types';
import api from './api';
import { Employee } from '../types';
import { employeeService } from './employeeService';

// Improved checkIfLate function with reliable detection
const checkIfLate = (employee: Employee, signInTime: Date): boolean => {
  try {
    
    // Handle different formats of workSchedule
    let workSchedule;
    if (typeof employee.workSchedule === 'string') {
      try {
        workSchedule = JSON.parse(employee.workSchedule);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('🕒 Error parsing work schedule string:', error);
        }
        
        // Try to extract times using regex if JSON.parse fails
        if (typeof employee.workSchedule === 'string' && (employee.workSchedule as string).includes('start')) {
          try {
            const startMatch = (typeof employee.workSchedule === 'string'
              ? employee.workSchedule
              : '').match(/start["']?\s*:\s*["']?(\d{1,2}:\d{2})["']?/);
            if (startMatch && startMatch[1]) {
              workSchedule = { start: startMatch[1] };
            } else {
              // Fall back to default work hours
              workSchedule = { start: "09:00" };
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.error("🕒 LATENESS CHECK - Error in regex parsing:", e);
            }
            workSchedule = { start: "09:00" };
          }
        } else {
          // If all else fails, use default hours
          workSchedule = { start: "09:00" };
        }
      }
    } else if (employee.workSchedule) {
      workSchedule = employee.workSchedule;
    } else if (employee.workingHours) {
      workSchedule = { start: employee.workingHours.start };
    } else {
      // Default fallback
      workSchedule = { start: "09:00" };
    }

    // Get current day of week (lowercase)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = signInTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfWeek = days[dayIndex];
    
    // Find start time for today based on the schedule format
    let startTime: string | undefined;
    
    // Format 1: {monday: {start: "09:00", end: "17:00"}, ...}
    if (workSchedule[dayOfWeek] && workSchedule[dayOfWeek].start) {
      startTime = workSchedule[dayOfWeek].start;
    } 
    // Format 2: workSchedule with days array and hours
    else if (workSchedule.days && Array.isArray(workSchedule.days)) {
      const isWorkDay = workSchedule.days.some((day: string) => {
        if (typeof day !== 'string') return false;
        const dayLower = day.toLowerCase();
        // Try to match full day name or abbreviation (mon, tue, etc.)
        return dayLower === dayOfWeek || dayLower.startsWith(dayOfWeek.substring(0, 3));
      });
      
      if (isWorkDay) {
        // Try to get start time from hours object
        if (workSchedule.hours && workSchedule.hours.start) {
          startTime = workSchedule.hours.start;
        } else if (workSchedule.start) {
          startTime = workSchedule.start;
        }
      } else {
        return false; // Not a work day, can't be late
      }
    }
    // Format 3: Simple object with start time
    else if (workSchedule.start) {
      startTime = workSchedule.start;
    }
    // Fallback to default for testing
    else {
      startTime = "09:00";
    }
    
    if (!startTime) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🕒 LATENESS CHECK - Could not determine start time');
      }
      return false;
    }
    
    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    if (isNaN(startHour) || isNaN(startMinute)) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🕒 LATENESS CHECK - Invalid start time format: ${startTime}`);
      }
      return false;
    }
    
    // Create Date object for scheduled start time today
    const scheduledStart = new Date(signInTime);
    scheduledStart.setHours(startHour, startMinute, 0, 0);
    
    // Add grace period (5 minutes)
    const graceEnd = new Date(scheduledStart);
    graceEnd.setMinutes(graceEnd.getMinutes() + 5);
    
    // IMPORTANT: Use getTime() for reliable comparison!
    const isLate = signInTime.getTime() > graceEnd.getTime();
    
    return isLate;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🕒 LATENESS CHECK - Error in lateness detection:', error);
    }
    return false; // Default to not late if there's an error
  }
};

// Service for employee authentication and attendance
export const employeeAuthService = {
  async recordAttendanceWithFace(attendanceData: AttendanceData) {
    try {
      
      // Essential validation
      if (!attendanceData.employeeId) {
        if (process.env.NODE_ENV === 'development') {
          console.error("📝 Missing employeeId in attendance data");
        }
        throw new Error('Required field missing: employeeId is required');
      }
      
      if (!attendanceData.type) {
        if (process.env.NODE_ENV === 'development') {
          console.error("📝 Missing type in attendance data");
        }
        throw new Error('Required field missing: type is required');
      }
      
      // If this is a sign-in, check if the employee is late
      let isLate = false;
      if (attendanceData.type === 'sign-in') {
        try {
          const employee = await employeeService.getEmployeeById(attendanceData.employeeId);
          
          if (employee) {
            // Get the current time or use the provided timestamp
            const signInTime = attendanceData.timestamp ? new Date(attendanceData.timestamp) : new Date();
            
            // Calculate lateness using our improved function
            isLate = checkIfLate(employee, signInTime);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn("📝 Could not fetch employee details for lateness check");
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error("📝 Error during lateness check:", error);
          }
        }
      }
      
      // Get organization ID
      let organizationId = attendanceData.organizationId;
      if (!organizationId) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          organizationId = user.organizationId;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error("📝 Error getting organization ID from localStorage:", error);
          }
        }
      }
      
      if (!organizationId) {
        if (process.env.NODE_ENV === 'development') {
          console.error("📝 No organization ID found");
        }
        throw new Error('Organization ID not found. Please log in again.');
      }
      
      // Create data object with explicit isLate flag
      const dataToSubmit = {
        employeeId: String(attendanceData.employeeId),
        type: attendanceData.type,
        // employeeName: attendanceData.employeeName || '',
        notes: attendanceData.notes || '',
        facialImage: attendanceData.facialImage,
        organizationId: String(organizationId),
        timestamp: attendanceData.timestamp || new Date().toISOString(),
        isLate: isLate, // IMPORTANT: Explicitly set lateness flag
        verificationMethod: 'face-recognition'
      };
      
      // Make API call
      const response = await api.post('/api/employee-auth/record-attendance', dataToSubmit);
      
      // Make sure the response includes the isLate flag
      const responseData = response.data.data || response.data;
      if (responseData && typeof responseData.isLate === 'undefined') {
        responseData.isLate = isLate;
      }
      
      return responseData;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('📝 Error recording attendance with face:', error);
      }
      throw error; // Let the calling code handle errors
    }
  },
  
  // Keep all other methods from the original service
  async getEmployeeByFingerprint(fingerprintId: string) {
    try {
      const response = await api.get(`/api/biometrics/fingerprint/employee/${fingerprintId}`);
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting employee by fingerprint:', error);
      }
      return null;
    }
  },

  async recordAttendanceWithBiometrics(attendanceData: AttendanceData) {
    try {
      // Ensure verification method is set to avoid validation errors
      const dataToSubmit = {
        ...attendanceData,
        verificationMethod: attendanceData.verificationMethod || 'fingerprint'
      };
      
      const response = await api.post('/api/employee-auth/record-biometric-attendance', dataToSubmit);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development') {
        console.error('Error recording attendance with biometrics:', apiError.message);
      }
      throw error;
    }
  },

  async enrollFingerprint(employeeId: string, fingerprintData: FingerprintEnrollData) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await api.post(
        `/api/biometrics/fingerprint/enroll/${employeeId}`,
        fingerprintData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development') {
        console.error('Error enrolling fingerprint:', apiError.message);
      }
      throw error;
    }
  },

  async verifyFingerprint(employeeId: string, fingerprintData: FingerprintData) {
    try {
      const response = await api.post(
        `/api/biometrics/fingerprint/verify/${employeeId}`,
        fingerprintData
      );
      
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development') {
        console.error('Error verifying fingerprint:', apiError.message);
      }
      throw error;
    }
  },

  async getFingerprintChallenge(employeeId: string) {
    try {
      const response = await api.get(
        `/api/biometrics/fingerprint/verify-challenge/${employeeId}`
      );
      
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting fingerprint challenge:', error);
      }
      throw error;
    }
  },

  async getFingerprintEnrollmentChallenge(employeeId: string) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await api.get(
        `/api/biometrics/fingerprint/challenge/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting fingerprint enrollment challenge:', error);
      }
      throw error;
    }
  },

  async deleteFingerprint(employeeId: string, credentialId: string) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await api.delete(
        `/api/biometrics/fingerprint/${employeeId}/${credentialId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.success;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting fingerprint:', error);
      }
      throw error;
    }
  },

  async addEmployeeFace(employeeId: string, faceImage: string) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await api.post(
        `/api/biometrics/face/${employeeId}`,
        { faceImage },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding employee face:', error);
      }
      throw error;
    }
  }
};

export default employeeAuthService;