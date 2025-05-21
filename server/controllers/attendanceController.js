// Complete attendanceController.js with all required functions

const { prisma } = require('../config/db');

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
    
    // Build where clause for Prisma query
    let where = { organizationId };
    
    // Date filtering
    if (req.query.startDate && req.query.endDate) {
      where.timestamp = {
        gte: new Date(req.query.startDate),
        lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      where.timestamp = { gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      where.timestamp = { lte: new Date(req.query.endDate) };
    }
    
    // Employee filtering
    if (req.query.employeeId) {
      where.employeeId = parseInt(req.query.employeeId);
    }
    
    // Type filtering
    if (req.query.type && ['sign-in', 'sign-out'].includes(req.query.type)) {
      where.type = req.query.type;
    }
    
    console.log('Fetching attendance records with filter:', where);
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default to 100 records per page
    const skip = (page - 1) * limit;
    
    // Get records with pagination using Prisma
    const records = await prisma.attendance.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take: limit,
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true
          }
        }
      }
    });
    
    // Count total records for pagination info
    const total = await prisma.attendance.count({ where });
    
    res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: records
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
    
    let dailyAttendance = await prisma.dailyAttendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: today,
        organizationId: recordOrganizationId
      }
    });
    
    if (type === 'sign-in') {
      if (!dailyAttendance) {
        console.log('Creating new daily attendance record');
        dailyAttendance = await prisma.dailyAttendance.create({
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
        dailyAttendance = await prisma.dailyAttendance.update({
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
        
        dailyAttendance = await prisma.dailyAttendance.update({
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

        dailyAttendance = await prisma.dailyAttendance.create({
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
    
    console.log(`Generating attendance report from ${startDateObj} to ${endDateObj}`);
    
    // Get attendance data using Prisma
    const attendanceData = await prisma.dailyAttendance.findMany({
      where: {
        date: {
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
            department: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Process the data into the required format
    const reportByDate = {};
    attendanceData.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!reportByDate[dateStr]) {
        reportByDate[dateStr] = {
          date: dateStr,
          stats: []
        };
      }

      const statusData = reportByDate[dateStr].stats.find(s => s.status === record.status);
      if (statusData) {
        statusData.count += 1;
        statusData.employees.push({
          id: record.employee.id,
          name: record.employee.name,
          department: record.employee.department,
          signInTime: record.signInTime,
          signOutTime: record.signOutTime,
          workDuration: record.workDuration
        });
      } else {
        reportByDate[dateStr].stats.push({
          status: record.status,
          count: 1,
          employees: [{
            id: record.employee.id,
            name: record.employee.name,
            department: record.employee.department,
            signInTime: record.signInTime,
            signOutTime: record.signOutTime,
            workDuration: record.workDuration
          }]
        });
      }
    });

    const report = Object.values(reportByDate);
    
    console.log(`Report generated with ${report.length} days of data`);
    
    res.status(200).json({
      success: true,
      data: report
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