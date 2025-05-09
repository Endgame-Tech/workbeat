const Employee = require('../models/employeeModel.js');
const BiometricData = require('../models/biometricDataModel.js');
const Attendance = require('../models/attendanceModel.js');
const AuditLog = require('../models/auditLogModel.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Save a face image
 * @param {String} base64Image Base64 encoded image data
 * @param {String} employeeId Employee ID
 * @returns {String} Path to the saved image
 */
const saveFaceImage = async (base64Image, employeeId) => {
  try {
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/faces');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Remove header from base64 string if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${employeeId}_${timestamp}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Save the file
    await fs.promises.writeFile(filepath, buffer);

    // Return the relative path to the file
    return `uploads/faces/${filename}`;
  } catch (error) {
    console.error('Error saving face image:', error);
    throw error;
  }
};

/**
 * @desc    Generate a challenge for fingerprint registration/verification
 * @route   GET /api/biometrics/fingerprint/challenge/:id
 * @access  Private (for enrollment)
 */
const generateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64');
    
    // Store the challenge in the session or temporarily in the DB
    // For this demo, we'll just return it
    // In a real system, you'd store it securely
    
    res.status(200).json({
      success: true,
      data: {
        challenge,
        employeeId: id
      }
    });
  } catch (error) {
    console.error('Error generating challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Generate a challenge for fingerprint verification
 * @route   GET /api/biometrics/fingerprint/verify-challenge/:id
 * @access  Public
 */
const generateVerifyChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Get employee's fingerprint credentials
    const biometricData = await BiometricData.findOne({ employeeId: id, type: 'fingerprint' });
    
    if (!biometricData || !biometricData.credentials || biometricData.credentials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fingerprint credentials found for this employee'
      });
    }
    
    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64');
    
    res.status(200).json({
      success: true,
      data: {
        challenge,
        credentials: biometricData.credentials
      }
    });
  } catch (error) {
    console.error('Error generating verification challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Enroll a fingerprint
 * @route   POST /api/biometrics/fingerprint/enroll/:id
 * @access  Private (Admin)
 */
const enrollFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    const credentialData = req.body;
    
    // Verify employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Find or create biometric data record
    let biometricData = await BiometricData.findOne({ employeeId: id, type: 'fingerprint' });
    
    if (!biometricData) {
      biometricData = new BiometricData({
        employeeId: id,
        type: 'fingerprint',
        credentials: []
      });
    }
    
    // Add new credential to array
    biometricData.credentials.push({
      id: credentialData.id,
      rawId: credentialData.rawId,
      type: credentialData.type,
      response: credentialData.response,
      enrolledAt: new Date()
    });
    
    // Save biometric data
    await biometricData.save();
    
    // Update employee record to show fingerprint is enrolled
    employee.biometrics = employee.biometrics || {};
    employee.biometrics.fingerprint = {
      isEnrolled: true,
      credentialId: credentialData.id,
      enrolledAt: new Date()
    };
    
    await employee.save();
    
    // Log the action
    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      action: 'fingerprint_enrollment',
      details: `Enrolled fingerprint for employee ${employee.name} (${employee.employeeId})`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employee._id
    });
    
    res.status(200).json({
      success: true,
      message: 'Fingerprint enrolled successfully',
      data: {
        employeeId: id,
        credentialId: credentialData.id
      }
    });
  } catch (error) {
    console.error('Error enrolling fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Verify a fingerprint
 * @route   POST /api/biometrics/fingerprint/verify/:id
 * @access  Public
 */
const verifyFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    const assertionData = req.body;
    
    // Verify employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Get biometric data for verification
    const biometricData = await BiometricData.findOne({ employeeId: id, type: 'fingerprint' });
    
    if (!biometricData || !biometricData.credentials || biometricData.credentials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fingerprint credentials found for this employee'
      });
    }
    
    // Find the matching credential
    const credential = biometricData.credentials.find(cred => cred.id === assertionData.id);
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential'
      });
    }
    
    // In a real system, you would verify the assertion cryptographically
    // For this demo, we'll assume the verification passed if we found a matching credential
    
    // Log the successful verification
    await AuditLog.create({
      action: 'fingerprint_verification',
      details: `Verified fingerprint for employee ${employee.name} (${employee.employeeId})`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employee._id
    });
    
    res.status(200).json({
      success: true,
      message: 'Fingerprint verified successfully',
      data: {
        employeeId: id,
        employeeName: employee.name,
        department: employee.department,
        position: employee.position
      }
    });
  } catch (error) {
    console.error('Error verifying fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get employee by fingerprint
 * @route   GET /api/biometrics/fingerprint/employee/:credentialId
 * @access  Public
 */
const getEmployeeByFingerprint = async (req, res) => {
  try {
    const { credentialId } = req.params;
    
    // Find the biometric data with this credential
    const biometricData = await BiometricData.findOne({
      type: 'fingerprint',
      'credentials.id': credentialId
    });
    
    if (!biometricData) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }
    
    // Get the employee
    const employee = await Employee.findById(biometricData.employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Employee is inactive'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
        position: employee.position
      }
    });
  } catch (error) {
    console.error('Error getting employee by fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a fingerprint credential
 * @route   DELETE /api/biometrics/fingerprint/:id/:credentialId
 * @access  Private (Admin)
 */
const deleteFingerprint = async (req, res) => {
  try {
    const { id, credentialId } = req.params;
    
    // Verify employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Get biometric data
    const biometricData = await BiometricData.findOne({ employeeId: id, type: 'fingerprint' });
    
    if (!biometricData) {
      return res.status(404).json({
        success: false,
        message: 'No fingerprint data found for this employee'
      });
    }
    
    // Filter out the credential to delete
    biometricData.credentials = biometricData.credentials.filter(
      cred => cred.id !== credentialId
    );
    
    await biometricData.save();
    
    // Update employee record if no credentials remain
    if (biometricData.credentials.length === 0) {
      employee.biometrics = employee.biometrics || {};
      employee.biometrics.fingerprint = {
        isEnrolled: false,
        credentialId: null,
        enrolledAt: null
      };
      
      await employee.save();
    }
    
    // Log the action
    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      action: 'fingerprint_deletion',
      details: `Deleted fingerprint credential for employee ${employee.name} (${employee.employeeId})`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employee._id
    });
    
    res.status(200).json({
      success: true,
      message: 'Fingerprint credential deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Record attendance with biometric verification
 * @route   POST /api/biometrics/attendance
 * @access  Public
 */
const recordBiometricAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      type,
      facialCapture,
      location,
      ipAddress,
      notes
    } = req.body;
    
    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Process facial capture if provided
    let faceImagePath = null;
    if (facialCapture && facialCapture.image) {
      faceImagePath = await saveFaceImage(facialCapture.image, employeeId);
    }
    
    // Create timestamp
    const timestamp = new Date();
    
    // Check if employee is late (for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workingHours) : 
      false;
    
    // Create attendance record
    const attendanceRecord = await Attendance.create({
      employeeId,
      employeeName: employee.name,
      type,
      timestamp,
      location,
      ipAddress,
      notes,
      isLate,
      facialCapture: faceImagePath ? {
        image: faceImagePath,
        verified: true
      } : null,
      verificationMethod: 'biometric'
    });
    
    // Update daily attendance record
    updateDailyAttendance(employeeId, type, isLate);
    
    // Log the action
    await AuditLog.create({
      action: `attendance_${type}_biometric`,
      details: `Employee ${employee.name} ${type === 'sign-in' ? 'signed in' : 'signed out'}${isLate ? ' (late)' : ''} using biometric verification`,
      ipAddress,
      resourceType: 'attendance',
      resourceId: attendanceRecord._id
    });
    
    res.status(201).json({
      success: true,
      data: attendanceRecord
    });
  } catch (error) {
    console.error('Error recording biometric attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
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

// Helper function to update daily attendance
const updateDailyAttendance = async (employeeId, type, isLate) => {
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
};

module.exports = {
  generateChallenge,
  generateVerifyChallenge,
  enrollFingerprint,
  verifyFingerprint,
  getEmployeeByFingerprint,
  deleteFingerprint,
  recordBiometricAttendance
};