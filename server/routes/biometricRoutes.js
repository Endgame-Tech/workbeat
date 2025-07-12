const express = require('express');
const {
  generateChallenge,
  generateVerifyChallenge,
  enrollFingerprint,
  verifyFingerprint,
  getEmployeeByFingerprint,
  deleteFingerprint,
  recordBiometricAttendance
} = require('../controllers/biometricsController.js');
const { protect, authorize } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Fingerprint routes
router.get('/fingerprint/challenge/:id', protect, generateChallenge);
router.get('/fingerprint/verify-challenge', generateVerifyChallenge); // Global verification challenge
router.get('/fingerprint/verify-challenge/:id', generateVerifyChallenge);
router.post('/fingerprint/enroll/:id', protect, authorize('admin'), enrollFingerprint);
router.post('/fingerprint/verify', verifyFingerprint); // Global verification
router.post('/fingerprint/verify/:id', verifyFingerprint);
router.get('/fingerprint/employee/:credentialId', getEmployeeByFingerprint);
router.delete('/fingerprint/:id/:credentialId', protect, authorize('admin'), deleteFingerprint);

// Attendance route
router.post('/attendance', recordBiometricAttendance);

module.exports = router;