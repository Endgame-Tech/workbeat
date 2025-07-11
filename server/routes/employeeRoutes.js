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
const { validate, validateQuery, validateParams, schemas, querySchemas, paramSchemas } = require('../middleware/validation.js');

const router = express.Router();

// Protect all routes
router.use(protect);

// Department statistics route
router.get('/stats/departments', authorize('admin', 'manager'), getDepartmentStats);

// Standard CRUD routes
router.route('/')
  .get(validateQuery(querySchemas.pagination), getEmployees)
  .post(authorize('admin'), validate('employee'), createEmployee);

router.route('/:id')
  .get(validateParams(paramSchemas.id), getEmployee)
  .put(authorize('admin'), validateParams(paramSchemas.id), validate('employee'), updateEmployee)
  .delete(authorize('admin'), validateParams(paramSchemas.id), deleteEmployee);

// Hard delete route - use with caution
router.delete('/:id/hard', authorize('admin'), validateParams(paramSchemas.id), hardDeleteEmployee);

module.exports = router;