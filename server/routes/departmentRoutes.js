const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { prisma } = require('../config/db');

// Get all departments for an organization
router.get('/:organizationId/departments', protect, async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Verify user belongs to organization
    if (req.user.organizationId !== parseInt(organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this organization'
      });
    }

    const departments = await prisma.department.findMany({
      where: {
        organizationId: parseInt(organizationId),
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
});

// Create a new department
router.post('/:organizationId/departments', protect, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { name, description } = req.body;
    
    // Verify user belongs to organization and is admin
    if (req.user.organizationId !== parseInt(organizationId) || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if department name already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        organizationId: parseInt(organizationId),
        name: name.trim(),
        isActive: true
      }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: parseInt(organizationId),
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

// Update a department
router.put('/:organizationId/departments/:departmentId', protect, async (req, res) => {
  try {
    const { organizationId, departmentId } = req.params;
    const { name, description, isActive } = req.body;
    
    // Verify user belongs to organization and is admin
    if (req.user.organizationId !== parseInt(organizationId) || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id: parseInt(departmentId),
        organizationId: parseInt(organizationId)
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if new name conflicts with existing departments
    if (name && name.trim() !== existingDepartment.name) {
      const nameConflict = await prisma.department.findFirst({
        where: {
          organizationId: parseInt(organizationId),
          name: name.trim(),
          isActive: true,
          id: { not: parseInt(departmentId) }
        }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const department = await prisma.department.update({
      where: {
        id: parseInt(departmentId)
      },
      data: updateData,
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
});

// Delete a department
router.delete('/:organizationId/departments/:departmentId', protect, async (req, res) => {
  try {
    const { organizationId, departmentId } = req.params;
    
    // Verify user belongs to organization and is admin
    if (req.user.organizationId !== parseInt(organizationId) || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if department exists
    const department = await prisma.department.findFirst({
      where: {
        id: parseInt(departmentId),
        organizationId: parseInt(organizationId)
      },
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has employees
    if (department._count.employees > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active employees. Please reassign employees first.'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.department.update({
      where: {
        id: parseInt(departmentId)
      },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
});

// Get department statistics
router.get('/:organizationId/departments/:departmentId/stats', protect, async (req, res) => {
  try {
    const { organizationId, departmentId } = req.params;
    
    // Verify user belongs to organization
    if (req.user.organizationId !== parseInt(organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this organization'
      });
    }

    // Return mock stats until migration is complete
    const stats = {
      department: {
        id: departmentId,
        name: 'Sample Department',
        employees: []
      },
      totalEmployees: 0,
      attendanceData: [],
      avgAttendanceRate: 0,
      lateArrivalRate: 0
    };

    res.json({
      success: true,
      data: stats,
      message: 'Department statistics (temporary response until migration)'
    });
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics'
    });
  }
});

module.exports = router;