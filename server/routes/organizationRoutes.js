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

const router = express.Router();

// Public routes with rate limiting and validation
router.post('/register', registerLimiter, validate('organizationRegister'), registerOrganization);

// Protected routes
router.get('/:id', protect, validateParams(paramSchemas.organizationId), getOrganization);
router.put('/:id', protect, validateParams(paramSchemas.organizationId), validate('organizationUpdate'), updateOrganization);

// Settings routes
router.get('/:id/settings', protect, validateParams(paramSchemas.organizationId), getOrganizationSettings);
router.put('/:id/settings', protect, validateParams(paramSchemas.organizationId), updateOrganizationSettings);
router.post('/:id/settings/reset', protect, validateParams(paramSchemas.organizationId), resetOrganizationSettings);

// Data export routes
router.get('/:id/export', protect, validateParams(paramSchemas.organizationId), exportOrganizationData);

// Audit log routes
router.get('/:id/audit-logs', protect, validateParams(paramSchemas.organizationId), getOrganizationAuditLogs);

// Subscription routes
router.get('/:id/subscription', protect, validateParams(paramSchemas.organizationId), getOrganizationSubscription);
router.put('/:id/subscription', protect, validateParams(paramSchemas.organizationId), updateOrganizationSubscription);

// User management routes
router.get('/:id/users', protect, validateParams(paramSchemas.organizationId), getOrganizationUsers);
router.post('/:id/users', protect, validateParams(paramSchemas.organizationId), addOrganizationUser);
router.put('/:id/users/:userId', protect, validateParams(paramSchemas.organizationId), updateOrganizationUser);
router.delete('/:id/users/:userId', protect, validateParams(paramSchemas.organizationId), removeOrganizationUser);

// Holiday calendar routes
router.get('/:id/holidays', protect, validateParams(paramSchemas.organizationId), getOrganizationHolidays);
router.put('/:id/holidays', protect, validateParams(paramSchemas.organizationId), updateOrganizationHolidays);

// Statistics routes
router.get('/:id/stats', protect, validateParams(paramSchemas.organizationId), getOrganizationStats);

module.exports = router;