const { prisma } = require('../config/db');

// Helper function to parse JSON fields
const parseEmployeeJsonFields = (employee) => {
  if (!employee) return employee;
  
  try {
    if (employee.workSchedule) {
      employee.workSchedule = JSON.parse(employee.workSchedule);
    }
    if (employee.faceRecognition) {
      employee.faceRecognition = JSON.parse(employee.faceRecognition);
    }
    if (employee.biometrics) {
      employee.biometrics = JSON.parse(employee.biometrics);
    }
  } catch (error) {
    console.error('Error parsing employee JSON fields:', error);
  }
  
  return employee;
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    // Get organizationId from authenticated user
    const organizationId = req.user.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
      // Create where clause for Prisma query
    const where = {
      organizationId: organizationId,
      ...(req.query.isActive !== undefined && {
        isActive: req.query.isActive === 'true'
      }),
      ...(req.query.department && {
        department: req.query.department
      }),
      ...(req.query.name && {
        name: {
          contains: req.query.name,
          mode: 'insensitive'
        }
      })
    };
    if (req.query.email) {
      where.email = {
        contains: req.query.email,
        mode: 'insensitive'
      };
    }
    
    console.log('Applying employee filter:', where);
      // Get filtered employees and sort by name using Prisma
    const employees = await prisma.employee.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
      // Parse JSON fields for each employee
    const parsedEmployees = employees.map(parseEmployeeJsonFields);

    res.status(200).json({
      success: true,
      count: parsedEmployees.length,
      data: parsedEmployees
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
  try {
    // Get organizationId from authenticated user
    const organizationId = req.user.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Find employee with both ID and matching organization using Prisma
    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(req.params.id),
        organizationId: organizationId
      }
    });    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your organization'
      });
    }

    // Parse JSON fields
    const parsedEmployee = parseEmployeeJsonFields(employee);

    res.status(200).json({
      success: true,
      data: parsedEmployee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};


const createEmployee = async (req, res) => {
  console.log('Backend received create employee request:', req.body);
  try {
    // Get organizationId from authenticated user or request body
    const organizationId = req.body.organizationId || req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }
    
    // Check for all required fields
    const requiredFields = ['name', 'email', 'department', 'position', 'employeeId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Create employee using Prisma
    const employee = await prisma.employee.create({
      data: {
        organizationId: parseInt(organizationId),
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
        position: req.body.position,        employeeId: req.body.employeeId,
        phone: req.body.phone,
        workSchedule: JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        })
      }
    });

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'create_employee',
        details: `Created employee: ${employee.name}`,
        ipAddress: req.ip,
        resourceType: 'employee',
        resourceId: String(employee.id)
      }
    });

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Backend error creating employee:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email or employee ID already exists',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    // Get organizationId from authenticated user
    const organizationId = req.user.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Parse the employee ID as an integer
    const employeeId = parseInt(req.params.id);
    
    // Check for valid ID format
    if (isNaN(employeeId)) {
      console.error(`Invalid employee ID format: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    console.log(`Attempting to update employee with ID: ${employeeId}`);
    
    // Find employee using findUnique
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        id: employeeId
      }
    });

    if (!existingEmployee) {
      console.error(`Employee not found with ID: ${employeeId}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if employee belongs to the user's organization
    if (existingEmployee.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Employee does not belong to your organization'
      });
    }
    
    // Create a cleaned update data object
    const updateData = { ...req.body };
    
    // Remove the id field from update data if it exists - Prisma doesn't allow updating primary keys
    if (updateData.id !== undefined) {
      delete updateData.id;
    }
    
    // Format the date fields correctly if they exist
    if (updateData.startDate) {
      try {
        // Ensure date is in ISO format
        updateData.startDate = new Date(updateData.startDate).toISOString();
      } catch (error) {
        console.error(`Invalid date format for startDate: ${updateData.startDate}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for startDate'
        });
      }
    }
    
    // Convert JSON fields to strings if they exist in the request
    if (updateData.workSchedule && typeof updateData.workSchedule !== 'string') {
      updateData.workSchedule = JSON.stringify(updateData.workSchedule);
    }
    
    if (updateData.faceRecognition && typeof updateData.faceRecognition !== 'string') {
      updateData.faceRecognition = JSON.stringify(updateData.faceRecognition);
    }
    
    if (updateData.biometrics && typeof updateData.biometrics !== 'string') {
      updateData.biometrics = JSON.stringify(updateData.biometrics);
    }

    console.log(`Updating employee ${employeeId} with data:`, updateData);

    // Update the employee
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'update_employee',
        details: `Updated employee: ${employee.name}`,
        ipAddress: req.ip,
        resourceType: 'employee',
        resourceId: String(employee.id)
      }
    });

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};  

const deleteEmployee = async (req, res) => {
  try {
    // Get organizationId from authenticated user
    const organizationId = req.user.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found for the current user'
      });
    }
    
    // Parse the employee ID as an integer
    const employeeId = parseInt(req.params.id);
    
    // Check for valid ID format
    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }
      
    // Find employee using findUnique
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if employee belongs to the user's organization
    if (employee.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Employee does not belong to your organization'
      });
    }

    // Instead of deleting, set to inactive
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive: false }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'deactivate_employee',
        details: `Deactivated employee: ${employee.name}`,
        ipAddress: req.ip,
        resourceType: 'employee',
        resourceId: String(employee.id)
      }
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Employee deactivated'
    });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message
    });
  }
};


// @desc    Hard delete employee (use with caution)
// @route   DELETE /api/employees/:id/hard
// @access  Private/Admin
const hardDeleteEmployee = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Store employee info for audit log
    const employeeName = employee.name;

    // Actually delete the employee using Prisma
    await prisma.employee.delete({
      where: { id: employeeId }
    });

    // Log the action using Prisma
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'delete_employee',
        details: `Permanently deleted employee: ${employeeName}`,
        ipAddress: req.ip,
        resourceType: 'employee',
        resourceId: String(employeeId)
      }
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Employee permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};

// @desc    Get department statistics
// @route   GET /api/employees/stats/departments
// @access  Private/Admin
const getDepartmentStats = async (req, res) => {
  try {
    const departmentStats = await prisma.employee.groupBy({
      by: ['department'],
      where: {
        isActive: true
      },
      _count: {
        department: true
      },
      orderBy: {
        _count: {
          department: 'desc'
        }
      }
    });

    // Transform the data to match the expected format
    const formattedStats = departmentStats.map(stat => ({
      department: stat.department,
      count: stat._count.department
    }));    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics',
      error: error.message
    });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  hardDeleteEmployee,
  getDepartmentStats
};