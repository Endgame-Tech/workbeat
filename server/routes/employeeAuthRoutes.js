const express = require('express');
const {
  recordAttendanceWithFace,
  addEmployeeFace
} = require('../controllers/employeeAuthController.js');

const { protect, authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes for employee authentication using QR code
router.post('/record-attendance', recordAttendanceWithFace);

// Protected routes for admin operations
router.use(protect);
router.use(authorize('admin'));

// Admin only routes
router.post('/add-face/:id', addEmployeeFace);

module.exports = router;