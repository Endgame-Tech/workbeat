const Organization = require('../models/organizationModel.js');
const AuditLog = require('../models/auditLogModel.js');
const User = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Register a new organization
// @route   POST /api/organizations/register
// @access  Public
const registerOrganization = async (req, res) => {
  try {
    const { 
      name, 
      industry, 
      contactEmail, 
      contactPhone,
      address,
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    // Check if organization email already exists
    const existingOrg = await Organization.findOne({ contactEmail });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this email already exists'
      });
    }

    // Create organization with trial subscription
    const organization = await Organization.create({
      name,
      industry,
      contactEmail,
      contactPhone,
      address,
      subscription: {
        plan: 'free',
        startDate: Date.now(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        status: 'trial',
        maxEmployees: 10,
        features: ['basic_attendance', 'admin_dashboard']
      }
    });

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Check if admin email is already in use
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin email already in use. Please use a different email.'
      });
    }

    // Create admin user for this organization with passwordHash (not password)
    const adminUser = await User.create({
      organizationId: organization._id,
      name: adminName,
      email: adminEmail,
      passwordHash: passwordHash, // Changed from password to passwordHash
      role: 'admin',
      organizationRole: 'owner'
    });

    // Create audit log
    await AuditLog.create({
      action: 'organization_register',
      details: `Organization "${name}" registered with admin user "${adminName}"`,
      ipAddress: req.ip,
      resourceType: 'organization',
      resourceId: organization._id
    });

    // Generate token for admin user login
    const token = generateToken(adminUser._id);

    res.status(201).json({
      success: true,
      data: {
        organization: {
          id: organization._id,
          name: organization.name,
          subscription: organization.subscription
        },
        admin: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register organization',
      error: error.message
    });
  }
};

// @desc    Get organization details
// @route   GET /api/organizations/:id
// @access  Private (Admin only)
const getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    // Check if organization exists
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Check if user belongs to this organization
    if (req.user.organizationId.toString() !== organization._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization details',
      error: error.message
    });
  }
};

// @desc    Update organization details
// @route   PUT /api/organizations/:id
// @access  Private (Admin only)
const updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    // Check if organization exists
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Check if user belongs to this organization and is an admin
    if (req.user.organizationId.toString() !== organization._id.toString() || 
        !['admin', 'owner'].includes(req.user.organizationRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update organization details
    const updatedOrg = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Log the update
    await AuditLog.create({
      userId: req.user._id,
      action: 'organization_update',
      details: `Organization "${organization.name}" updated`,
      ipAddress: req.ip,
      resourceType: 'organization',
      resourceId: organization._id
    });
    
    res.status(200).json({
      success: true,
      data: updatedOrg
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error.message
    });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports = {
  registerOrganization,
  getOrganization,
  updateOrganization
};