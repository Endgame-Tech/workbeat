const Employee = require('../models/employeeModel.js');
const Attendance = require('../models/attendanceModel.js');
const AuditLog = require('../models/auditLogModel.js');
const DailyAttendance = require('../models/dailyAttendanceModel.js');
const { uploadToS3 } = require('../utils/s3Utils');
const crypto = require('crypto');

// Helper function to save a base64 image to S3
const saveBase64Image = async (base64Image, employeeId) => {
  try {
    if (!base64Image) {
      throw new Error('No image data provided');
    }

    // Remove header from base64 string if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Validate base64 string
    if (!base64Data || base64Data.trim().length === 0) {
      throw new Error('Invalid image data');
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) {
        throw new Error('Empty image data');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${employeeId}_${timestamp}.jpg`;
      const key = `faces/${filename}`;

      // Upload to S3
      const imageUrl = await uploadToS3(buffer, key);
      return imageUrl;

    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image data');
    }
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};


// @desc    Record attendance with facial verification
// @route   POST /api/employee-auth/record-attendance
// @access  Public
const recordAttendanceWithFace = async (req, res) => {
  try {
    const { 
      employeeId, 
      type,  
      facialImage, 
      location, 
      notes,
      organizationId // Add organizationId to destructuring
    } = req.body;

    // Validate required fields
    if (!employeeId || !type || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, type, and organizationId are required'
      });
    }

    // Validate type enum
    if (!['sign-in', 'sign-out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type: must be either sign-in or sign-out'
      });
    }

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Process the facial image if provided
    let facialCapture = null;
    let verificationMethod = 'manual'; // Default to manual verification

    if (facialImage) {
      try {
        // Save the facial image
        const imagePath = await saveBase64Image(facialImage, employeeId);
        
        // In a real system, you would integrate with a facial recognition API here
        // For demo purposes, we'll simulate a match score
        const matchScore = Math.random() * 100; // 0-100 score
        const verified = matchScore > 80; // Threshold for verification
        
        facialCapture = {
          image: imagePath,
          matchScore,
          verified
        };
        
        verificationMethod = verified ? 'face-recognition' : 'manual';
        
        // If this is the first facial image for the employee, store it for future reference
        if (!employee.faceRecognition || !employee.faceRecognition.faceImages || employee.faceRecognition.faceImages.length === 0) {
          employee.faceRecognition = {
            faceId: crypto.randomBytes(16).toString('hex'),
            faceImages: [imagePath],
            lastUpdated: new Date()
          };
          await employee.save();
        }
      } catch (imageError) {
        console.error('Error processing facial image:', imageError);
        return res.status(400).json({
          success: false,
          message: 'Error processing facial image',
          error: imageError.message
        });
      }
    }

    // Create timestamp
    const timestamp = new Date();
    
    // Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workingHours) : 
      false;
    
    // Create attendance record
    const attendanceRecord = await Attendance.create({
      employeeId,
      employeeName: employee.name,
      organizationId, // Add organizationId to record
      type,
      timestamp,
      location,
      notes,
      isLate,
      facialCapture,
      verificationMethod,
      ipAddress: req.ip // Add IP address for tracking
    });

    // Update daily attendance
    await updateDailyAttendance(employeeId, type, isLate);
    
    // Log the action
    await AuditLog.create({
      action: `attendance_${type}`,
      details: `Employee ${employee.name} ${type === 'sign-in' ? 'signed in' : 'signed out'}${isLate ? ' (late)' : ''} using ${verificationMethod}`,
      ipAddress: req.ip,
      resourceType: 'attendance',
      resourceId: attendanceRecord._id,
      organizationId // Add organizationId to audit log
    });
    
    res.status(201).json({
      success: true,
      data: attendanceRecord,
      isLate
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
};


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

/**
 * @desc    Add face image for an employee
 * @route   POST /api/employee-auth/add-face/:id
 * @access  Private (Admin only)
 */
const addEmployeeFace = async (req, res) => {
    try {
      const { id } = req.params;
      const { faceImage } = req.body;
      
      if (!faceImage) {
        return res.status(400).json({
          success: false,
          message: 'Face image is required'
        });
      }
      
      // Find employee
      const employee = await Employee.findById(id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      
      // Validate the image (basic validation - in production, you'd do more)
      if (!faceImage.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format'
        });
      }
      
      // Initialize face recognition data if it doesn't exist
      if (!employee.faceRecognition) {
        employee.faceRecognition = {
          faceImages: [],
          lastUpdated: new Date()
        };
      }
      
      // Add new face image to array
      employee.faceRecognition.faceImages.push(faceImage);
      employee.faceRecognition.lastUpdated = new Date();
      
      // Generate a unique faceId if not already present
      if (!employee.faceRecognition.faceId) {
        employee.faceRecognition.faceId = crypto.randomBytes(16).toString('hex');
      }
      
      await employee.save();
      
      // Create audit log
      await AuditLog.create({
        userId: req.user._id,
        action: 'add-face',
        details: `Face image added for employee ${employee.name} (${employee.employeeId})`,
        ipAddress: req.ip,
        resourceType: 'employee',
        resourceId: employee._id
      });
      
      res.status(200).json({
        success: true,
        data: {
          _id: employee._id,
          name: employee.name,
          faceRecognition: {
            faceId: employee.faceRecognition.faceId,
            lastUpdated: employee.faceRecognition.lastUpdated,
            imagesCount: employee.faceRecognition.faceImages.length
          }
        }
      });
    } catch (error) {
      console.error('Error adding face image:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  };
  
  /**
   * Helper function to update daily attendance record
   */
  async function updateDailyAttendance(employeeId, type, isLate) {
    try {
      // Get today's date (without time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find or create daily attendance record
      let dailyRecord = await DailyAttendance.findOne({
        employeeId,
        date: today
      });
      
      if (!dailyRecord) {
        // Create new daily record
        dailyRecord = new DailyAttendance({
          employeeId,
          date: today,
          status: type === 'sign-in' ? (isLate ? 'late' : 'present') : 'absent' // Default to absent if first record is sign-out
        });
      }
      
      const now = new Date();
      
      // Update based on attendance type
      if (type === 'sign-in') {
        dailyRecord.signInTime = now;
        dailyRecord.status = isLate ? 'late' : 'present';
      } else if (type === 'sign-out') {
        dailyRecord.signOutTime = now;
        
        // Calculate work duration if sign-in time exists
        if (dailyRecord.signInTime) {
          const durationMs = now.getTime() - dailyRecord.signInTime.getTime();
          dailyRecord.workDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
          
          // Update status based on work duration (e.g., half-day if less than 4 hours)
          if (dailyRecord.workDuration < 240) { // Less than 4 hours
            dailyRecord.status = 'half-day';
          }
        }
      }
      
      await dailyRecord.save();
      return dailyRecord;
    } catch (error) {
      console.error('Error updating daily attendance:', error);
      // Don't throw, just log error to prevent main function from failing
    }
  }
  
  async function compareFaces(capturedImage, registeredImages) {
    
    return {
      matched: true,
      matchScore: 0.85,
      bestMatchIndex: 0
    };
  }

module.exports = {
  recordAttendanceWithFace,
  addEmployeeFace
};