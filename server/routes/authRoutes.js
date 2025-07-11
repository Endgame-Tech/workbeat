const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateDetails,
  logoutUser,
  // updatePassword
} = require('../controllers/authController.js');

const { protect, authorize } = require('../middleware/authMiddleware.js');
const { validate } = require('../middleware/validation.js');
const { authLimiter, passwordResetLimiter, registerLimiter, suspiciousActivityLimiter } = require('../middleware/rateLimiter.js');
const { csrfProtection } = require('../middleware/csrfProtection.js');

const router = express.Router();

// CSRF token endpoint for SPA applications
router.get('/csrf-token', csrfProtection.getTokenEndpoint());

// Public routes with rate limiting and validation
router.post('/login', suspiciousActivityLimiter, authLimiter, validate('login'), loginUser);
router.post('/forgotpassword', suspiciousActivityLimiter, passwordResetLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', suspiciousActivityLimiter, passwordResetLimiter, resetPassword);

// Protected routes - require authentication
router.use(protect);

router.get('/me', getCurrentUser);
router.post('/logout', logoutUser);
router.put('/updatedetails', validate('updateDetails'), updateDetails);
// router.put('/updatepassword', validate('updatePassword'), updatePassword);

// Admin only routes with validation and rate limiting
router.post('/register', registerLimiter, authorize('admin'), validate('register'), registerUser);

module.exports = router;