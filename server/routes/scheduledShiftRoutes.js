const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getScheduledShifts,
  getEmployeeScheduledShifts,
  createScheduledShift,
  bulkCreateScheduledShifts,
  updateScheduledShift,
  deleteScheduledShift,
  generateShiftsFromTemplate
} = require('../controllers/scheduledShiftController');

// Apply authentication middleware to all routes
router.use(protect);

// Scheduled Shifts routes
router.get('/', getScheduledShifts);
router.get('/employee/:employeeId', getEmployeeScheduledShifts);
router.post('/', createScheduledShift);
router.post('/bulk', bulkCreateScheduledShifts);
router.post('/generate', generateShiftsFromTemplate);
router.put('/:id', updateScheduledShift);
router.delete('/:id', deleteScheduledShift);

module.exports = router;
