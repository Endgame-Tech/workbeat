import { ApiError, AttendanceData, FingerprintData, FingerprintEnrollData } from '../types/api.types';
import api from './api';

declare global {
  interface Window {
    _env_?: {
      VITE_APP_API_URL?: string;
    };
  }
}

// Set base URL from environment variable or use default
const API_URL = window._env_?.VITE_APP_API_URL || 'https://workbeat-api.vercel.app';

// Service for employee authentication and attendance
export const employeeAuthService = {
  /**
   * Get employee details using fingerprint verification
   * @param fingerprintId The fingerprint credential ID
   * @returns Employee data if found
   */
  async getEmployeeByFingerprint(fingerprintId: string) {
    try {
      const response = await api.get(`/api/biometrics/fingerprint/employee/${fingerprintId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting employee by fingerprint:', error);
      return null;
    }
  },

  /**
   * Record attendance with biometric verification
   * @param attendanceData The attendance data with facial capture
   * @returns The created attendance record
   */
  async recordAttendanceWithBiometrics(attendanceData: AttendanceData) {
    try {
      // Ensure verification method is set to avoid validation errors
      const dataToSubmit = {
        ...attendanceData,
        verificationMethod: attendanceData.verificationMethod || 'fingerprint'
      };
      
      console.log('Recording attendance with biometrics:', JSON.stringify(dataToSubmit));
      
      const response = await api.post('/api/employee-auth/record-biometric-attendance', dataToSubmit);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error recording attendance with biometrics:', apiError.message);
      throw error;
    }
  },

  /**
   * Enroll employee fingerprint
   * @param employeeId The ID of the employee
   * @param fingerprintData The fingerprint credential data
   * @returns The enrolled fingerprint data
   */
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
      console.error('Error enrolling fingerprint:', apiError.message);
      throw error;
    }
  },

  /**
   * Verify employee fingerprint
   * @param employeeId The ID of the employee
   * @param fingerprintData The fingerprint assertion data
   * @returns Verification result
   */
  async verifyFingerprint(employeeId: string, fingerprintData: FingerprintData) {
    try {
      const response = await api.post(
        `/api/biometrics/fingerprint/verify/${employeeId}`,
        fingerprintData
      );
      
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error verifying fingerprint:', apiError.message);
      throw error;
    }
  },

  /**
   * Get fingerprint verification challenge
   * @param employeeId The ID of the employee
   * @returns Challenge data
   */
  async getFingerprintChallenge(employeeId: string) {
    try {
      const response = await api.get(
        `/api/biometrics/fingerprint/verify-challenge/${employeeId}`
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting fingerprint challenge:', error);
      throw error;
    }
  },

  /**
   * Get fingerprint enrollment challenge
   * @param employeeId The ID of the employee
   * @returns Challenge data
   */
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
      console.error('Error getting fingerprint enrollment challenge:', error);
      throw error;
    }
  },

  /**
   * Delete fingerprint enrollment
   * @param employeeId The ID of the employee
   * @param credentialId The credential ID to delete
   * @returns Success status
   */
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
      console.error('Error deleting fingerprint:', error);
      throw error;
    }
  },

  /**
   * Add face image for an employee
   * @param employeeId The ID of the employee
   * @param faceImage Base64 encoded face image
   * @returns The updated employee
   */
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
      console.error('Error adding employee face:', error);
      throw error;
    }
  },

  /**
   * Record attendance with facial verification
   * @param attendanceData The attendance data with facial capture
   * @returns The created attendance record
   */  async recordAttendanceWithFace(attendanceData: AttendanceData) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const organizationId = user.organizationId;
      
      if (!organizationId) {
        throw new Error('Organization ID not found. Please log in again.');
      }
      
      // Validate required fields
      if (!attendanceData.employeeId || !attendanceData.type) {
        throw new Error('Required fields missing: employeeId and type are required');
      }
      
      // Ensure all required fields are set to avoid validation errors
      const dataToSubmit: AttendanceData = {
        ...attendanceData,
        verificationMethod: 'face-recognition',
        organizationId,
        timestamp: new Date().toISOString()
      };
      
      // Format facial capture data correctly
      if (dataToSubmit.facialImage) {
        dataToSubmit.facialCapture = dataToSubmit.facialImage;
        delete dataToSubmit.facialImage;
      }
      
      // Log the request (without the actual image data for brevity)
      const logData = { ...dataToSubmit };
      if (logData.facialCapture) {
        logData.facialCapture = '[IMAGE DATA TRUNCATED]';
      }
      console.log('Recording attendance with face recognition:', JSON.stringify(logData));
      
      const response = await api.post('/api/employee-auth/record-attendance', dataToSubmit);
      console.log('Face attendance record created successfully:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error recording attendance with face:', apiError.message);
      console.error('Error details:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status
      });
      
      throw error;
    }
  }
};

export default employeeAuthService;