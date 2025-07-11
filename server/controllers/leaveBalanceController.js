const { prisma } = require('../config/db');

// Get leave balances for organization
const getLeaveBalances = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { employeeId, year = new Date().getFullYear() } = req.query;

    const where = {
      organizationId,
      year: parseInt(year),
      ...(employeeId && { employeeId: parseInt(employeeId) })
    };

    const leaveBalances = await prisma.leaveBalance.findMany({
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
            annualAllocation: true
          }
        }
      },
      orderBy: [
        { employee: { name: 'asc' } },
        { leaveType: { name: 'asc' } }
      ]
    });

    // Calculate remaining days for each balance
    const balancesWithRemaining = leaveBalances.map(balance => ({
      ...balance,
      remainingDays: balance.allocatedDays - balance.usedDays - balance.pendingDays
    }));

    res.json({ success: true, data: balancesWithRemaining });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leave balances',
      error: error.message 
    });
  }
};

// Get leave balance for specific employee
const getEmployeeLeaveBalances = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        organizationId,
        employeeId: parseInt(employeeId),
        year: parseInt(year)
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            annualAllocation: true
          }
        }
      },
      orderBy: { leaveType: { name: 'asc' } }
    });

    // Calculate remaining days and add summary
    const balancesWithRemaining = leaveBalances.map(balance => ({
      ...balance,
      remainingDays: balance.allocatedDays - balance.usedDays - balance.pendingDays
    }));

    const summary = {
      totalAllocated: balancesWithRemaining.reduce((sum, balance) => sum + balance.allocatedDays, 0),
      totalUsed: balancesWithRemaining.reduce((sum, balance) => sum + balance.usedDays, 0),
      totalPending: balancesWithRemaining.reduce((sum, balance) => sum + balance.pendingDays, 0),
      totalRemaining: balancesWithRemaining.reduce((sum, balance) => sum + balance.remainingDays, 0)
    };

    res.json({ 
      success: true, 
      data: balancesWithRemaining,
      summary 
    });
  } catch (error) {
    console.error('Error fetching employee leave balances:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee leave balances',
      error: error.message 
    });
  }
};

// Initialize leave balances for new year
const initializeLeaveBalances = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { year = new Date().getFullYear() } = req.body;

    // Get all active employees and leave types
    const [employees, leaveTypes] = await Promise.all([
      prisma.employee.findMany({
        where: {
          organizationId,
          isActive: true
        }
      }),
      prisma.leaveType.findMany({
        where: {
          organizationId,
          isActive: true
        }
      })
    ]);

    const balancesToCreate = [];
    
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        // Check if balance already exists
        const existingBalance = await prisma.leaveBalance.findFirst({
          where: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: parseInt(year)
          }
        });

        if (!existingBalance) {
          balancesToCreate.push({
            employeeId: employee.id,
            organizationId,
            leaveTypeId: leaveType.id,
            allocatedDays: leaveType.annualAllocation,
            usedDays: 0,
            pendingDays: 0,
            year: parseInt(year)
          });
        }
      }
    }

    if (balancesToCreate.length > 0) {
      await prisma.leaveBalance.createMany({
        data: balancesToCreate
      });
    }

    res.json({ 
      success: true, 
      message: `Initialized ${balancesToCreate.length} leave balances for year ${year}`,
      data: { created: balancesToCreate.length }
    });
  } catch (error) {
    console.error('Error initializing leave balances:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize leave balances',
      error: error.message 
    });
  }
};

// Update leave balance
const updateLeaveBalance = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { allocatedDays, usedDays, pendingDays, reason } = req.body;

    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        id: parseInt(id),
        organizationId
      }
    });

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }

    const updatedBalance = await prisma.leaveBalance.update({
      where: { id: parseInt(id) },
      data: {
        ...(allocatedDays !== undefined && { allocatedDays: parseFloat(allocatedDays) }),
        ...(usedDays !== undefined && { usedDays: parseFloat(usedDays) }),
        ...(pendingDays !== undefined && { pendingDays: parseFloat(pendingDays) })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Log the balance adjustment if reason provided
    if (reason) {
      await prisma.auditLog.create({
        data: {
          action: 'LEAVE_BALANCE_ADJUSTED',
          details: `Leave balance adjusted for ${updatedBalance.employee.name} - ${updatedBalance.leaveType.name}. Reason: ${reason}`,
          resourceType: 'leave_balance',
          resourceId: id.toString()
        }
      });
    }

    res.json({ success: true, data: updatedBalance });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update leave balance',
      error: error.message 
    });
  }
};

// Bulk update leave balances
const bulkUpdateLeaveBalances = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { updates, reason } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    
    for (const update of updates) {
      const { id, allocatedDays, usedDays, pendingDays } = update;
      
      try {
        const leaveBalance = await prisma.leaveBalance.findFirst({
          where: {
            id: parseInt(id),
            organizationId
          }
        });

        if (leaveBalance) {
          const updatedBalance = await prisma.leaveBalance.update({
            where: { id: parseInt(id) },
            data: {
              ...(allocatedDays !== undefined && { allocatedDays: parseFloat(allocatedDays) }),
              ...(usedDays !== undefined && { usedDays: parseFloat(usedDays) }),
              ...(pendingDays !== undefined && { pendingDays: parseFloat(pendingDays) })
            }
          });
          
          results.push({ id: parseInt(id), success: true, data: updatedBalance });
        } else {
          results.push({ id: parseInt(id), success: false, error: 'Leave balance not found' });
        }
      } catch (error) {
        results.push({ id: parseInt(id), success: false, error: error.message });
      }
    }

    // Log bulk update
    if (reason) {
      await prisma.auditLog.create({
        data: {
          action: 'BULK_LEAVE_BALANCE_UPDATE',
          details: `Bulk leave balance update performed. Reason: ${reason}. Updated ${results.filter(r => r.success).length} out of ${results.length} records.`,
          resourceType: 'leave_balance',
          resourceId: 'bulk_update'
        }
      });
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
    console.error('Error bulk updating leave balances:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk update leave balances',
      error: error.message 
    });
  }
};

// Get leave utilization report
const getLeaveUtilizationReport = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { year = new Date().getFullYear(), department } = req.query;

    const where = {
      organizationId,
      year: parseInt(year),
      ...(department && {
        employee: {
          department: department
        }
      })
    };

    const leaveBalances = await prisma.leaveBalance.findMany({
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
            name: true
          }
        }
      }
    });

    // Group by department and leave type
    const reportData = {};
    
    leaveBalances.forEach(balance => {
      const dept = balance.employee.department;
      const leaveTypeName = balance.leaveType.name;
      
      if (!reportData[dept]) {
        reportData[dept] = {};
      }
      
      if (!reportData[dept][leaveTypeName]) {
        reportData[dept][leaveTypeName] = {
          totalAllocated: 0,
          totalUsed: 0,
          totalPending: 0,
          totalRemaining: 0,
          employeeCount: 0,
          employees: []
        };
      }
      
      const remainingDays = balance.allocatedDays - balance.usedDays - balance.pendingDays;
      
      reportData[dept][leaveTypeName].totalAllocated += balance.allocatedDays;
      reportData[dept][leaveTypeName].totalUsed += balance.usedDays;
      reportData[dept][leaveTypeName].totalPending += balance.pendingDays;
      reportData[dept][leaveTypeName].totalRemaining += remainingDays;
      reportData[dept][leaveTypeName].employeeCount += 1;
      reportData[dept][leaveTypeName].employees.push({
        ...balance.employee,
        allocatedDays: balance.allocatedDays,
        usedDays: balance.usedDays,
        pendingDays: balance.pendingDays,
        remainingDays: remainingDays
      });
    });

    // Calculate utilization percentages
    Object.keys(reportData).forEach(dept => {
      Object.keys(reportData[dept]).forEach(leaveType => {
        const data = reportData[dept][leaveType];
        data.utilizationPercentage = data.totalAllocated > 0 
          ? Math.round((data.totalUsed / data.totalAllocated) * 100) 
          : 0;
      });
    });

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error generating leave utilization report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate leave utilization report',
      error: error.message 
    });
  }
};

module.exports = {
  getLeaveBalances,
  getEmployeeLeaveBalances,
  initializeLeaveBalances,
  updateLeaveBalance,
  bulkUpdateLeaveBalances,
  getLeaveUtilizationReport
};
