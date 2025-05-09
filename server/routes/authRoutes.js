const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateDetails,
  // updatePassword
} = require('../controllers/authController.js');

const { protect, authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes - require authentication
router.use(protect);

router.get('/me', getCurrentUser);
router.put('/updatedetails', updateDetails);
// router.put('/updatepassword', updatePassword);

// Admin only routes
router.post('/register', authorize('admin'), registerUser);

module.exports = router;