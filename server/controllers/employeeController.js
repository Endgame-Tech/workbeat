const Employee = require('../models/employeeModel');
const AuditLog = require('../models/auditLogModel');
const mongoose = require('mongoose');

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
    
    // Create base filter including organization restriction
    const filter = { organizationId: organizationId };
    
    // Add additional filters from query params
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' }; // Case-insensitive search
    }
    if (req.query.email) {
      filter.email = { $regex: req.query.email, $options: 'i' };
    }
    
    console.log('Applying employee filter:', filter);
    
    // Get filtered employees and sort by name
    const employees = await Employee.find(filter).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
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
    
    // Find employee with both ID and matching organization
    const employee = await Employee.findOne({
      _id: req.params.id,
      organizationId: organizationId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your organization'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
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
    // Check for organizationId in the request body first
    if (!req.body.organizationId) {
      // If not in body, try to get from authenticated user
      if (req.user && req.user.organizationId) {
        req.body.organizationId = req.user.organizationId;
        console.log('Added organizationId from user object:', req.user.organizationId);
      } 
      // Also check if organization is in alternate format (organization.id)
      else if (req.user && req.user.organization && req.user.organization.id) {
        req.body.organizationId = req.user.organization.id;
        console.log('Added organizationId from user.organization.id:', req.user.organization.id);
      }
      else {
        console.warn('No organizationId available in request body or user object');
        return res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
      }
    }
    
    // Check for all required fields from your schema
    const requiredFields = ['name', 'email', 'department', 'position', 'employeeId', 'organizationId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate organizationId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.body.organizationId)) {
      console.error('Invalid organizationId format:', req.body.organizationId);
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format'
      });
    }
    
    // Create employee
    console.log('Creating employee with data:', req.body);
    const employee = await Employee.create(req.body);
    console.log('Employee created in database:', employee);

    // Create an audit log
    await AuditLog.create({
      userId: req.user?._id || 'system',
      action: 'create_employee',
      details: `Created employee: ${employee.name}`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employee._id,
      organizationId: employee.organizationId
    });

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Backend error creating employee:', error);
    
    // Specific MongoDB error handling
    if (error.code === 11000) {
      console.error('Duplicate key error details:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: `Employee with this ${Object.keys(error.keyValue).join(', ')} already exists`,
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
    
    // Find employee with both ID and matching organization
    let employee = await Employee.findOne({
      _id: req.params.id,
      organizationId: organizationId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your organization'
      });
    }
    
    // Update the employee
    employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: 'update_employee',
      details: `Updated employee: ${employee.name}`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employee._id,
      organizationId: organizationId
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
    
    // Find employee with both ID and matching organization
    const employee = await Employee.findOne({
      _id: req.params.id,
      organizationId: organizationId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your organization'
      });
    }

    // Instead of deleting, set to inactive
    employee.isActive = false;
    await employee.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: 'deactivate_employee',
      details: `Deactivated employee: ${employee.name}`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employee._id,
      organizationId: organizationId
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
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Store employee name for audit log
    const employeeName = employee.name;
    const employeeId = employee._id;

    // Actually delete the employee
    await employee.remove();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete_employee',
      details: `Permanently deleted employee: ${employeeName}`,
      ipAddress: req.ip,
      resourceType: 'employee',
      resourceId: employeeId
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
    const departmentStats = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: departmentStats
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