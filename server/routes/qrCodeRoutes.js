const express = require('express');
const {
  generateQRCode,
  getActiveQRCodes,
  verifyQRCode,
  deactivateQRCode
} = require('../controllers/qrCodeController.js');

const { protect, authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public route for verifying QR codes
router.get('/verify/:value', verifyQRCode);

// Protected routes - require authentication
router.use(protect);

// Admin routes - require admin role
router.use(authorize('admin'));

router.route('/')
  .get(getActiveQRCodes)
  .post(generateQRCode);

router.delete('/:id', deactivateQRCode);

module.exports = router;