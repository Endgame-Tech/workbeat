const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeaveRequests,
  getEmployeeLeaveRequests,
  createLeaveRequest,
  updateLeaveRequestStatus,
  cancelLeaveRequest
} = require('../controllers/leaveRequestController');

// Apply authentication middleware to all routes
router.use(protect);

// Leave Requests routes
router.get('/', getLeaveRequests);
router.get('/employee/:employeeId', getEmployeeLeaveRequests);
router.post('/', createLeaveRequest);
router.put('/:id/status', updateLeaveRequestStatus);
router.put('/:id/cancel', cancelLeaveRequest);

module.exports = router;
