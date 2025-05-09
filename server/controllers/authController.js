const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const AuditLog = require('../models/auditLogModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
// Fixed registerUser function
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // If linking to an employee, verify employee exists
    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with passwordHash (not password)
    const user = await User.create({
      name,
      email,
      passwordHash, // Changed from password to passwordHash
      role: role || 'employee',
      employeeId: employeeId || null
    });

    // Log the action
    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      action: 'user_register',
      details: `Registered new user: ${name} (${email}) with role: ${role || 'employee'}`,
      ipAddress: req.ip,
      resourceType: 'user',
      resourceId: user._id
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// Fixed loginUser function with corrected organization variable name
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user with email
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account locked due to multiple failed login attempts. Please contact administrator.'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 50) {
        user.isLocked = true;
      }
      
      await user.save();

      // Log failed login attempt
      await AuditLog.create({
        action: 'login_failed',
        details: `Failed login attempt for user: ${email}`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: user._id
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await AuditLog.create({
      userId: user._id,
      action: 'login',
      details: `User logged in: ${user.name}`,
      ipAddress: req.ip,
      resourceType: 'user',
      resourceId: user._id
    });

    // Find organization ID for this user
    let organizationId = null;
    
    // First, check if organizationId is directly on the user
    if (user.organizationId) {
      organizationId = user.organizationId;
      console.log('Found organizationId on user:', organizationId);
    } 
    // If not, look for the organization where this user is an admin/owner
    else {
      // FIXED: changed "organization" to "Organization" (capital 'O')
      const organization = await Organization.findOne({
        $or: [
          { adminUsers: user._id },
          { owner: user._id }
        ]
      });
      
      if (organization) {
        organizationId = organization._id;
        console.log('Found organizationId from organization:', organizationId);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    // Log entire response for debugging
    const responseData = {
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: organizationId // Include the organization ID in the response
      }
    };
    
    console.log('Login response being sent:', JSON.stringify(responseData));

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
// Updated getCurrentUser function that ensures organizationId is included
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    // Get employee details if linked
    let employeeDetails = null;
    if (user.employeeId) {
      employeeDetails = await Employee.findById(user.employeeId);
    }
    
    // Ensure organizationId is included
    let organizationId = null;
    
    // Check if user already has an organizationId
    if (user.organizationId) {
      organizationId = user.organizationId;
    } 
    // If not, look for an organization where this user is an admin or owner
    else {
      const organization = await Organization.findOne({
        $or: [
          { adminUsers: user._id },
          { owner: user._id }
        ]
      });
      
      if (organization) {
        // Update the user with this organizationId for future reference
        organizationId = organization._id;
        user.organizationId = organizationId;
        await user.save();
        console.log('Updated user with organizationId:', organizationId);
      }
    }
    
    // Prepare user data with organizationId included
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationRole: user.organizationRole,
      organizationId: organizationId, // Always include organizationId
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({
      success: true,
      data: {
        user: userData,
        employee: employeeDetails
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with that email'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // In a real environment, send an email with the token
    // For this demo, just return the token directly
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      data: {
        resetToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(req.body.password, salt);
    
    // Set new passwordHash (not password)
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: user._id,
      action: 'password_reset',
      details: `Password reset for user: ${user.email}`,
      ipAddress: req.ip,
      resourceType: 'user',
      resourceId: user._id
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Fixed updatePassword function
const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+passwordHash');
    
    // Check current password
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(req.body.newPassword, salt);
    
    // Set new passwordHash (not password)
    user.passwordHash = passwordHash;
    await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: user._id,
      action: 'password_change',
      details: `Password changed for user: ${user.email}`,
      ipAddress: req.ip,
      resourceType: 'user',
      resourceId: user._id
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Password updated',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email would cause conflict
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    const fieldsToUpdate = {
      name: name || undefined,
      email: email || undefined
    };
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user details',
      error: error.message
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateDetails,
};