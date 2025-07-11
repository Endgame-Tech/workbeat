const { prisma } = require('../config/db');

// Leave Types Controller
const getLeaveTypes = async (req, res) => {
  try {
    const { organizationId } = req.user;
    
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            leaveRequests: true,
            leaveBalances: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: leaveTypes });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leave types',
      error: error.message 
    });
  }
};

const createLeaveType = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { name, annualAllocation, requiresApproval, adviceNoticeDays } = req.body;

    // Validate required fields
    if (!name || annualAllocation === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and annual allocation are required'
      });
    }

    // Check if leave type with same name already exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        organizationId,
        name: name.trim(),
        isActive: true
      }
    });

    if (existingLeaveType) {
      return res.status(400).json({
        success: false,
        message: 'Leave type with this name already exists'
      });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        organizationId,
        name: name.trim(),
        annualAllocation: parseInt(annualAllocation),
        requiresApproval: requiresApproval !== false,
        adviceNoticeDays: parseInt(adviceNoticeDays) || 1
      }
    });

    res.status(201).json({ success: true, data: leaveType });
  } catch (error) {
    console.error('Error creating leave type:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create leave type',
      error: error.message 
    });
  }
};

const updateLeaveType = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { name, annualAllocation, requiresApproval, adviceNoticeDays, isActive } = req.body;

    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    const updatedLeaveType = await prisma.leaveType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(annualAllocation !== undefined && { annualAllocation: parseInt(annualAllocation) }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(adviceNoticeDays !== undefined && { adviceNoticeDays: parseInt(adviceNoticeDays) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ success: true, data: updatedLeaveType });
  } catch (error) {
    console.error('Error updating leave type:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update leave type',
      error: error.message 
    });
  }
};

const deleteLeaveType = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Check if leave type exists and belongs to organization
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Check if there are any active leave requests for this type
    const activeRequests = await prisma.leaveRequest.count({
      where: {
        leaveTypeId: parseInt(id),
        status: { in: ['pending', 'approved'] }
      }
    });

    if (activeRequests > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete leave type with active leave requests'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.leaveType.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ success: true, message: 'Leave type deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave type:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete leave type',
      error: error.message 
    });
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
};
