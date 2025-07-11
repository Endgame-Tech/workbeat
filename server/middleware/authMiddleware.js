// Updated authMiddleware.js with Prisma
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies first (secure httpOnly), then fallback to headers for backward compatibility
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Fallback to header for backward compatibility
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (excluding password)
      const user = await prisma.user.findUnique({
        where: { id: parseInt(decoded.id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          organizationRole: true,
          employeeId: true,
          lastLogin: true,
          isLocked: true,
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Check if user has organizationId
      if (!user.organizationId) {
        console.warn(`User ${user.id} (${user.email}) has no organizationId`);
        
        // Try to find organization for this user using Prisma
        const organization = await prisma.organization.findFirst({
          where: {
            OR: [
              { ownerId: user.id },
              { adminUserIds: { has: user.id } }
            ]
          }
        });
        
        if (organization) {
          // Update user with organizationId using Prisma
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: organization.id }
          });
          user.organizationId = organization.id;
          console.log(`Updated user ${user.id} with organizationId ${organization.id}`);
        } else {
          console.warn(`No organization found for user ${user.id}`);
        }
      }

      // Set user in request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// New middleware to check organization access
const validateOrganizationAccess = async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Organization ID not found in user profile'
      });
    }
    
    // If accessing a specific organization by ID
    if (req.params.id) {
      // Only allow access if the organization ID matches the user's organization
      if (req.params.id !== req.user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this organization'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Organization access validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating organization access'
    });
  }
};

module.exports = { protect, authorize, validateOrganizationAccess };