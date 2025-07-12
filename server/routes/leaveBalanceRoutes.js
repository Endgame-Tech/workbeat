const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeaveBalances,
  getEmployeeLeaveBalances,
  initializeLeaveBalances,
  updateLeaveBalance,
  bulkUpdateLeaveBalances,
  getLeaveUtilizationReport
} = require('../controllers/leaveBalanceController');

// Apply authentication middleware to all routes
router.use(protect);

// Leave Balances routes
router.get('/', getLeaveBalances);
router.get('/employee/:employeeId', getEmployeeLeaveBalances);
router.post('/initialize', initializeLeaveBalances);
router.put('/:id', updateLeaveBalance);
router.put('/bulk', bulkUpdateLeaveBalances);
router.get('/report/utilization', getLeaveUtilizationReport);

module.exports = router;
