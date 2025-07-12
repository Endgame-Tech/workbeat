const { prisma } = require('../config/db');

// Get notification templates
const getNotificationTemplates = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const templates = await prisma.notificationTemplate.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: { type: 'asc' }
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification templates',
      error: error.message 
    });
  }
};

// Create notification template
const createNotificationTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { type, subject, bodyTemplate } = req.body;

    // Validate required fields
    if (!type || !subject || !bodyTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Type, subject, and body template are required'
      });
    }

    // Validate type
    const validTypes = ['late_arrival', 'leave_request', 'leave_approved', 'leave_rejected', 'shift_reminder', 'weekly_summary', 'monthly_report', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    // Check if template with same type already exists
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        organizationId,
        type,
        isActive: true
      }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Notification template for this type already exists'
      });
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        organizationId,
        type,
        subject: subject.trim(),
        bodyTemplate: bodyTemplate.trim()
      }
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating notification template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification template',
      error: error.message 
    });
  }
};

// Update notification template
const updateNotificationTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { subject, bodyTemplate, isActive } = req.body;

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Notification template not found'
      });
    }

    const updatedTemplate = await prisma.notificationTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(subject && { subject: subject.trim() }),
        ...(bodyTemplate && { bodyTemplate: bodyTemplate.trim() }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    console.error('Error updating notification template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification template',
      error: error.message 
    });
  }
};

// Delete notification template
const deleteNotificationTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Notification template not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.notificationTemplate.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ success: true, message: 'Notification template deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification template',
      error: error.message 
    });
  }
};

// Preview notification template
const previewNotificationTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { sampleData = {} } = req.body;

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: parseInt(id),
        organizationId,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Notification template not found'
      });
    }

    // Default sample data based on type
    const defaultSampleData = {
      late_arrival: {
        employeeName: 'John Doe',
        arrivalTime: '09:15 AM',
        expectedTime: '09:00 AM',
        date: new Date().toLocaleDateString(),
        reason: 'Traffic jam'
      },
      leave_request: {
        employeeName: 'Jane Smith',
        leaveType: 'Vacation',
        startDate: new Date().toLocaleDateString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        daysRequested: 5,
        reason: 'Family vacation'
      },
      leave_approved: {
        employeeName: 'Jane Smith',
        leaveType: 'Vacation',
        startDate: new Date().toLocaleDateString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        approverName: 'Manager'
      },
      shift_reminder: {
        employeeName: 'Mike Johnson',
        shiftDate: new Date().toLocaleDateString(),
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        shiftName: 'Morning Shift'
      },
      weekly_summary: {
        weekStart: new Date().toLocaleDateString(),
        weekEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        totalHours: 40,
        attendanceRate: '95%',
        lateArrivals: 2
      }
    };

    const data = { ...defaultSampleData[template.type], ...sampleData };

    // Simple template variable replacement
    let previewSubject = template.subject;
    let previewBody = template.bodyTemplate;

    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, data[key]);
      previewBody = previewBody.replace(regex, data[key]);
    });

    res.json({ 
      success: true, 
      data: {
        template,
        preview: {
          subject: previewSubject,
          body: previewBody
        },
        sampleData: data
      }
    });
  } catch (error) {
    console.error('Error previewing notification template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to preview notification template',
      error: error.message 
    });
  }
};

// Get available template variables
const getTemplateVariables = async (req, res) => {
  try {
    const variables = {
      late_arrival: [
        '{{employeeName}}', '{{arrivalTime}}', '{{expectedTime}}', 
        '{{date}}', '{{reason}}', '{{department}}'
      ],
      leave_request: [
        '{{employeeName}}', '{{leaveType}}', '{{startDate}}', 
        '{{endDate}}', '{{daysRequested}}', '{{reason}}', '{{department}}'
      ],
      leave_approved: [
        '{{employeeName}}', '{{leaveType}}', '{{startDate}}', 
        '{{endDate}}', '{{approverName}}', '{{department}}'
      ],
      leave_rejected: [
        '{{employeeName}}', '{{leaveType}}', '{{startDate}}', 
        '{{endDate}}', '{{rejectionReason}}', '{{department}}'
      ],
      shift_reminder: [
        '{{employeeName}}', '{{shiftDate}}', '{{startTime}}', 
        '{{endTime}}', '{{shiftName}}', '{{department}}'
      ],
      weekly_summary: [
        '{{weekStart}}', '{{weekEnd}}', '{{totalHours}}', 
        '{{attendanceRate}}', '{{lateArrivals}}', '{{department}}'
      ],
      monthly_report: [
        '{{month}}', '{{year}}', '{{totalWorkingDays}}', 
        '{{totalHours}}', '{{attendanceRate}}', '{{department}}'
      ],
      custom: [
        '{{employeeName}}', '{{department}}', '{{date}}', 
        '{{organizationName}}', '{{managerName}}'
      ]
    };

    res.json({ success: true, data: variables });
  } catch (error) {
    console.error('Error fetching template variables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch template variables',
      error: error.message 
    });
  }
};

module.exports = {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  previewNotificationTemplate,
  getTemplateVariables
};
