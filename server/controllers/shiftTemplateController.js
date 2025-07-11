const { prisma } = require('../config/db');

// Get shift templates
const getShiftTemplates = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const shiftTemplates = await prisma.shiftTemplate.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            scheduledShifts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Parse daysOfWeek JSON for each template and fix object-to-array conversion
    const templatesWithParsedDays = shiftTemplates.map(template => {
      let daysOfWeek = JSON.parse(template.daysOfWeek || '[]');
      
      // Fix for arrays that were stored as objects due to middleware conversion
      if (daysOfWeek && typeof daysOfWeek === 'object' && !Array.isArray(daysOfWeek)) {
        const keys = Object.keys(daysOfWeek);
        if (keys.every(key => /^\d+$/.test(key))) {
          daysOfWeek = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(key => daysOfWeek[key]);
        }
      }
      
      return {
        ...template,
        daysOfWeek
      };
    });

    res.json({ success: true, data: templatesWithParsedDays });
  } catch (error) {
    console.error('Error fetching shift templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch shift templates',
      error: error.message 
    });
  }
};

// Create shift template
const createShiftTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { name, startTime, endTime, breakDuration, daysOfWeek } = req.body;

    // Validate required fields
    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Name, start time, and end time are required'
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format'
      });
    }

    // Validate daysOfWeek array
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Received daysOfWeek:', daysOfWeek, 'Type:', typeof daysOfWeek, 'IsArray:', Array.isArray(daysOfWeek));
    
    // Fix for arrays converted to objects by some middleware
    let daysArray = daysOfWeek;
    if (daysOfWeek && typeof daysOfWeek === 'object' && !Array.isArray(daysOfWeek)) {
      // Convert object like {"0":"monday","1":"tuesday"} back to array
      const keys = Object.keys(daysOfWeek);
      if (keys.every(key => /^\d+$/.test(key))) {
        daysArray = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(key => daysOfWeek[key]);
        console.log('Converted object to array:', daysArray);
      }
    }
    
    console.log('Final daysArray to be used:', daysArray, 'IsArray:', Array.isArray(daysArray));
    
    if (daysArray && Array.isArray(daysArray)) {
      for (let i = 0; i < daysArray.length; i++) {
        const day = daysArray[i];
        console.log(`Checking day ${i}: "${day}" (type: ${typeof day})`);
        if (!validDays.includes(day.toLowerCase())) {
          console.log(`Invalid day: "${day}"`);
          return res.status(400).json({
            success: false,
            message: `Invalid day: "${day}". Valid days are: ${validDays.join(', ')}`
          });
        }
      }
    }

    // Check if template with same name already exists
    const existingTemplate = await prisma.shiftTemplate.findFirst({
      where: {
        organizationId,
        name: name.trim(),
        isActive: true
      }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Shift template with this name already exists'
      });
    }

    const shiftTemplate = await prisma.shiftTemplate.create({
      data: {
        organizationId,
        name: name.trim(),
        startTime,
        endTime,
        breakDuration: parseInt(breakDuration) || 0,
        daysOfWeek: JSON.stringify(daysArray || [])
      }
    });

    res.status(201).json({ 
      success: true, 
      data: {
        ...shiftTemplate,
        daysOfWeek: daysArray || []
      }
    });
  } catch (error) {
    console.error('Error creating shift template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create shift template',
      error: error.message 
    });
  }
};

// Update shift template
const updateShiftTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name, startTime, endTime, breakDuration, daysOfWeek, isActive } = req.body;

    const shiftTemplate = await prisma.shiftTemplate.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!shiftTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Shift template not found'
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

    // Validate daysOfWeek array if provided
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let daysArray = daysOfWeek;
    
    if (daysOfWeek) {
      // Fix for arrays converted to objects by middleware
      if (typeof daysOfWeek === 'object' && !Array.isArray(daysOfWeek)) {
        const keys = Object.keys(daysOfWeek);
        if (keys.every(key => /^\d+$/.test(key))) {
          daysArray = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(key => daysOfWeek[key]);
        }
      }
      
      if (!Array.isArray(daysArray) || !daysArray.every(day => validDays.includes(day.toLowerCase()))) {
        return res.status(400).json({
          success: false,
          message: 'Days of week must be an array of valid day names'
        });
      }
    }

    const updatedTemplate = await prisma.shiftTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(breakDuration !== undefined && { breakDuration: parseInt(breakDuration) }),
        ...(daysArray && { daysOfWeek: JSON.stringify(daysArray) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ 
      success: true, 
      data: {
        ...updatedTemplate,
        daysOfWeek: JSON.parse(updatedTemplate.daysOfWeek)
      }
    });
  } catch (error) {
    console.error('Error updating shift template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update shift template',
      error: error.message 
    });
  }
};

// Delete shift template
const deleteShiftTemplate = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const shiftTemplate = await prisma.shiftTemplate.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!shiftTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Shift template not found'
      });
    }

    // Check if there are any scheduled shifts using this template
    const scheduledShifts = await prisma.scheduledShift.count({
      where: {
        shiftTemplateId: parseInt(id),
        status: { in: ['scheduled', 'completed'] }
      }
    });

    if (scheduledShifts > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shift template with active scheduled shifts'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.shiftTemplate.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ success: true, message: 'Shift template deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete shift template',
      error: error.message 
    });
  }
};

module.exports = {
  getShiftTemplates,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate
};
