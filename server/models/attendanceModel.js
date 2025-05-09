const mongoose = require('mongoose');

/**
 * Attendance record model schema
 * Tracks individual attendance events (sign-in/sign-out)
 */
const attendanceSchema = new mongoose.Schema(
  {
    // Employee reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    
    // Employee name (redundant but useful for performance)
    employeeName: {
      type: String,
      required: true
    },
    
    // Organization reference
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    
    // Attendance type
    type: {
      type: String,
      enum: ['sign-in', 'sign-out'],
      required: true
    },
    
    // Timestamp of the attendance event
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    // Location data (if available)
    location: {
      latitude: Number,
      longitude: Number
    },
    
    // IP address (for tracking and security)
    ipAddress: String,
    
    // Is this a late arrival (only applicable for sign-in)
    isLate: {
      type: Boolean,
      default: false
    },
    
    // Additional notes
    notes: String,
    
    // Verification method used
    verificationMethod: {
      type: String,
      enum: ['face-recognition', 'fingerprint', 'manual'],
      default: 'manual'
    },
    
    // Facial verification details
    facialVerification: {
      type: Boolean,
      default: false
    },
    
    // Facial capture image (stored as base64 or URL)
    facialCapture: {
      image: String
    },
    
    // Fingerprint verification details
    fingerprintVerification: {
      type: Boolean,
      default: false
    },
    
  },
  {
    timestamps: true
  }
);

// Create indexes for frequently queried fields
attendanceSchema.index({ organizationId: 1, timestamp: -1 });
attendanceSchema.index({ employeeId: 1, timestamp: -1 });
attendanceSchema.index({ organizationId: 1, employeeId: 1, timestamp: -1 });
attendanceSchema.index({ organizationId: 1, type: 1, timestamp: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;