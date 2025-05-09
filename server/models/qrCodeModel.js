const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      default: 'Main Office Entrance'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly find active QR codes
qrCodeSchema.index({ isActive: 1, expiresAt: 1 });
qrCodeSchema.index({ value: 1 });

const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;