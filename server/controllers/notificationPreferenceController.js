const { prisma } = require('../config/db');

// Get notification preferences
const getNotificationPreferences = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { userId } = req.query;

    const where = {
      organizationId,
      ...(userId && { userId: parseInt(userId) })
    };

    const preferences = await prisma.notificationPreference.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification preferences',
      error: error.message 
    });
  }
};

// Get user's notification preferences
const getUserNotificationPreferences = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { userId } = req.params;

    let preference = await prisma.notificationPreference.findFirst({
      where: {
        userId: parseInt(userId),
        organizationId
      }
    });

    // Create default preferences if none exist
    if (!preference) {
      preference = await prisma.notificationPreference.create({
        data: {
          userId: parseInt(userId),
          organizationId,
          emailEnabled: true,
          lateArrivalAlerts: true,
          leaveRequestNotifications: true,
          weeklySummary: true,
          notificationTime: '09:00'
        }
      });
    }

    res.json({ success: true, data: preference });
  } catch (error) {
    console.error('Error fetching user notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user notification preferences',
      error: error.message 
    });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { userId } = req.params;
    const { 
      emailEnabled, 
      lateArrivalAlerts, 
      leaveRequestNotifications, 
      weeklySummary, 
      notificationTime 
    } = req.body;

    // Validate notification time format
    if (notificationTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notificationTime)) {
      return res.status(400).json({
        success: false,
        message: 'Notification time must be in HH:MM format'
      });
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upsert preferences
    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId: parseInt(userId)
      },
      update: {
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(lateArrivalAlerts !== undefined && { lateArrivalAlerts }),
        ...(leaveRequestNotifications !== undefined && { leaveRequestNotifications }),
        ...(weeklySummary !== undefined && { weeklySummary }),
        ...(notificationTime && { notificationTime })
      },
      create: {
        userId: parseInt(userId),
        organizationId,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        lateArrivalAlerts: lateArrivalAlerts !== undefined ? lateArrivalAlerts : true,
        leaveRequestNotifications: leaveRequestNotifications !== undefined ? leaveRequestNotifications : true,
        weeklySummary: weeklySummary !== undefined ? weeklySummary : true,
        notificationTime: notificationTime || '09:00'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({ success: true, data: preference });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification preferences',
      error: error.message 
    });
  }
};

// Bulk update notification preferences
const bulkUpdateNotificationPreferences = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];

    for (const update of updates) {
      const { userId, ...preferences } = update;

      try {
        // Validate user exists
        const user = await prisma.user.findFirst({
          where: {
            id: parseInt(userId),
            organizationId
          }
        });

        if (!user) {
          results.push({
            userId: parseInt(userId),
            success: false,
            error: 'User not found'
          });
          continue;
        }

        const preference = await prisma.notificationPreference.upsert({
          where: {
            userId: parseInt(userId)
          },
          update: preferences,
          create: {
            userId: parseInt(userId),
            organizationId,
            ...preferences
          }
        });

        results.push({
          userId: parseInt(userId),
          success: true,
          data: preference
        });
      } catch (error) {
        results.push({
          userId: parseInt(userId),
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      data: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Error bulk updating notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk update notification preferences',
      error: error.message 
    });
  }
};

// Reset user preferences to default
const resetNotificationPreferences = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const defaultPreferences = {
      emailEnabled: true,
      lateArrivalAlerts: true,
      leaveRequestNotifications: true,
      weeklySummary: true,
      notificationTime: '09:00'
    };

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId: parseInt(userId)
      },
      update: defaultPreferences,
      create: {
        userId: parseInt(userId),
        organizationId,
        ...defaultPreferences
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      data: preference,
      message: 'Notification preferences reset to default'
    });
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset notification preferences',
      error: error.message 
    });
  }
};

// Get organization-wide notification settings summary
const getOrganizationNotificationSummary = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const [
      totalUsers,
      usersWithPreferences,
      emailEnabledCount,
      lateArrivalAlertsCount,
      leaveNotificationsCount,
      weeklySummaryCount
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.notificationPreference.count({ where: { organizationId } }),
      prisma.notificationPreference.count({ 
        where: { organizationId, emailEnabled: true } 
      }),
      prisma.notificationPreference.count({ 
        where: { organizationId, lateArrivalAlerts: true } 
      }),
      prisma.notificationPreference.count({ 
        where: { organizationId, leaveRequestNotifications: true } 
      }),
      prisma.notificationPreference.count({ 
        where: { organizationId, weeklySummary: true } 
      })
    ]);

    const summary = {
      totalUsers,
      usersWithPreferences,
      usersWithoutPreferences: totalUsers - usersWithPreferences,
      preferencesSummary: {
        emailEnabled: {
          count: emailEnabledCount,
          percentage: Math.round((emailEnabledCount / Math.max(usersWithPreferences, 1)) * 100)
        },
        lateArrivalAlerts: {
          count: lateArrivalAlertsCount,
          percentage: Math.round((lateArrivalAlertsCount / Math.max(usersWithPreferences, 1)) * 100)
        },
        leaveRequestNotifications: {
          count: leaveNotificationsCount,
          percentage: Math.round((leaveNotificationsCount / Math.max(usersWithPreferences, 1)) * 100)
        },
        weeklySummary: {
          count: weeklySummaryCount,
          percentage: Math.round((weeklySummaryCount / Math.max(usersWithPreferences, 1)) * 100)
        }
      }
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching organization notification summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch organization notification summary',
      error: error.message 
    });
  }
};

module.exports = {
  getNotificationPreferences,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  bulkUpdateNotificationPreferences,
  resetNotificationPreferences,
  getOrganizationNotificationSummary
};
