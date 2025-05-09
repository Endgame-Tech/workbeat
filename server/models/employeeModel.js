const mongoose = require('mongoose');
const crypto = require('crypto');

const employeeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true
    },
    profileImage: {
      type: String,
      default: null
    },
    // Facial recognition data
    faceRecognition: {
      faceId: String,
      faceImages: [String],
      lastUpdated: Date
    },
    // Biometric data flags and metadata
    biometrics: {
      fingerprint: {
        isEnrolled: {
          type: Boolean,
          default: false
        },
        credentialId: String,
        enrolledAt: Date
      }
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    workSchedule: {
      days: [String],
      hours: {
        start: {
          type: String,
          default: '09:00'
        },
        end: {
          type: String,
          default: '17:00'
        }
      }
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    employmentStatus: {
      type: String,
      enum: ['full-time', 'part-time', 'contractor'],
      default: 'full-time'
    },
    accessLevel: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee'
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for frequently searched fields
employeeSchema.index({ name: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ 'biometrics.fingerprint.isEnrolled': 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;