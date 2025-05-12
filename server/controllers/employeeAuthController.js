const { prisma } = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path'); 

// Helper function to save a base64 image
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
      
      // Create directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../uploads/faces');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, filename);
      
      // Write file to disk
      await fs.promises.writeFile(filePath, buffer);
      
      // Return the relative URL to the file
      return `/uploads/faces/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image data');
    }
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

module.exports = { saveBase64Image };



const recordAttendanceWithFace = async (req, res) => {
  try {
    const { 
      employeeId, 
      type,
      facialImage,
      facialCapture,
      location, 
      notes,
      organizationId
    } = req.body;

    console.log('Received attendance request:', {
      employeeId,
      type,
      hasFacialImage: !!facialImage,
      hasFacialCapture: !!facialCapture,
      location,
      notes,
      organizationId
    });

    // Validate required fields
    if (!employeeId || !type || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, type, and organizationId are required'
      });
    }

    // Parse employeeId as integer
    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employeeId: must be a number'
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
    const employee = await prisma.employee.findUnique({
      where: { id: empId }
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Process the facial image if provided
    let capturedImage = null;
    
    // Accept either facialImage or facialCapture.image
    if (facialImage) {
      capturedImage = facialImage;
    } else if (facialCapture?.image) {
      capturedImage = facialCapture.image;
    }
    
    let facialCaptureData = null;
    let verificationMethod = 'manual'; // Default to manual verification

    if (capturedImage) {
      try {
        // Save the facial image
        const imagePath = await saveBase64Image(capturedImage, employeeId);
        
        // In a real system, you would integrate with a facial recognition API here
        // For demo purposes, we'll simulate a match score
        const matchScore = Math.random() * 100; // 0-100 score
        const verified = matchScore > 80; // Threshold for verification
        
        facialCaptureData = {
          image: imagePath,
          matchScore,
          verified
        };
        
        verificationMethod = verified ? 'face-recognition' : 'manual';
      } catch (imageError) {
        console.error('Error processing facial image:', imageError);
        // Continue with manual verification
        verificationMethod = 'manual';
      }
    }

    // Create timestamp
    const timestamp = new Date();
    
    // Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workSchedule ? JSON.parse(employee.workSchedule) : null) : 
      false;
    
    // Convert location object to JSON string if it exists
    const locationString = location ? JSON.stringify(location) : null;
    
    // Convert facialCaptureData to JSON string if it exists
    const facialCaptureString = facialCaptureData ? JSON.stringify(facialCaptureData) : null;
    
    // Data object to create attendance record
    const attendanceData = {
      employeeId: empId,
      employeeName: employee.name,
      organizationId: parseInt(organizationId),
      type,
      timestamp,
      location: locationString, // This is now a string
      notes: notes || "",
      isLate,
      facialCapture: facialCaptureString, // This is now a string
      verificationMethod,
      facialVerification: capturedImage ? true : false,
      ipAddress: req.ip || '127.0.0.1'
    };
    
    console.log('Creating attendance with data:', {
      ...attendanceData,
      facialCapture: attendanceData.facialCapture ? '[DATA]' : null
    });
    
    // Create the attendance record
    const attendanceRecord = await prisma.attendance.create({
      data: attendanceData
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
  async function updateDailyAttendance(employeeId, organizationId, type, isLate, timestamp, notes) {
  try {
    // Get today's date (without time)
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);
    
    // Find or create daily attendance record using Prisma
    let dailyRecord = await prisma.dailyAttendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        organizationId: parseInt(organizationId),
        date: today
      }
    });
    
    const now = new Date(timestamp);
    
    if (!dailyRecord) {
      // Create new daily record
      dailyRecord = await prisma.dailyAttendance.create({
        data: {
          employeeId: parseInt(employeeId),
          organizationId: parseInt(organizationId),
          date: today,
          status: type === 'sign-in' ? (isLate ? 'late' : 'present') : 'absent', // Default to absent if first record is sign-out
          signInTime: type === 'sign-in' ? now : null,
          signOutTime: type === 'sign-out' ? now : null,
          notes: notes || null
        }
      });
    } else {
      // Update existing record
      let updateData = {};
      
      if (type === 'sign-in') {
        updateData.signInTime = now;
        updateData.status = isLate ? 'late' : 'present';
      } else if (type === 'sign-out') {
        updateData.signOutTime = now;
        
        // Calculate work duration if sign-in time exists
        if (dailyRecord.signInTime) {
          const durationMs = now.getTime() - new Date(dailyRecord.signInTime).getTime();
          updateData.workDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
          
          // Update status based on work duration (e.g., half-day if less than 4 hours)
          if (updateData.workDuration < 240) { // Less than 4 hours
            updateData.status = 'half-day';
          }
        }
      }
      
      // Add notes if provided
      if (notes) {
        updateData.notes = dailyRecord.notes 
          ? `${dailyRecord.notes}; ${notes}` 
          : notes;
      }
      
      // Update the record
      await prisma.dailyAttendance.update({
        where: { id: dailyRecord.id },
        data: updateData
      });
    }
    
    return dailyRecord;
  } catch (error) {
    console.error('Error updating daily attendance:', error);
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