const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotificationQueue,
  queueNotification,
  bulkQueueNotifications,
  processNotificationQueue,
  retryFailedNotifications,
  cleanupNotificationQueue,
  getNotificationQueueStats
} = require('../controllers/notificationQueueController');

// Apply authentication middleware to all routes
router.use(protect);

// Notification Queue routes
router.get('/', getNotificationQueue);
router.get('/stats', getNotificationQueueStats);
router.post('/', queueNotification);
router.post('/bulk', bulkQueueNotifications);
router.post('/process', processNotificationQueue);
router.post('/retry', retryFailedNotifications);
router.post('/cleanup', cleanupNotificationQueue);

module.exports = router;
