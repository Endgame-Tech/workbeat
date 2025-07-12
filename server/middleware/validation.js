const { z } = require('zod');

// Validation schemas
const schemas = {
  // User registration and login
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    role: z.enum(['admin', 'employee']).optional(),
    employeeId: z.number().int().positive().optional()
  }),

  login: z.object({
    email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
    password: z.string().min(1, 'Password is required').max(128, 'Password must be less than 128 characters')
  }),

  // Organization registration
  organizationRegister: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(200, 'Organization name must be less than 200 characters'),
    industry: z.string().min(2, 'Industry must be at least 2 characters').max(100, 'Industry must be less than 100 characters'),
    contactEmail: z.string().email('Invalid contact email format').max(255, 'Contact email must be less than 255 characters'),
    contactPhone: z.string().min(10, 'Phone number must be at least 10 characters').max(20, 'Phone number must be less than 20 characters')
      .regex(/^[\+]?[0-9][\d]{0,15}$/, 'Invalid phone number format'),
    address: z.union([
      z.string().max(500, 'Address must be less than 500 characters'),
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional()
      })
    ]).optional(),
    adminName: z.string().min(2, 'Admin name must be at least 2 characters').max(100, 'Admin name must be less than 100 characters'),
    adminEmail: z.string().email('Invalid admin email format').max(255, 'Admin email must be less than 255 characters'),
    adminPassword: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    confirmPassword: z.string().optional() // Accept but ignore confirmPassword field
  }),

  // Employee management
  employee: z.object({
    name: z.string().min(2, 'Employee name must be at least 2 characters').max(100, 'Employee name must be less than 100 characters'),
    email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
    department: z.string().min(1, 'Department is required').max(100, 'Department must be less than 100 characters'),
    position: z.string().min(1, 'Position is required').max(100, 'Position must be less than 100 characters'),
    employeeId: z.string().min(1, 'Employee ID is required').max(50, 'Employee ID must be less than 50 characters'),
    phone: z.string().max(20, 'Phone number must be less than 20 characters')
      .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
    workSchedule: z.string().max(1000, 'Work schedule must be less than 1000 characters').optional(),
    employmentStatus: z.enum(['full-time', 'part-time', 'contract', 'intern']).optional(),
    accessLevel: z.enum(['employee', 'supervisor', 'manager']).optional()
  }),

  // Attendance creation
  attendance: z.object({
    employeeId: z.number().int().positive('Employee ID must be a positive integer'),
    type: z.enum(['sign-in', 'sign-out'], 'Type must be either sign-in or sign-out'),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    location: z.string().max(200, 'Location must be less than 200 characters').optional(),
    ipAddress: z.string().ip('Invalid IP address format').optional(),
    organizationId: z.number().int().positive('Organization ID must be a positive integer').optional()
  }),

  // Attendance with facial recognition
  attendanceFace: z.object({
    employeeId: z.number().int().positive('Employee ID must be a positive integer'),
    type: z.enum(['sign-in', 'sign-out'], 'Type must be either sign-in or sign-out'),
    facialCapture: z.string().max(5000000, 'Facial capture data too large').optional(), // ~5MB base64 limit
    location: z.string().max(200, 'Location must be less than 200 characters').optional(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    organizationId: z.number().int().positive('Organization ID must be a positive integer').optional()
  }),

  // Password update
  updatePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required').max(128, 'Current password must be less than 128 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128, 'New password must be less than 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
  }),

  // User details update
  updateDetails: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
    email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters').optional()
  }),

  // Organization update
  organizationUpdate: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(200, 'Organization name must be less than 200 characters').optional(),
    industry: z.string().min(2, 'Industry must be at least 2 characters').max(100, 'Industry must be less than 100 characters').optional(),
    contactEmail: z.string().email('Invalid contact email format').max(255, 'Contact email must be less than 255 characters').optional(),
    contactPhone: z.string().min(10, 'Phone number must be at least 10 characters').max(20, 'Phone number must be less than 20 characters')
      .regex(/^[\+]?[0-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
    address: z.union([
      z.string().max(500, 'Address must be less than 500 characters'),
      z.object({
        street: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        country: z.string().max(100).optional(),
        postalCode: z.string().max(20).optional()
      })
    ]).optional()
  }),

  // Subscription validation
  subscription: z.object({
    plan: z.enum(['free', 'basic', 'professional', 'enterprise']),
    billingCycle: z.enum(['monthly', 'annual']).optional(),
    organizationId: z.number().int().positive('Organization ID must be a positive integer')
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1, 'Filename is required').max(255, 'Filename must be less than 255 characters')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
    contentType: z.string().regex(/^[a-z]+\/[a-z0-9.-]+$/, 'Invalid content type'),
    size: z.number().int().positive().max(10 * 1024 * 1024, 'File size must be less than 10MB')
  }),

  // ID parameter validation
  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number).pipe(z.number().int().positive('ID must be a positive integer'))
  }),

  // Biometric data validation
  biometricData: z.object({
    employeeId: z.number().int().positive('Employee ID must be a positive integer'),
    biometricType: z.enum(['fingerprint', 'face', 'voice'], 'Invalid biometric type'),
    biometricData: z.string().min(1, 'Biometric data is required').max(10000000, 'Biometric data too large'), // ~10MB limit
    quality: z.number().min(0).max(100).optional(),
    organizationId: z.number().int().positive('Organization ID must be a positive integer').optional()
  }),

  // Leave request validation
  leaveRequest: z.object({
    employeeId: z.number().int().positive('Employee ID must be a positive integer'),
    leaveTypeId: z.number().int().positive('Leave type ID must be a positive integer'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000, 'Reason must be less than 1000 characters'),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
  }),

  // Report generation validation
  reportGeneration: z.object({
    reportType: z.enum(['attendance', 'leave', 'employee', 'analytics'], 'Invalid report type'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
    format: z.enum(['pdf', 'excel', 'csv'], 'Invalid format'),
    filters: z.object({
      employeeIds: z.array(z.number().int().positive()).optional(),
      departments: z.array(z.string().max(100)).optional(),
      includeInactive: z.boolean().optional()
    }).optional()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Get the schema from our schemas object
      const validationSchema = schemas[schema];
      
      if (!validationSchema) {
        return res.status(500).json({
          success: false,
          message: 'Invalid validation schema',
          error: 'VALIDATION_SCHEMA_ERROR'
        });
      }

      // Validate the request body
      const result = validationSchema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        console.log('🔍 Validation failed for schema:', schema);
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        console.log('❌ Validation errors:', errors);

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors,
          error: 'VALIDATION_ERROR'
        });
      }

      // Replace req.body with validated data
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
};

// Query parameter validation for common patterns
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: errors,
          error: 'QUERY_VALIDATION_ERROR'
        });
      }

      req.query = result.data;
      next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Query validation error',
        error: 'QUERY_VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
};

// Parameter validation
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: errors,
          error: 'PARAMETER_VALIDATION_ERROR'
        });
      }

      req.params = result.data;
      next();
    } catch (error) {
      console.error('Parameter validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Parameter validation error',
        error: 'PARAMETER_VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
};

// Common query schemas
const querySchemas = {
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    employeeId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
    type: z.enum(['sign-in', 'sign-out']).optional(),
    department: z.string().max(100).optional(),
    organizationId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional()
  })
};

// Common parameter schemas
const paramSchemas = {
  id: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number).pipe(z.number().int().positive('ID must be a positive integer'))
  }),
  organizationId: z.object({
    id: z.string().regex(/^\d+$/, 'Organization ID must be a number').transform(Number).pipe(z.number().int().positive('Organization ID must be a positive integer'))
  }),
  // Legacy support - if server is still using organizationId parameter name
  organizationIdLegacy: z.object({
    id: z.string().regex(/^\d+$/, 'Organization ID must be a number').transform(Number).pipe(z.number().int().positive('Organization ID must be a positive integer'))
  }),
  employeeId: z.object({
    employeeId: z.string().regex(/^\d+$/, 'Employee ID must be a number').transform(Number).pipe(z.number().int().positive('Employee ID must be a positive integer'))
  })
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  schemas,
  querySchemas,
  paramSchemas
};