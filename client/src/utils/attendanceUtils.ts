/**
 * Utility functions for attendance operations
 */

/**
 * Check if an employee is late based on working hours
 * @param {Date} currentTime - Current time
 * @param {Object} workingHours - Employee working hours object
 * @returns {boolean} True if the employee is late, false otherwise
 */
export const isEmployeeLate = (
  currentTime: Date, 
  workingHours?: { start: string; end: string }
): boolean => {
  if (!workingHours || !workingHours.start) return false;
  
  // Extract hours and minutes from working hours
  const [hours, minutes] = workingHours.start.split(':').map(Number);
  
  // Set start time
  const startTime = new Date(currentTime);
  startTime.setHours(hours, minutes, 0, 0);
  
  // Add a 5-minute grace period
  startTime.setMinutes(startTime.getMinutes() + 5);
  
  return currentTime > startTime;
};

/**
 * Calculate work duration between sign-in and sign-out
 * @param {Date|string} signInTime - Sign-in timestamp
 * @param {Date|string} signOutTime - Sign-out timestamp
 * @returns {number} Duration in minutes
 */
export const calculateWorkDuration = (
  signInTime: Date | string, 
  signOutTime: Date | string
): number => {
  const start = signInTime instanceof Date ? signInTime : new Date(signInTime);
  const end = signOutTime instanceof Date ? signOutTime : new Date(signOutTime);
  
  // Return duration in minutes
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Format time to display in a readable format
 * @param {Date|string} time - Date object or date string
 * @returns {string} Formatted time (e.g., "09:30 AM")
 */
export const formatTime = (time: Date | string): string => {
  const date = time instanceof Date ? time : new Date(time);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format date to display in a readable format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date (e.g., "Jan 15, 2023")
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format duration in minutes to hours and minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "8h 30m")
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes) return '0h 0m';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Get the current location of the user
 * @returns {Promise<{latitude: number, longitude: number} | null>} Location or null if permission denied
 */
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      }
    );
  });
};

/**
 * Attendance record type definition
 */
export interface AttendanceRecord {
  employeeId: string;
  type: 'sign-in' | 'sign-out';
  timestamp: Date;
  location: { latitude: number; longitude: number } | null;
  isLate: boolean;
  notes: string;
  ipAddress: string;
  status: 'late' | 'on-time';
}

/**
 * Create an attendance record
 * @param {string} employeeId - Employee ID
 * @param {string} type - Attendance type (sign-in or sign-out)
 * @param {string} notes - Optional notes
 * @param {Object} workingHours - Employee working hours
 * @returns {Promise<AttendanceRecord>} Created attendance record
 */
export const createAttendanceRecord = async (
  employeeId: string,
  type: 'sign-in' | 'sign-out',
  notes: string,
  workingHours?: { start: string; end: string }
): Promise<AttendanceRecord> => {
  // Create timestamp
  const timestamp = new Date();
  
  // Check if late (only for sign-in)
  const isLate = type === 'sign-in' ? isEmployeeLate(timestamp, workingHours) : false;
  
  // Get location
  const location = await getCurrentLocation();
  
  // Get IP address (mock implementation)
  const ipAddress = await getIpAddress();
  
  // Return the attendance record
  return {
    employeeId,
    type,
    timestamp,
    location,
    isLate,
    notes,
    ipAddress,
    status: isLate ? 'late' : 'on-time'
  };
};

/**
 * Get client IP address (mock implementation)
 * @returns {Promise<string>} IP address
 */
const getIpAddress = async (): Promise<string> => {
  // In a real app, you would use a service to get the client IP
  // This is a mock implementation
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return '127.0.0.1'; // Fallback
  }
};