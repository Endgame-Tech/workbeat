const QRCode = require('../models/qrCodeModel');
const AuditLog = require('../models/auditLogModel');
const crypto = require('crypto');

// Generate a secure QR code value
const generateQRCodeValue = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Calculate expiration time (24 hours from now by default)
const getQRCodeExpiration = (hours = 24) => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate;
};

// @desc    Generate a new QR code
// @route   POST /api/qrcodes
// @access  Private/Admin
const generateQRCode = async (req, res) => {
  try {
    const { location, expirationHours } = req.body;
    
    // Generate QR code value
    const qrValue = generateQRCodeValue();
    
    // Calculate expiration time
    const expiresAt = getQRCodeExpiration(expirationHours || 24);
    
    // Create QR code record
    const qrCode = await QRCode.create({
      value: qrValue,
      expiresAt,
      location: location || 'Main Office Entrance',
      isActive: true,
      createdBy: req.user.id
    });
    
    // Log the action
    await AuditLog.create({
      userId: req.user.id,
      action: 'create_qrcode',
      details: `Generated QR code for ${qrCode.location}`,
      ipAddress: req.ip,
      resourceType: 'qrcode',
      resourceId: qrCode._id
    });
    
    res.status(201).json({
      success: true,
      data: qrCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
};

// @desc    Get active QR codes
// @route   GET /api/qrcodes
// @access  Private/Admin
const getActiveQRCodes = async (req, res) => {
  try {
    const qrCodes = await QRCode.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: qrCodes.length,
      data: qrCodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QR codes',
      error: error.message
    });
  }
};

// @desc    Verify a QR code
// @route   GET /api/qrcodes/verify/:value
// @access  Public
const verifyQRCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({
      value: req.params.value,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR code'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        location: qrCode.location,
        expiresAt: qrCode.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code',
      error: error.message
    });
  }
};

// @desc    Deactivate QR code
// @route   DELETE /api/qrcodes/:id
// @access  Private/Admin
const deactivateQRCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }
    
    // Set to inactive instead of deleting
    qrCode.isActive = false;
    await qrCode.save();
    
    // Log the action
    await AuditLog.create({
      userId: req.user.id,
      action: 'deactivate_qrcode',
      details: `Deactivated QR code for ${qrCode.location}`,
      ipAddress: req.ip,
      resourceType: 'qrcode',
      resourceId: qrCode._id
    });
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'QR code deactivated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate QR code',
      error: error.message
    });
  }
};

module.exports = {
  generateQRCode,
  getActiveQRCodes,
  verifyQRCode,
  deactivateQRCode
};