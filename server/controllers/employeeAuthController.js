// Complete employeeAuthController.js with all required functions
const { prisma } = require('../config/db-simple');
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

// FIXED: Improved checkIfLate function that handles all schedule formats
const checkIfLate = (currentTime, workScheduleData) => {
  console.log("Backend lateness check - Current time:", currentTime.toLocaleTimeString());
  
  // If no schedule data, cannot be late
  if (!workScheduleData) {
    console.log("Backend lateness check - No work schedule data, returning false");
    return false;
  }
  
  let startTimeStr;
  
  // Handle different formats of work schedule data
  if (typeof workScheduleData === 'string') {
    try {
      const parsedData = JSON.parse(workScheduleData);
      console.log("Backend lateness check - Parsed schedule:", JSON.stringify(parsedData));
      
      // Get current day of week
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = days[currentTime.getDay()];
      console.log("Backend lateness check - Today is:", dayOfWeek);
      
      // Format 1: {monday: {start: "09:00"}}
      if (parsedData[dayOfWeek] && parsedData[dayOfWeek].start) {
        startTimeStr = parsedData[dayOfWeek].start;
        console.log(`Backend lateness check - Found start time for ${dayOfWeek}:`, startTimeStr);
      }
      // Format 2: {days: [...], hours: {start: "09:00"}}
      else if (parsedData.days && parsedData.hours && parsedData.hours.start) {
        startTimeStr = parsedData.hours.start;
        console.log("Backend lateness check - Found start time in hours:", startTimeStr);
      }
      // Format 3: Simple {start: "09:00"}
      else if (parsedData.start) {
        startTimeStr = parsedData.start;
        console.log("Backend lateness check - Found direct start time:", startTimeStr);
      }
      else {
        // Default fallback
        startTimeStr = "09:00";
        console.log("Backend lateness check - No valid format found, using default 9:00 AM");
      }
    } catch (error) {
      console.error("Backend lateness check - Error parsing work schedule:", error);
      // Try regex extraction as fallback
      const startMatch = workScheduleData.match(/start["']?\s*:\s*["']?(\d{1,2}:\d{2})["']?/);
      if (startMatch && startMatch[1]) {
        startTimeStr = startMatch[1];
        console.log("Backend lateness check - Extracted start time with regex:", startTimeStr);
      } else {
        // Default fallback
        startTimeStr = "09:00";
        console.log("Backend lateness check - No start time found via regex, using default 9:00 AM");
      }
    }
  } 
  // If workScheduleData is already an object
  else if (typeof workScheduleData === 'object') {
    // Get current day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[currentTime.getDay()];
    
    // Direct start property
    if (workScheduleData.start) {
      startTimeStr = workScheduleData.start;
      console.log("Backend lateness check - Found start time in object:", startTimeStr);
    }
    // If there's a workingHours property with start
    else if (workScheduleData.workingHours && workScheduleData.workingHours.start) {
      startTimeStr = workScheduleData.workingHours.start;
      console.log("Backend lateness check - Found start time in workingHours:", startTimeStr);
    }
    // Day-specific schedule
    else if (workScheduleData[dayOfWeek] && workScheduleData[dayOfWeek].start) {
      startTimeStr = workScheduleData[dayOfWeek].start;
      console.log(`Backend lateness check - Found start time for ${dayOfWeek}:`, startTimeStr);
    }
    // Hours object with start
    else if (workScheduleData.hours && workScheduleData.hours.start) {
      startTimeStr = workScheduleData.hours.start;
      console.log("Backend lateness check - Found start time in hours object:", startTimeStr);
    }
    else {
      // Default fallback
      startTimeStr = "09:00";
      console.log("Backend lateness check - No start time found in object, using default 9:00 AM");
    }
  }
  
  // If no start time found after all attempts, default to 9am
  if (!startTimeStr) {
    startTimeStr = "09:00";
    console.log("Backend lateness check - No start time determined, using default 9:00 AM");
  }
  
  // Parse the start time
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    console.log("Backend lateness check - Invalid start time format:", startTimeStr);
    return false;
  }
  
  // Create scheduled start time and add grace period
  const scheduledStart = new Date(currentTime);
  scheduledStart.setHours(hours, minutes, 0, 0);
  
  // Add a 5-minute grace period
  const graceEnd = new Date(scheduledStart);
  graceEnd.setMinutes(graceEnd.getMinutes() + 5);
  
  console.log("Backend lateness check - Scheduled start:", scheduledStart.toLocaleTimeString());
  console.log("Backend lateness check - Grace period ends:", graceEnd.toLocaleTimeString());
  console.log("Backend lateness check - Actual time:", currentTime.toLocaleTimeString());
  
  // IMPORTANT: Use getTime() for accurate timestamp comparison
  const isLate = currentTime.getTime() > graceEnd.getTime();
  console.log("Backend lateness check - Is employee late?", isLate);
  
  return isLate;
};

// FIXED: Fixed recordAttendanceWithFace function
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
    let imagePath = null;
    
    // Accept either facialImage or facialCapture.image
    const imageToProcess = facialImage || (facialCapture?.image);
    
    let facialCaptureData = null;
    let verificationMethod = 'manual'; // Default to manual verification

    if (imageToProcess) {
      try {
        // Save the facial image
        imagePath = await saveBase64Image(imageToProcess, employeeId);
        
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
    
    // IMPORTANT: Check if employee is late (only for sign-in)
    // We need to make sure this is working properly
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workSchedule) : 
      false;
    
    if (type === 'sign-in') {
      console.log(`Employee ${employee.name} is ${isLate ? 'LATE' : 'ON TIME'} with type ${type}`);
    }
    
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
      isLate, // IMPORTANT: Including the lateness flag
      facialCapture: facialCaptureString, // This is now a string
      verificationMethod,
      facialVerification: !!imageToProcess, // FIXED: Using imageToProcess instead of undefined variable
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
    
    // IMPORTANT: Make sure isLate is included in the response
    res.status(201).json({
      success: true,
      data: {
        ...attendanceRecord,
        isLate // Explicitly include isLate in response
      },
      isLate // Also include at top level for backward compatibility
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

// Record attendance with biometric data
const recordAttendanceWithBiometrics = async (req, res) => {
  try {
    const { employeeId, type, notes, location, verificationMethod, organizationId } = req.body;
    
    // Check for required fields
    if (!employeeId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and type are required'
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
    
    // Create timestamp
    const timestamp = new Date();
    
    // Check if employee is late (only for sign-in)
    const isLate = type === 'sign-in' ? 
      checkIfLate(timestamp, employee.workSchedule) : 
      false;
    
    // Create attendance record
    const attendanceRecord = await prisma.attendance.create({
      data: {
        employeeId: empId,
        employeeName: employee.name,
        type,
        timestamp,
        location: location ? JSON.stringify(location) : null,
        notes: notes || "",
        isLate,
        verificationMethod: verificationMethod || 'fingerprint',
        fingerprintVerification: true,
        organizationId: parseInt(organizationId),
        ipAddress: req.ip || '127.0.0.1'
      }
    });
    
    // IMPORTANT: Make sure isLate is included in the response
    res.status(201).json({
      success: true,
      data: {
        ...attendanceRecord,
        isLate 
      },
      isLate
    });
  } catch (error) {
    console.error('Error recording attendance with biometrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
};

// Add employee face data
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
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Validate the image (basic validation)
    if (!faceImage.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format'
      });
    }
    
    // Save the image
    const imagePath = await saveBase64Image(faceImage, id);
    
    // Parse existing faceRecognition data or create new
    let faceRecognition;
    try {
      faceRecognition = employee.faceRecognition ? 
        JSON.parse(employee.faceRecognition) : 
        { faceImages: [], lastUpdated: new Date() };
    } catch (error) {
      console.error('Error parsing face recognition data:', error);
      faceRecognition = { faceImages: [], lastUpdated: new Date() };
    }
    
    // Add new face image
    faceRecognition.faceImages = faceRecognition.faceImages || [];
    faceRecognition.faceImages.push(imagePath);
    faceRecognition.lastUpdated = new Date();
    
    // Generate a unique faceId if not already present
    if (!faceRecognition.faceId) {
      faceRecognition.faceId = crypto.randomBytes(16).toString('hex');
    }
    
    // Update employee record
    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        faceRecognition: JSON.stringify(faceRecognition)
      }
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'add-face',
        details: `Face image added for employee ${employee.name} (${employee.employeeId})`,
        ipAddress: req.ip,
        resourceType: 'employee',
        resourceId: String(employee.id)
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        faceRecognition: {
          faceId: faceRecognition.faceId,
          lastUpdated: faceRecognition.lastUpdated,
          imagesCount: faceRecognition.faceImages.length
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

// Register biometric data for employee
const registerBiometricData = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type, credentials, metadata } = req.body;
    
    if (!type || !credentials) {
      return res.status(400).json({
        success: false,
        message: 'Type and credentials are required'
      });
    }
    
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Create or update biometric data
    const biometricData = await prisma.biometricData.create({
      data: {
        employeeId: parseInt(employeeId),
        type,
        credentials: JSON.stringify(credentials),
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'active'
      }
    });
    
    res.status(201).json({
      success: true,
      data: biometricData
    });
  } catch (error) {
    console.error('Error registering biometric data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get biometric data for employee
const getEmployeeBiometricData = async (req, res) => {
  try {
    const { employeeId, type } = req.params;
    
    const biometricData = await prisma.biometricData.findMany({
      where: {
        employeeId: parseInt(employeeId),
        ...(type && { type })
      }
    });
    
    res.status(200).json({
      success: true,
      data: biometricData
    });
  } catch (error) {
    console.error('Error fetching biometric data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Generate challenge for biometric verification
const generateBiometricChallenge = async (req, res) => {
  try {
    const challenge = crypto.randomBytes(32).toString('hex');
    
    res.status(200).json({
      success: true,
      data: {
        challenge,
        timestamp: new Date()
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

// Verify biometric credentials
const verifyBiometricCredentials = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type, credential, challenge } = req.body;
    
    if (!type || !credential || !challenge) {
      return res.status(400).json({
        success: false,
        message: 'Type, credential, and challenge are required'
      });
    }
    
    // Find employee and biometric data
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const biometricData = await prisma.biometricData.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        type,
        status: 'active'
      }
    });
    
    if (!biometricData) {
      return res.status(404).json({
        success: false,
        message: 'Biometric data not found'
      });
    }
    
    // In a real system, perform actual verification
    // For demo, we'll simulate verification
    const isVerified = true; // Placeholder for actual verification
    
    if (isVerified) {
      res.status(200).json({
        success: true,
        data: {
          employee: {
            id: employee.id,
            name: employee.name,
            employeeId: employee.employeeId
          },
          verified: true
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Biometric verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying biometrics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  recordAttendanceWithFace,
  recordAttendanceWithBiometrics,
  addEmployeeFace,
  registerBiometricData,
  getEmployeeBiometricData,
  generateBiometricChallenge,
  verifyBiometricCredentials,
  checkIfLate
};