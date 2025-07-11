const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotificationPreferences,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  bulkUpdateNotificationPreferences,
  resetNotificationPreferences,
  getOrganizationNotificationSummary
} = require('../controllers/notificationPreferenceController');

// Apply authentication middleware to all routes
router.use(protect);

// Notification Preferences routes
router.get('/', getNotificationPreferences);
router.get('/summary', getOrganizationNotificationSummary);
router.get('/user/:userId', getUserNotificationPreferences);
router.put('/user/:userId', updateNotificationPreferences);
router.put('/user/:userId/reset', resetNotificationPreferences);
router.put('/bulk', bulkUpdateNotificationPreferences);

module.exports = router;
