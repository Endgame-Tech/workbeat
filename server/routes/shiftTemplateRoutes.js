const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getShiftTemplates,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate
} = require('../controllers/shiftTemplateController');

// Apply authentication middleware to all routes
router.use(protect);

// Shift Templates routes
router.get('/', getShiftTemplates);
router.post('/', createShiftTemplate);
router.put('/:id', updateShiftTemplate);
router.delete('/:id', deleteShiftTemplate);

module.exports = router;
