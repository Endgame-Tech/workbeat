const { prisma } = require('../config/db');

// Helper function to calculate working days between two dates
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// Get leave requests for organization
const getLeaveRequests = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { status, employeeId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {
      organizationId,
      ...(status && { status }),
      ...(employeeId && { employeeId: parseInt(employeeId) }),
      ...(startDate && endDate && {
        OR: [
          {
            startDate: {
              lte: new Date(endDate),
              gte: new Date(startDate)
            }
          },
          {
            endDate: {
              lte: new Date(endDate),
              gte: new Date(startDate)
            }
          }
        ]
      })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
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
          leaveType: {
            select: {
              id: true,
              name: true,
              requiresApproval: true
            }
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.leaveRequest.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: leaveRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leave requests',
      error: error.message 
    });
  }
};

// Get leave requests for a specific employee
const getEmployeeLeaveRequests = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { employeeId } = req.params;

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        organizationId,
        employeeId: parseInt(employeeId)
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            requiresApproval: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: leaveRequests });
  } catch (error) {
    console.error('Error fetching employee leave requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee leave requests',
      error: error.message 
    });
  }
};

// Create leave request
const createLeaveRequest = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;

    // Validate required fields
    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee, leave type, start date, and end date are required'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    if (start < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request leave for past dates'
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

    // Check if leave type exists
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: parseInt(leaveTypeId),
        organizationId,
        isActive: true
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found'
      });
    }

    // Calculate working days
    const daysRequested = calculateWorkingDays(start, end);

    // Check for overlapping leave requests
    const overlappingRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: parseInt(employeeId),
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    });

    if (overlappingRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Leave request overlaps with existing request'
      });
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        leaveTypeId: parseInt(leaveTypeId),
        year: currentYear
      }
    });

    if (leaveBalance) {
      const availableDays = leaveBalance.allocatedDays - leaveBalance.usedDays - leaveBalance.pendingDays;
      if (daysRequested > availableDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. Available: ${availableDays} days, Requested: ${daysRequested} days`
        });
      }
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: parseInt(employeeId),
        organizationId,
        leaveTypeId: parseInt(leaveTypeId),
        startDate: start,
        endDate: end,
        daysRequested,
        reason: reason?.trim() || null,
        status: leaveType.requiresApproval ? 'pending' : 'approved'
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
        leaveType: {
          select: {
            id: true,
            name: true,
            requiresApproval: true
          }
        }
      }
    });

    // Update leave balance if request is auto-approved
    if (!leaveType.requiresApproval) {
      if (leaveBalance) {
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: { usedDays: leaveBalance.usedDays + daysRequested }
        });
      }
    } else {
      // Update pending days
      if (leaveBalance) {
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: { pendingDays: leaveBalance.pendingDays + daysRequested }
        });
      }
    }

    res.status(201).json({ success: true, data: leaveRequest });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create leave request',
      error: error.message 
    });
  }
};

// Approve/Reject leave request
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { status, rejectionReason, approverId } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: parseInt(id),
        organizationId,
        status: 'pending'
      },
      include: {
        leaveType: true
      }
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or already processed'
      });
    }

    // Update leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        approvedBy: approverId ? parseInt(approverId) : null,
        approvedAt: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason : null
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
        leaveType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear
      }
    });

    if (leaveBalance) {
      if (status === 'approved') {
        // Move from pending to used
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            usedDays: leaveBalance.usedDays + leaveRequest.daysRequested,
            pendingDays: leaveBalance.pendingDays - leaveRequest.daysRequested
          }
        });
      } else {
        // Remove from pending
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            pendingDays: leaveBalance.pendingDays - leaveRequest.daysRequested
          }
        });
      }
    }

    res.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update leave request',
      error: error.message 
    });
  }
};

// Cancel leave request
const cancelLeaveRequest = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: parseInt(id),
        organizationId,
        status: { in: ['pending', 'approved'] }
      }
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or cannot be cancelled'
      });
    }

    // Check if leave has already started
    const today = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(leaveRequest.startDate).setHours(0, 0, 0, 0);
    
    if (startDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave that has already started'
      });
    }

    // Update leave request
    await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' }
    });

    // Update leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear
      }
    });

    if (leaveBalance) {
      if (leaveRequest.status === 'approved') {
        // Return used days
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            usedDays: leaveBalance.usedDays - leaveRequest.daysRequested
          }
        });
      } else {
        // Return pending days
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            pendingDays: leaveBalance.pendingDays - leaveRequest.daysRequested
          }
        });
      }
    }

    res.json({ success: true, message: 'Leave request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel leave request',
      error: error.message 
    });
  }
};

module.exports = {
  getLeaveRequests,
  getEmployeeLeaveRequests,
  createLeaveRequest,
  updateLeaveRequestStatus,
  cancelLeaveRequest
};
