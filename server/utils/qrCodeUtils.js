const crypto = require('crypto');

/**
 * Generate a secure random value for QR code
 * @param {string} location - Location name to include in QR data
 * @returns {string} QR code value
 */
const generateQRCodeValue = (location = 'Main Office') => {
  // Create a SHA-256 hash of the timestamp + random bytes + location
  const timestamp = new Date().getTime().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const data = timestamp + randomBytes + location;
  
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Calculate QR code expiration time (24 hours by default)
 * @param {number} hours - Number of hours until expiration
 * @returns {string} ISO date string of expiration time
 */
const getQRCodeExpiration = (hours = 24) => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate.toISOString();
};

/**
 * Check if a QR code is valid (not expired)
 * @param {string} qrValue - QR code value to check
 * @param {string} expiresAt - Expiration date string
 * @returns {boolean} True if QR code is valid, false otherwise
 */
const isQRCodeValid = (qrValue, expiresAt) => {
  if (!qrValue || !expiresAt) return false;
  
  const expirationDate = new Date(expiresAt);
  const currentDate = new Date();
  
  return expirationDate > currentDate;
};

/**
 * Scan QR code from video element (stub for backend implementation)
 * In a real backend, this function would be different or not needed
 * @param {HTMLVideoElement} videoElement - Video element to scan
 * @returns {Promise<string|null>} Scanned QR code value or null
 */
const scanQRCode = async (videoElement) => {
  // This is a stub - in a real backend, this would be handled differently
  return null;
};

module.exports = {
  generateQRCodeValue,
  getQRCodeExpiration,
  isQRCodeValid,
  scanQRCode
};