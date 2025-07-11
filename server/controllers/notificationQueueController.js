const { prisma } = require('../config/db');

// Get notification queue
const getNotificationQueue = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { status, type, page = 1, limit = 20 } = req.query;

    const where = {
      organizationId,
      ...(status && { status }),
      ...(type && { type })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notificationQueue.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notification queue:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification queue',
      error: error.message 
    });
  }
};

// Add notification to queue
const queueNotification = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { 
      recipientEmail, 
      subject, 
      body, 
      type, 
      scheduledAt 
    } = req.body;

    // Validate required fields
    if (!recipientEmail || !subject || !body || !type) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email, subject, body, and type are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const notification = await prisma.notificationQueue.create({
      data: {
        organizationId,
        recipientEmail: recipientEmail.toLowerCase().trim(),
        subject: subject.trim(),
        body: body.trim(),
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
      }
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error queuing notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to queue notification',
      error: error.message 
    });
  }
};

// Bulk queue notifications
const bulkQueueNotifications = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notifications array is required'
      });
    }

    const validNotifications = [];
    const errors = [];

    // Validate each notification
    notifications.forEach((notification, index) => {
      const { recipientEmail, subject, body, type, scheduledAt } = notification;

      if (!recipientEmail || !subject || !body || !type) {
        errors.push({
          index,
          error: 'Missing required fields'
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        errors.push({
          index,
          error: 'Invalid email format'
        });
        return;
      }

      validNotifications.push({
        organizationId,
        recipientEmail: recipientEmail.toLowerCase().trim(),
        subject: subject.trim(),
        body: body.trim(),
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
      });
    });

    // Create valid notifications
    let createdNotifications = [];
    if (validNotifications.length > 0) {
      await prisma.notificationQueue.createMany({
        data: validNotifications
      });

      // Get the created notifications
      createdNotifications = await prisma.notificationQueue.findMany({
        where: {
          organizationId,
          createdAt: { gte: new Date(Date.now() - 1000) } // Get recently created
        },
        take: validNotifications.length,
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ 
      success: true, 
      data: {
        created: createdNotifications,
        errors,
        summary: {
          total: notifications.length,
          successful: validNotifications.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    console.error('Error bulk queuing notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk queue notifications',
      error: error.message 
    });
  }
};

// Process notification queue (mark as sent/failed)
const processNotificationQueue = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { limit = 10 } = req.query;

    // Get pending notifications
    const pendingNotifications = await prisma.notificationQueue.findMany({
      where: {
        organizationId,
        status: 'pending',
        scheduledAt: { lte: new Date() }
      },
      take: parseInt(limit),
      orderBy: { scheduledAt: 'asc' }
    });

    if (pendingNotifications.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No pending notifications to process',
        data: { processed: 0 }
      });
    }

    const results = [];

    for (const notification of pendingNotifications) {
      try {
        // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
        // For now, we'll simulate the process
        
        // Simulate email sending (replace with actual email service)
        const emailSent = await simulateEmailSending(notification);

        if (emailSent.success) {
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: 'sent',
              sentAt: new Date()
            }
          });

          results.push({
            id: notification.id,
            success: true,
            status: 'sent'
          });
        } else {
          const attempts = notification.attempts + 1;
          const maxAttempts = 3;

          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: attempts >= maxAttempts ? 'failed' : 'pending',
              attempts,
              errorMessage: emailSent.error
            }
          });

          results.push({
            id: notification.id,
            success: false,
            status: attempts >= maxAttempts ? 'failed' : 'retry',
            error: emailSent.error,
            attempts
          });
        }
      } catch (error) {
        results.push({
          id: notification.id,
          success: false,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      data: {
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    console.error('Error processing notification queue:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process notification queue',
      error: error.message 
    });
  }
};

// Simulate email sending (replace with actual email service integration)
const simulateEmailSending = async (notification) => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Simulated email service error' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Retry failed notifications
const retryFailedNotifications = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    // Get failed notifications
    const failedNotifications = await prisma.notificationQueue.findMany({
      where: {
        id: { in: notificationIds.map(id => parseInt(id)) },
        organizationId,
        status: 'failed'
      }
    });

    if (failedNotifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No failed notifications found with provided IDs'
      });
    }

    // Reset status to pending and reset attempts
    await prisma.notificationQueue.updateMany({
      where: {
        id: { in: failedNotifications.map(n => n.id) },
        organizationId
      },
      data: {
        status: 'pending',
        attempts: 0,
        errorMessage: null,
        scheduledAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      message: `${failedNotifications.length} notifications reset for retry`,
      data: { reset: failedNotifications.length }
    });
  } catch (error) {
    console.error('Error retrying failed notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retry notifications',
      error: error.message 
    });
  }
};

// Delete processed notifications
const cleanupNotificationQueue = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { olderThanDays = 30, status = 'sent' } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));

    const result = await prisma.notificationQueue.deleteMany({
      where: {
        organizationId,
        status,
        createdAt: { lt: cutoffDate }
      }
    });

    res.json({ 
      success: true, 
      message: `Cleaned up ${result.count} old notifications`,
      data: { deleted: result.count }
    });
  } catch (error) {
    console.error('Error cleaning up notification queue:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup notification queue',
      error: error.message 
    });
  }
};

// Get notification queue statistics
const getNotificationQueueStats = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const [
      totalNotifications,
      pendingCount,
      sentCount,
      failedCount,
      todaysSent,
      thisWeeksSent
    ] = await Promise.all([
      prisma.notificationQueue.count({ where: { organizationId } }),
      prisma.notificationQueue.count({ where: { organizationId, status: 'pending' } }),
      prisma.notificationQueue.count({ where: { organizationId, status: 'sent' } }),
      prisma.notificationQueue.count({ where: { organizationId, status: 'failed' } }),
      prisma.notificationQueue.count({
        where: {
          organizationId,
          status: 'sent',
          sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      prisma.notificationQueue.count({
        where: {
          organizationId,
          status: 'sent',
          sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const stats = {
      total: totalNotifications,
      pending: pendingCount,
      sent: sentCount,
      failed: failedCount,
      successRate: totalNotifications > 0 ? Math.round((sentCount / totalNotifications) * 100) : 0,
      todaysSent,
      thisWeeksSent
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching notification queue stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification queue stats',
      error: error.message 
    });
  }
};

module.exports = {
  getNotificationQueue,
  queueNotification,
  bulkQueueNotifications,
  processNotificationQueue,
  retryFailedNotifications,
  cleanupNotificationQueue,
  getNotificationQueueStats
};
