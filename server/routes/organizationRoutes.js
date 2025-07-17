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

const router = express.Router();

// Public routes with rate limiting and validation
router.post('/register', registerLimiter, validate('organizationRegister'), registerOrganization);

// Protected routes - now using organization names instead of IDs
router.get('/:orgName', protect, resolveOrganization('orgName'), getOrganization);
router.put('/:orgName', protect, resolveOrganization('orgName'), validate('organizationUpdate'), updateOrganization);

// Settings routes
router.get('/:orgName/settings', protect, resolveOrganization('orgName'), getOrganizationSettings);
router.put('/:orgName/settings', protect, resolveOrganization('orgName'), updateOrganizationSettings);
router.post('/:orgName/settings/reset', protect, resolveOrganization('orgName'), resetOrganizationSettings);

// Data export routes
router.get('/:orgName/export', protect, resolveOrganization('orgName'), exportOrganizationData);

// Audit log routes
router.get('/:orgName/audit-logs', protect, resolveOrganization('orgName'), getOrganizationAuditLogs);

// Subscription routes
router.get('/:orgName/subscription', protect, resolveOrganization('orgName'), getOrganizationSubscription);
router.put('/:orgName/subscription', protect, resolveOrganization('orgName'), updateOrganizationSubscription);

// User management routes
router.get('/:orgName/users', protect, resolveOrganization('orgName'), getOrganizationUsers);
router.post('/:orgName/users', protect, resolveOrganization('orgName'), addOrganizationUser);
router.put('/:orgName/users/:userId', protect, resolveOrganization('orgName'), updateOrganizationUser);
router.delete('/:orgName/users/:userId', protect, resolveOrganization('orgName'), removeOrganizationUser);

// Holiday calendar routes
router.get('/:orgName/holidays', protect, resolveOrganization('orgName'), getOrganizationHolidays);
router.put('/:orgName/holidays', protect, resolveOrganization('orgName'), updateOrganizationHolidays);

// Statistics routes
router.get('/:orgName/stats', protect, resolveOrganization('orgName'), getOrganizationStats);

module.exports = router;