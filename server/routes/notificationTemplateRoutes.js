const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  previewNotificationTemplate,
  getTemplateVariables
} = require('../controllers/notificationTemplateController');

// Apply authentication middleware to all routes
router.use(protect);

// Notification Templates routes
router.get('/', getNotificationTemplates);
router.get('/variables', getTemplateVariables);
router.post('/', createNotificationTemplate);
router.put('/:id', updateNotificationTemplate);
router.delete('/:id', deleteNotificationTemplate);
router.post('/:id/preview', previewNotificationTemplate);

module.exports = router;
