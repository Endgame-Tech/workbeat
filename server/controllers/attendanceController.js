const mongoose = require('mongoose');
const Attendance = require('../models/attendanceModel');
const Employee = require('../models/employeeModel');
const DailyAttendance = require('../models/dailyAttendanceModel');
const AuditLog = require('../models/auditLogModel');

// Utility function to check if employee is late
const checkIfLate = (currentTime, workingHours) => {
  if (!workingHours || !workingHours.start) return false;
  
  const [hours, minutes] = workingHours.start.split(':').map(Number);
  const startTime = new Date(currentTime);
  startTime.setHours(hours, minutes, 0, 0);
  
  // Add a 5-minute grace period
  startTime.setMinutes(startTime.getMinutes() + 5);
  
  return currentTime > startTime;
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Admin
const getAttendanceRecords = async (req, res) => {
  try {
    // Get organizationId from authenticated user or query parameter
    const organizationId = req.user?.organizationId || req.query.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Build filter with organization ID to restrict results to this organization
    const filter = { organizationId };
    const limit = parseInt(req.query.limit) || 100;
    
    // Date range filtering
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    // Employee filtering
    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }
    
    // Type filtering
    if (req.query.type && ['sign-in', 'sign-out'].includes(req.query.type)) {
      filter.type = req.query.type;
    }
    
    console.log('Fetching attendance records with filter:', filter);
    
    // Get records with pagination
    const records = await Attendance.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: records.length,
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
    const employeeId = req.params.id;
    
    // Get organizationId from authenticated user or query parameter
    const organizationId = req.user?.organizationId || req.query.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Verify the employee exists and belongs to the user's organization
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId // Ensure employee belongs to this organization
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your organization'
      });
    }
    
    // Build filter for date range, including organization ID
    const filter = { 
      employeeId,
      organizationId
    };
    
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    // Default to last 30 days if no date range specified
    if (!filter.timestamp) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filter.timestamp = { $gte: thirtyDaysAgo };
    }
    
    const records = await Attendance.find(filter).sort({ timestamp: -1 });
    
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
    const { employeeId, employeeName, type, notes, location, ipAddress, organizationId } = req.body;
    
    // Check if organizationId is provided in the request or get from authenticated user
    const recordOrganizationId = organizationId || (req.user ? req.user.organizationId : null);
    
    if (!recordOrganizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }
    
    // Verify that the employee exists and belongs to the correct organization
    const employee = await Employee.findOne({ 
      _id: employeeId,
      organizationId: recordOrganizationId // Ensure employee belongs to this organization
    });
    
    if (!employee) {
      console.error(`Employee not found: ${employeeId} in organization: ${recordOrganizationId}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found in this organization'
      });
    }
    
    console.log(`Creating attendance record for employee: ${employee.name} (${employee._id})`);
    
    // Create timestamp
    const timestamp = new Date();
    
    // Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workingHours) : 
      false;
    
    // Create attendance record with organization ID
    const attendanceData = {
      employeeId,
      employeeName: employee.name || employeeName,
      type,
      timestamp,
      location,
      ipAddress,
      notes,
      isLate,
      organizationId: recordOrganizationId // Ensure organization ID is set
    };
    
    console.log('Creating attendance record with data:', attendanceData);
    
    const attendanceRecord = new Attendance(attendanceData);
    await attendanceRecord.save();
    
    console.log(`Created attendance record: ${attendanceRecord._id}`);
    
    // Update daily attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyAttendance = await DailyAttendance.findOne({
      employeeId,
      date: today,
      organizationId: recordOrganizationId // Ensure we get the right daily attendance record
    });
    
    if (type === 'sign-in') {
      // If it's a sign-in, create or update daily attendance
      if (!dailyAttendance) {
        console.log('Creating new daily attendance record');
        const newDailyAttendance = new DailyAttendance({
          employeeId,
          date: today,
          status: isLate ? 'late' : 'present',
          signInTime: timestamp,
          notes: notes,
          organizationId: recordOrganizationId // Ensure organization ID is set
        });
        
        await newDailyAttendance.save();
        console.log(`Created daily attendance record: ${newDailyAttendance._id}`);
      } else {
        // Update existing record
        console.log(`Updating existing daily attendance record: ${dailyAttendance._id}`);
        
        dailyAttendance.signInTime = timestamp;
        dailyAttendance.status = isLate ? 'late' : 'present';
        
        if (notes) {
          dailyAttendance.notes = notes;
        }
        
        await dailyAttendance.save();
        console.log('Updated daily attendance record');
      }
    } else if (type === 'sign-out') {
      // For sign-out, update if daily record exists
      if (dailyAttendance) {
        console.log(`Updating daily attendance record with sign-out: ${dailyAttendance._id}`);
        
        dailyAttendance.signOutTime = timestamp;
        
        // Calculate work duration in minutes if sign-in time exists
        if (dailyAttendance.signInTime) {
          const signInTime = new Date(dailyAttendance.signInTime).getTime();
          const signOutTime = timestamp.getTime();
          dailyAttendance.workDuration = Math.round((signOutTime - signInTime) / (1000 * 60));
        }
        
        if (notes) {
          dailyAttendance.notes = dailyAttendance.notes
            ? `${dailyAttendance.notes}; ${notes}`
            : notes;
        }
        
        await dailyAttendance.save();
        console.log('Updated daily attendance record with sign-out time');
      } else {
        // If no daily record exists yet (unusual case), create one with sign-out only
        console.log('Creating new daily attendance record for sign-out only');
        
        const newDailyAttendance = new DailyAttendance({
          employeeId,
          date: today,
          status: 'present', // Default to present since we have a sign-out but no sign-in
          signOutTime: timestamp,
          notes: notes,
          organizationId: recordOrganizationId // Ensure organization ID is set
        });
        
        await newDailyAttendance.save();
        console.log(`Created daily attendance record for sign-out: ${newDailyAttendance._id}`);
      }
    }
    
    // Log the action
    try {
      const auditLog = new AuditLog({
        action: `attendance_${type}`,
        details: `Employee ${employee.name} ${type === 'sign-in' ? 'signed in' : 'signed out'}${isLate ? ' (late)' : ''}`,
        ipAddress,
        resourceType: 'attendance',
        resourceId: attendanceRecord._id,
        organizationId: recordOrganizationId // Ensure organization ID is set in audit log
      });
      
      await auditLog.save();
      console.log(`Created audit log: ${auditLog._id}`);
    } catch (logError) {
      console.error('Error creating audit log:', logError);
      // Continue even if audit log fails
    }
    
    res.status(201).json({
      success: true,
      data: attendanceRecord,
      isLate
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
    
    // Verify that the employee exists and belongs to the correct organization
    const employee = await Employee.findOne({ 
      _id: employeeId,
      organizationId: recordOrganizationId // Ensure employee belongs to this organization
    });
    
    if (!employee) {
      console.error(`Employee not found for facial attendance: ${employeeId} in organization: ${recordOrganizationId}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found in this organization'
      });
    }
    
    console.log(`Creating facial attendance record for employee: ${employee.name} (${employee._id})`);
    
    // Create timestamp
    const timestamp = new Date();
    
    // Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workingHours) : 
      false;
    
    // Create attendance record with organization ID
    const attendanceData = {
      employeeId,
      employeeName: employee.name,
      type,
      timestamp,
      facialVerification: true,
      location,
      notes,
      isLate,
      verificationMethod: 'face-recognition',
      organizationId: recordOrganizationId // Ensure organization ID is set
    };
    
    // Add facial capture if provided
    if (facialCapture) {
      attendanceData.facialCapture = { image: facialCapture };
    }
    
    console.log('Creating facial attendance record...');
    
    const attendanceRecord = new Attendance(attendanceData);
    await attendanceRecord.save();
    
    console.log(`Created facial attendance record: ${attendanceRecord._id}`);
    
    // Update daily attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyAttendance = await DailyAttendance.findOne({
      employeeId,
      date: today,
      organizationId: recordOrganizationId
    });
    
    // Update daily attendance (same logic as createAttendanceRecord)
    if (type === 'sign-in') {
      if (!dailyAttendance) {
        console.log('Creating new daily attendance record for facial sign-in');
        
        const newDailyAttendance = new DailyAttendance({
          employeeId,
          date: today,
          status: isLate ? 'late' : 'present',
          signInTime: timestamp,
          notes: notes,
          organizationId: recordOrganizationId
        });
        
        await newDailyAttendance.save();
        console.log(`Created daily attendance record for facial sign-in: ${newDailyAttendance._id}`);
      } else {
        console.log(`Updating existing daily attendance record with facial sign-in: ${dailyAttendance._id}`);
        
        dailyAttendance.signInTime = timestamp;
        dailyAttendance.status = isLate ? 'late' : 'present';
        
        if (notes) {
          dailyAttendance.notes = notes;
        }
        
        await dailyAttendance.save();
        console.log('Updated daily attendance record with facial sign-in');
      }
    } else if (type === 'sign-out') {
      if (dailyAttendance) {
        console.log(`Updating daily attendance record with facial sign-out: ${dailyAttendance._id}`);
        
        dailyAttendance.signOutTime = timestamp;
        
        if (dailyAttendance.signInTime) {
          const signInTime = new Date(dailyAttendance.signInTime).getTime();
          const signOutTime = timestamp.getTime();
          dailyAttendance.workDuration = Math.round((signOutTime - signInTime) / (1000 * 60));
        }
        
        if (notes) {
          dailyAttendance.notes = dailyAttendance.notes
            ? `${dailyAttendance.notes}; ${notes}`
            : notes;
        }
        
        await dailyAttendance.save();
        console.log('Updated daily attendance record with facial sign-out');
      } else {
        console.log('Creating new daily attendance record for facial sign-out only');
        
        const newDailyAttendance = new DailyAttendance({
          employeeId,
          date: today,
          status: 'present',
          signOutTime: timestamp,
          notes: notes,
          organizationId: recordOrganizationId
        });
        
        await newDailyAttendance.save();
        console.log(`Created daily attendance record for facial sign-out: ${newDailyAttendance._id}`);
      }
    }
    
    // Log the action
    try {
      const auditLog = new AuditLog({
        action: `attendance_${type}_face`,
        details: `Employee ${employee.name} ${type === 'sign-in' ? 'signed in' : 'signed out'} using facial recognition${isLate ? ' (late)' : ''}`,
        resourceType: 'attendance',
        resourceId: attendanceRecord._id,
        organizationId: recordOrganizationId
      });
      
      await auditLog.save();
      console.log(`Created audit log for facial attendance: ${auditLog._id}`);
    } catch (logError) {
      console.error('Error creating audit log for facial attendance:', logError);
      // Continue even if audit log fails
    }
    
    res.status(201).json({
      success: true,
      data: attendanceRecord,
      isLate
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
    const organizationId = req.user?.organizationId || req.query.organizationId;
    
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
    
    // Get all active employees count for this organization
    const totalActiveEmployees = await Employee.countDocuments({ 
      isActive: true,
      organizationId // Filter by organization ID
    });
    
    console.log(`Found ${totalActiveEmployees} active employees`);
    
    // Get unique employees who have signed in today
    const signedInEmployees = await Attendance.distinct('employeeId', {
      type: 'sign-in',
      timestamp: { $gte: today, $lt: tomorrow },
      organizationId // Filter by organization ID
    });
    
    // Get employees who were late
    const lateEmployees = await Attendance.distinct('employeeId', {
      type: 'sign-in',
      isLate: true,
      timestamp: { $gte: today, $lt: tomorrow },
      organizationId // Filter by organization ID
    });
    
    // Calculate stats
    const presentCount = signedInEmployees.length;
    const lateCount = lateEmployees.length;
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
        organizationId // Include organization ID in response
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
    const organizationId = req.user?.organizationId || req.query.organizationId;
    
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
    
    // Convert organizationId to MongoDB ObjectId
    const orgObjectId = mongoose.Types.ObjectId(organizationId);
    
    // Build pipeline with organization filter
    const pipeline = [
      {
        $match: {
          date: { $gte: startDateObj, $lte: endDateObj },
          organizationId: orgObjectId // Filter by organization ID
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: {
          path: '$employee',
          preserveNullAndEmptyArrays: true // Keep records even if employee not found
        }
      },
      // Ensure we only get employees from the same organization
      {
        $match: {
          $or: [
            { 'employee.organizationId': orgObjectId },
            { 'employee': null } // Include records even if employee not found
          ]
        }
      }
    ];
    
    // Add department filter if specified
    if (department) {
      pipeline.push({
        $match: {
          'employee.department': department
        }
      });
    }
    
    // Group by date and status
    pipeline.push(
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 },
          employees: {
            $push: {
              id: '$employee._id',
              name: '$employee.name',
              department: '$employee.department',
              signInTime: '$signInTime',
              signOutTime: '$signOutTime',
              workDuration: '$workDuration'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count',
              employees: '$employees'
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          stats: 1,
          _id: 0
        }
      },
      {
        $sort: { date: 1 }
      }
    );
    
    console.log('Executing aggregation pipeline');
    
    const report = await DailyAttendance.aggregate(pipeline);
    
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

module.exports = {
  getAttendanceRecords,
  getEmployeeAttendance,
  createAttendanceRecord,
  createAttendanceWithFace,
  getTodayStats,
  getAttendanceReport
};