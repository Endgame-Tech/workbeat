const express = require('express');
const {
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
} = require('../controllers/organizationController.js');
const { protect, authorize } = require('../middleware/authMiddleware.js');
const { validate, validateParams, paramSchemas } = require('../middleware/validation.js');
const { registerLimiter, reportLimiter, uploadLimiter } = require('../middleware/rateLimiter.js');
const { resolveOrganization } = require('../utils/organizationUtils.js');
const { prisma } = require('../config/db');

const router = express.Router();

// Public routes with rate limiting and validation
router.post('/register', registerLimiter, validate('organizationRegister'), registerOrganization);

// Protected routes - now using organization names instead of IDs
router.get('/:orgIdentifier', protect, resolveOrganization('orgIdentifier'), getOrganization);
router.put('/:orgIdentifier', protect, resolveOrganization('orgIdentifier'), validate('organizationUpdate'), updateOrganization);

// Settings routes
router.get('/:orgIdentifier/settings', protect, resolveOrganization('orgIdentifier'), getOrganizationSettings);
router.put('/:orgIdentifier/settings', protect, resolveOrganization('orgIdentifier'), updateOrganizationSettings);
router.post('/:orgIdentifier/settings/reset', protect, resolveOrganization('orgIdentifier'), resetOrganizationSettings);

// Data export routes
router.get('/:orgIdentifier/export', protect, resolveOrganization('orgIdentifier'), exportOrganizationData);

// Audit log routes
router.get('/:orgIdentifier/audit-logs', protect, resolveOrganization('orgIdentifier'), getOrganizationAuditLogs);

// Subscription routes
router.get('/:orgIdentifier/subscription', protect, resolveOrganization('orgIdentifier'), getOrganizationSubscription);
router.put('/:orgIdentifier/subscription', protect, resolveOrganization('orgIdentifier'), updateOrganizationSubscription);

// User management routes
router.get('/:orgIdentifier/users', protect, resolveOrganization('orgIdentifier'), getOrganizationUsers);
router.post('/:orgIdentifier/users', protect, resolveOrganization('orgIdentifier'), addOrganizationUser);
router.put('/:orgIdentifier/users/:userId', protect, resolveOrganization('orgIdentifier'), updateOrganizationUser);
router.delete('/:orgIdentifier/users/:userId', protect, resolveOrganization('orgIdentifier'), removeOrganizationUser);

// Holiday calendar routes
router.get('/:orgIdentifier/holidays', protect, resolveOrganization('orgIdentifier'), getOrganizationHolidays);
router.put('/:orgIdentifier/holidays', protect, resolveOrganization('orgIdentifier'), updateOrganizationHolidays);

// Statistics routes
router.get('/:orgIdentifier/stats', protect, resolveOrganization('orgIdentifier'), getOrganizationStats);

// Department Routes

// Get all departments for an organization
router.get('/:orgIdentifier/departments', protect, resolveOrganization('orgIdentifier'), async (req, res) => {
  try {
    const organizationId = req.organizationId;
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const departments = await prisma.department.findMany({
      where: { organizationId: organizationId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// Create a new department
router.post('/:orgIdentifier/departments', protect, resolveOrganization('orgIdentifier'), async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { name, description } = req.body;

        if (req.user.organizationId !== organizationId || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const existingDepartment = await prisma.department.findFirst({
            where: { organizationId: organizationId, name: name.trim(), isActive: true }
        });

        if (existingDepartment) {
            return res.status(400).json({ success: false, message: 'Department already exists' });
        }

        const department = await prisma.department.create({
            data: { name: name.trim(), description: description?.trim() || null, organizationId: organizationId, isActive: true }
        });

        res.status(201).json({ success: true, data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create department' });
    }
});

module.exports = router;
