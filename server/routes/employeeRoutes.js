const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  hardDeleteEmployee,
  getDepartmentStats
} = require('../controllers/employeeController.js');

const { protect, authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Protect all routes
router.use(protect);

// Department statistics route
router.get('/stats/departments', authorize('admin', 'manager'), getDepartmentStats);

// Standard CRUD routes
router.route('/')
  .get(getEmployees)
  .post(authorize('admin'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(authorize('admin'), updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

// Hard delete route - use with caution
router.delete('/:id/hard', authorize('admin'), hardDeleteEmployee);

module.exports = router;