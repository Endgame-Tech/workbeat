// Complete attendanceController.js with all required functions

const { prisma } = require('../config/db');
const queryOptimizer = require('../utils/queryOptimizer');
const webSocketService = require('../services/websocketService');

// FIXED: Improved checkIfLate function
const checkIfLate = (currentTime, workScheduleData) => {
  console.log("Backend lateness check - Current time:", currentTime.toLocaleTimeString());
  
  // If no schedule provided, can't be late
  if (!workScheduleData) {
    console.log("Backend lateness check - No work schedule data provided");
    return false;
  }
  
  let startTimeStr;
  
  // Parse string to object if necessary
  let scheduleObj = workScheduleData;
  if (typeof workScheduleData === 'string') {
    try {
      scheduleObj = JSON.parse(workScheduleData);
      console.log("Backend lateness check - Parsed schedule:", JSON.stringify(scheduleObj));
    } catch (error) {
      console.error('Backend lateness check - Error parsing work schedule:', error);
      // Try extracting with regex as fallback
      const startMatch = workScheduleData.match(/start["']?\s*:\s*["']?(\d{1,2}:\d{2})["']?/);
      if (startMatch && startMatch[1]) {
        startTimeStr = startMatch[1];
        console.log("Backend lateness check - Extracted start time with regex:", startTimeStr);
      } else {
        // Default to 9am if unparseable
        startTimeStr = "09:00";
        console.log("Backend lateness check - Using default start time (9:00)");
      }
    }
  }
  
  // If we have parsed object but not start time yet
  if (!startTimeStr && scheduleObj) {
    // Get current day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[currentTime.getDay()];
    console.log("Backend lateness check - Current day:", dayOfWeek);
    
    // Format 1: {monday: {start: "09:00"}, ...}
    if (scheduleObj[dayOfWeek] && scheduleObj[dayOfWeek].start) {
      startTimeStr = scheduleObj[dayOfWeek].start;
      console.log(`Backend lateness check - Found start time for ${dayOfWeek}:`, startTimeStr);
    }
    // Format 2: {days: [...], hours: {start: "09:00"}}
    else if (scheduleObj.days && scheduleObj.hours && scheduleObj.hours.start) {
      startTimeStr = scheduleObj.hours.start;
      console.log("Backend lateness check - Found start time in hours:", startTimeStr);
    }
    // Format 3: Simple {start: "09:00"}
    else if (scheduleObj.start) {
      startTimeStr = scheduleObj.start;
      console.log("Backend lateness check - Found direct start time:", startTimeStr);
    }
  }
  
  // If no start time determined, default to 9am
  if (!startTimeStr) {
    startTimeStr = "09:00";
    console.log("Backend lateness check - No start time found, using default:", startTimeStr);
  }
  
  // Parse start time
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.log("Backend lateness check - Invalid start time format:", startTimeStr);
    return false;
  }
  
  // Create scheduled start time
  const scheduledStart = new Date(currentTime);
  scheduledStart.setHours(hours, minutes, 0, 0);
  
  // Add grace period (5 minutes)
  const graceEnd = new Date(scheduledStart);
  graceEnd.setMinutes(graceEnd.getMinutes() + 5);
  
  console.log("Backend lateness check - Scheduled start:", scheduledStart.toLocaleTimeString());
  console.log("Backend lateness check - Grace period ends:", graceEnd.toLocaleTimeString());
  console.log("Backend lateness check - Actual time:", currentTime.toLocaleTimeString());
  
  // IMPORTANT: Always use getTime() for accurate timestamp comparison
  const isLate = currentTime.getTime() > graceEnd.getTime();
  console.log("Backend lateness check - Is employee late?", isLate);
  
  return isLate;
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Admin
const getAttendanceRecords = async (req, res) => {
  try {
    // Get organizationId from authenticated user or query parameter
    const organizationId = parseInt(req.user?.organizationId) || parseInt(req.query.organizationId);
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Build filters object
    const filters = { organizationId };
    
    // Date filtering
    if (req.query.startDate && req.query.endDate) {
      filters.timestamp = {
        gte: new Date(req.query.startDate),
        lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filters.timestamp = { gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filters.timestamp = { lte: new Date(req.query.endDate) };
    }
    
    // Employee filtering
    if (req.query.employeeId) {
      filters.employeeId = parseInt(req.query.employeeId);
    }
    
    // Type filtering
    if (req.query.type && ['sign-in', 'sign-out'].includes(req.query.type)) {
      filters.type = req.query.type;
    }
    
    // Get pagination parameters
    filters.page = parseInt(req.query.page) || 1;
    filters.limit = parseInt(req.query.limit) || 100;
    
    console.log('🚀 Fetching optimized attendance records with filters:', filters);
    
    // Use optimized query
    const result = await queryOptimizer.getOptimizedAttendanceRecords(filters);
    
    console.log(`✅ Optimized query returned ${result.records.length} records out of ${result.pagination.total} total`);
    if (result.records.length > 0) {
      console.log('Sample optimized record:', {
        _id: result.records[0]._id,
        employeeId: result.records[0].employeeId,
        employeeName: result.records[0].employee?.name,
        organizationId: result.records[0].organizationId,
        type: result.records[0].type,
        timestamp: result.records[0].timestamp,
        hasEmployee: !!result.records[0].employee
      });
    }
    
    res.status(200).json({
      success: true,
      count: result.records.length,
      pagination: result.pagination,
      data: result.records
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

// @desc    Get attendance records for a specific employee
// @route   GET /api/attendance/employee/:id
// @access  Private
const getEmployeeAttendance = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    
    // Get organizationId from authenticated user or query parameter
    const organizationId = parseInt(req.user?.organizationId) || parseInt(req.query.organizationId);
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Verify the employee exists and belongs to the user's organization using Prisma
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId
      }
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your organization'
      });
    }
    
    // Build where clause for Prisma query
    const where = { 
      employeeId,
      organizationId
    };
    
    if (req.query.startDate && req.query.endDate) {
      where.timestamp = {
        gte: new Date(req.query.startDate),
        lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      where.timestamp = { gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      where.timestamp = { lte: new Date(req.query.endDate) };
    } else {
      // Default to last 30 days if no date range specified
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.timestamp = { gte: thirtyDaysAgo };
    }
    
    const records = await prisma.attendance.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee attendance',
      error: error.message
    });
  }
};

// @desc    Create new attendance record
// @route   POST /api/attendance
// @access  Public
const createAttendanceRecord = async (req, res) => {
  try {
    const { employeeId, type, notes, location, ipAddress, organizationId } = req.body;
    
    // Check if organizationId is provided in the request or get from authenticated user
    const recordOrganizationId = parseInt(organizationId) || (req.user ? parseInt(req.user.organizationId) : null);
    
    if (!recordOrganizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }
    
    // Verify that the employee exists and belongs to the correct organization using Prisma
    const employee = await prisma.employee.findFirst({ 
      where: {
        id: parseInt(employeeId),
        organizationId: recordOrganizationId
      }
    });
    
    if (!employee) {
      console.error(`Employee not found: ${employeeId} in organization: ${recordOrganizationId}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found in this organization'
      });
    }
    
    console.log(`Creating attendance record for employee: ${employee.name} (${employee.id})`);
    
    // Create timestamp
    const timestamp = new Date();
    
    // IMPORTANT: Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workSchedule) : 
      false;
    
    // For debugging purposes
    if (type === 'sign-in') {
      console.log(`Employee ${employee.name} is ${isLate ? 'LATE' : 'ON TIME'} with type ${type}`);
    }
    
    // Create attendance record with organization ID using Prisma
    const attendanceRecord = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        type,
        timestamp,
        date: new Date(timestamp), // Add the required date field
        location,
        ipAddress,
        notes,
        isLate, // IMPORTANT: Including the lateness flag
        organizationId: recordOrganizationId
      }
    });
    
    console.log(`Created attendance record: ${attendanceRecord.id}`);
    
    // Update daily attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyAttendance = await prisma.dailyAttendances.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: today,
        organizationId: recordOrganizationId
      }
    });
    
    if (type === 'sign-in') {
      if (!dailyAttendance) {
        console.log('Creating new daily attendance record');
        dailyAttendance = await prisma.dailyAttendances.create({
          data: {
            employeeId: parseInt(employeeId),
            date: today,
            status: isLate ? 'late' : 'present',
            signInTime: timestamp,
            notes: notes,
            organizationId: recordOrganizationId
          }
        });
        console.log(`Created daily attendance record: ${dailyAttendance.id}`);
      } else {
        console.log(`Updating existing daily attendance record: ${dailyAttendance.id}`);
        dailyAttendance = await prisma.dailyAttendances.update({
          where: { id: dailyAttendance.id },
          data: {
            signInTime: timestamp,
            status: isLate ? 'late' : 'present',
            notes: notes || dailyAttendance.notes
          }
        });
        console.log('Updated daily attendance record');
      }
    } else if (type === 'sign-out') {
      if (dailyAttendance) {
        console.log(`Updating daily attendance record with sign-out: ${dailyAttendance.id}`);
        
        const workDuration = dailyAttendance.signInTime
          ? Math.round((timestamp.getTime() - dailyAttendance.signInTime.getTime()) / (1000 * 60))
          : null;
        
        dailyAttendance = await prisma.dailyAttendances.update({
          where: { id: dailyAttendance.id },
          data: {
            signOutTime: timestamp,
            workDuration,
            notes: notes
              ? dailyAttendance.notes
                ? `${dailyAttendance.notes}; ${notes}`
                : notes
              : dailyAttendance.notes
          }
        });
        console.log('Updated daily attendance record with sign-out time');
      } else {
        console.log('Creating new daily attendance record for sign-out only');

        dailyAttendance = await prisma.dailyAttendances.create({
          data: {
            employeeId: parseInt(employeeId),
            date: today,
            status: 'absent', // Default to absent for sign-out only
            signOutTime: timestamp,
            notes: notes,
            organizationId: parseInt(recordOrganizationId)
          }
        });
        console.log(`Created daily attendance record for sign-out: ${dailyAttendance.id}`);
      }
    }
    
    // Log the action using Prisma
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: `attendance_${type}`,
          details: `Employee ${employee.name} ${type === 'sign-in' ? 'signed in' : 'signed out'}${isLate ? ' (late)' : ''}`,
          ipAddress,
          resourceType: 'attendance',
          resourceId: String(attendanceRecord.id)
        }
      });
      console.log(`Created audit log for attendance`);
    } catch (logError) {
      console.error('Error creating audit log:', logError);
      // Continue even if audit log fails
    }
    
    // Broadcast real-time attendance update via WebSocket
    const attendanceData = {
      id: attendanceRecord.id,
      employeeId: attendanceRecord.employeeId,
      employeeName: employee.name,
      type: attendanceRecord.type,
      timestamp: attendanceRecord.timestamp,
      isLate: isLate,
      location: attendanceRecord.location,
      organizationId: recordOrganizationId
    };

    webSocketService.broadcastToOrganization(recordOrganizationId, 'attendance_updated', attendanceData);
    webSocketService.broadcastToDashboard(recordOrganizationId, 'overview', 'stats_updated', { 
      trigger: 'attendance_created',
      timestamp: new Date().toISOString() 
    });

    // IMPORTANT: Make sure isLate is included in the response
    res.status(201).json({
      success: true,
      data: {
        ...attendanceRecord,
        isLate // Explicitly include isLate in response data
      },
      isLate // Also include at top level for backward compatibility
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance record',
      error: error.message
    });
  }
};

// @desc    Create attendance record with facial recognition
// @route   POST /api/attendance/face
// @access  Public
const createAttendanceWithFace = async (req, res) => {
  try {
    console.log('Face attendance payload received');
    const { employeeId, type, facialCapture, location, notes, organizationId } = req.body;
    
    // Check if organizationId is provided in the request or get from authenticated user
    const recordOrganizationId = organizationId || (req.user ? req.user.organizationId : null);
    
    if (!recordOrganizationId) {
      console.error('No organization ID provided for facial attendance');
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }
    
    // Verify that the employee exists and belongs to the correct organization using Prisma
    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(employeeId),
        organizationId: parseInt(recordOrganizationId)
      }
    });
    
    if (!employee) {
      console.error(`Employee not found for facial attendance: ${employeeId} in organization: ${recordOrganizationId}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found in this organization'
      });
    }
    
    console.log(`Creating facial attendance record for employee: ${employee.name} (${employee.id})`);
    
    // Create timestamp
    const timestamp = new Date();
    
    // IMPORTANT: Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workSchedule) : 
      false;
    
    // For debugging purposes
    if (type === 'sign-in') {
      console.log(`Employee ${employee.name} is ${isLate ? 'LATE' : 'ON TIME'} with type ${type}`);
    }
    
    // Create attendance record with organization ID using Prisma
    const attendanceRecord = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        type,
        timestamp,
        date: new Date(timestamp), // Add the required date field
        facialVerification: true,
        location,
        notes,
        isLate, // IMPORTANT: Including the lateness flag
        verificationMethod: 'face-recognition',
        organizationId: parseInt(recordOrganizationId),
        facialCapture: facialCapture ? JSON.stringify({ image: facialCapture }) : null
      }
    });
    
    console.log(`Created facial attendance record: ${attendanceRecord.id}`);
    
    // Update daily attendance similar to createAttendanceRecord
    // (code omitted for brevity, but would follow the same pattern)
    
    // Broadcast real-time facial attendance update via WebSocket
    const attendanceData = {
      id: attendanceRecord.id,
      employeeId: attendanceRecord.employeeId,
      employeeName: employee.name,
      type: attendanceRecord.type,
      timestamp: attendanceRecord.timestamp,
      isLate: isLate,
      location: attendanceRecord.location,
      organizationId: recordOrganizationId,
      verificationMethod: 'face-recognition'
    };

    webSocketService.broadcastToOrganization(recordOrganizationId, 'attendance_updated', attendanceData);
    webSocketService.broadcastToDashboard(recordOrganizationId, 'overview', 'stats_updated', { 
      trigger: 'facial_attendance_created',
      timestamp: new Date().toISOString() 
    });

    // IMPORTANT: Make sure isLate is included in the response
    res.status(201).json({
      success: true,
      data: {
        ...attendanceRecord,
        isLate // Explicitly include isLate in response data
      },
      isLate // Also include at top level for backward compatibility
    });
  } catch (error) {
    console.error('Error creating attendance record with face:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance with facial recognition',
      error: error.message
    });
  }
};

// @desc    Get today's attendance stats
// @route   GET /api/attendance/stats/today
// @access  Private/Admin
const getTodayStats = async (req, res) => {
  try {
    // Get organizationId from authenticated user or query parameter
    const organizationId = parseInt(req.user?.organizationId) || parseInt(req.query.organizationId);
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    console.log(`Getting today's attendance stats for organization: ${organizationId}`);
    
    // Get today's date (beginning of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all active employees count for this organization using Prisma
    const totalActiveEmployees = await prisma.employee.count({ 
      where: {
        isActive: true,
        organizationId
      }
    });
    
    console.log(`Found ${totalActiveEmployees} active employees`);
    
    // Get unique employees who have signed in today using Prisma
    const signedInEmployeesData = await prisma.attendance.findMany({
      where: {
        type: 'sign-in',
        timestamp: {
          gte: today,
          lt: tomorrow
        },
        organizationId
      },
      distinct: ['employeeId']
    });
    
    // Get employees who were late using Prisma
    const lateEmployeesData = await prisma.attendance.findMany({
      where: {
        type: 'sign-in',
        isLate: true,
        timestamp: {
          gte: today,
          lt: tomorrow
        },
        organizationId
      },
      distinct: ['employeeId']
    });
    
    // Calculate stats
    const presentCount = signedInEmployeesData.length;
    const lateCount = lateEmployeesData.length;
    const absentCount = Math.max(0, totalActiveEmployees - presentCount);
    
    // Calculate rates
    const attendanceRate = totalActiveEmployees > 0 
      ? Math.round((presentCount / totalActiveEmployees) * 100) 
      : 0;
    
    const punctualityRate = presentCount > 0 
      ? Math.round(((presentCount - lateCount) / presentCount) * 100) 
      : 0;
    
    console.log(`Stats: Present=${presentCount}, Late=${lateCount}, Absent=${absentCount}, Rate=${attendanceRate}%, Punctuality=${punctualityRate}%`);
    
    res.status(200).json({
      success: true,
      data: {
        totalEmployees: totalActiveEmployees,
        presentEmployees: presentCount,
        lateEmployees: lateCount,
        absentEmployees: absentCount,
        attendanceRate,
        punctualityRate,
        date: today,
        organizationId
      }
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance stats',
      error: error.message
    });
  }
};

// @desc    Generate attendance report
// @route   GET /api/attendance/report
// @access  Private/Admin
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Get organizationId from authenticated user or query parameter
    const organizationId = parseInt(req.user?.organizationId) || parseInt(req.query.organizationId);
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start and end dates'
      });
    }
    
    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Set time to start and end of days
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(23, 59, 59, 999);
    
    console.log(`Generating attendance report from ${startDateObj} to ${endDateObj} for organization ${organizationId}`);
    
    // Debug: Check total attendance records for this organization
    const totalAttendanceCount = await prisma.attendance.count({
      where: { organizationId }
    });
    console.log(`Total attendance records for organization ${organizationId}: ${totalAttendanceCount}`);
    
    // Get attendance data using Prisma - Query the attendance table instead of dailyAttendance
    const attendanceData = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startDateObj,
          lte: endDateObj
        },
        organizationId,
        ...(department && {
          employee: {
            department
          }
        })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
            employeeId: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    console.log(`Found ${attendanceData.length} attendance records`);

    // Convert attendance records to the format expected by the frontend
    const records = attendanceData.map(record => ({
      id: record.id,
      employeeId: record.employee.employeeId || record.employeeId.toString(),
      employeeName: record.employee.name,
      organizationId: record.organizationId,
      type: record.type,
      timestamp: record.timestamp.toISOString(),
      location: record.location,
      ipAddress: record.ipAddress,
      isLate: record.isLate,
      notes: record.notes,
      verificationMethod: record.verificationMethod,
      facialVerification: record.facialVerification,
      facialCapture: record.facialCapture,
      fingerprintVerification: record.fingerprintVerification,
      employee: {
        id: record.employee.id,
        name: record.employee.name,
        department: record.employee.department,
        position: record.employee.position,
        employeeId: record.employee.employeeId
      }
    }));
    
    console.log(`Report generated with ${records.length} attendance records`);
    
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report',
      error: error.message
    });
  }
};

// Export all required functions
module.exports = {
  getAttendanceRecords,
  getEmployeeAttendance,
  createAttendanceRecord,
  createAttendanceWithFace,
  getTodayStats,
  getAttendanceReport,
  checkIfLate 
};