const mongoose = require('mongoose');

/**
 * Daily attendance record model schema
 * Aggregates multiple attendance events per employee per day
 */
const dailyAttendanceSchema = new mongoose.Schema(
  {
    // Employee reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    
    // Organization reference
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    
    // Date of attendance record (without time)
    date: {
      type: Date,
      required: true,
      index: true
    },
    
    // Status for this day
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'leave', 'holiday'],
      default: 'absent'
    },
    
    // Sign-in time
    signInTime: {
      type: Date
    },
    
    // Sign-out time
    signOutTime: {
      type: Date
    },
    
    // Work duration in minutes
    workDuration: {
      type: Number
    },
    
    // Additional notes
    notes: String
  },
  {
    timestamps: true
  }
);

// Create compound index for unique daily record per employee
dailyAttendanceSchema.index({ employeeId: 1, date: 1, organizationId: 1 }, { unique: true });

// Create indexes for frequently queried fields
dailyAttendanceSchema.index({ organizationId: 1, date: 1 });
dailyAttendanceSchema.index({ organizationId: 1, status: 1, date: 1 });

const DailyAttendance = mongoose.model('DailyAttendance', dailyAttendanceSchema);

module.exports = DailyAttendance;