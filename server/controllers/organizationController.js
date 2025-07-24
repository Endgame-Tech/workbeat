const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET is required for token generation');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new organization
// @route   POST /api/organizations/register
// @access  Public
const registerOrganization = async (req, res) => {
  try {
    console.log('🔍 Organization registration attempt:', {
      hasName: !!req.body.name,
      hasIndustry: !!req.body.industry,
      hasContactEmail: !!req.body.contactEmail,
      hasContactPhone: !!req.body.contactPhone,
      hasAddress: !!req.body.address,
      addressType: typeof req.body.address,
      hasAdminName: !!req.body.adminName,
      hasAdminEmail: !!req.body.adminEmail,
      hasAdminPassword: !!req.body.adminPassword,
      bodyKeys: Object.keys(req.body)
    });
    
    const { 
      name, 
      industry, 
      contactEmail, 
      contactPhone,
      address,
      adminName,
      adminEmail,
      adminPassword,
      selectedPlan = 'free',
      skipSubscriptionSetup = false
    } = req.body;
    
    // Check if organization email already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { contactEmail }
    });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this email already exists'
      });
    }
    
    // Determine subscription setup based on plan selection
    let subscriptionData;
    if (selectedPlan === 'free') {
      // Create free trial subscription
      subscriptionData = JSON.stringify({
        plan: 'free',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        status: 'trial',
        maxEmployees: 7,
        features: ['basicAttendance', 'employeeManagement', 'emailSupport']
      });
    } else {
      // For paid plans, create pending subscription (will be activated after payment)
      subscriptionData = JSON.stringify({
        plan: selectedPlan,
        startDate: new Date().toISOString(),
        endDate: null,
        status: skipSubscriptionSetup ? 'pending_payment' : 'pending',
        maxEmployees: 7, // Will be updated after payment
        features: ['basicAttendance', 'employeeManagement', 'emailSupport']
      });
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        industry,
        contactEmail,
        contactPhone,
        address: typeof address === 'object' ? JSON.stringify(address) : address,
        subscription: subscriptionData,
        subscriptionStatus: selectedPlan === 'free' ? 'trial' : 'pending'
      }
    });

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Check if admin email is already in use
    const existingUser = await prisma.user.findUnique({ 
      where: { email: adminEmail }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin email already in use. Please use a different email.'
      });
    }
    
    // Create admin user for this organization with passwordHash (not password)
    const adminUser = await prisma.user.create({
      data: {
        organizationId: organization.id,
        name: adminName,
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'admin',
        organizationRole: 'owner'
      }
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'organization_register',
        details: `Organization "${name}" registered with admin user "${adminName}"`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organization.id)
      }
    });

    // Generate token for admin user login
    const token = generateToken(adminUser.id);
    
    res.status(201).json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          subscription: JSON.parse(organization.subscription)
        },
        admin: {
          id: adminUser.id,
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
// @access  Private
const getOrganization = async (req, res) => {
  try {
    // Handle both old route format (/organizations/:id) and new format (/organizations/:orgIdentifier)
    const organizationId = req.organizationId || parseInt(req.params.id) || parseInt(req.params.orgIdentifier);
    
    if (!organizationId || isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid organization ID is required'
      });
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    // Check if organization exists
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organization.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Parse JSON fields for response
    let parsedOrganization = { ...organization };
    try {
      if (organization.settings) {
        parsedOrganization.settings = JSON.parse(organization.settings);
      }
      if (organization.subscription) {
        parsedOrganization.subscription = JSON.parse(organization.subscription);
      }
    } catch (parseError) {
      console.error('Error parsing organization JSON fields:', parseError);
    }
    
    res.status(200).json({
      success: true,
      data: parsedOrganization
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
// @access  Private
const updateOrganization = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    // Check if organization exists
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Prepare data for update
    const updateData = { ...req.body };
    
    // Handle JSON fields
    if (updateData.settings && typeof updateData.settings === 'object') {
      updateData.settings = JSON.stringify(updateData.settings);
    }
    if (updateData.subscription && typeof updateData.subscription === 'object') {
      updateData.subscription = JSON.stringify(updateData.subscription);
    }
    if (updateData.address && typeof updateData.address === 'object') {
      updateData.address = JSON.stringify(updateData.address);
    }
    
    // Update organization details
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    });
      // Log the update
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'organization_update',
        details: `Organization "${organization.name}" updated`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organization.id)
      }
    });
    
    // Parse JSON fields for response
    let parsedResponse = { ...updatedOrg };
    try {
      if (updatedOrg.settings) {
        parsedResponse.settings = JSON.parse(updatedOrg.settings);
      }
      if (updatedOrg.subscription) {
        parsedResponse.subscription = JSON.parse(updatedOrg.subscription);
      }
      if (updatedOrg.address && typeof updatedOrg.address === 'string') {
        try {
          parsedResponse.address = JSON.parse(updatedOrg.address);
        } catch {
          // Keep as string if not valid JSON
        }
      }
    } catch (parseError) {
      console.error('Error parsing response JSON fields:', parseError);
    }
    
    res.status(200).json({
      success: true,
      data: parsedResponse
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

// @desc    Get organization settings
// @route   GET /api/organizations/:id/settings
// @access  Private
const getOrganizationSettings = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        settings: true,
        subscription: true
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Parse JSON fields
    let settings = {};
    let subscription = {};
    
    try {
      settings = organization.settings ? JSON.parse(organization.settings) : {};
      subscription = organization.subscription ? JSON.parse(organization.subscription) : {};
    } catch (parseError) {
      console.error('Error parsing organization JSON fields:', parseError);
    }

    res.json({
      success: true,
      data: {
        ...organization,
        settings,
        subscription
      }
    });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization settings'
    });
  }
};

// @desc    Update organization settings
// @route   PUT /api/organizations/:id/settings
// @access  Private
const updateOrganizationSettings = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Merge existing settings with new settings
    let existingSettings = {};
    try {
      existingSettings = organization.settings ? JSON.parse(organization.settings) : {};
    } catch (parseError) {
      console.error('Error parsing existing settings:', parseError);
    }

    // Deep merge settings
    const mergedSettings = deepMerge(existingSettings, req.body);

    // Update organization settings
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: JSON.stringify(mergedSettings)
      }
    });

    // Log the settings update
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'settings_update',
        details: `Organization settings updated`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organizationId)
      }
    });

    // Parse settings for response
    let responseSettings = {};
    try {
      responseSettings = JSON.parse(updatedOrg.settings || '{}');
    } catch (parseError) {
      responseSettings = {};
    }

    res.json({
      success: true,
      data: {
        ...updatedOrg,
        settings: responseSettings
      },
      message: 'Organization settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization settings'
    });
  }
};

// @desc    Reset organization settings to defaults
// @route   POST /api/organizations/:id/settings/reset
// @access  Private
const resetOrganizationSettings = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Default settings
    const defaultSettings = {
      workingHours: {
        default: {
          start: '09:00',
          end: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00'
        }
      },
      attendancePolicy: {
        gracePeriodsMinutes: 15,
        lateThresholdMinutes: 30,
        earlyDepartureMinutes: 30,
        minimumHoursPerDay: 8,
        maximumHoursPerDay: 12,
        overtimeThresholdHours: 8,
        requiresApprovalForOvertime: true,
        allowEarlyDeparture: false,
        strictWorkingHours: false,
        autoMarkLateAfterMinutes: 30
      },
      biometricRequirements: {
        requireFingerprint: false,
        requireFacial: false
      },
      security: {
        ipWhitelistEnabled: false,
        allowedIPs: [],
        geofencingEnabled: false,
        geofenceRadius: 100,
        sessionTimeoutMinutes: 480,
        maxConcurrentSessions: 2,
        requirePasswordChange: false,
        passwordExpiryDays: 90,
        twoFactorRequired: false
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        lateArrivalAlerts: true,
        absenceAlerts: true,
        overtimeAlerts: true,
        leaveRequestAlerts: true,
        systemMaintenanceAlerts: true,
        weeklyReports: false,
        monthlyReports: false,
        customReports: false
      },
      localization: {
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12',
        currency: 'USD',
        weekStartDay: 'monday'
      },
      appearance: {
        logoUrl: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E3A8A',
        darkModeEnabled: true,
        customBranding: false
      }
    };

    // Update organization with default settings
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: JSON.stringify(defaultSettings)
      }
    });

    // Log the settings reset
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'settings_reset',
        details: `Organization settings reset to defaults`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organizationId)
      }
    });

    res.json({
      success: true,
      data: {
        ...updatedOrg,
        settings: defaultSettings
      },
      message: 'Organization settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting organization settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset organization settings'
    });
  }
};

// @desc    Export organization data
// @route   GET /api/organizations/:id/export
// @access  Private
const exportOrganizationData = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { format = 'json' } = req.query;
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Fetch organization data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
            employeeId: true,
            startDate: true
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Parse JSON fields
    let settings = {};
    let subscription = {};
    
    try {
      settings = organization.settings ? JSON.parse(organization.settings) : {};
      subscription = organization.subscription ? JSON.parse(organization.subscription) : {};
    } catch (parseError) {
      settings = {};
      subscription = {};
    }

    const exportData = {
      organization: {
        ...organization,
        settings,
        subscription
      },
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.email,
        format
      }
    };

    // Log the export
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'data_export',
        details: `Organization data exported in ${format} format`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organizationId)
      }
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="organization-${organizationId}-export.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      // Simple CSV export for employees
      const csvData = [
        ['Employee ID', 'Name', 'Email', 'Department', 'Position', 'Start Date'],
        ...organization.employees.map(emp => [
          emp.employeeId,
          emp.name,
          emp.email,
          emp.department || '',
          emp.position || '',
          emp.startDate ? new Date(emp.startDate).toLocaleDateString() : ''
        ])
      ];
      
      const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="organization-${organizationId}-employees.csv"`);
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use json or csv.'
      });
    }
  } catch (error) {
    console.error('Error exporting organization data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export organization data'
    });
  }
};

// @desc    Get organization audit logs
// @route   GET /api/organizations/:id/audit-logs
// @access  Private
const getOrganizationAuditLogs = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { limit = 50, offset = 0 } = req.query;
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: {
          in: await prisma.user.findMany({
            where: { organizationId },
            select: { id: true }
          }).then(users => users.map(u => u.id))
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.auditLog.count({
      where: {
        userId: {
          in: await prisma.user.findMany({
            where: { organizationId },
            select: { id: true }
          }).then(users => users.map(u => u.id))
        }
      }
    });

    res.json({
      success: true,
      data: {
        logs: auditLogs,
        totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

// Helper function for deep merging objects
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// @desc    Get organization subscription details
// @route   GET /api/organizations/:id/subscription
// @access  Private
const getOrganizationSubscription = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        subscription: true
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Parse subscription JSON
    let subscription = {};
    try {
      subscription = organization.subscription ? JSON.parse(organization.subscription) : {};
    } catch (parseError) {
      console.error('Error parsing subscription:', parseError);
      subscription = {};
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching organization subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization subscription'
    });
  }
};

// @desc    Update organization subscription
// @route   PUT /api/organizations/:id/subscription
// @access  Private
const updateOrganizationSubscription = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update subscription
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscription: JSON.stringify(req.body)
      }
    });

    // Log the subscription update
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'subscription_update',
        details: `Organization subscription updated`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organizationId)
      }
    });

    res.json({
      success: true,
      data: req.body,
      message: 'Organization subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization subscription'
    });
  }
};

// @desc    Get organization users
// @route   GET /api/organizations/:id/users
// @access  Private
const getOrganizationUsers = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationRole: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization users'
    });
  }
};

// @desc    Add user to organization
// @route   POST /api/organizations/:id/users
// @access  Private
const addOrganizationUser = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { name, email, role, organizationRole, password } = req.body;
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        organizationId,
        name,
        email,
        passwordHash,
        role,
        organizationRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationRole: true,
        isActive: true,
        createdAt: true
      }
    });

    // Log the user creation
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'user_create',
        details: `User "${name}" added to organization`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(user.id)
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User added successfully'
    });
  } catch (error) {
    console.error('Error adding organization user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add organization user'
    });
  }
};

// @desc    Update organization user
// @route   PUT /api/organizations/:id/users/:userId
// @access  Private
const updateOrganizationUser = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId 
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.organizationRole !== undefined) updateData.organizationRole = req.body.organizationRole;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationRole: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log the user update
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'user_update',
        details: `User "${user.name}" updated`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(userId)
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization user'
    });
  }
};

// @desc    Remove user from organization
// @route   DELETE /api/organizations/:id/users/:userId
// @access  Private
const removeOrganizationUser = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId 
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the last admin/owner
    if (existingUser.organizationRole === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove organization owner'
      });
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Log the user removal
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'user_remove',
        details: `User "${existingUser.name}" removed from organization`,
        ipAddress: req.ip,
        resourceType: 'user',
        resourceId: String(userId)
      }
    });

    res.json({
      success: true,
      message: 'User removed successfully'
    });
  } catch (error) {
    console.error('Error removing organization user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove organization user'
    });
  }
};

// @desc    Get organization holiday calendar
// @route   GET /api/organizations/:id/holidays
// @access  Private
const getOrganizationHolidays = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { year } = req.query;
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For now, return default holidays until we implement the holiday table
    const defaultHolidays = [
      {
        id: 1,
        name: 'New Year\'s Day',
        date: '2024-01-01',
        type: 'public',
        isRecurring: true
      },
      {
        id: 2,
        name: 'Independence Day',
        date: '2024-07-04',
        type: 'public',
        isRecurring: true
      },
      {
        id: 3,
        name: 'Christmas Day',
        date: '2024-12-25',
        type: 'public',
        isRecurring: true
      }
    ];

    res.json({
      success: true,
      data: defaultHolidays
    });
  } catch (error) {
    console.error('Error fetching organization holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization holidays'
    });
  }
};

// @desc    Update organization holiday calendar
// @route   PUT /api/organizations/:id/holidays
// @access  Private
const updateOrganizationHolidays = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { holidays } = req.body;
    
    // Check if user belongs to this organization and is admin
    if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // For now, just return the holidays back as we don't have a holiday table yet
    // In a real implementation, you would save these to a holiday table
    
    // Log the holiday update
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'holidays_update',
        details: `Organization holiday calendar updated`,
        ipAddress: req.ip,
        resourceType: 'organization',
        resourceId: String(organizationId)
      }
    });

    res.json({
      success: true,
      data: holidays,
      message: 'Holiday calendar updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization holidays'
    });
  }
};

// @desc    Get organization statistics
// @route   GET /api/organizations/:id/stats
// @access  Private
const getOrganizationStats = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    // Check if user belongs to this organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get basic organization stats
    const [totalUsers, totalEmployees, totalAttendanceRecords] = await Promise.all([
      prisma.user.count({
        where: { organizationId, isActive: true }
      }),
      prisma.employee.count({
        where: { organizationId, isActive: true }
      }),
      prisma.attendance.count({
        where: { organizationId }
      })
    ]);

    const stats = {
      totalUsers,
      totalEmployees,
      totalAttendanceRecords,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization stats'
    });
  }
};

module.exports = {
  registerOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
  resetOrganizationSettings,
  exportOrganizationData,
  getOrganizationAuditLogs,
  getOrganizationSubscription,
  updateOrganizationSubscription,
  getOrganizationUsers,
  addOrganizationUser,
  updateOrganizationUser,
  removeOrganizationUser,
  getOrganizationHolidays,
  updateOrganizationHolidays,
  getOrganizationStats
};