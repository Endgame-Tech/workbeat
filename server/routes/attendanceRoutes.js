const express = require('express');
const {
  getAttendanceRecords,
  getEmployeeAttendance,
  createAttendanceRecord,
  createAttendanceWithFace,
  getTodayStats,
  getAttendanceReport
} = require('../controllers/attendanceController.js');
const { protect, authorize } = require('../middleware/authMiddleware.js');
const { validate, validateQuery, validateParams, querySchemas, paramSchemas } = require('../middleware/validation.js');
const { attendanceLimiter, biometricLimiter, reportLimiter } = require('../middleware/rateLimiter.js');
const router = express.Router();


// Public attendance routes with rate limiting and validation
router.post('/', attendanceLimiter, validate('attendance'), createAttendanceRecord);

// Face recognition attendance route with biometric rate limiting
router.post('/face', biometricLimiter, validate('attendanceFace'), createAttendanceWithFace);

// Protected routes
router.use(protect);

// Admin routes with query validation
router.get('/', validateQuery(querySchemas.pagination), getAttendanceRecords);
router.get('/stats/today', validateQuery(querySchemas.pagination), getTodayStats);
router.get('/report', reportLimiter, validateQuery(querySchemas.pagination), getAttendanceReport);

// Employee routes with validation
router.get('/employee/:id', validateParams(paramSchemas.employeeId), validateQuery(querySchemas.pagination), getEmployeeAttendance);

module.exports = router;