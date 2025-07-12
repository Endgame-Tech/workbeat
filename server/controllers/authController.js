const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { 
  asyncHandler, 
  AuthenticationError, 
  ValidationError, 
  NotFoundError,
  successResponse,
  dbOperation 
} = require('../utils/errorHandler');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // If linking to an employee, verify employee exists
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(employeeId) }
      });
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
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'employee',
        employeeId: employeeId ? parseInt(employeeId) : null
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action: 'user_register',
        details: `Registered new user: ${name} (${email}) with role: ${role || 'employee'}`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(user.id)
      }
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user.id,
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
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user with email
  const user = await dbOperation(
    () => prisma.user.findUnique({ where: { email } }),
    'Failed to find user'
  );
  
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new AuthenticationError('Account locked due to multiple failed login attempts. Please contact administrator.');
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    // Increment failed login attempts
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const isLocked = failedLoginAttempts >= 5;
    
    await dbOperation(
      () => prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts, isLocked }
      }),
      'Failed to update user login attempts'
    );

    // Log failed login attempt
    await dbOperation(
      () => prisma.auditLog.create({
        data: {
          action: 'login_failed',
          details: `Failed login attempt for user: ${email}`,
          ipAddress: req.ip,
          resourceType: 'user',
          resourceId: String(user.id)
        }
      }),
      'Failed to log login attempt'
    );

    throw new AuthenticationError('Invalid credentials');
  }

  // Reset failed login attempts on successful login
  await dbOperation(
    () => prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLogin: new Date(),
        isLocked: false
      }
    }),
    'Failed to update user login status'
  );

  // Log successful login
  await dbOperation(
    () => prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        details: `User logged in: ${user.name}`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(user.id)
      }
    }),
    'Failed to log successful login'
  );

  // Generate token
  const token = generateToken(user.id);

  // Set secure httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });

  res.json(successResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  }, 'Login successful'));
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
// Updated getCurrentUser function that ensures organizationId is included
const getCurrentUser = async (req, res) => {
  try {
    // Use prisma.user.findUnique instead of User.findById
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) },
      select: {
        id: true,
        name: true, 
        email: true,
        role: true,
        organizationRole: true,
        organizationId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get employee details if linked
    let employeeDetails = null;
    if (user.employeeId) {
      employeeDetails = await prisma.employee.findUnique({
        where: { id: parseInt(user.employeeId) }
      });
    }
    
    // Ensure organizationId is included
    let organizationId = user.organizationId;
    
    // If not, look for an organization where this user is an admin or owner
    if (!organizationId) {
      // This lookup needs to be adapted for Prisma
      // For now, let's create a simpler implementation
      const organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { users: { some: { id: user.id, organizationRole: 'admin' } } },
            { users: { some: { id: user.id, organizationRole: 'owner' } } }
          ]
        }
      });
      
      if (organization) {
        // Update the user with this organizationId for future reference
        organizationId = organization.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: organization.id }
        });
        console.log('Updated user with organizationId:', organizationId);
      }
    }
    
    // Prepare user data with organizationId included
    const userData = {
      id: user.id,
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
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with that email'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token and expiry in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });
    
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
    console.error('Forgot password error:', error);
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
    
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          gt: new Date()
        }
      }
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
    
    // Update user with new password and clear reset fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        details: `Password reset for user: ${user.email}`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(user.id)
      }
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
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
    
    // Update user with new password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_change',
        details: `Password changed for user: ${user.email}`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(user.id)
      }
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    res.status(200).json({
      success: true,
      message: 'Password updated',
      token
    });
  } catch (error) {
    console.error('Update password error:', error);
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
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: parseInt(req.user.id)
          }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Build update data object
    const fieldsToUpdate = {
      ...(name && { name }),
      ...(email && { email })
    };
    
    // Only update if there are fields to update
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fields to update'
      });
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.user.id) },
      data: fieldsToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user details',
      error: error.message
    });
  }
};

// @desc    Logout user and clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // Clear the httpOnly cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    // Log the logout event
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'logout',
          details: `User logged out: ${req.user.name}`,
          ipAddress: req.ip,
          resourceType: 'user',
          resourceId: String(req.user.id)
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
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
  logoutUser,
};