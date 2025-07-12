/**
 * Utility functions for attendance operations
 */

/**
 * Format time to display in a readable format
 * @param {Date|string} timestamp - Date object or date string
 * @returns {string} Formatted time (e.g., "09:30 AM")
 */
const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  /**
   * Format date to display in a readable format
   * @param {Date|string} timestamp - Date object or date string
   * @returns {string} Formatted date (e.g., "Jan 15, 2023")
   */
  const formatDate = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  /**
   * Check if an employee is late based on working hours
   * @param {Date} currentTime - Current time
   * @param {Object} workingHours - Employee working hours object
   * @returns {boolean} True if the employee is late, false otherwise
   */
  const isEmployeeLate = (currentTime, workingHours) => {
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
  const calculateWorkDuration = (signInTime, signOutTime) => {
    const start = signInTime instanceof Date ? signInTime : new Date(signInTime);
    const end = signOutTime instanceof Date ? signOutTime : new Date(signOutTime);
    
    // Return duration in minutes
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };
  
  /**
   * Format duration in minutes to hours and minutes
   * @param {number} durationInMinutes - Duration in minutes
   * @returns {string} Formatted duration (e.g., "8h 30m")
   */
  const formatDuration = (durationInMinutes) => {
    if (!durationInMinutes) return '0h 0m';
    
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };
  
  /**
   * Generate attendance summary for a given date range
   * @param {Array} records - Array of attendance records
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Summary statistics
   */
  const generateAttendanceSummary = (records, startDate, endDate) => {
    // Filter records within date range
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    // Count unique employees who checked in
    const uniqueEmployees = new Set();
    const lateEmployees = new Set();
    
    filteredRecords.forEach(record => {
      if (record.type === 'sign-in') {
        uniqueEmployees.add(record.employeeId.toString());
        
        if (record.isLate) {
          lateEmployees.add(record.employeeId.toString());
        }
      }
    });
    
    return {
      totalRecords: filteredRecords.length,
      uniqueEmployees: uniqueEmployees.size,
      lateCount: lateEmployees.size,
      latePercentage: uniqueEmployees.size > 0 
        ? Math.round((lateEmployees.size / uniqueEmployees.size) * 100) 
        : 0
    };
  };
  
  module.exports = {
    formatTime,
    formatDate,
    isEmployeeLate,
    calculateWorkDuration,
    formatDuration,
    generateAttendanceSummary
  };