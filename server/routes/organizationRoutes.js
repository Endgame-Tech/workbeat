const express = require('express');
const {
  registerOrganization,
  getOrganization,
  updateOrganization
} = require('../controllers/organizationController.js');
const { protect, authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.post('/register', registerOrganization);

// Protected routes
router.get('/:id', protect, getOrganization);
router.put('/:id', protect, updateOrganization);

module.exports = router;