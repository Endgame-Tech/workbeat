const { prisma } = require('../config/db');

// Get scheduled shifts
const getScheduledShifts = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { 
      employeeId, 
      startDate, 
      endDate, 
      status, 
      page = 1, 
      limit = 50 
    } = req.query;

    // Build where clause
    const where = {
      organizationId,
      ...(employeeId && { employeeId: parseInt(employeeId) }),
      ...(status && { status }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [scheduledShifts, total] = await Promise.all([
      prisma.scheduledShift.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true
            }
          },
          shiftTemplate: {
            select: {
              id: true,
              name: true,
              breakDuration: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.scheduledShift.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: scheduledShifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled shifts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch scheduled shifts',
      error: error.message 
    });
  }
};

// Get scheduled shifts for specific employee
const getEmployeeScheduledShifts = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const where = {
      organizationId,
      employeeId: parseInt(employeeId),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const scheduledShifts = await prisma.scheduledShift.findMany({
      where,
      include: {
        shiftTemplate: {
          select: {
            id: true,
            name: true,
            breakDuration: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({ success: true, data: scheduledShifts });
  } catch (error) {
    console.error('Error fetching employee scheduled shifts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee scheduled shifts',
      error: error.message 
    });
  }
};

// Create scheduled shift
const createScheduledShift = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { 
      employeeId, 
      shiftTemplateId, 
      date, 
      startTime, 
      endTime, 
      notes 
    } = req.body;

    // Validate required fields
    if (!employeeId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Employee, date, start time, and end time are required'
      });
    }

    // Validate date is not in the past
    const shiftDate = new Date(date);
    const today = new Date().setHours(0, 0, 0, 0);
    
    if (shiftDate.setHours(0, 0, 0, 0) < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule shifts for past dates'
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format'
      });
    }

    // Check if employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(employeeId),
        organizationId,
        isActive: true
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if shift template exists (if provided)
    if (shiftTemplateId) {
      const shiftTemplate = await prisma.shiftTemplate.findFirst({
        where: {
          id: parseInt(shiftTemplateId),
          organizationId,
          isActive: true
        }
      });

      if (!shiftTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Shift template not found'
        });
      }
    }

    // Check for conflicting shifts on the same date
    const conflictingShift = await prisma.scheduledShift.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: new Date(date),
        status: { in: ['scheduled', 'completed'] }
      }
    });

    if (conflictingShift) {
      return res.status(400).json({
        success: false,
        message: 'Employee already has a shift scheduled for this date'
      });
    }

    const scheduledShift = await prisma.scheduledShift.create({
      data: {
        employeeId: parseInt(employeeId),
        organizationId,
        shiftTemplateId: shiftTemplateId ? parseInt(shiftTemplateId) : null,
        date: new Date(date),
        startTime,
        endTime,
        notes: notes?.trim() || null
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        shiftTemplate: {
          select: {
            id: true,
            name: true,
            breakDuration: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: scheduledShift });
  } catch (error) {
    console.error('Error creating scheduled shift:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create scheduled shift',
      error: error.message 
    });
  }
};

// Bulk create scheduled shifts
const bulkCreateScheduledShifts = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { shifts } = req.body;

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shifts array is required'
      });
    }

    const results = [];
    
    for (const shift of shifts) {
      const { employeeId, shiftTemplateId, date, startTime, endTime, notes } = shift;
      
      try {
        // Validate employee exists
        const employee = await prisma.employee.findFirst({
          where: {
            id: parseInt(employeeId),
            organizationId,
            isActive: true
          }
        });

        if (!employee) {
          results.push({ 
            shift, 
            success: false, 
            error: 'Employee not found' 
          });
          continue;
        }

        // Check for conflicts
        const conflictingShift = await prisma.scheduledShift.findFirst({
          where: {
            employeeId: parseInt(employeeId),
            date: new Date(date),
            status: { in: ['scheduled', 'completed'] }
          }
        });

        if (conflictingShift) {
          results.push({ 
            shift, 
            success: false, 
            error: 'Employee already has a shift scheduled for this date' 
          });
          continue;
        }

        const scheduledShift = await prisma.scheduledShift.create({
          data: {
            employeeId: parseInt(employeeId),
            organizationId,
            shiftTemplateId: shiftTemplateId ? parseInt(shiftTemplateId) : null,
            date: new Date(date),
            startTime,
            endTime,
            notes: notes?.trim() || null
          }
        });

        results.push({ shift, success: true, data: scheduledShift });
      } catch (error) {
        results.push({ shift, success: false, error: error.message });
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
    console.error('Error bulk creating scheduled shifts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk create scheduled shifts',
      error: error.message 
    });
  }
};

// Update scheduled shift
const updateScheduledShift = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { 
      employeeId, 
      shiftTemplateId, 
      date, 
      startTime, 
      endTime, 
      status, 
      notes 
    } = req.body;

    const scheduledShift = await prisma.scheduledShift.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!scheduledShift) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled shift not found'
      });
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format'
      });
    }

    // Validate status if provided
    const validStatuses = ['scheduled', 'completed', 'missed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updatedShift = await prisma.scheduledShift.update({
      where: { id: parseInt(id) },
      data: {
        ...(employeeId && { employeeId: parseInt(employeeId) }),
        ...(shiftTemplateId !== undefined && { 
          shiftTemplateId: shiftTemplateId ? parseInt(shiftTemplateId) : null 
        }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes?.trim() || null })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        shiftTemplate: {
          select: {
            id: true,
            name: true,
            breakDuration: true
          }
        }
      }
    });

    res.json({ success: true, data: updatedShift });
  } catch (error) {
    console.error('Error updating scheduled shift:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update scheduled shift',
      error: error.message 
    });
  }
};

// Delete scheduled shift
const deleteScheduledShift = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const scheduledShift = await prisma.scheduledShift.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!scheduledShift) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled shift not found'
      });
    }

    // Check if shift has already started or completed
    const today = new Date().setHours(0, 0, 0, 0);
    const shiftDate = new Date(scheduledShift.date).setHours(0, 0, 0, 0);
    
    if (shiftDate <= today && scheduledShift.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed shifts'
      });
    }

    await prisma.scheduledShift.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Scheduled shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled shift:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete scheduled shift',
      error: error.message 
    });
  }
};

// Generate shifts from template
const generateShiftsFromTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { 
      shiftTemplateId, 
      employeeIds, 
      startDate, 
      endDate, 
      skipWeekends = true,
      skipExisting = true 
    } = req.body;

    // Validate required fields
    if (!shiftTemplateId || !employeeIds || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Shift template, employees, start date, and end date are required'
      });
    }

    // Get shift template
    const shiftTemplate = await prisma.shiftTemplate.findFirst({
      where: {
        id: parseInt(shiftTemplateId),
        organizationId,
        isActive: true
      }
    });

    if (!shiftTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Shift template not found'
      });
    }

    const templateDays = JSON.parse(shiftTemplate.daysOfWeek || '[]');
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate shifts for each employee
    for (const employeeId of employeeIds) {
      // Validate employee exists
      const employee = await prisma.employee.findFirst({
        where: {
          id: parseInt(employeeId),
          organizationId,
          isActive: true
        }
      });

      if (!employee) {
        results.push({
          employeeId: parseInt(employeeId),
          success: false,
          error: 'Employee not found',
          shifts: []
        });
        continue;
      }

      const employeeShifts = [];
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);

        // Skip if not in template days or weekends (if specified)
        if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
          current.setDate(current.getDate() + 1);
          continue;
        }

        if (templateDays.length > 0 && !templateDays.includes(dayName)) {
          current.setDate(current.getDate() + 1);
          continue;
        }

        // Check if shift already exists
        if (skipExisting) {
          const existingShift = await prisma.scheduledShift.findFirst({
            where: {
              employeeId: parseInt(employeeId),
              date: new Date(current),
              status: { in: ['scheduled', 'completed'] }
            }
          });

          if (existingShift) {
            current.setDate(current.getDate() + 1);
            continue;
          }
        }

        try {
          const shift = await prisma.scheduledShift.create({
            data: {
              employeeId: parseInt(employeeId),
              organizationId,
              shiftTemplateId: parseInt(shiftTemplateId),
              date: new Date(current),
              startTime: shiftTemplate.startTime,
              endTime: shiftTemplate.endTime
            }
          });

          employeeShifts.push(shift);
        } catch (error) {
          // Skip this shift if creation fails
          console.error('Error creating shift:', error);
        }

        current.setDate(current.getDate() + 1);
      }

      results.push({
        employeeId: parseInt(employeeId),
        employeeName: employee.name,
        success: true,
        shifts: employeeShifts
      });
    }

    const totalShifts = results.reduce((sum, result) => sum + result.shifts.length, 0);

    res.json({ 
      success: true, 
      data: results,
      summary: {
        employeesProcessed: results.length,
        totalShiftsCreated: totalShifts,
        templateUsed: {
          id: shiftTemplate.id,
          name: shiftTemplate.name,
          startTime: shiftTemplate.startTime,
          endTime: shiftTemplate.endTime
        }
      }
    });
  } catch (error) {
    console.error('Error generating shifts from template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate shifts from template',
      error: error.message 
    });
  }
};

module.exports = {
  getScheduledShifts,
  getEmployeeScheduledShifts,
  createScheduledShift,
  bulkCreateScheduledShifts,
  updateScheduledShift,
  deleteScheduledShift,
  generateShiftsFromTemplate
};
