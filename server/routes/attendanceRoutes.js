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
const router = express.Router();


router.post('/', createAttendanceRecord);

// Face recognition attendance route
router.post('/face', createAttendanceWithFace);

// Protected routes
router.use(protect);

// Admin routes
router.get('/', authorize('admin', 'manager'), getAttendanceRecords);
router.get('/stats/today', authorize('admin', 'manager'), getTodayStats);
router.get('/report', authorize('admin', 'manager'), getAttendanceReport);

// Employee routes
router.get('/employee/:id', getEmployeeAttendance);

module.exports = router;