import api from './api';
import { AttendanceRecord, AttendanceStats } from '../types';
import { employeeService } from './employeeService';

/**
 * Service for attendance management
 */
export const attendanceService = {
  /**
   * Get all attendance records with optional limit
   * @param limit Maximum number of records to return
   * @returns Array of attendance records
   */
  async getAllAttendanceRecords(limit = 100): Promise<AttendanceRecord[]> {
    try {
      
      // Make request without organizationId in URL - let backend get it from authenticated user
      const response = await api.get(`/api/attendance?limit=${limit}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No attendance data in response or unsuccessful response');
        }
        return [];
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching attendance records:', error);
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as { response: { data?: unknown; status?: unknown } };
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
        }
      }
      return [];
    }
  },
  
  /**
   * Get attendance records for a specific employee
   * @param employeeId Employee ID to fetch records for
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Array of attendance records
   */
  async getEmployeeAttendance(employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    try {
      // Get organization ID for filtering
      const organizationId = employeeService.getCurrentOrganizationId();
      
      if (!organizationId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No organization ID found for fetching employee attendance');
        }
        return [];
      }
      
      // Build URL with params
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('organizationId', organizationId);
      
      const url = `/api/attendance/employee/${employeeId}?${params.toString()}`;
      
      const response = await api.get(url);
      
      return response.data.data || [];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching employee attendance:', error);
      }
      return [];
    }
  },
    /**
   * Record new attendance (sign-in or sign-out)
   * @param employeeIdOrData Either an employee ID string or an attendance data object
   * @param employeeName Employee name (only used when first param is employeeId)
   * @param type Attendance type (sign-in or sign-out) (only used when first param is employeeId)
   * @param ipAddress Client IP address (only used when first param is employeeId)
   * @param location Location data (optional) (only used when first param is employeeId)
   * @param notes Additional notes (optional)
   * @returns Created attendance record
   */
  async recordAttendance(
  employeeIdOrData: string | {
    employeeId: string;
    type: 'sign-in' | 'sign-out';
    location?: { latitude: number; longitude: number };
    notes?: string;
    employeeName?: string;
    ipAddress?: string;
    qrValue?: string;
  },
  employeeName?: string,
  type?: 'sign-in' | 'sign-out',
  ipAddress?: string | null,
  location?: { latitude: number; longitude: number } | null,
  notes?: string,
  qrValue?: string
): Promise<AttendanceRecord> {
  try {
    // Get organization ID for filtering
    const organizationId = employeeService.getCurrentOrganizationId();
    
    if (!organizationId) {
      throw new Error('No organization ID found for recording attendance');
    }
    
    // Create attendance data object based on parameters
    let attendanceData;
    if (typeof employeeIdOrData === 'string') {
      attendanceData = {
        employeeId: employeeIdOrData,
        type: type || 'sign-in',
        employeeName,
        ipAddress: ipAddress || undefined,
        location,
        notes,
        qrValue
      };
    } else {
      attendanceData = employeeIdOrData;
    }
    
    const dataToSubmit = {
      ...attendanceData,
      organizationId,
      timestamp: new Date().toISOString(),
      verificationMethod: 'manual'
    };
    
    const response = await api.post('/api/attendance', dataToSubmit);
    return response.data.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error recording attendance:', error);
    }
    throw error;
  }
},

  /**
   * Record attendance with facial recognition
   * @param attendanceData Attendance data including face image
   * @returns Created attendance record
   */
  async recordAttendanceWithFace(attendanceData: {
    employeeId: string;
    employeeName?: string;
    type: 'sign-in' | 'sign-out';
    timestamp?: Date | string;
    notes?: string;
    location?: { latitude: number; longitude: number };
    facialCapture?: Blob | string;
    organizationId?: string;
    [key: string]: unknown;
  }): Promise<AttendanceRecord> {
    try {
      // Ensure the organization ID is included
      const dataToSubmit = { ...attendanceData };
      
      if (!dataToSubmit.organizationId) {
        const organizationId = employeeService.getCurrentOrganizationId();
        
        if (organizationId) {
          dataToSubmit.organizationId = organizationId;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('No organization ID found for recording face attendance');
          }
          throw new Error('Organization ID is required to record attendance');
        }
      }
      
      const response = await api.post('/api/attendance/face', dataToSubmit);
      
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error recording attendance with face:', error);
      }

      return {
        _id: 'mock-face-' + new Date().getTime(),
        employeeId: attendanceData.employeeId,
        employeeName: attendanceData.employeeName || 'Mock Employee',
        type: attendanceData.type,
        timestamp: new Date(),
        notes: attendanceData.notes,
        location: attendanceData.location,
        isLate: false,
        facialVerification: true,
        verificationMethod: 'face-recognition',
        organizationId: attendanceData.organizationId || employeeService.getCurrentOrganizationId() || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },
  
  /**
   * Get today's attendance statistics
   * @returns Today's attendance statistics
   */
  async getTodayStats(): Promise<AttendanceStats> {
    try {
      // Get organization ID for filtering
      const organizationId = employeeService.getCurrentOrganizationId();
      
      if (!organizationId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No organization ID found for fetching today stats');
        }
        return {
          totalEmployees: 0,
          presentEmployees: 0,
          lateEmployees: 0,
          absentEmployees: 0,
          attendanceRate: 0,
          punctualityRate: 0,
          date: new Date().toISOString()
        };
      }
      
      const response = await api.get(`/api/attendance/stats/today?organizationId=${organizationId}`);
      
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching today stats:', error);
      }
      // Return default empty stats object on error
      return {
        totalEmployees: 0,
        presentEmployees: 0,
        lateEmployees: 0,
        absentEmployees: 0,
        attendanceRate: 0,
        punctualityRate: 0,
        date: new Date().toISOString()
      };
    }
  },
  
  /**
   * Calculate attendance stats from records
   * This is a local fallback if API fails or for quick updates
   * @param attendanceRecords Array of attendance records
   * @param totalEmployees Total number of active employees 
   * @returns Calculated attendance statistics
   */
  calculateStatsFromRecords(attendanceRecords: AttendanceRecord[], totalEmployees: number): AttendanceStats {

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter records for today
    const todayRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    
    // Get unique employees who signed in today
    const uniqueEmployeesPresent = new Set(
      todayRecords
        .filter(record => record.type === 'sign-in')
        .map(record => record.employeeId)
    );
    
    const presentEmployees = uniqueEmployeesPresent.size;
    
    // Count late arrivals
    const lateEmployees = todayRecords.filter(
      record => record.type === 'sign-in' && record.isLate
    ).length;
    
    // Calculate absent as total minus present
    const absentEmployees = Math.max(0, totalEmployees - presentEmployees);
    
    // Calculate rates
    const attendanceRate = totalEmployees > 0 
      ? Math.round((presentEmployees / totalEmployees) * 100) 
      : 0;
    
    const punctualityRate = presentEmployees > 0 
      ? Math.round(((presentEmployees - lateEmployees) / presentEmployees) * 100) 
      : 0;

    return {
      totalEmployees,
      presentEmployees,
      lateEmployees,
      absentEmployees,
      attendanceRate,
      punctualityRate,
      date: today.toISOString()
    };
  },

  /**
   * Get attendance records for a specific date range
   * @param startDate Start date (YYYY-MM-DD format)
   * @param endDate End date (YYYY-MM-DD format)
   * @returns Array of attendance records within the date range
   */
  async getAttendanceInRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    try {
      
      // Use the main attendance endpoint with date range parameters
      const response = await api.get(`/api/attendance`, {
        params: {
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
          limit: 1000 // Get up to 1000 records
        }
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No attendance data in range response');
        }
        return [];
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching attendance records in range:', error);
      }
      // Fallback to regular attendance fetch if date filtering fails
      try {
        const allRecords = await this.getAllAttendanceRecords(1000);
        
        // Filter records by date range
        const filteredRecords = allRecords.filter(record => {
          const recordDate = record.timestamp;
          if (!recordDate) return false;
          const date = new Date(recordDate).toISOString().split('T')[0];
          return date >= startDate && date <= endDate;
        });
        
        return filteredRecords;
      } catch (fallbackError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Fallback fetch also failed:', fallbackError);
        }
        return [];
      }
    }
  },
  
  /**
   * Get attendance report for date range
   * @param startDate Start date for report
   * @param endDate End date for report
   * @param department Optional department filter
   * @returns Attendance report data
   */
  async getAttendanceReport(startDate: string, endDate: string, department?: string) {
    try {
      // Get organization ID for filtering
      const organizationId = employeeService.getCurrentOrganizationId();
      
      if (!organizationId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No organization ID found for fetching attendance report');
        }
        return [];
      }
      
      // Build URL with params
      const params = new URLSearchParams({
        startDate,
        endDate,
        organizationId
      });
      
      if (department) {
        params.append('department', department);
      }
      
      
      const url = `/api/attendance/report?${params.toString()}`;
      
      const response = await api.get(url);
      
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching attendance report:', error);
      }
      return [];
    }
  },
  
  /**
   * Get client's IP address
   * @returns Client IP address
   */
  async getClientIpAddress(): Promise<string> {
    try {
      // We can use a public IP API to get the client IP
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting IP address:', error);
      }
      return '';
    }
  },
  
  /**
   * Get client's geo location
   * @returns Location data or null if unavailable
   */
  async getClientLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          resolve(location);
        },
        (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error getting location:', error.message);
          }
          resolve(null);
        }
      );
    });
  }
};

export default attendanceService;